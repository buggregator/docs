---
llms_description: "Install the standalone binary (no Docker, no dependencies): download URLs per OS and CPU (linux-amd64, linux-arm64, darwin-arm64, darwin-amd64, windows-amd64.exe) from GitHub releases, first start, default ports and addresses (all interfaces), flags -http-addr -smtp-addr -vardumper-addr -monolog-addr -db -config, keeping events across restarts with -db, check with GET /api/version. For an AI agent: see /agent-setup."
---

# Install the binary

Buggregator is one file. Download it, make it executable, run it. No Docker, no PHP, no database server.

> Setting it up with an AI agent (Claude Code, Cursor, Codex)? Give it [this page for agents](/agent-setup).

## 1. Download

Pick your system. Each command downloads the latest release from
[GitHub](https://github.com/buggregator/server/releases/latest).

**Linux (x86-64):**

```bash
curl -fsSL https://github.com/buggregator/server/releases/latest/download/buggregator-linux-amd64 -o buggregator
chmod +x buggregator
```

**Linux (ARM64, e.g. Raspberry Pi 4/5, AWS Graviton):**

```bash
curl -fsSL https://github.com/buggregator/server/releases/latest/download/buggregator-linux-arm64 -o buggregator
chmod +x buggregator
```

**macOS (Apple Silicon: M1 and later):**

```bash
curl -fsSL https://github.com/buggregator/server/releases/latest/download/buggregator-darwin-arm64 -o buggregator
chmod +x buggregator
```

**macOS (Intel):**

```bash
curl -fsSL https://github.com/buggregator/server/releases/latest/download/buggregator-darwin-amd64 -o buggregator
chmod +x buggregator
```

**Windows (x86-64, PowerShell):**

```powershell
Invoke-WebRequest https://github.com/buggregator/server/releases/latest/download/buggregator-windows-amd64.exe -OutFile buggregator.exe
```

Not sure which one? Run `uname -m`: `x86_64` means amd64, `arm64` or `aarch64` means arm64.

<!-- TODO(#4507): macOS Gatekeeper / quarantine and Windows SmartScreen steps, once tested. -->

## 2. Start

```bash
./buggregator
```

On Windows: `.\buggregator.exe`.

Open http://127.0.0.1:8000. The UI is empty until your app sends something.

To check from the command line:

```bash
curl http://127.0.0.1:8000/api/version
# {"version":"2.6.0"}
```

## 3. Point your app at it

Change one address in your app. Examples are on [Getting Started → Just change the address](/getting-started#just-change-the-address),
and each integration page has its own (for example [Sentry](/config/sentry) or [SMTP](/config/smtp)).

## Ports

| Port | What listens | Change it with |
|------|--------------|----------------|
| `8000` | Web UI, HTTP events (Sentry, Ray, Inspector, XHProf, HTTP dumps, SMS), mock server | `-http-addr` or `HTTP_ADDR` |
| `1025` | SMTP: captured emails | `-smtp-addr` or `SMTP_ADDR` |
| `9912` | VarDumper | `-vardumper-addr` or `VAR_DUMPER_ADDR` |
| `9913` | Monolog | `-monolog-addr` or `MONOLOG_ADDR` |
| `8080` | HTTP proxy | `PROXY_ADDR` |

If a port is already taken, that one module does not start; the log shows `address already in use`, and the rest
keeps running. Example: another mail tool holds `1025`. Move Buggregator's SMTP elsewhere:

```bash
./buggregator -smtp-addr :2525
```

## Listen only on this machine

By default every port listens on all network interfaces (`:8000`). Other machines on your network can then reach
the UI and your captured data. To keep it on your machine only:

```bash
./buggregator \
  -http-addr 127.0.0.1:8000 \
  -smtp-addr 127.0.0.1:1025 \
  -vardumper-addr 127.0.0.1:9912 \
  -monolog-addr 127.0.0.1:9913
```

Add `PROXY_ADDR=127.0.0.1:8080` in front if you keep the HTTP proxy.

## Keep events after a restart

By default events live in memory: stopping Buggregator clears them. To keep them, give it a database file:

```bash
./buggregator -db ./buggregator.db
```

The file is created on the first start. More options: [Database](/config/database).

## More settings

Every setting is a flag, an environment variable or a line in `buggregator.yaml` (flags win over variables, variables
over the file). See [Server configuration](/config/server). Example: turn on the MCP server for AI assistants:

```bash
MCP_ENABLED=true ./buggregator
```

Then connect your assistant: [MCP](/config/mcp).

## Update

Download the file again with the same command and restart. With `-db`, your events stay.
