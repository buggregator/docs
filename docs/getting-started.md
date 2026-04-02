---
llms_description: "Installation via standalone binary (~30 MB, curl one-liner), Docker run, Docker Compose, and Kubernetes. Port mapping: 8000 (HTTP/Sentry/Ray/Inspector/XHProf/SMS/HTTP Dumps), 1025 (SMTP), 9912 (VarDumper TCP), 9913 (Monolog TCP). Configuration via buggregator.yaml, environment variables, or CLI flags. Image tags: latest, dev, versioned."
---

# Getting Started

## Three steps. That's it.

1. **Run one command** — start Buggregator with a single command. No installation, no registration, no configuration files.
2. **Add one env variable** — change one line in your `.env` file. Your existing Sentry SDK, VarDumper, Monolog, or Ray — they all just work.
3. **Open your browser** — navigate to http://127.0.0.1:8000 and start debugging. No login required.

## Quick Start

### Standalone Binary (Recommended)

Buggregator is a single ~30 MB binary with no dependencies. Download and run:

```bash
# Linux (amd64)
curl -sL https://github.com/buggregator/server/releases/latest/download/buggregator-linux-amd64 -o buggregator \
  && chmod +x buggregator \
  && ./buggregator
```

<details>
<summary>Other platforms</summary>

```bash
# Linux (arm64)
curl -sL https://github.com/buggregator/server/releases/latest/download/buggregator-linux-arm64 -o buggregator \
  && chmod +x buggregator

# macOS (Apple Silicon)
curl -sL https://github.com/buggregator/server/releases/latest/download/buggregator-darwin-arm64 -o buggregator \
  && chmod +x buggregator

# macOS (Intel)
curl -sL https://github.com/buggregator/server/releases/latest/download/buggregator-darwin-amd64 -o buggregator \
  && chmod +x buggregator
```

</details>

Open http://127.0.0.1:8000 in your browser. Done.

### Docker

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  ghcr.io/buggregator/server:latest
```

### Docker Compose

Add Buggregator to your `docker-compose.yml` alongside your other services:

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:1025:1025
      - 127.0.0.1:9912:9912
      - 127.0.0.1:9913:9913
```

No environment configuration needed. Works out of the box.

## Just change the address

If Buggregator is part of an existing Docker Compose stack, other services can reach it by its service name.
Change your app's `.env` to point at the container — that's the only change you need:

```dotenv
# Sentry — only the host changed. Your Sentry SDK keeps working exactly the same.
SENTRY_LARAVEL_DSN=http://sentry@buggregator:8000/1

# Ray
RAY_HOST=ray@buggregator
RAY_PORT=8000

# VarDumper
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=buggregator:9912

# Monolog
LOG_CHANNEL=socket
LOG_SOCKET_URL=buggregator:9913

# SMTP — email capture
MAIL_HOST=buggregator
MAIL_PORT=1025
```

## Ports

Each port serves a specific module. You only need to expose the ports for the features you use:

| Port | Protocol | Module | What it does |
|------|----------|--------|-------------|
| **8000** | HTTP | [Sentry](./config/sentry.md), [Ray](./config/ray.md), [Inspector](./config/inspector.md), [HTTP Dumps](./config/http-dumps.md), [XHProf](./config/xhprof.md), [SMS](./config/sms.md) | Web UI + HTTP-based event ingestion. This is the only required port. |
| **1025** | SMTP | [Fake SMTP Server](./config/smtp.md) | Captures outgoing emails. Point your app's SMTP config here. |
| **9912** | TCP | [Symfony VarDumper](./config/var-dumper.md) | Receives `dump()` / `dd()` output. |
| **9913** | TCP | [Monolog](./config/monolog.md) | Receives log records via Monolog's `SocketHandler`. |

If you only need specific features, omit the unused ports. For example, VarDumper only:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:9912:9912 \
  ghcr.io/buggregator/server:latest
```

## Kubernetes

The recommended way to deploy Buggregator on Kubernetes is using the [Helm chart](./config/helm-chart.md):

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator
```

See the [Helm chart documentation](./config/helm-chart.md) for SSO, Ingress, Prometheus, and more.

Or deploy manually as a `Deployment` + `Service`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: buggregator
spec:
  replicas: 1
  selector:
    matchLabels:
      app: buggregator
  template:
    metadata:
      labels:
        app: buggregator
    spec:
      containers:
        - name: buggregator
          image: ghcr.io/buggregator/server:latest
          ports:
            - containerPort: 8000
            - containerPort: 1025
            - containerPort: 9912
            - containerPort: 9913
---
apiVersion: v1
kind: Service
metadata:
  name: buggregator
spec:
  selector:
    app: buggregator
  ports:
    - name: http
      port: 8000
    - name: smtp
      port: 1025
    - name: var-dumper
      port: 9912
    - name: monolog
      port: 9913
```

## Configuration

Buggregator can be configured via a YAML config file, environment variables, or CLI flags.
The priority order is: **CLI flags > Environment variables > Config file > Defaults**.

See the [server configuration guide](./config/server.md) for the full reference.

### Quick example with environment variables

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -e DATABASE_DSN=data.db \
  -e METRICS_ENABLED=true \
  -v ./data:/data \
  ghcr.io/buggregator/server:latest
```

## Image Tags

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release. **Recommended.** |
| `dev` | Latest development build. May be less stable. |
| `X.Y` (e.g., `2.0`) | A specific release version, pinned. |

## Security

By default, all ports are bound to `127.0.0.1` (localhost only). This prevents external access.
Your debug data never leaves your machine.

> **Warning:** If you remove the `127.0.0.1:` prefix (e.g., `-p 8000:8000`), the port becomes accessible from
> outside your machine. Only do this if you understand the implications.

For team environments, consider enabling [SSO authentication](./config/sso.md) to restrict access to the UI.
