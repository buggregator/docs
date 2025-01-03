# Configuration — RoadRunner

The **Buggregator server** uses the **RoadRunner application server** to handle HTTP and TCP requests efficiently.
RoadRunner is a high-performance server written in Go, designed for PHP applications. In some cases, you might want to
customize its configuration to suit your needs, such as:

- Restricting **CORS rules** for security.
- Increasing **TCP buffer size** for better performance.
- Adjusting **logging settings** for different environments (e.g., development or production).

This guide explains how to configure the Buggregator server using RoadRunner's **environment variables**.

---

### Available ENV Variables

| **Variable Name**                | **Description**                                                                                           | **Default Value**  |
|----------------------------------|-----------------------------------------------------------------------------------------------------------|--------------------|
| `RR_LOG_MODE`                    | Logging mode: `development`, `production`, or `raw`.                                                      | `production`       |
| `RR_LOG_ENCODING`                | Log encoding format: `console` or `json`. Recommended `json` for production.                              | `json`             |
| `RR_LOG_LEVEL`                   | Global logging level: `panic`, `error`, `warn`, `info`, `debug`.                                          | `warn`             |
| `RR_LOG_HTTP_LEVEL`              | Logging level for HTTP plugin: `panic`, `error`, `warn`, `info`, `debug`.                                 | `warn`             |
| `RR_LOG_TCP_LEVEL`               | Logging level for TCP plugin: `panic`, `error`, `warn`, `info`, `debug`.                                  | `warn`             |
| `RR_LOG_CENTRIFUGE_LEVEL`        | Logging level for Centrifuge plugin: `panic`, `error`, `warn`, `info`, `debug`.                           | `warn`             |
| `RR_LOG_SERVER_LEVEL`            | Logging level for the server: `panic`, `error`, `warn`, `info`, `debug`.                                  | `warn`             |
| `RR_LOG_SERVICE_LEVEL`           | Logging level for services: `panic`, `error`, `warn`, `info`, `debug`.                                    | `warn`             |
| `RR_HTTP_ALLOWED_ORIGIN`         | Allowed origins for CORS. Typically set to specific domains or `*` for all.                               | `*`                |
| `RR_HTTP_ALLOWED_HEADERS`        | Allowed headers for CORS. Set `*` for all or specify headers.                                             | `*`                |
| `RR_HTTP_ALLOW_CREDENTIALS`      | Whether CORS credentials (cookies, authorization) are allowed.                                            | `true`             |
| `RR_HTTP_NUM_WORKERS`            | Number of workers in the HTTP pool. Determines concurrency for HTTP handling.                             | (Unset by default) |
| `RR_TCP_MONOLOG_ADDR`            | Address for the Monolog TCP server.                                                                       | `:9913`            |
| `RR_TCP_VAR_DUMPER_ADDR`         | Address for the Var-Dumper TCP server.                                                                    | `:9912`            |
| `RR_TCP_SMTP_ADDR`               | Address for the SMTP TCP server.                                                                          | `:1025`            |
| `RR_TCP_READ_BUF_SIZE`           | Buffer size for TCP data reading (in bytes). Higher values reduce `read` system calls for large payloads. | `50485760` (50MB)  |
| `RR_TCP_NUM_WORKERS`             | Number of workers in the TCP pool. Determines concurrency for TCP handling.                               | (Unset by default) |
| `RR_CENTRIFUGE_PROXY_ADDRESS`    | Proxy address for Centrifuge plugin.                                                                      | (Unset by default) |
| `RR_CENTRIFUGE_GRPC_API_ADDRESS` | gRPC API address for Centrifuge plugin.                                                                   | (Unset by default) |
| `RR_CENTRIFUGE_NUM_WORKERS`      | Number of workers in the Centrifuge poll.                                                                 | (Unset by default) |

---

### Example: Using ENV Variables in Docker Compose

To configure RoadRunner through environment variables in `docker-compose.yml`, use the following example:

```yaml
version: '3.9'

services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    environment:
      RR_LOG_MODE: json         # Set logging mode to JSON
      RR_HTTP_NUM_WORKERS: 4    # Configure the number of HTTP workers
      RR_TCP_READ_BUF_SIZE: 10485760 # Set TCP read buffer size to 10MB
      RR_HTTP_ALLOWED_ORIGIN: "https://example.com" # Restrict allowed CORS origins
```

### Example: Using ENV Variables with `docker run`

You can also pass environment variables directly when running a Docker container:

```bash
docker run --pull always \
  -e RR_LOG_MODE=json \            # Set logging mode to JSON
  -e RR_HTTP_NUM_WORKERS=4 \       # Configure the number of HTTP workers
  -e RR_TCP_READ_BUF_SIZE=10485760 \ # Set TCP read buffer size to 10MB
  -e RR_HTTP_ALLOWED_ORIGIN="https://example.com" \ # Restrict allowed CORS origins
  ghcr.io/buggregator/server:latest
```
