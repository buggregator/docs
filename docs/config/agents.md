---
llms_description: "Agents panel, since server [version: to fill]: talk to the AI agents of a harnsy project from any Buggregator page over h2a. Off until explain.url + explain.token (env EXPLAIN_H2A_URL, EXPLAIN_H2A_TOKEN; explain.to / EXPLAIN_H2A_TO, default lead). URL: wss://<gateway>/h2a/v1, or ws://127.0.0.1:7790/h2a/v1 for harnsy on the same machine (ws:// only to this machine). Token: a pass made on the harnsy dashboard (Settings › Your program), h2a_…; one Buggregator per pass, a second one with the same token replaces the first. On the first question the page context goes with it (for an event, the server builds its text: Sentry error = exception, stack with source lines, tags, breadcrumbs, request line); obvious secrets masked first; nothing leaves without a click. Conversations kept in the database across restarts (event thread deleted with its event; last 50 page threads kept); event text by type (sentry, monolog, http-dump, var-dump, profiler, inspector; others JSON), page text ≤4 KB from the UI. Read-only MCP (mcp.read_only / MCP_READ_ONLY) drops write tools (event_delete, mock writes, xdebug control and eval); add it to the agents in harnsy as an MCP connection; Buggregator never sends the MCP token. API: GET /api/assist (status), /api/assist/threads."
---

# Agents Panel

Ask the AI agents of your [harnsy](https://harnsy.dev) project about what you see in Buggregator. Example: open a
Sentry error, ask «why does this fail?», and the agents answer next to the error, with the stack and the request in
front of them.

Available since server `[version: to fill]`. It is off until you connect it.

<!-- screens: filled from the UI item #7116 once it is merged -->

## What is sent, and when

Nothing leaves Buggregator until you send a question. With your first question, Buggregator sends what the page shows:

- **On an event:** the event as text. A Sentry error: the exception, the stack with its source lines, tags,
  breadcrumbs and the request line. A Monolog record, an HTTP dump, a dump, the slowest functions of a profile, an
  Inspector transaction: their main fields. Any other event: its data as JSON.
- **On any other page:** a short description of the page (up to 4 KB).

- Obvious secrets are masked before sending: DSN keys and passwords in URLs, `Authorization` and `Cookie` headers,
  values of keys such as `password`, `token` or `secret`, and well-known token shapes. Example: `DB_PASSWORD=hunter2`
  goes out as `DB_PASSWORD=[redacted]`.
- The text goes to your harnsy node, to the agents of the project the pass belongs to.
- Conversations are kept in Buggregator's database, across restarts. An event's conversation is deleted with the
  event. Of the conversations about other pages, the last 50 are kept.

## Set it up

You need a harnsy node and a project with agents.

1. In harnsy, open **Settings › Your program** and make a pass for the project. Copy its token (`h2a_…`).
2. Tell Buggregator where harnsy is and give it the token:

```dotenv
# harnsy on the same machine:
EXPLAIN_H2A_URL=ws://127.0.0.1:7790/h2a/v1
# or through the harnsy gateway:
# EXPLAIN_H2A_URL=wss://<your gateway>/h2a/v1
EXPLAIN_H2A_TOKEN=h2a_...
```

Or in `buggregator.yaml`:

```yaml
explain:
  url: ws://127.0.0.1:7790/h2a/v1
  token: h2a_...
  to: lead            # who answers: the project's lead (default), or role:<id> from the pass
```

3. Restart Buggregator. The panel connects by itself.

- `ws://` works only for harnsy on the same machine. Any other address must be `wss://`.
- Buggregator in Docker reaches `ws://127.0.0.1:7790` only with the host's network (`network_mode: host`). Otherwise
  use the gateway's `wss://` address.
- One Buggregator per pass. Start a second one with the same token, and it takes the connection over from the first.
  Make a pass for each Buggregator.
- Keep the token secret: anyone with it can write to your agents.

## Let the agents look at your data

The agents can read Buggregator's data themselves, through its [MCP server](/config/mcp), in a mode that changes
nothing:

```yaml
mcp:
  enabled: true
  transport: http
  addr: 127.0.0.1:8001
  auth_token: a-long-random-token
  read_only: true      # env MCP_READ_ONLY=true
```

`read_only` removes every tool that changes data or drives a debugger: `event_delete`, the mock rule writes and the
Xdebug controls and `eval`. The agents can still list and read events, profiles, mock rules and traces.

Then, in harnsy, add `http://127.0.0.1:8001/` with the header `Authorization: Bearer a-long-random-token` to the agents
as an MCP connection named `buggregator`. Buggregator tells the agents the connection is there; it never sends the
token. This works when the agents run where they can reach that address, for example on the same machine.

## Panel status

| Status | What it means | What to do |
|--------|---------------|------------|
| Not configured | `explain.url` or `explain.token` is empty | Set both, restart |
| Connecting | Buggregator is signing in to harnsy, or lost the connection and tries again | Wait; check that harnsy runs and the URL is right |
| Stopped | The URL is wrong (`ws://` to another machine), or harnsy refused the pass: a wrong token, a revoked pass, or another Buggregator took the pass over | Fix the URL, check the token and the pass in harnsy, restart |

## API

`GET /api/assist` answers the panel's status. The conversations are under `/api/assist/threads`. With
[SSO](/config/sso) on, both need the `X-Auth-Token` header.
