---
llms_description: "For AI agents (Claude Code, Cursor, Codex): set up Buggregator for the user in one pass. Install script per OS (install.sh, install.ps1), then start the binary in the background on 127.0.0.1 with MCP on and a database file; check with GET /api/version and a test event; connect MCP (claude mcp add buggregator -- <path>/buggregator mcp); env lines to point the user's app (Sentry DSN, VarDumper, Monolog, SMTP, Ray); stop and restart."
---

# Set up with an AI agent

This page is written for an AI agent (Claude Code, Cursor, Codex and others). Give it to your agent:

```
Read https://docs.buggregator.dev/agent-setup.md and set up Buggregator for this project.
```

The rest of the page is the agent's instructions.

---

## Instructions for the agent

Goal: Buggregator runs on this machine, the user's app sends events to it, and you can read them over MCP.
Run the steps in order. Each step has a check; do not go on until it passes.

### 1. Install

Linux and macOS: the script picks the binary for this OS and CPU, checks its checksum and puts it in
`~/.local/bin/buggregator`. Then start it in the background:

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh | sh
mkdir -p ~/.local/share/buggregator
MCP_ENABLED=true PROXY_ADDR=127.0.0.1:8080 nohup ~/.local/bin/buggregator \
  -http-addr 127.0.0.1:8000 -smtp-addr 127.0.0.1:1025 \
  -vardumper-addr 127.0.0.1:9912 -monolog-addr 127.0.0.1:9913 \
  -db ~/.local/share/buggregator/buggregator.db \
  > ~/.local/share/buggregator/buggregator.log 2>&1 &
```

Windows (PowerShell): the script puts `buggregator.exe` in `%LOCALAPPDATA%\Programs\buggregator`. MCP runs over
HTTP on Windows (no Unix socket there):

```powershell
irm https://raw.githubusercontent.com/buggregator/server/master/scripts/install.ps1 | iex
$dir = "$env:LOCALAPPDATA\Programs\buggregator"
$env:MCP_ENABLED = "true"; $env:MCP_TRANSPORT = "http"; $env:MCP_ADDR = "127.0.0.1:8001"; $env:PROXY_ADDR = "127.0.0.1:8080"
Start-Process -WindowStyle Hidden "$dir\buggregator.exe" -ArgumentList "-http-addr 127.0.0.1:8000 -smtp-addr 127.0.0.1:1025 -monolog-addr 127.0.0.1:9913 -db `"$dir\buggregator.db`""
```

The script fails with `no checksums.txt in this release`: the latest release is older than v2.6.0. Run it again with
`BUGGREGATOR_NO_VERIFY=1` (`curl … | BUGGREGATOR_NO_VERIFY=1 sh`; PowerShell: `$env:BUGGREGATOR_NO_VERIFY = "1"`
before `irm`).

No `curl`/`sh` or the script fails otherwise: download by hand. URL
`https://github.com/buggregator/server/releases/latest/download/<file>`, where `<file>` is
`buggregator-linux-amd64`, `buggregator-linux-arm64`, `buggregator-darwin-arm64`, `buggregator-darwin-amd64`,
`buggregator-windows-amd64.exe` or `buggregator-windows-arm64.exe`; then `chmod +x`.

Rules:
- Every port listens on `127.0.0.1` only: captured data stays on this machine.
- `-db` keeps events after a restart. Without it, events live in memory.
- A port already taken: Buggregator exits at start (code 1), the log says `address already in use`
  (`failed to start HTTP server` for `8000`, `failed to start TCP servers` for the others). Find what holds it (`lsof -i :1025`), ask the user,
  or move the module, e.g. `-smtp-addr 127.0.0.1:2525`, and use the new port in step 3.
- On Windows the VarDumper module (port `9912`) does not work; everything else does.

Check:

```bash
curl -s http://127.0.0.1:8000/api/version
# {"version":"…"}
```

No answer: read the log (`~/.local/share/buggregator/buggregator.log`).

### 2. Send a test event

```bash
curl -s -H 'X-Buggregator-Event: http-dump' http://127.0.0.1:8000/agent-setup-test
curl -s http://127.0.0.1:8000/api/events | head -c 300
```

Check: the list has an event of type `http-dump` with `agent-setup-test` in its URI. Tell the user it is in the UI at
http://127.0.0.1:8000.

### 3. Point the user's app at Buggregator

Change only the addresses below in the app's config (`.env` or similar). Keep the user's other settings. Add only the
lines for tools the app already uses.

| The app uses | Set |
|--------------|-----|
| Sentry SDK | DSN `http://sentry@127.0.0.1:8000/1` (Laravel: `SENTRY_LARAVEL_DSN`, others: `SENTRY_DSN`) |
| Symfony VarDumper | `VAR_DUMPER_FORMAT=server`, `VAR_DUMPER_SERVER=127.0.0.1:9912` |
| Monolog | socket handler to `127.0.0.1:9913` (Laravel: `LOG_CHANNEL=socket`, `LOG_SOCKET_URL=127.0.0.1:9913`) |
| Email (SMTP) | host `127.0.0.1`, port `1025`, no auth (Laravel: `MAIL_MAILER=smtp`, `MAIL_HOST`, `MAIL_PORT`) |
| Spatie Ray | `RAY_HOST=ray@127.0.0.1`, `RAY_PORT=8000` |

The app runs in Docker: `127.0.0.1` inside a container is the container itself. Use `host.docker.internal` (Docker
Desktop) instead. That needs Buggregator on `0.0.0.0` addresses, which opens the ports to the network: ask the user
first. Or run Buggregator in the same Compose stack: [Getting Started](/getting-started#docker-compose).

Details per tool: [Sentry](/config/sentry), [VarDumper](/config/var-dumper), [Monolog](/config/monolog),
[SMTP](/config/smtp), [Ray](/config/ray), [Inspector](/config/inspector), [XHProf](/config/xhprof).

Check: trigger something in the app (an error, a `dump()`, a log line, an email) and see a new event in
`GET /api/events`.

### 4. Connect MCP

Claude Code, Linux and macOS (socket, the default):

```bash
claude mcp add buggregator -- ~/.local/bin/buggregator mcp
```

Claude Code, Windows (HTTP, as started in step 1):

```bash
claude mcp add --transport http buggregator http://127.0.0.1:8001/mcp
```

Other clients: [MCP → Integration with AI assistants](/config/mcp#integration-with-ai-assistants).

Check: the client lists the tool `events_list`; calling it returns the test event from step 2. A new MCP server may
need a new session of the client: tell the user if so.

### 5. Tell the user

Say in plain words: where the UI is (http://127.0.0.1:8000), which lines of their config you changed, and how to
stop it (below).

## Stop and restart

```bash
pkill -f '.local/bin/buggregator'     # Linux, macOS
```

```powershell
Stop-Process -Name buggregator         # Windows
```

Start again with the start command of step 1 (skip the install line).

## Update

Run the install line of step 1 again: it replaces the old file with the latest release. Stop the running one first. Events stay in the
`-db` file.
