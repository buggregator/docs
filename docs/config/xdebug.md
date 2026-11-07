---
llms_description: "Xdebug proxy (since v2.6.0, off by default): Buggregator sits between PHP/Xdebug and the IDE (DBGp). With an IDE it forwards the session unchanged and only reads it. Without an IDE (xdebug.mode auto, the default, or standalone) Buggregator drives the session: continue, step into/over/out, stop, release from the Xdebug page or REST POST /api/xdebug/sessions/{id}/run|step-into|step-over|step-out|stop|detach (JSON; 409 ide_attached/not_paused). Modes: proxy, auto, standalone (env XDEBUG_PROXY_MODE). pause_on_first_line (XDEBUG_PROXY_PAUSE_ON_FIRST_LINE, false): stop at the first line, else run to xdebug_break(). idle_timeout (XDEBUG_PROXY_IDLE_TIMEOUT, 10m, 0 = never): a session paused here with no command is released. PUT /api/xdebug/settings {mode, pause_on_first_line} for new sessions, not saved. Page shows stack, variables, source, breakpoints, watches, agent activity; MCP tools xdebug_sessions, xdebug_location, xdebug_stack, xdebug_variables, xdebug_property, xdebug_eval (eval only with allow_eval). Config xdebug.enabled/addr/ide_addr/allow_eval/mode/pause_on_first_line/idle_timeout, env XDEBUG_PROXY_ENABLED, XDEBUG_PROXY_ADDR (127.0.0.1:9003), XDEBUG_PROXY_IDE_ADDR (127.0.0.1:9004), XDEBUG_PROXY_ALLOW_EVAL (false). HTTP API /api/xdebug/*, WebSocket channel xdebug."
---

# Xdebug Proxy — Debug PHP With or Without an IDE

Buggregator receives Xdebug sessions from PHP. Two ways to use it:

- **With your IDE.** Buggregator sits in the middle and passes the session to the IDE unchanged. The IDE steps
  and sets breakpoints. The **Xdebug** page and an AI assistant over [MCP](/config/mcp) only look at the same
  paused session.
- **Without an IDE.** No IDE answers, so Buggregator drives the session itself. You step through the code on the
  **Xdebug** page in the browser. Example: a script on a test server stops at `xdebug_break()`, and you step
  over it line by line, with no PhpStorm set up.

```
PHP / Xdebug ──▶ Buggregator :9003 ──▶ IDE (PhpStorm, VS Code…), if one answers
                      │
                      ├── Xdebug page: reads; steps when no IDE drives
                      └── MCP tools ◀── AI assistant
```

While an IDE is attached, it drives. Buggregator then only reads where the script stopped: the stack, variables
and source.

> The proxy is available since server v2.6.0, off by default. Driving a session without an IDE is available since
> server v2.7.0.

## Use cases

- **Ask an AI assistant about a paused request** — "what is in `$order` here?", while you stay at the breakpoint.
- **Show a session to a colleague** — they open the Xdebug page and see the same stack and variables.
- **Keep the IDE in charge** — the proxy passes everything through, so the IDE works as before.
- **Debug where there is no IDE** — a CI runner, a colleague's machine, a container: step through the code in
  the browser.

## Setup

### 1. Turn the proxy on

```yaml
xdebug:
  enabled: true
  addr: 127.0.0.1:9003        # where Xdebug connects
  ide_addr: 127.0.0.1:9004    # where your IDE listens
  allow_eval: false           # let MCP clients and watches evaluate PHP expressions
  mode: auto                  # proxy, auto or standalone; see Modes
  pause_on_first_line: false  # without an IDE: stop at the first line
  idle_timeout: 10m           # without an IDE: release a session paused this long; 0 = never
```

Or with environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `XDEBUG_PROXY_ENABLED` | `false` | Turn the proxy on (`true`, `1` or `yes`) |
| `XDEBUG_PROXY_ADDR` | `127.0.0.1:9003` | Where Xdebug connects |
| `XDEBUG_PROXY_IDE_ADDR` | `127.0.0.1:9004` | Where the IDE listens for debug connections |
| `XDEBUG_PROXY_ALLOW_EVAL` | `false` | Allow evaluating PHP expressions (see [Eval](#eval)) |
| `XDEBUG_PROXY_MODE` | `auto` | `proxy`, `auto` or `standalone` (see [Modes](#modes)). An unknown value falls back to `auto`, with a warning in the log |
| `XDEBUG_PROXY_PAUSE_ON_FIRST_LINE` | `false` | A session driven by Buggregator stops at the first line. Otherwise it runs to `xdebug_break()` |
| `XDEBUG_PROXY_IDLE_TIMEOUT` | `10m` | A session paused by Buggregator with no command this long is released, and the script runs to the end. A Go duration (`90s`, `10m`); `0` = never. A bad value keeps `10m`, with a warning |

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

## Modes

`mode` decides what happens when a session arrives.

| Mode | IDE answers | No IDE answers |
|------|-------------|----------------|
| `proxy` | the IDE drives | Buggregator detaches; the script runs on as if there were no debugger |
| `auto` (default) | the IDE drives | Buggregator drives the session |
| `standalone` | Buggregator does not call the IDE | Buggregator drives the session |

Change the mode for new sessions without a restart: `PUT /api/xdebug/settings` (see [HTTP API](#http-api)). This
change is not saved: after a restart, the config value applies again.

## Debug without an IDE

1. Turn the proxy on. The default `mode: auto` is enough. No IDE needs to listen on `ide_addr`.
2. Stop the script somewhere. Put `xdebug_break();` in the code where you want to stop. Or set
   `pause_on_first_line: true`, and every session stops at its first line.
3. Run the request with Xdebug, e.g. `php -d xdebug.mode=debug -d xdebug.start_with_request=yes script.php`.
4. Open the **Xdebug** page. The session is **Paused** at the line after `xdebug_break()`. Step with the buttons.

Without `xdebug_break()` and without `pause_on_first_line`, the script runs to the end and does not stop.

What the buttons do:

| Button | What happens |
|--------|--------------|
| **Continue** | Runs to the next `xdebug_break()`, or to the end |
| **Step into** | The next line; goes into a function call |
| **Step over** | The next line; runs a function call without stopping in it |
| **Step out** | Runs to the end of the current function and stops in the caller |
| **Stop** | Ends the request now. The rest of the script does not run, so work can stay half done |
| **Release** | Lets the script run to the end without the debugger |

While an IDE drives the session, the buttons are off.

### Stop or release?

- **Release** when you are done looking: the script finishes normally, as if no debugger had been there.
- **Stop** when the rest must not run: e.g. the next line sends an email. A stopped request may leave work
  half done: a file half written, a record without its children.

### The idle guard

A paused script holds resources: a PHP-FPM worker, the session lock, open database transactions. A session that
Buggregator paused and nobody touched for `idle_timeout` (10 minutes by default) is released: the script runs to
the end. The session then closes with `closed_reason` `idle_detached`. Every command from the page or an agent
starts the timer again. Set `idle_timeout: 0` to turn the guard off.

### Who can step

Anyone who can reach the API can step, stop and release sessions driven by Buggregator. Keep port 8000 on
`127.0.0.1`, or turn on [SSO](/config/sso): the control routes need the same login as the rest of `/api`.

## What happens to a session

- Each PHP request with Xdebug is one session. Several requests at once each get their own session.
- The IDE gets the session unchanged. It does not see what the page or the MCP tools read.
- **No IDE listening**, or the IDE goes away: depends on the [mode](#modes). In `proxy` mode Buggregator detaches,
  and the script runs on as if there were no debugger. In `auto` and `standalone` Buggregator drives the session.
- A closed session stays in the list for 10 minutes with its reason, unless you dismiss it. At most the 50
  newest closed sessions are kept.

## The Xdebug page

The **Xdebug** item appears in the sidebar only when the proxy is on.

- **Sessions** — state (Paused, Running, Detached, Stopped…), the request (`GET /checkout?step=2`, or the CLI
  command), file and line, and whether the IDE is connected.
- **Controls** — continue, step into, over and out, stop and release, for a session driven by Buggregator (see
  [Debug without an IDE](#debug-without-an-ide)). While an IDE drives, the page says so and the buttons are off.
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
| `GET` | `/api/xdebug` | `{"enabled", "addr", "ide_addr", "allow_eval", "mode", "pause_on_first_line", "idle_timeout_seconds"}`; also answers with `"enabled": false` when the proxy is off |
| `PUT` | `/api/xdebug/settings` | body `{"mode": "proxy\|auto\|standalone", "pause_on_first_line": true}`, `Content-Type: application/json`; a field left out keeps its value; applies to new sessions, not saved; answers `{"mode", "pause_on_first_line", "idle_timeout_seconds"}` |
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
| `POST` | `/api/xdebug/sessions/{id}/run` | continue; also `step-into`, `step-over`, `step-out`, `stop`, `detach` (release). Body `{}`, `Content-Type: application/json`. Answers the session at once (state `running`); the next pause comes as `session.status` |

While the script is not paused, reads and controls answer `409 not_paused`. A control on a session the IDE drives
answers `409 ide_attached`. Other codes: `400 bad_request` (a missing or bad parameter, an unknown mode),
`404 not_found`, `415 unsupported_media_type` (eval, a control or settings without JSON), `422 xdebug_error`
(Xdebug refused the read), `502 xdebug_failed`, `504 timeout`.

```json
{"code": "not_paused", "error": "session is not paused (the script is running or has not stopped at a breakpoint yet)", "state": "stopped"}
{"code": "bad_request", "error": "mode must be proxy, auto or standalone, got \"nope\""}
```

A session's `state` is one of `starting`, `break`, `running`, `stopping`, `stopped`, `detached`. A closed session
also has `closed_reason`: `ide_unreachable`, `ide_closed`, `engine_closed`, `stopped`, `detached` (released from
the page or by an agent) or `idle_detached` (released by the idle guard).

Session fields for driving: `driver` (`ide` or `here`), `last_continuation_by` (`ui`, `agent` or `null`), and
`idle_deadline` (when the idle guard releases a paused session; `null` otherwise).

### WebSocket

Events go to the `xdebug` channel: `session.created`, `session.status`, `session.closed`, `session.idle` (a new
`idle_deadline`), `agent.call.started`, `agent.call`. `session.status` carries `pause_seq`, which goes up by one on every new pause: re-read the
session when it changes.
