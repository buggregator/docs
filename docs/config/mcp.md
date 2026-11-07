---
llms_description: "MCP (Model Context Protocol) server for AI assistant integration. Two transports: Unix socket (default) and HTTP/SSE. Available tools: events_list, event_get, event_delete, sentry_event, vardump_get, profiler_summary, profiler_top, profiler_call_graph; with the Xdebug proxy on, xdebug_sessions, xdebug_location, xdebug_stack, xdebug_variables, xdebug_property, xdebug_eval (allow_eval only). Integration with Claude Code, Cursor, and other MCP-compatible clients."
---

# Configuration — MCP (Model Context Protocol)

Buggregator includes a built-in [MCP](https://modelcontextprotocol.io/) server that lets AI assistants
query your debugging data directly. Connect Claude Code, Cursor, or any MCP-compatible client to browse
events, inspect errors, analyze profiling data, and read variable dumps — without leaving your editor.

## Enabling MCP

MCP is disabled by default. Enable it in `buggregator.yaml`:

```yaml
mcp:
  enabled: true
```

Or via environment variable:

```bash
MCP_ENABLED=true
```

## Transport Modes

### Unix Socket (Default)

The server listens on a Unix domain socket. This is the recommended mode for local development.

```yaml
mcp:
  enabled: true
  transport: socket
  socket_path: /tmp/buggregator-mcp.sock
```

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `socket` | Transport type |
| `MCP_SOCKET_PATH` | `/tmp/buggregator-mcp.sock` | Unix socket path |

### HTTP/SSE

For remote access or when Unix sockets are not available, use HTTP transport:

```yaml
mcp:
  enabled: true
  transport: http
  addr: ":8001"
  auth_token: my-secret-token     # Optional bearer token
```

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_TRANSPORT` | `socket` | Set to `http` |
| `MCP_ADDR` | `:8001` | HTTP listen address |
| `MCP_AUTH_TOKEN` | — | Bearer token for authentication (optional) |

When `MCP_AUTH_TOKEN` is set, all requests must include the `Authorization: Bearer <token>` header.

## Integration with AI Assistants

### Claude Code

Add to your `.mcp.json` or configure via Claude Code settings:

```json
{
  "mcpServers": {
    "buggregator": {
      "type": "stdio",
      "command": "buggregator",
      "args": ["mcp"]
    }
  }
}
```

Or from the command line:

```bash
claude mcp add buggregator -- buggregator mcp
```

The `buggregator mcp` subcommand bridges stdio to the running Buggregator instance via the Unix socket.
`command` is the path to the binary: `buggregator` when it is on your `PATH`, else the full path.

> **Note:** Make sure Buggregator is running with MCP enabled before connecting.

If Buggregator runs in Docker, you can use the HTTP transport instead:

```json
{
  "mcpServers": {
    "buggregator": {
      "type": "http",
      "url": "http://localhost:8001/mcp"
    }
  }
}
```

Or add it from the command line:

```bash
claude mcp add --transport http buggregator http://localhost:8001/mcp
```

With `MCP_AUTH_TOKEN` set, pass the token as a header:

```json
{
  "mcpServers": {
    "buggregator": {
      "type": "http",
      "url": "http://localhost:8001/mcp",
      "headers": {
        "Authorization": "Bearer my-secret-token"
      }
    }
  }
}
```

The same from the command line:

```bash
claude mcp add --transport http buggregator http://localhost:8001/mcp \
  --header "Authorization: Bearer my-secret-token"
```

Without the header, the server answers `401`.

### Cursor

In Cursor settings, add the MCP server:

- **Command:** `buggregator mcp`
- Or use the HTTP URL: `http://localhost:8001/mcp`

### Docker Setup

When running Buggregator in Docker with MCP enabled:

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:8001:8001    # MCP HTTP port
    environment:
      MCP_ENABLED: "true"
      MCP_TRANSPORT: http
      MCP_ADDR: ":8001"
```

## Available Tools

MCP clients can use the following tools to query Buggregator data:

### Event Management

| Tool | Description |
|------|-------------|
| `events_list` | List events with optional filtering by type and project. Returns metadata (uuid, type, timestamp, project) without payloads. Supports `limit` parameter (default 20, max 100). |
| `event_get` | Get a complete event by UUID, including the full payload. |
| `event_delete` | Delete an event by UUID. |

### Sentry

| Tool | Description |
|------|-------------|
| `sentry_event` | Get structured details of a Sentry error: message, severity, exception chain with stack traces, environment, platform. Returns clean, AI-friendly data. |

### VarDumper

| Tool | Description |
|------|-------------|
| `vardump_get` | Get a variable dump with HTML stripped for clean AI consumption. Returns variable type, label, and plain text representation. |

### Profiler

| Tool | Description |
|------|-------------|
| `profiler_summary` | Quick overview: total CPU/wall time/memory, slowest function, biggest memory consumer, most called function. |
| `profiler_top` | Top functions sorted by metric (cpu, wt, mu, pmu, ct, and their exclusive variants). Returns inclusive and exclusive metrics with percentages. |
| `profiler_call_graph` | Filtered call graph showing function relationships. Use `threshold` and `percentage` to control which nodes are shown. |

### Xdebug

With the [Xdebug proxy](/config/xdebug) on (`xdebug.enabled: true`), MCP clients also get these tools. They read a
debug session paused in the IDE; only `xdebug_eval` (off unless `xdebug.allow_eval: true`) runs code. Stepping and
continuing stay in the IDE.

| Tool | Description |
|------|-------------|
| `xdebug_sessions` | List debug sessions, including ones closed in the last 10 minutes. A session can be read only while it is paused (state `break`). |
| `xdebug_location` | Current file and line, the function it is in, and the source lines around it. |
| `xdebug_stack` | The call stack, one frame per level; `0` is the current frame. |
| `xdebug_variables` | Variables of a frame: locals by default (`context_id` `1` = superglobals, `2` = constants). Arrays and objects show their first level. |
| `xdebug_property` | One variable or property by its full name (`$user`, `$user->address`, `$items[0]`) with its children. Long strings up to 64 KB. |
| `xdebug_eval` | The value of a PHP expression in the current frame. Present only with `xdebug.allow_eval: true`: the code really runs inside the debugged request. |

`session_id` can be left out when exactly one session is paused. More in [Xdebug → MCP tools](/config/xdebug#mcp-tools).

### Example Usage in Claude Code

Once connected, you can ask your AI assistant things like:

- "Show me the latest Sentry errors"
- "What's the stack trace for this exception?"
- "Analyze the profiling data and find the slowest functions"
- "What value was dumped in the last VarDumper event?"
