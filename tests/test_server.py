import json
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from server import ServerSettings, create_app


VALID_DEFECT = {
    "model": "КрАЗ-255Б",
    "orderNumber": "42",
    "chassisNumber": "CHASSIS-1",
    "engineNumber": "ENGINE-1",
    "selectedItems": [
        {
            "value": "255Б-3507005-Б",
            "label": "Гальмо стоянкове у зборі",
            "quantity": 1,
            "replace": 1,
            "repair": 0,
            "missing": 0,
        }
    ],
}


def make_settings(tmp_path: Path) -> tuple[ServerSettings, list[dict[str, object]]]:
    dist_dir = tmp_path / "dist"
    dist_dir.mkdir()
    (dist_dir / "index.html").write_text(
        "<!doctype html><title>DefKraz</title>", encoding="utf-8"
    )
    (dist_dir / "manifest.webmanifest").write_text(
        '{"name":"DefKraz"}', encoding="utf-8"
    )

    vehicles = [{"value": "kraz-255b", "label": "КрАЗ-255Б", "nodes": []}]
    vehicles_file = tmp_path / "vehicles.json"
    vehicles_file.write_text(
        json.dumps(vehicles, ensure_ascii=False), encoding="utf-8-sig"
    )

    return (
        ServerSettings(
            dist_dir=dist_dir,
            vehicles_file=vehicles_file,
            upstream_url="http://bridge.test",
            upstream_timeout_seconds=1,
        ),
        vehicles,
    )


def test_get_vehicles_returns_cached_catalog(tmp_path: Path) -> None:
    settings, vehicles = make_settings(tmp_path)
    app = create_app(settings)

    with TestClient(app) as client:
        settings.vehicles_file.write_text("[]", encoding="utf-8")
        response = client.get("/api/vehicles")

    assert response.status_code == 200
    assert response.json() == vehicles


def test_create_defect_forwards_payload_once(tmp_path: Path) -> None:
    settings, _ = make_settings(tmp_path)
    requests: list[httpx.Request] = []

    def upstream_handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={"documentRef": "DOC-123"},
            headers={"content-type": "application/json"},
        )

    app = create_app(settings, upstream_transport=httpx.MockTransport(upstream_handler))

    with TestClient(app) as client:
        response = client.post("/api/defect", json=VALID_DEFECT)

    assert response.status_code == 200
    assert response.json() == {"documentRef": "DOC-123"}
    assert len(requests) == 1
    assert requests[0].url == "http://bridge.test/api/defect"
    assert json.loads(requests[0].content) == VALID_DEFECT


def test_invalid_defect_is_not_forwarded(tmp_path: Path) -> None:
    settings, _ = make_settings(tmp_path)
    request_count = 0

    def upstream_handler(request: httpx.Request) -> httpx.Response:
        nonlocal request_count
        request_count += 1
        return httpx.Response(200, json={"documentRef": "unexpected"})

    app = create_app(settings, upstream_transport=httpx.MockTransport(upstream_handler))
    invalid_defect = {**VALID_DEFECT, "orderNumber": "   "}

    with TestClient(app) as client:
        response = client.post("/api/defect", json=invalid_defect)

    assert response.status_code == 422
    assert request_count == 0


def test_upstream_error_status_and_body_are_preserved(tmp_path: Path) -> None:
    settings, _ = make_settings(tmp_path)

    def upstream_handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            409,
            json={"detail": "Document already exists"},
            headers={"content-type": "application/json"},
        )

    app = create_app(settings, upstream_transport=httpx.MockTransport(upstream_handler))

    with TestClient(app) as client:
        response = client.post("/api/defect", json=VALID_DEFECT)

    assert response.status_code == 409
    assert response.json() == {"detail": "Document already exists"}


@pytest.mark.parametrize(
    ("upstream_error", "expected_detail"),
    [
        (httpx.ReadTimeout("timed out"), "timed out"),
        (httpx.ConnectError("connection failed"), "unavailable"),
    ],
)
def test_upstream_transport_failures_return_502(
    tmp_path: Path,
    upstream_error: httpx.RequestError,
    expected_detail: str,
) -> None:
    settings, _ = make_settings(tmp_path)
    request_count = 0

    def upstream_handler(request: httpx.Request) -> httpx.Response:
        nonlocal request_count
        request_count += 1
        raise upstream_error

    app = create_app(settings, upstream_transport=httpx.MockTransport(upstream_handler))

    with TestClient(app) as client:
        response = client.post("/api/defect", json=VALID_DEFECT)

    assert response.status_code == 502
    assert expected_detail in response.json()["detail"]
    assert request_count == 1


def test_static_files_spa_fallback_and_api_404(tmp_path: Path) -> None:
    settings, _ = make_settings(tmp_path)
    app = create_app(settings)

    with TestClient(app) as client:
        root_response = client.get("/")
        manifest_response = client.get("/manifest.webmanifest")
        spa_response = client.get("/orders/current")
        missing_asset_response = client.get("/assets/missing.js")
        api_response = client.get("/api/unknown")

    assert root_response.status_code == 200
    assert "DefKraz" in root_response.text
    assert manifest_response.status_code == 200
    assert manifest_response.json() == {"name": "DefKraz"}
    assert spa_response.status_code == 200
    assert "DefKraz" in spa_response.text
    assert missing_asset_response.status_code == 404
    assert api_response.status_code == 404
    assert api_response.headers["content-type"].startswith("application/json")


def test_missing_frontend_build_fails_startup(tmp_path: Path) -> None:
    settings = ServerSettings(
        dist_dir=tmp_path / "missing-dist",
        vehicles_file=tmp_path / "vehicles.json",
    )
    app = create_app(settings)

    with pytest.raises(RuntimeError, match="npm run build"):
        with TestClient(app):
            pass
