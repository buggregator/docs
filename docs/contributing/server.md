---
llms: "optional"
llms_description: "Server-side contributing: Go 1.26+, SQLite, modular architecture. Build with make build, test with go test ./..., single binary output. Module system for HTTP and TCP event handlers."
---

# Contributing — Server side

[The Server Part](https://github.com/buggregator/server) is where all the data processing and management happen. It's
crucial for handling the information that flows through Buggregator.

1. **Event Processing:** This part receives information (like errors or logs) from applications. It organizes and
   processes these events.

2. **API Communication:** It also communicates with clients through REST API and WebSocket, sending and receiving
   data as needed.

## Key Technologies

Buggregator v2.0 is written in Go as a single self-contained binary:

- [Go](https://go.dev/) — the server language
- [SQLite](https://www.sqlite.org/) (via [modernc.org/sqlite](https://pkg.go.dev/modernc.org/sqlite)) — embedded database, no external server needed
- Built-in WebSocket server implementing the [Centrifugo v5](https://centrifugal.dev/) protocol
- Embedded SPA frontend (compiled into the binary via `go:embed`)

## Architecture

### Module System

Every feature (Sentry, Ray, Monolog, etc.) is a **module** implementing the `module.Module` interface.
Modules are either HTTP-based or TCP-based:

- **HTTP modules** return an `HTTPIngestionHandler` with `Priority()`, `Match()`, and `Handle()`.
  Lower priority runs first. The http-dump module has priority 9999 as the catch-all.
- **TCP modules** return `[]tcp.ServerConfig` with connection handlers (Monolog, VarDumper) or
  self-managed servers (SMTP).

### Ingestion Pipeline

1. **Detect** — extract event type/project from URI userinfo, headers, or Basic Auth
2. **Match** — try handlers in priority order; first match wins
3. **Handle** — parse request body, return `event.Incoming`
4. **Store & Broadcast** — store in SQLite, build preview, broadcast via WebSocket, notify modules

### Storage

Single implementation: `SQLiteStore` using pure Go SQLite. Migrations live in each module and run
automatically on startup.

## Server Requirements

- Go 1.26+
- Make (for build commands)

## Build & Development

```bash
# Full build (downloads frontend, builds PHP parser for VarDumper, compiles binary)
make build

# Quick Go compilation check
go build ./...

# Run all tests
go test ./...

# Run a single test
go test ./internal/server/http/ -run TestAPI_Version

# Cross-compile
make build-cross GOOS=darwin GOARCH=arm64
```

## Installation

1. **Docker:** Use the Docker Compose setup for a quick dev environment.
   See the [Docker development guide](../cookbook/docker-install).
2. **Manual:** Download dependencies and build from source.
   See the [manual installation guide](../cookbook/manual-install.md).
