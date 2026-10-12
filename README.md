# CharzAuto DefKraz

DefKraz is a React PWA served by a FastAPI application. The Python server also
provides the vehicle catalog and forwards defect submissions to the existing 1C
bridge.

## Prerequisites

- Python 3.11 or newer
- Node.js 24 and npm for building the frontend
- A reachable 1C bridge API (the default URL is `http://127.0.0.1:5157`)

Node.js is needed only while producing the `dist/` frontend build. A deployed
server needs Python, `server.py`, `dist/`, and
`src/assets/vehicles/all.json`.

## Setup on Windows PowerShell

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm ci
npm run build
```

Configure the upstream bridge if it is not running at the default address, then
start the server:

```powershell
$env:CHARZAUTO_UPSTREAM_URL = "http://127.0.0.1:5157"
.\.venv\Scripts\python.exe server.py
```

## Setup on Linux or macOS

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm ci
npm run build
```

Configure the upstream bridge and start the server:

```bash
export CHARZAUTO_UPSTREAM_URL="http://127.0.0.1:5157"
.venv/bin/python server.py
```

The server listens on every network interface at port 8000. Open
`http://localhost:8000` on the host or `http://SERVER_IP:8000` from another
device on the LAN. The host firewall must allow inbound connections to the
configured port.

If `dist/index.html` is missing, the server exits with instructions to run the
frontend build first.

## Configuration

| Environment variable | Default | Purpose |
| --- | --- | --- |
| `CHARZAUTO_HOST` | `0.0.0.0` | Interface used by the Python server |
| `CHARZAUTO_PORT` | `8000` | Port used by the Python server |
| `CHARZAUTO_UPSTREAM_URL` | `http://127.0.0.1:5157` | Base URL of the existing 1C bridge |
| `CHARZAUTO_UPSTREAM_TIMEOUT_SECONDS` | `30` | Timeout for one defect submission |
| `VITE_API_HOST` | empty (same origin) | Optional API host override when building or using Vite development mode |

The Python service does not authenticate to the bridge and does not store
submissions locally. A defect submission is forwarded exactly once; after an
ambiguous failure, retry it manually only after checking whether 1C created the
document.

## API

- `GET /api/vehicles` returns the cached catalog from
  `src/assets/vehicles/all.json`.
- `POST /api/defect` validates a defect request and forwards it to
  `${CHARZAUTO_UPSTREAM_URL}/api/defect`.

Successful and error responses from the bridge retain their status and body.
Connection failures and timeouts return HTTP 502.

## Development and checks

The built application talks to the Python server on the same origin. To use the
Vite development server, keep Python running and provide its URL to Vite:

```powershell
$env:VITE_API_HOST = "http://localhost:8000"
npm run dev
```

Run all checks with:

```powershell
.\.venv\Scripts\python.exe -m pytest
npm run lint
npm run build
```
