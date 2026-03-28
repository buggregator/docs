# Getting Started

## Quick Start

Make sure [Docker](https://docs.docker.com/get-docker/) is installed on your machine, then run:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  -p 127.0.0.1:9914:9914 \
  ghcr.io/buggregator/server:latest
```

Open http://127.0.0.1:8000 in your browser. Done.

## Ports

Each port serves a specific module. You only need to expose the ports for the features you use:

| Port | Protocol | Module | What it does |
|------|----------|--------|-------------|
| **8000** | HTTP | [Sentry](./config/sentry.md), [Ray](./config/ray.md), [Inspector](./config/inspector.md), [HTTP Dumps](./config/http-dumps.md), [XHProf](./config/xhprof.md) | Web UI + HTTP-based event ingestion. This is the only required port. |
| **1025** | SMTP | [Fake SMTP Server](./config/smtp.md) | Captures outgoing emails. Point your app's SMTP config here (e.g., `MAIL_HOST=127.0.0.1`, `MAIL_PORT=1025`). |
| **9912** | TCP | [Symfony VarDumper](./config/var-dumper.md) | Receives `dump()` / `dd()` output. Set `VAR_DUMPER_FORMAT=server` and `VAR_DUMPER_SERVER=127.0.0.1:9912`. |
| **9913** | TCP | [Monolog](./config/monolog.md) | Receives log records via Monolog's `SocketHandler` in JSON format. |
| **9914** | TCP | [XHProf Profiler](./config/xhprof.md) | Receives XHProf profiling data from `spiral/profiler` and compatible clients. |

If you only need specific features, omit the unused ports. For example, VarDumper only:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:9912:9912 \
  ghcr.io/buggregator/server:latest
```

## Installation Options

### Docker Compose

Add Buggregator as a service in your `docker-compose.yml`:

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:1025:1025
      - 127.0.0.1:9912:9912
      - 127.0.0.1:9913:9913
      - 127.0.0.1:9914:9914
```

If Buggregator is part of an existing Docker Compose stack, other services can reach it by its service name.
Configure your app's `.env` to point at the container:

```dotenv
RAY_HOST=ray@buggregator
RAY_PORT=8000
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=buggregator:9912
SENTRY_LARAVEL_DSN=http://sentry@buggregator:8000/1
LOG_CHANNEL=socket
LOG_SOCKET_URL=buggregator:9913
MAIL_HOST=buggregator
MAIL_PORT=1025
```

### Kubernetes

Deploy Buggregator as a `Deployment` + `Service` in your cluster:

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
            - containerPort: 9914
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
    - name: profiler
      port: 9914
```

Other pods can reach Buggregator at `buggregator:8000` (or the corresponding port) within the cluster.

### Manual Installation

See the [manual installation guide](./cookbook/manual-install.md) for running Buggregator without Docker
(RoadRunner + Centrifugo binaries).

## Other Image Tags

All available tags can be found in the [GitHub Container Registry](https://github.com/buggregator/server/pkgs/container/server).

| Tag | Description |
|-----|-------------|
| `latest` | Latest stable release. **Recommended.** |
| `dev` | Latest development build. Includes newest features, may be less stable. |
| `X.Y` (e.g., `1.0`) | A specific release version, pinned. |

Example with the dev tag:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  -p 127.0.0.1:9914:9914 \
  ghcr.io/buggregator/server:dev
```

## Security

By default, all ports are bound to `127.0.0.1` (localhost only). This prevents external access.

> **Warning:** If you remove the `127.0.0.1:` prefix (e.g., `-p 8000:8000`), the port becomes accessible from
> outside your machine. Only do this if you understand the implications.

For production-like setups, consider enabling [SSO authentication](./config/sso.md) to restrict access to the UI.
