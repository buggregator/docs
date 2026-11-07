---
llms_description: "Xdebug proxy (since v2.6.0, off by default): Buggregator sits between PHP/Xdebug and the IDE (DBGp), forwards the session unchanged, shows the paused session on a read-only Xdebug page (stack, variables, source, breakpoints, watches, agent activity) and gives MCP clients read-only tools xdebug_sessions, xdebug_location, xdebug_stack, xdebug_variables, xdebug_property, xdebug_eval (eval only with allow_eval). Config xdebug.enabled/addr/ide_addr/allow_eval, env XDEBUG_PROXY_ENABLED, XDEBUG_PROXY_ADDR (127.0.0.1:9003), XDEBUG_PROXY_IDE_ADDR (127.0.0.1:9004), XDEBUG_PROXY_ALLOW_EVAL (false). HTTP API /api/xdebug/*, WebSocket channel xdebug. Stepping and breakpoints stay in the IDE."
---

# Xdebug Proxy — Share a Debug Session

You debug PHP in your IDE with Xdebug as usual. Buggregator can sit in the middle and let others look at the same
paused session: the **Xdebug** page in the browser, and an AI assistant over [MCP](/config/mcp).

```
PHP / Xdebug ──▶ Buggregator :9003 ──▶ IDE (PhpStorm, VS Code…)
                      │
                      ├── Xdebug page (read-only)
                      └── MCP tools (read-only) ◀── AI assistant
```

Everything here is **read-only**. Stepping, continuing and breakpoints stay in the IDE. Buggregator only reads
where the script stopped: the stack, variables and source.

> Available since server v2.6.0, off by default. The **Xdebug** page needs frontend 1.35.0, which is bundled
> with v2.6.0.

## Use cases

- **Ask an AI assistant about a paused request** — "what is in `$order` here?", while you stay at the breakpoint.
- **Show a session to a colleague** — they open the Xdebug page and see the same stack and variables.
- **Keep the IDE in charge** — the proxy passes everything through, so the IDE works as before.

## Setup

### 1. Turn the proxy on

```yaml
xdebug:
  enabled: true
  addr: 127.0.0.1:9003        # where Xdebug connects
  ide_addr: 127.0.0.1:9004    # where your IDE listens
  allow_eval: false           # let MCP clients and watches evaluate PHP expressions
```

Or with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `XDEBUG_PROXY_ENABLED` | `false` | Turn the proxy on (`true`, `1` or `yes`) |
| `XDEBUG_PROXY_ADDR` | `127.0.0.1:9003` | Where Xdebug connects |
| `XDEBUG_PROXY_IDE_ADDR` | `127.0.0.1:9004` | Where the IDE listens for debug connections |
| `XDEBUG_PROXY_ALLOW_EVAL` | `false` | Allow evaluating PHP expressions (see [Eval](#eval)) |

For the MCP tools, also turn on [MCP](/config/mcp) (`mcp.enabled: true`).

### 2. Free the port for the proxy

The proxy and the IDE cannot both listen on port 9003 on one machine. Pick one of two setups.

**A. Move the IDE to another port.** Xdebug stays unchanged.

- IDE: set the Xdebug debug port to `9004` (PhpStorm: *Settings → PHP → Debug → Xdebug → Debug port*).
- Buggregator: the defaults (`addr: 127.0.0.1:9003`, `ide_addr: 127.0.0.1:9004`).
- Xdebug: unchanged (`xdebug.client_port=9003`).

**B. Keep the IDE on 9003.** Point Xdebug at the proxy instead.

- IDE: unchanged (port `9003`).
- Buggregator: `addr: 127.0.0.1:9010`, `ide_addr: 127.0.0.1:9003`.
- Xdebug: `xdebug.client_port=9010`.

### 3. Point Xdebug at Buggregator

A typical `php.ini` for setup A:

```ini
xdebug.mode=debug
xdebug.client_host=127.0.0.1
xdebug.client_port=9003
xdebug.start_with_request=trigger
```

Then start a debug session in the IDE as usual and stop at a breakpoint.

### Docker

When Buggregator runs in a container and the IDE on your machine, the proxy must listen on all interfaces inside
the container and dial the host.

**PHP in a container too.** PHP reaches the proxy over the Docker network, so port 9003 is not published, and
the IDE can stay on port 9003:

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
    environment:
      XDEBUG_PROXY_ENABLED: "true"
      XDEBUG_PROXY_ADDR: 0.0.0.0:9003
      XDEBUG_PROXY_IDE_ADDR: host.docker.internal:9003
    extra_hosts:
      - host.docker.internal:host-gateway   # needed on Linux
```

In the PHP container, set `xdebug.client_host` to the Buggregator service name (e.g., `buggregator`).

**PHP on your machine.** Then Xdebug needs the proxy on a host port, and that port cannot also be the IDE's.
Publish 9003 and move the IDE to 9004:

```yaml
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:9003:9003
    environment:
      XDEBUG_PROXY_ENABLED: "true"
      XDEBUG_PROXY_ADDR: 0.0.0.0:9003
      XDEBUG_PROXY_IDE_ADDR: host.docker.internal:9004
```

Set the IDE's Xdebug debug port to `9004`, and keep `xdebug.client_host=127.0.0.1`, `xdebug.client_port=9003`.

> The proxy has no login of its own. Anyone who can reach its port can start a session. Keep it on
> `127.0.0.1` or inside your Docker network.

## What happens to a session

- Each PHP request with Xdebug is one session. Several requests at once each get their own session.
- The IDE gets the session unchanged. It does not see what the page or the MCP tools read.
- **No IDE listening**, or the IDE goes away: Buggregator detaches, and the script runs on as if there were
  no debugger.
- A closed session stays in the list for 10 minutes with its reason, unless you dismiss it. At most the 50
  newest closed sessions are kept.

## The Xdebug page

The **Xdebug** item appears in the sidebar only when the proxy is on.

- **Sessions** — state (Paused, Running, Detached, Stopped…), the request (`GET /checkout?step=2`, or the CLI
  command), file and line, and whether the IDE is connected.
- **Code** — the source around the paused line, with the IDE's breakpoints in the gutter.
- **Variables** — locals, superglobals and user constants. Objects and arrays load when you expand them.
- **Call stack** — vendor frames fold into one line. Pick a frame to see its source and variables.
- **Watch** — expressions evaluated once per pause. Needs `allow_eval: true`; otherwise the page shows the setting to turn on.
- **Agent activity** — the MCP calls an AI assistant made in this session, including refused ones.

Values can be read only while the script is paused. While it runs, the page shows the last known line.

## MCP tools

With `mcp.enabled: true`, MCP clients get these tools. All are read-only.

| Tool | What it returns |
|------|-----------------|
| `xdebug_sessions` | Sessions, including ones closed in the last 10 minutes: id, entry file, state, current file and line |
| `xdebug_location` | Current file and line, the function, and the source lines around it |
| `xdebug_stack` | The call stack, one frame per level; 0 is the current one |
| `xdebug_variables` | Variables of a frame (locals by default). Arrays and objects show their first level |
| `xdebug_property` | One variable or property by its full name (`$user->address`, `$items[0]`) with its children; strings up to 64 KB |
| `xdebug_eval` | The value of a PHP expression in the current frame. Present only with `allow_eval: true` |

`session_id` can be left out when exactly one session is paused.

Example conversation with an assistant, while the IDE stopped at a breakpoint:

- "Where did the script stop?" → `xdebug_location`
- "What is in `$user`?" → `xdebug_property` with `$user`

## Eval

`allow_eval` is off by default. With it on, MCP clients (`xdebug_eval`) and the page's watches can evaluate PHP
expressions inside the debugged request. An expression can change state: `$order->pay()` really runs. Turn it
on only where you trust everyone who can reach the API and MCP.

With eval off, `xdebug_eval` is not offered, and `POST /api/xdebug/sessions/{id}/eval` answers
`403 eval_disabled`.

## HTTP API

The page uses these routes. They need the same login as the rest of `/api` when [SSO](/config/sso) is on.
Errors are `{"code", "error", "state"?}`.

| Method | Path | Answer |
|--------|------|--------|
| `GET` | `/api/xdebug` | `{"enabled", "addr", "ide_addr", "allow_eval"}`; also answers with `"enabled": false` when the proxy is off |
| `GET` | `/api/xdebug/sessions` | live and closed sessions |
| `GET` | `/api/xdebug/sessions/{id}` | one session |
| `DELETE` | `/api/xdebug/sessions/{id}` | dismiss a closed session: `204`; a live one: `409 session_live` |
| `GET` | `/api/xdebug/sessions/{id}/stack` | frames |
| `GET` | `/api/xdebug/sessions/{id}/contexts?frame=0` | `0` Locals, `1` Superglobals, `2` User defined constants |
| `GET` | `/api/xdebug/sessions/{id}/variables?frame=0&context=0` | variables |
| `GET` | `/api/xdebug/sessions/{id}/property?name=$user&frame=0&context=0&page=0` | one variable with children |
| `GET` | `/api/xdebug/sessions/{id}/source?file=…&begin=1&end=120` | source lines, at most 2000 |
| `GET` | `/api/xdebug/sessions/{id}/breakpoints` | the IDE's breakpoints |
| `POST` | `/api/xdebug/sessions/{id}/eval` | body `{"expression": "count($items)"}`, `Content-Type: application/json`; needs `allow_eval` |
| `GET` | `/api/xdebug/sessions/{id}/agent-log` | the last 200 MCP calls of the session |

While the script is not paused, reads answer `409 not_paused`. Other codes: `400 bad_request` (a missing or
bad parameter), `404 not_found`, `415 unsupported_media_type` (eval without JSON), `422 xdebug_error` (Xdebug
refused the read), `502 xdebug_failed`, `504 timeout`.

A session's `state` is one of `starting`, `break`, `running`, `stopping`, `stopped`, `detached`. A closed session
also has `closed_reason`: `ide_unreachable`, `ide_closed`, `engine_closed` or `stopped`.

### WebSocket

Events go to the `xdebug` channel: `session.created`, `session.status`, `session.closed`, `agent.call.started`,
`agent.call`. `session.status` carries `pause_seq`, which goes up by one on every new pause: re-read the
session when it changes.
