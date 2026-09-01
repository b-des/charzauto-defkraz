from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import Annotated

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator


PROJECT_ROOT = Path(__file__).resolve().parent
DEFAULT_DIST_DIR = PROJECT_ROOT / "dist"
DEFAULT_VEHICLES_FILE = PROJECT_ROOT / "src" / "assets" / "vehicles" / "all.json"

NonEmptyString = Annotated[str, StringConstraints(min_length=1)]


@dataclass(frozen=True)
class ServerSettings:
    dist_dir: Path = DEFAULT_DIST_DIR
    vehicles_file: Path = DEFAULT_VEHICLES_FILE
    upstream_url: str = "http://127.0.0.1:5157"
    upstream_timeout_seconds: float = 30.0

    @classmethod
    def from_environment(cls) -> "ServerSettings":
        upstream_url = os.getenv(
            "CHARZAUTO_UPSTREAM_URL", "http://127.0.0.1:5157"
        ).strip()
        if not upstream_url:
            raise ValueError("CHARZAUTO_UPSTREAM_URL must not be empty")

        timeout_value = os.getenv("CHARZAUTO_UPSTREAM_TIMEOUT_SECONDS", "30")
        try:
            timeout_seconds = float(timeout_value)
        except ValueError as error:
            raise ValueError(
                "CHARZAUTO_UPSTREAM_TIMEOUT_SECONDS must be a number"
            ) from error
        if timeout_seconds <= 0:
            raise ValueError(
                "CHARZAUTO_UPSTREAM_TIMEOUT_SECONDS must be greater than zero"
            )

        return cls(
            upstream_url=upstream_url.rstrip("/"),
            upstream_timeout_seconds=timeout_seconds,
        )


class RequestModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class DefectPart(RequestModel):
    value: NonEmptyString
    label: NonEmptyString
    quantity: int = Field(ge=1)
    replace: int = Field(ge=0)
    repair: int = Field(ge=0)
    missing: int = Field(ge=0)

    @field_validator("value", "label")
    @classmethod
    def reject_blank_strings(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


class DefectRequest(RequestModel):
    model: NonEmptyString
    orderNumber: NonEmptyString
    chassisNumber: NonEmptyString
    engineNumber: NonEmptyString
    selectedItems: list[DefectPart]

    @field_validator("model", "orderNumber", "chassisNumber", "engineNumber")
    @classmethod
    def reject_blank_strings(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value


def _load_vehicles(vehicles_file: Path) -> list[object]:
    try:
        with vehicles_file.open(encoding="utf-8-sig") as catalog_file:
            vehicles = json.load(catalog_file)
    except (OSError, json.JSONDecodeError) as error:
        raise RuntimeError(
            f"Unable to load the vehicle catalog at {vehicles_file}: {error}"
        ) from error

    if not isinstance(vehicles, list):
        raise RuntimeError(
            f"Vehicle catalog at {vehicles_file} must contain a JSON array"
        )
    return vehicles


def create_app(
    settings: ServerSettings | None = None,
    *,
    upstream_transport: httpx.AsyncBaseTransport | None = None,
) -> FastAPI:
    settings = settings or ServerSettings.from_environment()
    dist_dir = settings.dist_dir.resolve()
    index_file = dist_dir / "index.html"

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        if not index_file.is_file():
            raise RuntimeError(
                f"Frontend build not found at {index_file}. "
                "Run `npm ci` and `npm run build` before `python server.py`."
            )

        application.state.vehicles = _load_vehicles(settings.vehicles_file)
        async with httpx.AsyncClient(
            timeout=settings.upstream_timeout_seconds,
            transport=upstream_transport,
        ) as upstream_client:
            application.state.upstream_client = upstream_client
            yield

    application = FastAPI(title="CharzAuto DefKraz", lifespan=lifespan)

    @application.get("/api/vehicles")
    async def get_vehicles() -> list[object]:
        return application.state.vehicles

    @application.post("/api/defect")
    async def create_defect(payload: DefectRequest) -> Response:
        defect_url = f"{settings.upstream_url}/api/defect"
        try:
            upstream_response = await application.state.upstream_client.post(
                defect_url,
                json=payload.model_dump(),
            )
        except httpx.TimeoutException as error:
            raise HTTPException(
                status_code=502,
                detail="The 1C bridge timed out while creating the defect document.",
            ) from error
        except httpx.RequestError as error:
            raise HTTPException(
                status_code=502,
                detail="The 1C bridge is unavailable.",
            ) from error

        response_headers = {}
        content_type = upstream_response.headers.get("content-type")
        if content_type:
            response_headers["content-type"] = content_type

        return Response(
            content=upstream_response.content,
            status_code=upstream_response.status_code,
            headers=response_headers,
        )

    api_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]

    @application.api_route("/api", methods=api_methods, include_in_schema=False)
    @application.api_route(
        "/api/{api_path:path}", methods=api_methods, include_in_schema=False
    )
    async def unknown_api_route(api_path: str = "") -> None:
        raise HTTPException(status_code=404, detail="Not Found")

    @application.api_route(
        "/{requested_path:path}", methods=["GET", "HEAD"], include_in_schema=False
    )
    async def serve_frontend(requested_path: str) -> FileResponse:
        requested_file = (dist_dir / requested_path).resolve()
        if requested_file.is_relative_to(dist_dir) and requested_file.is_file():
            return FileResponse(requested_file)

        if Path(requested_path).suffix:
            raise HTTPException(status_code=404, detail="Not Found")

        return FileResponse(index_file)

    return application


def _read_port() -> int:
    port_value = os.getenv("CHARZAUTO_PORT", "8000")
    try:
        port = int(port_value)
    except ValueError as error:
        raise ValueError("CHARZAUTO_PORT must be an integer") from error
    if not 1 <= port <= 65535:
        raise ValueError("CHARZAUTO_PORT must be between 1 and 65535")
    return port


app = create_app()


if __name__ == "__main__":
    host = os.getenv("CHARZAUTO_HOST", "0.0.0.0").strip()
    if not host:
        raise ValueError("CHARZAUTO_HOST must not be empty")
    uvicorn.run(app, host=host, port=_read_port())
