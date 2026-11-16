---
llms_description: "HTTP API reference: full OpenAPI 3.1 spec api/openapi.yaml in buggregator/server (78 paths of v2.10.0: Server, Events, Projects, Auth, Metrics, Sentry, SMTP, Attachments, Mocks, Xdebug, Xdebug traces, Profiler, Ingestion; ingestion paths marked x-ingestion: true). Calls for tests: GET /api/version (health, no auth); DELETE /api/events (no body = all; JSON {type, project, uuids, keep_pinned} narrows; since server [version: to fill] a malformed body or wrong field type → 400, nothing deleted); DELETE /api/smtp/messages?project=; GET /api/smtp/messages/wait?subject=&to=&timeout=10s → 200 message or 408 (max 60s); GET /api/events?type=sentry → {data:[…]}. Auth only with SSO on: header X-Auth-Token."
---

# API reference

Everything the UI does goes through an HTTP API on port `8000`. Your tests and scripts can use the same API, e.g. to
wait for an email or to clear events between tests.

## The full spec

The whole API is described in one OpenAPI 3.1 file:
[`api/openapi.yaml`](https://github.com/buggregator/server/blob/master/api/openapi.yaml) in the server repository.
Open it in any OpenAPI viewer (Swagger UI, Redoc, your IDE) or generate a client from it.

It covers every route of the server, grouped by area:

| Area | What is there |
|------|---------------|
| Server, Projects | version, settings, project list |
| Events | list, read, pin, delete events of every type |
| SMTP, Attachments | email testing API, attachment download |
| Sentry | errors, traces, logs, metrics, counts, clear |
| Mocks | mock server rules, OpenAPI import |
| Profiler, Xdebug, Xdebug traces | profiles, the Xdebug proxy, traces |
| Auth, Metrics | SSO login, Prometheus |
| Ingestion | routes the SDKs send to (marked `x-ingestion: true`) |

A server test compares the spec with the routes in the code, so a new route cannot ship without its entry.

## Calls for tests

The ones you need most in a test suite or CI job. Examples use `http://127.0.0.1:8000`.

### Is the server up?

```bash
curl http://127.0.0.1:8000/api/version
# {"version":"2.10.0"}
```

No login needed, also with SSO on. Use it as a health check.

### Start from a clean state

```bash
# every event
curl -X DELETE http://127.0.0.1:8000/api/events

# only emails
curl -X DELETE http://127.0.0.1:8000/api/events \
  -H 'Content-Type: application/json' -d '{"type": "smtp"}'
```

It deletes events. Sentry logs, metrics and trace spans without an event card stay: clear them with
`DELETE /api/sentry/all` (see [Sentry → Clearing data](/config/sentry#clearing-data)).

The JSON body narrows what is deleted: `type`, `project`, `uuids` (a list of event IDs), `keep_pinned: true`.
Since server [version: to fill], a body that is not valid JSON, or a field of the wrong type, gets `400` and deletes
nothing. In 2.10.0 the same
mistake deletes **every** event: e.g. `{"type": smtp}` (no quotes) clears all types.

### Wait for an email

```bash
curl -G http://127.0.0.1:8000/api/smtp/messages/wait \
  --data-urlencode 'subject=Welcome' \
  --data-urlencode 'to=user@example.com' \
  --data-urlencode 'timeout=10s'
```

It answers `200` with the message as soon as one matches, or `408` when the time is up (at most `60s`). More
filters and calls: [SMTP → Testing API](/config/smtp#testing-api).

### List events of one type

```bash
curl 'http://127.0.0.1:8000/api/events?type=sentry'
# {"data": [{"uuid": "…", "type": "sentry", "project": "default", "payload": {…}, …}], "meta": {…}}
```

Types: `sentry`, `smtp`, `monolog`, `var-dump`, `ray`, `inspector`, `profiler`, `http-dump`, `sms`,
`xdebug-trace`.

## With SSO on

When [SSO](/config/sso) is on, the UI's API needs the header `X-Auth-Token: <token>`. See
[SSO → Calling the API from Scripts](/config/sso#calling-the-api-from-scripts). In CI you usually run Buggregator
without SSO, so no token is needed.
