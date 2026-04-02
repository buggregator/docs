---
llms_description: "Server configuration via buggregator.yaml, environment variables, and CLI flags. Covers HTTP address, CORS, database (SQLite), storage modes, TCP ports (SMTP, Monolog, VarDumper), module enable/disable, metrics, auth, MCP, webhooks, projects. Priority: CLI flags > env vars > config file > defaults."
---

# Configuration — Server

Buggregator is configured through a combination of a YAML config file, environment variables, and CLI flags.
Every setting has a sensible default — no configuration file is required to get started.

## Configuration Priority

Settings are resolved in this order (highest priority first):

1. **CLI flags** (e.g., `--http-addr :9000`)
2. **Environment variables** (e.g., `HTTP_ADDR=:9000`)
3. **Config file** (`buggregator.yaml`)
4. **Defaults**

## Config File

Place a file named `buggregator.yaml` (or `buggregator.yml`) next to the binary, or specify a custom path:

```bash
./buggregator --config /path/to/buggregator.yaml
```

The config file supports environment variable substitution using `${VAR}` or `${VAR:default}` syntax.

### Full Example

```yaml
# HTTP server
server:
  addr: ${HTTP_ADDR::8000}
  cors_origins:
    - "*"

# Database (SQLite)
database:
  driver: sqlite
  dsn: ${DATABASE_DSN::memory:}       # ":memory:" or file path like "data.db"

# Attachment storage (SMTP attachments, HTTP dump files)
storage:
  mode: ${STORAGE_MODE:memory}        # "memory" or "filesystem"
  path: ${STORAGE_PATH:./storage}     # Directory for filesystem mode

# TCP servers
tcp:
  smtp:
    addr: ${SMTP_ADDR::1025}
  monolog:
    addr: ${MONOLOG_ADDR::9913}
  var-dumper:
    addr: ${VAR_DUMPER_ADDR::9912}

# Enable/disable modules
modules:
  sentry: true
  ray: true
  var-dump: true
  inspector: true
  monolog: true
  smtp: true
  sms: true
  http-dump: true
  profiler: true

# Prometheus metrics
metrics:
  enabled: ${METRICS_ENABLED:false}
  addr: ${METRICS_ADDR:}              # Separate server, e.g. ":9090". Empty = serve on main HTTP server.

# Authentication (OAuth2/OIDC)
# auth:
#   enabled: false
#   provider: oidc
#   provider_url: https://xxx.us.auth0.com
#   client_id: xxx
#   client_secret: xxx
#   callback_url: http://localhost:8000/auth/sso/callback
#   scopes: openid,email,profile
#   jwt_secret: my-secret-key

# MCP (Model Context Protocol) for AI assistants
# mcp:
#   enabled: false
#   transport: socket                  # "socket" or "http"
#   socket_path: /tmp/buggregator-mcp.sock
#   addr: :8001                        # For HTTP transport
#   auth_token:                        # Bearer token for HTTP transport

# Webhooks
# webhooks:
#   - event: "*"
#     url: https://slack.example.com/webhook
#     headers:
#       Authorization: "Bearer token"
#     verify_ssl: false
#     retry: true

# Pre-defined projects
# projects:
#   - key: my-app
#     name: My Application
```

---

## Environment Variables Reference

### HTTP Server

| Variable | Default | Description |
|----------|---------|-------------|
| `HTTP_ADDR` | `:8000` | HTTP server listen address |
| `CORS_ORIGINS` | `*` | Comma-separated list of allowed CORS origins |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_DSN` | `:memory:` | SQLite database path. Use `:memory:` for in-memory (data lost on restart) or a file path like `data.db` for persistence. |

### Attachment Storage

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_MODE` | `memory` | `memory` (lost on restart) or `filesystem` (persistent) |
| `STORAGE_PATH` | `./storage` | Directory for filesystem storage mode |

### TCP Ports

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_ADDR` | `:1025` | SMTP server listen address |
| `MONOLOG_ADDR` | `:9913` | Monolog TCP server listen address |
| `VAR_DUMPER_ADDR` | `:9912` | VarDumper TCP server listen address |

### Modules

| Variable | Default | Description |
|----------|---------|-------------|
| `CLIENT_SUPPORTED_EVENTS` | all | Comma-separated list of enabled module types (e.g., `sentry,ray,smtp`) |

### Metrics

| Variable | Default | Description |
|----------|---------|-------------|
| `METRICS_ENABLED` | `false` | Enable Prometheus metrics |
| `METRICS_ADDR` | (empty) | Separate metrics server address (e.g., `:9090`). Leave empty to serve `/metrics` on the main HTTP server. |

### Authentication

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `false` | Enable OAuth2/OIDC authentication |
| `AUTH_PROVIDER` | `oidc` | Provider: `auth0`, `google`, `github`, `keycloak`, `gitlab`, `oidc` |
| `AUTH_PROVIDER_URL` | — | OIDC issuer URL (e.g., `https://xxx.us.auth0.com`) |
| `AUTH_CLIENT_ID` | — | OAuth2 client ID |
| `AUTH_CLIENT_SECRET` | — | OAuth2 client secret |
| `AUTH_CALLBACK_URL` | — | Callback URL (e.g., `http://localhost:8000/auth/sso/callback`) |
| `AUTH_SCOPES` | `openid,email,profile` | Comma-separated OAuth2 scopes |
| `AUTH_JWT_SECRET` | — | Secret for signing internal JWT tokens (required when auth is enabled) |

### MCP (Model Context Protocol)

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_ENABLED` | `false` | Enable MCP server for AI assistant integration |
| `MCP_TRANSPORT` | `socket` | Transport type: `socket` (Unix socket) or `http` (HTTP/SSE) |
| `MCP_SOCKET_PATH` | `/tmp/buggregator-mcp.sock` | Unix socket path (for socket transport) |
| `MCP_ADDR` | `:8001` | HTTP listen address (for HTTP transport) |
| `MCP_AUTH_TOKEN` | — | Bearer token for HTTP transport authentication |

### Other

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_DIR` | — | Serve frontend from disk instead of embedded (for development) |

---

## Docker Examples

### Using Environment Variables

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -e DATABASE_DSN=data.db \
  -e METRICS_ENABLED=true \
  -v ./data:/data \
  ghcr.io/buggregator/server:latest
```

### Using a Config File

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -v ./buggregator.yaml:/buggregator.yaml \
  ghcr.io/buggregator/server:latest
```

### Docker Compose with All Options

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:1025:1025
      - 127.0.0.1:9912:9912
      - 127.0.0.1:9913:9913
    environment:
      DATABASE_DSN: data.db
      STORAGE_MODE: filesystem
      STORAGE_PATH: /data/storage
      METRICS_ENABLED: "true"
    volumes:
      - buggregator-data:/data

volumes:
  buggregator-data:
```

## Disabling Modules

You can disable modules you don't need. Disabled modules won't bind their TCP port and will ignore incoming events.

In `buggregator.yaml`:

```yaml
modules:
  sentry: true
  ray: true
  var-dump: false    # Disable VarDumper
  inspector: false   # Disable Inspector
  monolog: true
  smtp: true
  sms: false         # Disable SMS
  http-dump: true
  profiler: true
```

Or via environment variable:

```bash
CLIENT_SUPPORTED_EVENTS=sentry,ray,monolog,smtp,http-dump,profiler
```
