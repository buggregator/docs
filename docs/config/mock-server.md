---
llms_description: "Mock server (since v2.6.0): requests to http://host:8000/mock/<path> get the response of the first enabled matching rule (method + path -> status, headers, body, delay). Path forms: exact, {param} for one segment, trailing * for the rest. Rules from buggregator.yaml (mocks:) come first and are read-only; rules from the UI or REST API /api/mocks follow by position. Every mock request is captured as an http-dump event with a payload.mock field (matched, rule_id, status, headers, body, near). Unmatched: 404 JSON. Project via X-Buggregator-Project or Basic Auth mock:<project>. Limits: status 100-599, delay up to 30s, body up to 1 MB. Up to 500 stored rules per project. OpenAPI 3.0/3.1 import: POST /api/mocks/import/openapi {spec|url, project, group (default openapi:<info.title>), base_path} -> {group, title, rules, skipped}; one rule per operation (lowest 2xx, spec example as is or a template from the schema); re-import replaces the group; DELETE /api/mocks/groups/{group}; config mocks_openapi: (file, project, group, base_path), read-only; MCP mock_import_openapi, mock_group_delete. Dynamic responses: template: true and seed, see /config/mock-templates. Request conditions (since 2.16.0): rule field conditions [{in: header|body, name, op: equals (default)|not_equals|exists|not_exists, value}], all must hold besides method/path/project, a failing rule is skipped and the next tried (put specific rules above general ones); header names any case, values exact; body path a.b, items.0.id, items.*.id (any item), $.a.b and a[0] accepted; body value compared by type (string as is, number numerically, big ints exact, true/false, null, object/list as JSON); missing field or non-JSON body: equals/exists fail, not_equals/not_exists hold; max 20 conditions, name 512 B, value 4 KB, body first 1 MB; no regex, no form fields. PUT without conditions keeps them, [] clears; 422 errors.conditions.N. near[].reason conditions with detail (e.g. header Authorization equals, no value). Preview answers failed_condition."
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
- **Realistic data** — a [template rule](/config/mock-templates) copies the id from the path and fills in fake
  names, emails and prices for each request.

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
| **Conditions** | optional; every condition on request headers and JSON body fields must hold, see [Request conditions](#request-conditions) |

### Path forms

| Form | Example rule | Matches | Does not match |
|------|--------------|---------|----------------|
| Exact | `/users/me` | `/mock/users/me` | `/mock/users/42` |
| One segment | `/users/{id}` | `/mock/users/42` | `/mock/users/42/orders` |
| The rest | `/files/*` | `/mock/files`, `/mock/files/a/b.png` | `/mock/images/a.png` |

- `*` is allowed only as the whole last segment.
- A trailing slash is ignored. The query string is ignored.

### Request conditions

Since server v2.16.0. A rule can also check request headers and JSON body fields. One path can then give different
answers. Example: `POST /payments` answers `200` for a good card and `402` for any other card.

```yaml
mocks:
  - name: payment ok
    method: POST
    path: /payments
    conditions:
      - { in: body, name: card.token, op: equals, value: tok_ok }
      - { in: header, name: authorization, op: exists }
    status: 200
    body: '{"status": "paid"}'
  - name: payment declined
    method: POST
    path: /payments
    status: 402
    body: '{"error": "card_declined"}'
```

```bash
curl -X POST http://127.0.0.1:8000/mock/payments -H 'Authorization: Bearer x' \
  -H 'Content-Type: application/json' -d '{"card": {"token": "tok_ok"}}'
# {"status": "paid"}  (200)

curl -X POST http://127.0.0.1:8000/mock/payments -H 'Authorization: Bearer x' \
  -H 'Content-Type: application/json' -d '{"card": {"token": "tok_bad"}}'
# {"error": "card_declined"}  (402)
```

All conditions of a rule must hold, together with its method, path and project. When one fails, the rule is
skipped and the next rule is tried. So put the rule with conditions **above** a general rule for the same path.
In the example above, the order of the two rules matters: swapped, `payment declined` would answer every request.

Each condition has four fields:

| Field | Values |
|-------|--------|
| `in` | `header` or `body` |
| `name` | a header name, or a path to a JSON body field |
| `op` | `equals` (the default), `not_equals`, `exists`, `not_exists` |
| `value` | text to compare with; not used by `exists` and `not_exists` |

**Headers.** Header names ignore case: `authorization` checks `Authorization`. The value is compared exactly, case
included. When a header comes several times, `equals` holds if any of its values is equal.

**Body fields.** The body must be JSON. Write the path with dots:

| Path | Reads |
|------|-------|
| `card.token` | `{"card": {"token": "…"}}` |
| `items.0.id` | the `id` of the first item of the list `items` |
| `items.*.id` | the `id` of any item: `equals` holds when one of them is equal |

`$.card.token` and `items[0].id` work too. They mean the same as `card.token` and `items.0.id`.

A body field is compared by its type in the request:

| Field in the request | `value` that equals it |
|----------------------|------------------------|
| string `"15"` | `15` (the text as is) |
| number `15` | `15`, `15.0`; large whole numbers are compared exactly |
| `true` / `false` | `true` / `false` |
| `null` | `null` |
| object or list | the same JSON, e.g. `{"a": 1}`; key order does not matter |

**A missing field never equals.** If the header or the field is not in the request (or the body is not JSON),
`equals` and `exists` fail, and `not_equals` and `not_exists` hold. Example: `card.token` `not_equals` `tok_ok`
holds for a request with no card at all.

Rules without conditions work as before.

Limits: at most 20 conditions per rule, a `name` up to 512 bytes, a `value` up to 4 KB. The body is read up to
its first 1 MB. Comparisons are exact text or JSON values only: no patterns and no form fields (`a=1&b=2`).

In the UI, the rule form has a **Conditions** block: **+ Add condition**, then pick **Header** or **Body field**,
the name, and **equals**, **does not equal**, **is present** or **is missing**. In the rule list, a rule with
conditions shows a tag like `+2 conditions`.

### No rule matched

The mock server answers `404` with a JSON error:

```json
{"error": "no mock rule matched GET /users/42"}
```

The request is still captured. In the request details you see the rules whose path fits but that missed by one
condition, and why: `disabled`, `method`, `project` or `conditions`. Example: you made `POST /orders` but the app
sent `GET`. The details then show that rule with the reason `method`.

For `conditions`, the details also name the first condition that failed, e.g. `body card.token equals`. The value
is not shown.

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
| stored rules | at most 500 per project; rule 501 gets `422` with `errors.project` |

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

::: v-pre

## Import an OpenAPI spec

Have an OpenAPI 3.0 or 3.1 spec? Import it, and every operation becomes a rule. Example: a spec with
`GET /users/{id}` and `POST /orders` gives two rules, and `/mock/v1/users/42` answers at once.

How a rule is built:

- **One rule per operation**, all in one group. The rule's name is the `operationId`, else the `summary`, else
  the method and the full path, base path included: `GET /v1/users/{id}`.
- **Status**: the lowest `2xx` response of the operation.
- **Body**: the spec's `example`, as is. No example: a [template](/config/mock-templates) built from the schema,
  with fake data. A root field named like a path parameter echoes it (`id` for the last one).
- **Path**: the path of `servers[0].url` goes in front. `https://api.example.com/v1` + `/users/{id}` →
  `/v1/users/{id}`. Set `base_path` to change it; `""` means no prefix.
- **Import again** into the same group, and the group's old rules are replaced.
- Local `$ref` only. `oneOf` and `anyOf` take the first option. Swagger 2.0 is refused: convert it to OpenAPI 3.

The rules are ordinary rules: edit them afterwards like any other.

Import a spec:

```bash
curl -X POST http://127.0.0.1:8000/api/mocks/import/openapi \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --rawfile spec shop.yaml '{spec: $spec}')"
```

With this `shop.yaml`:

```yaml
openapi: 3.0.3
info: { title: Shop API, version: "1.0" }
servers:
  - url: https://api.example.com/v1
paths:
  /users/{id}:
    get:
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        "200":
          description: A user
          content:
            application/json:
              schema:
                type: object
                properties:
                  id: { type: integer }
                  name: { type: string }
                  email: { type: string, format: email }
                  status: { type: string, enum: [active, banned] }
  /orders:
    post:
      responses:
        "201":
          description: Created
          content:
            application/json:
              example: { id: 1001, status: pending }
```

The answer lists the rules (cut here) and the operations it skipped:

```json
{"group": "openapi:Shop API", "title": "Shop API",
 "rules": [
   {"name": "GET /v1/users/{id}", "method": "GET", "path": "/v1/users/{id}", "status": 200, "template": true,
    "body": "{\n  \"id\": {{ int (path \"id\") }},\n  \"name\": {{ fake \"name\" | json }},\n  \"email\": {{ fake \"email\" | json }},\n  \"status\": {{ pick \"active\" \"banned\" | json }}\n}", …},
   {"name": "POST /v1/orders", "method": "POST", "path": "/v1/orders", "status": 201, "template": false,
    "body": "{\n  \"id\": 1001,\n  \"status\": \"pending\"\n}", …}],
 "skipped": []}
```

Then:

```bash
curl http://127.0.0.1:8000/mock/v1/users/42
# {"id": 42, "name": "Alden Vaughn", "email": "troy-hart@ramirez.net", "status": "active"}
curl -X POST http://127.0.0.1:8000/mock/v1/orders
# {"id": 1001, "status": "pending"}   (status 201)
```

(Bodies come indented; shown here on one line.)

Request fields:

| Field | What it does |
|-------|--------------|
| `spec` | The spec text, YAML or JSON |
| `url` | Or the spec's address: `http`/`https`, at most 5 MB, downloaded within 10 s |
| `project` | The rules' project; empty = every project. A project that does not exist yet is fine: it is created by its first event |
| `group` | The group name; default `openapi:<info.title>` |
| `base_path` | The prefix for every path; default: the path of `servers[0].url`; `""` = none |

Answer fields: `group`, `title`, `rules` (the created rules), `skipped` (a list of `method`, `path`, `reason`).
An operation is skipped, for example, when one import builds more than 500 rules (`reason`: `over 500 rules`).

A project holds at most 500 stored rules. When the import would take it over, the whole import is refused and
nothing is added: `422`, `errors.project`: `the import adds 2 rules, the project has 499; at most 500 rules per
project`.

Errors are `422`, the field in `errors`:

| Case | `errors` |
|------|----------|
| neither `spec` nor `url` | `{"spec": "give the spec text or its url"}` |
| both | `{"spec": "give spec or url, not both"}` |
| Swagger 2.0 | `{"spec": "Swagger 2.0 is not supported; convert it to OpenAPI 3"}` |
| not OpenAPI | `{"spec": "not an OpenAPI 3 document (no openapi: 3.x)"}` |
| `url` not http(s) | `{"url": "url must be http or https"}` |
| download failed | `{"url": "download: raw.githubusercontent.com answered 404"}` |

Delete a group (the name URL-encoded):

```bash
curl -X DELETE 'http://127.0.0.1:8000/api/mocks/groups/openapi%3AShop%20API'
# {"deleted":2}
```

### A spec in `buggregator.yaml`

```yaml
mocks_openapi:
  - file: ./shop.yaml
    project: shop          # optional; empty = every project
    group: shop-api        # optional; default openapi:<info.title>
    base_path: ""          # optional; "" = no prefix
```

The spec is read at startup; the log says `mock: OpenAPI spec loaded` with the file, group and rule count. These
rules are read-only, like other config rules (`"source": "config"`, ids `config-1`, …): changing or deleting one
gets `409`.

AI agents import with the MCP tool `mock_import_openapi` and delete a group with `mock_group_delete`, see
[MCP tools](/config/mock-templates#mcp-tools-for-ai-agents).

:::

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
  "template": false,
  "seed": 0,
  "conditions": [{"in": "header", "name": "Authorization", "op": "exists"}],
  "group": "",
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
| `POST` | `/api/mocks/import/openapi` | `{"spec" or "url", "project", "group", "base_path"}` | `{"group", "title", "rules", "skipped"}`, see [OpenAPI import](#import-an-openapi-spec) |
| `DELETE` | `/api/mocks/groups/{group}` | — | `{"deleted": n}`: the group's stored rules are gone |

Defaults on create: `method` `ANY`, `status` `200`, `enabled` `true`, `template` `false`, `seed` `0`,
`conditions` `[]`. On `PUT`, a body without `conditions` keeps the rule's conditions; `"conditions": []` removes
them. A bad condition gets `422` with the field `conditions.N` (N counts from 0).

Template rules (`template`, `seed`), `POST /api/mocks/preview` and `GET /api/mocks/helpers`:
[Response templates](/config/mock-templates).

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

Example — a rule with conditions: answer `401` when the `Authorization` header is not `Bearer good`:

```bash
curl -X POST http://127.0.0.1:8000/api/mocks \
  -H 'Content-Type: application/json' \
  -d '{"method": "GET", "path": "/me", "status": 401, "body": "{\"error\": \"unauthorized\"}",
       "conditions": [{"in": "header", "name": "Authorization", "op": "not_equals", "value": "Bearer good"}]}'
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
  5 rules that missed by one condition: `[{"rule_id", "rule_name", "reason", "detail"}]`. `detail` is there only
  for the reason `conditions`: the first condition that failed, e.g. `header Authorization equals`.
- A [template](/config/mock-templates) that failed adds `template_error` with the error text; `status` is then `500`.
- Ordinary HTTP dumps have no `mock` field.
