---
llms: "optional"
llms_description: "Manual installation without Docker: download standalone Go binary from GitHub Releases, run directly. Configuration via buggregator.yaml or environment variables. No external dependencies required."
---

# Cookbook — Manual Installation

Buggregator is a single self-contained binary with no external dependencies. You don't need Docker, PHP, Go, or any
runtime to run it.

## Download

Download the latest release for your platform from
[GitHub Releases](https://github.com/buggregator/server/releases):

```bash
# Linux (amd64)
curl -fsSL -o buggregator https://github.com/buggregator/server/releases/latest/download/buggregator-linux-amd64
chmod +x buggregator

# Linux (arm64)
curl -fsSL -o buggregator https://github.com/buggregator/server/releases/latest/download/buggregator-linux-arm64
chmod +x buggregator

# macOS (Apple Silicon)
curl -fsSL -o buggregator https://github.com/buggregator/server/releases/latest/download/buggregator-darwin-arm64
chmod +x buggregator

# macOS (Intel)
curl -fsSL -o buggregator https://github.com/buggregator/server/releases/latest/download/buggregator-darwin-amd64
chmod +x buggregator
```

Windows (PowerShell):

```powershell
# x86-64
Invoke-WebRequest https://github.com/buggregator/server/releases/latest/download/buggregator-windows-amd64.exe -OutFile buggregator.exe
# ARM64, from v2.6.0
Invoke-WebRequest https://github.com/buggregator/server/releases/latest/download/buggregator-windows-arm64.exe -OutFile buggregator.exe
```

> On Windows, the VarDumper module (port 9912) is not available. Every other module works.

One command that also checks the checksum (from v2.6.0): see [Install the binary](/install#with-the-install-script).

## Run

```bash
./buggregator
```

On Windows: `.\buggregator.exe`.

Open http://127.0.0.1:8000 in your browser. That's it.

## Configuration

By default, Buggregator runs with in-memory storage (data is lost on restart). To persist data, create
a `buggregator.yaml` file next to the binary:

```yaml
database:
  dsn: data.db                    # Persist events to a SQLite file

storage:
  mode: filesystem                # Persist attachments to disk
  path: ./storage
```

Or specify a custom config path:

```bash
./buggregator --config /etc/buggregator/buggregator.yaml
```

See the [server configuration guide](../config/server.md) for all available options.

## Default Ports

| Port | Service |
|------|---------|
| 8000 | HTTP (Web UI + API) |
| 1025 | SMTP |
| 9912 | VarDumper (TCP) |
| 9913 | Monolog (TCP) |

All ports are configurable via environment variables or the config file.
