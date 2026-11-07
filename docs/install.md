---
llms_description: "Install the standalone binary (no Docker, no dependencies): download URLs per OS and CPU (linux-amd64, linux-arm64, darwin-arm64, darwin-amd64, windows-amd64.exe, windows-arm64.exe) from GitHub releases; install scripts install.sh (curl | sh, ~/.local/bin, checksums) and install.ps1 (irm | iex); macOS quarantine (xattr) and Windows SmartScreen (Unblock-File); first start, default ports and addresses (all interfaces), flags -http-addr -smtp-addr -vardumper-addr -monolog-addr -db -config, keeping events across restarts with -db, check with GET /api/version. For an AI agent: see /agent-setup."
---

# Install the binary

Buggregator is one file. Download it, make it executable, run it. No Docker, no PHP, no database server.

> Setting it up with an AI agent (Claude Code, Cursor, Codex)? Give it [this page for agents](/agent-setup).

## 1. Download

### With the install script

**Linux and macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh | sh
```

It picks the file for your system and CPU, checks it against the release's `checksums.txt`, and puts it in
`~/.local/bin/buggregator`. No `sudo`. If `~/.local/bin` is not in your `PATH`, the script says so; then run
`~/.local/bin/buggregator`.

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/buggregator/server/master/scripts/install.ps1 | iex
```

It puts `buggregator.exe` in `%LOCALAPPDATA%\Programs\buggregator`.

Both scripts take these environment variables:

| Variable | What it does |
|----------|--------------|
| `BUGGREGATOR_VERSION` | a release tag, e.g. `v2.6.0`; default: the latest release |
| `BUGGREGATOR_INSTALL_DIR` | another folder for the binary |
| `BUGGREGATOR_NO_VERIFY=1` | skip the checksum; only for releases without `checksums.txt` (v2.5.0 and older) |

Example — a fixed version into `~/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh \
  | BUGGREGATOR_VERSION=v2.6.0 BUGGREGATOR_INSTALL_DIR="$HOME/bin" sh
```

> The scripts and `checksums.txt` come with v2.6.0. To install v2.5.0 or older with the script, add
> `BUGGREGATOR_NO_VERIFY=1`.

### By hand

Pick the file for your system from the [latest release](https://github.com/buggregator/server/releases/latest):

| System | File |
|--------|------|
| Linux, x86-64 | `buggregator-linux-amd64` |
| Linux, ARM64 (Raspberry Pi 4/5, AWS Graviton) | `buggregator-linux-arm64` |
| macOS, Apple Silicon (M1 and later) | `buggregator-darwin-arm64` |
| macOS, Intel | `buggregator-darwin-amd64` |
| Windows, x86-64 | `buggregator-windows-amd64.exe` |
| Windows, ARM64 (since v2.6.0) | `buggregator-windows-arm64.exe` |

Not sure which one? Run `uname -m`: `x86_64` means amd64, `arm64` or `aarch64` means arm64.

Linux and macOS, e.g. Linux x86-64:

```bash
curl -fsSL -o buggregator https://github.com/buggregator/server/releases/latest/download/buggregator-linux-amd64
chmod +x buggregator
```

Windows:

```powershell
Invoke-WebRequest https://github.com/buggregator/server/releases/latest/download/buggregator-windows-amd64.exe -OutFile buggregator.exe
```

### If your system blocks it

- **macOS.** A file downloaded with `curl` (or the script) is not blocked. A file downloaded in a browser is
  marked as from the internet, and macOS refuses to open it. Clear the mark once:
  `xattr -d com.apple.quarantine buggregator`. Or right-click the file → **Open**. The binary is not notarized
  by Apple.
- **Windows.** A file downloaded in a browser may show «Windows protected your PC». Click **More info → Run
  anyway**, or run `Unblock-File .\buggregator.exe` once.

## 2. Start

```bash
buggregator                 # installed with the script, ~/.local/bin in your PATH
~/.local/bin/buggregator    # installed with the script, not in PATH
./buggregator               # downloaded by hand
```

On Windows: `& "$env:LOCALAPPDATA\Programs\buggregator\buggregator.exe"` after the script, or `.\buggregator.exe`.

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

If a port is already taken, Buggregator stops at start. The log names the port and says `address already in use`:
`failed to start HTTP server` for `8000`, `failed to start TCP servers` for the others. Example: another mail tool holds `1025`. Move
Buggregator's SMTP elsewhere:

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

Then connect your assistant: [MCP](/config/mcp). On Windows, use the MCP HTTP transport
(`MCP_TRANSPORT=http`, port `8001`): the default Unix socket path `/tmp/buggregator-mcp.sock` does not exist there.

## Update

Run the install script (or the download) again, then restart. With `-db`, your events stay.
