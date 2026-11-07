---
llms_description: "Mock server (since v2.6.0): requests to http://host:8000/mock/<path> get the response of the first enabled matching rule (method + path -> status, headers, body, delay). Path forms: exact, {param} for one segment, trailing * for the rest. Rules from buggregator.yaml (mocks:) come first and are read-only; rules from the UI or REST API /api/mocks follow by position. Every mock request is captured as an http-dump event with a payload.mock field (matched, rule_id, status, headers, body, near). Unmatched: 404 JSON. Project via X-Buggregator-Project or Basic Auth mock:<project>. Limits: status 100-599, delay up to 30s, body up to 1 MB."
---

# Mock Server — Fake API Responses

Your app calls an API that is not ready yet, is slow, or costs money per call. You want it to answer with a
fixed response, and you want to see what your app sent. The mock server does both. You describe a response
once: method and path in, status, headers and body out. Your app calls Buggregator instead of the real API.

Every call is also captured as an [HTTP dump](/config/http-dumps), so you see the request and the response
that was sent next to your logs and exceptions.

> Available since server v2.6.0. The **Mock server** page needs frontend 1.35.0, which is bundled with v2.6.0.

## Use cases

- **API not ready yet** — the frontend team builds against `/mock/users/{id}` while the backend is still in progress.
- **Error handling** — make a rule that answers `500` or `429` and check how your app reacts.
- **Slow responses** — add a delay to test timeouts and loading states.
- **CI** — put the rules in `buggregator.yaml`, so every test run gets the same answers.

## How it works

Point your client at `http://127.0.0.1:8000/mock/`. Write rule paths without the `/mock` prefix.

For example, the rule `GET /users/{id}` answers `GET http://127.0.0.1:8000/mock/users/42`.

```bash
curl http://127.0.0.1:8000/mock/users/42
# {"id": 1, "name": "Jane"}
```

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `buggregator`).

The mock server lives only under `/mock/`. A rule can never hide SDK ingestion, `/api/...` or the UI.

The mock server is part of the HTTP dumps module. If you turn that module off (`modules.http-dump: false`),
`/mock/` is off too.

### Which rule answers

Buggregator checks the rules in order. The first enabled rule that matches answers.

1. Rules from `buggregator.yaml` come first, in file order. They are read-only.
2. Rules made in the UI or through the API come next, in the order you set.

A rule matches when all of these fit:

| Condition | Values |
|-----------|--------|
| **Method** | `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, or `ANY` (the default) |
| **Path** | see the path forms below |
| **Project** | empty means every project; otherwise it must be the request's project |
| **Enabled** | a disabled rule never answers |

### Path forms

| Form | Example rule | Matches | Does not match |
|------|--------------|---------|----------------|
| Exact | `/users/me` | `/mock/users/me` | `/mock/users/42` |
| One segment | `/users/{id}` | `/mock/users/42` | `/mock/users/42/orders` |
| The rest | `/files/*` | `/mock/files`, `/mock/files/a/b.png` | `/mock/images/a.png` |

- `*` is allowed only as the whole last segment.
- A trailing slash is ignored. The query string is ignored.

### No rule matched

The mock server answers `404` with a JSON error:

```json
{"error": "no mock rule matched GET /users/42"}
```

The request is still captured. In the request details you see the rules whose path fits but that missed by one
condition, and why: `disabled`, `method` or `project`. Example: you made `POST /orders` but the app sent `GET`.
The details then show that rule with the reason `method`.

### Projects

A request belongs to the `default` project unless it says otherwise. Two ways to set a project:

```bash
# Header
curl http://127.0.0.1:8000/mock/users/42 -H 'X-Buggregator-Project: shop'

# Basic Auth with the user name "mock" (or "http-dump")
curl http://mock:shop@127.0.0.1:8000/mock/users/42
```

Other Basic Auth credentials are left alone: they belong to the API you mock.

### What every response carries

Mock bodies are your own content, served from the same address as the Buggregator UI. To keep the UI safe,
every mock response gets two headers that a rule cannot remove:

```
Content-Security-Policy: sandbox
X-Content-Type-Options: nosniff
```

A `Set-Cookie` header from a rule stays inside the mock server. Buggregator removes its `Domain` and puts its
`Path` under `/mock`. Example: `sid=1; Path=/; Domain=example.com` is sent as `sid=1; Path=/mock/`.

### CORS preflight

A browser may send an `OPTIONS` request before the real one (a CORS preflight). An `OPTIONS` rule answers it.
Without such a rule, Buggregator answers `204` with the CORS headers, and the request is captured as unmatched.

### Limits

| Field | Limit |
|-------|-------|
| `status` | 100–599, default `200` |
| delay | up to 30 seconds |
| `body` | up to 1 MB |
| header names | no spaces, no `:` |

## The Mock server page

Open **Mock server** in the sidebar.

- **Rules** on the left, in match order. Rules from `buggregator.yaml` are marked `yaml`. You can open them
  and duplicate them as editable rules, but not change them.
- Your own rules can be switched on and off, moved up and down, and edited.
- **Requests** on the right: calls to `/mock/` of the current project, live.
- Click a request to see what was sent and what came back. For an unmatched request, the page lists the rules
  that almost matched and offers to create a rule from that request.

## Rules in `buggregator.yaml`

Rules in the config file suit CI and shared setups: everyone gets the same answers.

```yaml
mocks:
  - name: user                       # optional
    method: GET                      # GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS or ANY (default)
    path: /users/{id}
    status: 200                      # default 200
    headers: { Content-Type: application/json }
    body: '{"id": 1, "name": "Jane"}'
    delay: 150ms                     # optional, a Go duration, at most 30s
    project: default                 # optional; empty = every project
```

- These rules are always enabled and read-only in the UI.
- An invalid rule is skipped at startup, with a warning in the log.
- A `delay` that is not a duration (e.g. `150` without a unit) is ignored, with a warning.

See [Server configuration](/config/server) for where the file goes.

## REST API

All routes need the same login as the rest of `/api` when [SSO](/config/sso) is on. The mock server itself
(`/mock/...`) is always public: the clients of the mocked API call it.

A rule looks like this:

```json
{
  "id": "f5171e15-2599-4c33-949b-7f7ecc05ab20",
  "project": "",
  "name": "user",
  "method": "GET",
  "path": "/users/{id}",
  "status": 200,
  "headers": {"Content-Type": "application/json"},
  "body": "{\"id\": 1}",
  "delay_ms": 100,
  "enabled": true,
  "position": 0,
  "source": "api",
  "read_only": false,
  "created_at": "2026-11-06T18:30:09Z",
  "updated_at": "2026-11-06T18:30:09Z"
}
```

Rules from the config file have `"source": "config"`, `"read_only": true` and ids `config-1`, `config-2`, …

| Method | Path | Body | Answer |
|--------|------|------|--------|
| `GET` | `/api/mocks` | — | `{"data": [rule, …]}` in match order |
| `POST` | `/api/mocks` | rule fields; `path` is required | `201` and the rule, added at the end |
| `GET` | `/api/mocks/{id}` | — | the rule, or `404` |
| `PUT` | `/api/mocks/{id}` | rule fields (replaces the rule, keeps its position) | the rule; `409` for a config rule |
| `DELETE` | `/api/mocks/{id}` | — | `{"status": true}`; `409` for a config rule |
| `POST` | `/api/mocks/order` | `{"ids": ["…", "…"]}` | `{"data": [rule, …]}`; listed rules first, the rest keep their order; an unknown or config rule id gets `404` |
| `GET` | `/api/mocks/requests?limit=50&project=&rule_id=` | — | captured mock requests, newest first; `limit` 1–500, default 50 |

Defaults on create: `method` `ANY`, `status` `200`, `enabled` `true`.

Errors are `{"message", "code"}`. A rule that fails validation gets `422` with the bad fields:

```json
{"message": "invalid mock rule: status: must be between 100 and 599", "code": 422,
 "errors": {"status": "must be between 100 and 599"}}
```

Example — create a rule:

```bash
curl -X POST http://127.0.0.1:8000/api/mocks \
  -H 'Content-Type: application/json' \
  -d '{"method": "POST", "path": "/orders", "status": 201, "body": "{\"id\": 7}", "delay_ms": 200}'
```

### The captured request

A mock request is a normal `http-dump` event. Its payload has an extra `mock` field with what was sent:

```json
"mock": {
  "matched": true,
  "rule_id": "f5171e15-…", "rule_name": "user",
  "status": 200,
  "headers": {"Content-Type": "application/json", "Content-Security-Policy": "sandbox", "X-Content-Type-Options": "nosniff"},
  "body": "{\"id\": 1}", "body_size": 9, "body_truncated": false,
  "delay_ms": 100
}
```

- `body` keeps the first 64 KB; `body_truncated` says when it was cut.
- For an unmatched request, `matched` is `false`, `rule_id` and `rule_name` are `null`, and `near` lists up to
  5 rules that missed by one condition: `[{"rule_id", "rule_name", "reason"}]`.
- Ordinary HTTP dumps have no `mock` field.
