---
llms_description: "Mock response templates (dynamic mock responses): rule field template: true makes body and header values Go text/template; seed (0 = new random data per request, not 0 = same data every time). Helpers: path, query, queryAll, header, body (JSON dot path, list index), bodyRaw, method, requestPath; fake (gofakeit generators, args fill params in order), pick, repeat (range $i := repeat n), add, int, now; json, default, upper, lower; if/else/eq/gt, with. Rules: every string in a JSON body through | json; request values are strings and JSON body numbers are float64: convert with int before repeat, add or comparing with a whole number (repeat (int (query \"limit\"))). Limits per response: 1 MB output, 10000 loop items, 1000000 steps, 4 MB made by helpers, fake counts 1000; 500 stored rules per project. Errors: parse error 422 on save, runtime error 500 {\"error\":\"mock template: …\"} and mock.template_error. API: POST /api/mocks/preview, GET /api/mocks/helpers. MCP tools mock_rules_list, mock_rule_get, mock_rule_preview, mock_requests_list, mock_template_helpers, mock_rule_create, mock_rule_update, mock_rule_delete, mock_rule_from_request (write tools off with mcp.mock_write: false). YAML mocks: template, seed."
---

::: v-pre

# Mock Server — Response Templates

A plain [mock rule](/config/mock-server) always sends the same body. A template rule builds the body for each
request. It can copy values from the request and add fake data.

Example: the rule `GET /users/{id}` answers `/mock/users/42` with `{"id": 42, …}` and `/mock/users/7` with
`{"id": 7, …}`, each with a made-up name.

> Available since server v2.6.0. The **Mock server** page does not show the template fields yet: set them through
> the [REST API](/config/mock-server#rest-api) or in [`buggregator.yaml`](#rules-in-buggregator-yaml).

Every example on this page was run on a real server. The output is pasted as it came back. With fake data and
no `seed`, your values will differ.

## Turn it on

Two rule fields:

| Field | Values | What it does |
|-------|--------|--------------|
| `template` | `false` (default), `true` | `true`: the body and every header value are [Go templates](https://pkg.go.dev/text/template) |
| `seed` | integer, default `0` | `0`: new fake data on every request. Any other number: the same fake data on every request |

With `template: false`, `{{` is sent as is. Rule body `{"id": {{ path "id" }}}` then answers
`{"id": {{ path "id" }}}`.

The `status` is not a template: a rule always answers with its own status code.

Create a template rule:

```bash
curl -X POST http://127.0.0.1:8000/api/mocks \
  -H 'Content-Type: application/json' \
  -d '{"method": "GET", "path": "/users/{id}", "template": true, "seed": 42,
       "headers": {"Content-Type": "application/json"},
       "body": "{\"id\": {{ path \"id\" }}, \"name\": {{ fake \"name\" | json }}, \"email\": {{ fake \"email\" | json }}}"}'

curl http://127.0.0.1:8000/mock/users/42
# {"id": 42, "name": "Jessica Hills", "email": "jonathon.marquardt@wilkinson.biz"}
```

## Template basics

Text outside `{{ … }}` is sent as is. Inside, you call a helper: its name, then its arguments, separated by
spaces. Strings are in double quotes.

```
{{ path "id" }}             one helper, one argument
{{ fake "number" 18 90 }}   two arguments
```

`|` passes a value to the next helper as its last argument. `{{ fake "name" | json }}` is the same as
`{{ json (fake "name") }}`. Parentheses group a call inside another one.

### Three rules for JSON bodies

1. **Every string goes through `| json`.** It adds the quotes and escapes them inside the value. Without it, the
   body is not valid JSON. Request `?q=say "hi"`:

   | Template | Output |
   |----------|--------|
   | `{"q": {{ query "q" \| json }}}` | `{"q": "say \"hi\""}` |
   | `{"q": "{{ query "q" }}"}` | `{"q": "say "hi""}` (broken) |

   Numbers and booleans can go in as they are: `{"age": {{ fake "number" 18 90 }}}`.

2. **Request values are strings.** `path`, `query` and `header` always return text. Compare them with a string:
   `eq (query "page") "2"`, not `eq (query "page") 2`.

3. **Numbers from a JSON request body are decimals** (Go `float64`). Compare them with a decimal:
   `gt (body "amount") 100.0`. `gt (body "amount") 100` fails with
   `incompatible types for comparison: float64 and int`.

   **Need a whole number? Use `int`.** `repeat`, `add` and a comparison with a whole number need one. Wrap the
   request value in `int`:

   | Template | Request | Output |
   |----------|---------|--------|
   | `{{ range $i := repeat (int (query "limit" \| default "2")) }}…` | `?limit=3` | 3 items |
   | `{"qty": {{ add (int (body "qty")) 1 }}}` | body `{"qty": 2}` | `{"qty": 3}` |
   | `{{ if gt (int (body "amount")) 100 }}…` | body `{"amount": 250}` | the `if` part |

   Without `int`, `repeat (query "limit")` fails with `wrong type for value; expected int; got string`.

## Guide

The examples use the preview endpoint: it runs a rule against a sample request without saving it. See
[Preview](#preview-a-rule).

### Values from the request

Rule `GET /users/{id}`, body:

```
{"id": {{ path "id" }}, "page": {{ query "page" | default "1" }}, "client": {{ header "X-Client" | json }}, "method": {{ method | json }}, "path": {{ requestPath | json }}}
```

Request `GET /mock/users/42?page=3` with header `X-Client: web`:

```json
{"id": 42, "page": 3, "client": "web", "method": "GET", "path": "/users/42"}
```

Request `GET /mock/users/7`, no query, no header:

```json
{"id": 7, "page": 1, "client": ""}
```

(Second run with the body cut to the first three fields.) A missing value is an empty string; `default` replaces it.

The rest of a path after a trailing `*`: rule `/files/*`, body `{"file": {{ path "*" | json }}}`, request
`/mock/files/docs/2026/report.pdf`:

```json
{"file": "docs/2026/report.pdf"}
```

### Values from a JSON body

`body` takes a dot path. A number in the path picks a list item, counting from 0.

Rule `POST /orders`, status `201`, body:

```
{"email": {{ body "customer.email" | json }}, "first_sku": {{ body "items.0.sku" | json }}, "items": {{ body "items" | json }}, "missing": {{ body "nope" | json }}}
```

Request body `{"customer":{"email":"alice@example.com"},"items":[{"sku":"A-1","qty":2},{"sku":"B-7","qty":1}]}`:

```json
{"email": "alice@example.com", "first_sku": "A-1", "items": [{"qty":2,"sku":"A-1"},{"qty":1,"sku":"B-7"}], "missing": null}
```

- A missing path gives nothing; `| json` writes it as `null`.
- Objects and lists come out whole with `| json`. Their keys are sorted.
- A body that is not JSON: every `body` path is missing. `bodyRaw` gives the body as text:
  body `{{ bodyRaw }}`, request body `hello=world` → `hello=world`.

### Fake data

`fake "generator"` makes up a value. Common generators, run with `seed: 1`:

| Template | Output |
|----------|--------|
| `{{ fake "name" \| json }}` | `"Zachary Byrd"` |
| `{{ fake "firstname" \| json }}` | `"Zachary"` |
| `{{ fake "lastname" \| json }}` | `"Zamora"` |
| `{{ fake "email" \| json }}` | `"zacharybyrd@towne.io"` |
| `{{ fake "username" \| json }}` | `"Antonio.87"` |
| `{{ fake "phone" \| json }}` | `"9189298152"` |
| `{{ fake "uuid" \| json }}` | `"b84fb46b-9fe3-4aff-8b5a-111c601e3d1a"` |
| `{{ fake "word" \| json }}` | `"change"` |
| `{{ fake "sentence" \| json }}` | `"Mind the year, then celebrate!"` |
| `{{ fake "city" \| json }}` | `"Birmingham"` |
| `{{ fake "country" \| json }}` | `"Zimbabwe"` |
| `{{ fake "street" \| json }}` | `"89298 North Ovalburgh"` |
| `{{ fake "zip" \| json }}` | `"18929"` |
| `{{ fake "company" \| json }}` | `"Zoner"` |
| `{{ fake "jobtitle" \| json }}` | `"Zookeeper"` |
| `{{ fake "url" \| json }}` | `"https://www.strategicstrategize.io/evolve"` |
| `{{ fake "ipv4address" \| json }}` | `"184.11.172.220"` |
| `{{ fake "productname" \| json }}` | `"Usb-Powered Yoga Strap"` |
| `{{ fake "currencyshort" \| json }}` | `"ZWL"` |
| `{{ fake "color" \| json }}` | `"YellowGreen"` |
| `{{ fake "date" \| json }}` | `"2026-02-27T21:17:56Z"` |
| `{{ fake "number" }}` | `-340504648` |
| `{{ fake "price" }}` | `340.28` |
| `{{ fake "bool" }}` | `false` |
| `{{ fake "httpstatuscode" }}` | `504` |

These are a few of many. The full list with each one's parameters: [`GET /api/mocks/helpers`](#list-of-helpers-and-generators).

**Arguments** fill the generator's parameters in the order the list gives them. `number` has `min` and `max`, so
`{{ fake "number" 18 90 }}` is a whole number from 18 to 90. A parameter you leave out takes its default. A
parameter with no default must be given: `{{ fake "float64range" }}` fails with `could not find field: min`.

Rule `/users/{id}`, `seed: 42`, body:

```
{"id": {{ path "id" }}, "name": {{ fake "name" | json }}, "email": {{ fake "email" | json }}, "age": {{ fake "number" 18 90 }}, "uuid": {{ fake "uuid" | json }}, "active": {{ fake "bool" }}, "price": {{ fake "price" 5 500 }}, "bio": {{ fake "loremipsumsentence" 6 | json }}}
```

Request `/mock/users/1`:

```json
{"id": 1, "name": "Jessica Hills", "email": "jonathon.marquardt@wilkinson.biz", "age": 73, "uuid": "bb4692dd-a6cd-4bd1-b922-33be54bd787f", "active": false, "price": 385.05, "bio": "Rerum et adipisci reprehenderit voluptates nam."}
```

Dates: the format style depends on the generator. `{{ fake "date" "2006-01-02" | json }}` gave `"1962-12-12"`;
`{{ fake "daterange" "2024-01-01" "2024-12-31" "yyyy-MM-dd" | json }}` gave `"2024-03-16"`. Check the `default`
of the generator's `format` parameter in the helpers list.

Some generators return an object. Write it with `| json`. `{{ fake "person" | json }}`, `seed: 1`:

```json
{"first_name":"Zachary","last_name":"Byrd","gender":"female","age":92,"ssn":"356850791","hobby":"Virtual Reality","job":{"company":"SocialEffort Inc","title":"Barista","descriptor":"Investor","level":"Directives"},"address":{"address":"340 Terraceland, Fort Worth, Maine 26713","street":"340 Terraceland","unit":"","city":"Fort Worth","state":"Maine","zip":"26713","country":"United States Minor Outlying Islands","latitude":13.856683,"longitude":-9.588688},"contact":{"phone":"1800157326","email":"darrin.moreno@dixon.biz"},"credit_card":{"type":"UnionPay","number":"6062828218685127","exp":"10/29","cvv":"584"}}
```

### The same data every time: `seed`

With `seed: 42`, two requests with the body `{"name": {{ fake "name" | json }}, "email": {{ fake "email" | json }}}`
both answer:

```json
{"name": "Jessica Hills", "email": "jonathon.marquardt@wilkinson.biz"}
```

With `seed: 0` (the default) the body `{"name": {{ fake "name" | json }}}` answered `{"name": "Marion Santiago"}`,
then `{"name": "Clara Maldonado"}`.

A seed fixes the order of fake values, not each value. Add a `fake` call before another one, and the later one
changes. Use a seed in tests that compare responses.

### Lists: `repeat` and `range`

`range $i := repeat n` repeats a block `n` times. `$i` is the index, from 0. JSON lists need a comma between
items: `{{ if $i }},{{ end }}` writes one before every item except the first.

Body, `seed: 7`:

```
[{{ range $i := repeat 3 }}{{ if $i }},{{ end }}{"id": {{ add $i 1 }}, "name": {{ fake "name" | json }}}{{ end }}]
```

Output:

```json
[{"id": 1, "name": "Sienna Atkinson"},{"id": 2, "name": "Logan Cooper"},{"id": 3, "name": "Carrie Gray"}]
```

`range` also walks a list from the request:

- **A JSON body list**: `range $i, $item := body "items"`; `$item.sku` reads a field of the item.

  Rule `POST /orders`, body:

  ```
  {"lines": [{{ range $i, $item := body "items" }}{{ if $i }},{{ end }}{"line": {{ add $i 1 }}, "sku": {{ $item.sku | json }}, "qty": {{ $item.qty }}}{{ end }}]}
  ```

  Request body `{"items":[{"sku":"A-1","qty":2},{"sku":"B-7","qty":1}]}`:

  ```json
  {"lines": [{"line": 1, "sku": "A-1", "qty": 2},{"line": 2, "sku": "B-7", "qty": 1}]}
  ```

- **All values of a query parameter**: body
  `[{{ range $i, $t := queryAll "tag" }}{{ if $i }},{{ end }}{"tag": {{ upper $t | json }}}{{ end }}]`, request
  `/mock/tags?tag=red&tag=blue`:

  ```json
  [{"tag": "RED"},{"tag": "BLUE"}]
  ```

- **A JSON body object**: `range $k, $v := body "m"` walks its keys in sorted order. Request body
  `{"m":{"b":2,"a":1}}`, body `{{ range $k, $v := body "m" }}{{ $k }}={{ $v }};{{ end }}` → `a=1;b=2;`.

`range` works only over `repeat`, `queryAll` and `body`. Anything else is refused when you save the rule.

### Conditions

`{{ if … }}…{{ else }}…{{ end }}` picks a part of the body. Tests: `eq` (equal), `ne` (not equal), `lt`, `le`,
`gt`, `ge`, and `and`, `or`, `not`. An empty value counts as false.

Body:

```
{{ if eq (query "fail") "1" }}{"status": "failed"}{{ else }}{"status": "paid"}{{ end }}
```

`/mock/pay?fail=1` → `{"status": "failed"}`; `/mock/pay` → `{"status": "paid"}`.

A header present or not: body `{{ if header "Authorization" }}{"user": "alice"}{{ else }}{"error": "no token"}{{ end }}`,
request without the header → `{"error": "no token"}`.

A number from the JSON body: compare it with a decimal, or turn it into a whole number with `int`. Both bodies
answer `{"review": true}` to the request body `{"amount": 250}`:

```
{{ if gt (body "amount") 100.0 }}{"review": true}{{ else }}{"review": false}{{ end }}
{{ if gt (int (body "amount")) 100 }}{"review": true}{{ else }}{"review": false}{{ end }}
```

`with` runs a block only when the value is there; inside it, `.` is the value. Body
`{{ with body "coupon" }}{"coupon": {{ . | json }}}{{ else }}{"coupon": null}{{ end }}`, request body
`{"coupon": "SALE10"}` → `{"coupon": "SALE10"}`.

The status code stays the rule's own. For a different status, make a second rule.

### Headers

Header values are templates too. Rule `POST /orders`, status `201`, `seed: 9`, headers:

```json
{"Content-Type": "application/json", "Location": "/orders/{{ fake \"number\" 1000 9999 }}", "X-Request-Id": "{{ header \"X-Request-Id\" | default \"none\" }}"}
```

Request with `X-Request-Id: abc-123` → headers:

```json
{"Content-Type": "application/json", "Location": "/orders/9069", "X-Request-Id": "abc-123"}
```

Headers are not JSON: do not use `| json` in them. A header value with a line break fails the response.

### Time

Body `{"created_at": {{ now | json }}, "day": {{ now "2006-01-02" | json }}, "ts": {{ now "unix" }}}`:

```json
{"created_at": "2026-11-07T08:03:55Z", "day": "2026-11-07", "ts": 1794038635}
```

`now` is the current time in UTC. A layout is written with Go's reference date, `2006-01-02 15:04:05`.

## Helper reference

| Helper | Usage | Returns | Example → output |
|--------|-------|---------|------------------|
| `path` | `path "name"` | a path parameter of the rule's path, as a string; `"*"` = the rest after a trailing `*`; missing: `""` | rule `/users/{id}`, `/mock/users/42`: `{"id": {{ path "id" }}}` → `{"id": 42}` |
| `query` | `query "name"` | the first value of a query parameter, as a string; missing: `""` | `?page=3`: `{{ query "page" }}` → `3` |
| `queryAll` | `queryAll "name"` | all values of a query parameter, a list of strings | `?tag=a&tag=b`: `{{ queryAll "tag" \| json }}` → `["a","b"]`; none → `[]` |
| `header` | `header "Name"` | a request header (name in any case); missing: `""` | `X-Client: web`: `{{ header "X-Client" \| json }}` → `"web"` |
| `body` | `body "a.b.0.c"` | a value of the JSON request body by dot path: string, number (`float64`), bool, object or list; missing: nothing | `{{ body "items.0.sku" \| json }}` → `"A-1"` |
| `bodyRaw` | `bodyRaw` | the request body as text (first 1 MB) | `hello=world` → `hello=world` |
| `method` | `method` | the request method | `{{ method \| json }}` → `"GET"` |
| `requestPath` | `requestPath` | the request path without `/mock` | `{{ requestPath \| json }}` → `"/users/42"` |
| `fake` | `fake "generator" [args…]` | fake data; args fill the generator's parameters in order | `{{ fake "number" 18 90 }}` → `73` |
| `pick` | `pick a b c…` | one of the arguments at random (follows `seed`) | `{{ pick "paid" "pending" "failed" \| json }}` → `"failed"` (`seed: 5`) |
| `repeat` | `repeat n` | the list 0…n-1, for `range`; `n` is a whole number (a request value through `int`) | `{{ range $i := repeat 3 }}{{ $i }}{{ end }}` → `012` |
| `add` | `add a b` | the sum of two whole numbers (request values through `int`) | `{{ add 2 3 }}` → `5`; `{{ add $i 1 }}` in a `range` |
| `int` | `int value` | a whole number: from text (`"42"` → 42, `"4.9"` → 4), a JSON body number, a bool (`true` → 1, `false` → 0); missing or `""` → 0; other text is an error | `{{ int "42" }} {{ int "4.9" }} {{ int "" }} {{ int true }}` → `42 4 0 1` |
| `now` | `now`, `now "layout"`, `now "unix"` | the current UTC time: RFC 3339, a Go layout, or unix seconds | `{{ now "2006-01-02" \| json }}` → `"2026-11-07"` |
| `json` | `json value`, `value \| json` | the value as JSON: strings quoted and escaped, lists and objects encoded | `{{ query "q" \| json }}` → `"say \"hi\""` |
| `default` | `default fallback value`, `value \| default fallback` | `value`, or `fallback` when it is empty or missing | `{{ query "limit" \| default 20 }}` → `20` |
| `upper` | `upper s` | upper case | `{{ upper "abc" }}` → `ABC` |
| `lower` | `lower s` | lower case | `X-Mode: FAST`: `{{ lower (header "X-Mode") }}` → `fast` |

Go template built-ins also work: `if`, `else`, `with`, `range` (over `repeat`, `queryAll`, `body` only), `eq`, `ne`,
`lt`, `le`, `gt`, `ge`, `and`, `or`, `not`, `len`, `index`, `printf`, and variables (`$x := …`). `define`,
`template` and `block` are not supported.

Generators left out on purpose: `sql`, `csv`, `json`, `xml`, `regex`, `template`, `map`, `fixed_width`,
`generate`, `imagejpeg`, `imagepng`, `svg`. Calling one fails like an unknown generator.

## Limits

| What | Limit | When it is over |
|------|-------|-----------------|
| Response body | 1 MB | `response is larger than 1048576 bytes` |
| Loop items in one response (`repeat`, `range` over `queryAll` and `body`, nested loops added up) | 10000 | `repeat: more than 10000 loop items in one response` |
| Steps in one response: each loop item costs the number of steps (helper calls, text pieces) inside the loop | 1,000,000 | `template does more than 1000000 steps in one response (fewer or smaller loops)` |
| Text made by helpers in one response (`fake`, `json`…), written out or not | 4 MB | `helpers made more than 4194304 bytes in one response` |
| Count-like `fake` parameters (`wordcount`, `length`, `count`…) | 1000 | `fake "loremipsumsentence": wordcount must be at most 1000` |
| `body` and `bodyRaw` | read the first 1 MB of the request body | — |

Nested loops add up: `repeat 200` with `repeat 100` inside is 20200 items and fails.

Steps add up too. `repeat 9000` with `{{ $i }}` written 100 times inside fails on steps, though 9000 items are
allowed. `repeat 1000` with the same loop body works.

One more limit is not about templates: a project holds at most 500 stored rules. Rule 501 is refused with `422`
and `errors.project`: `at most 500 rules per project; delete unused ones first`.

## Errors

**When you save a rule** (create, update, or a rule in `buggregator.yaml`), the template is parsed. A syntax error,
an unknown helper name, `define`, or `range` over something else gives `422` with the place of the error:

```json
{"code": 422, "errors": {"body": "template: template: body:1: unexpected \"}\" in operand"}, "message": "invalid mock rule: body: template: template: body:1: unexpected \"}\" in operand"}
```

The field is `errors.body`, or `errors.headers` for a header value. `body:1:30` means line 1, column 30.

**When a request comes in**, a template can still fail: a wrong argument type, an unknown generator, a limit. The
mock then answers `500`:

```json
{"error":"mock template: template: body:1:9: executing \"body\" at <fake \"nosuch\">: error calling fake: fake: unknown generator \"nosuch\" (list: GET /api/mocks/helpers)"}
```

The captured request shows the same text in `mock.template_error`, so you find it on the **Mock server** page.

Errors you will meet most:

| Error text | Cause | Fix |
|------------|-------|-----|
| `wrong type for value; expected int; got string` | a request value passed to `repeat` or `add` | wrap it: `int (query "limit")` |
| `expected int; got float64` | a JSON body number passed to `add` or `repeat` | wrap it: `int (body "qty")` |
| `incompatible types for comparison: float64 and int` | `gt (body "n") 100` | `gt (int (body "n")) 100`, or compare with `100.0` |
| `int: "abc" is not a number` | `int` got text that is not a number | check the request value, or give it a `default` |
| `fake: unknown generator "…"` | a typo, or a left-out generator | look it up in `GET /api/mocks/helpers` |
| `fake "name" takes at most 0 arguments` | too many arguments | see the generator's `params` |
| `could not find field: min` | a parameter with no default left out | pass it |
| `function "atoi" not defined` | a helper that does not exist (`422` on save) | use only the helpers above |

## Preview a rule

`POST /api/mocks/preview` runs a rule against a sample request. Nothing is saved and nothing is captured. Use it to
test a template before you save it.

Request:

```json
{
  "rule": {"method": "GET", "path": "/users/{id}", "template": true, "seed": 0, "headers": {}, "body": "…"},
  "request": {"method": "GET", "path": "/users/42?page=3", "headers": {"X-Client": "web"}, "body": ""}
}
```

- `rule`: the same fields as a rule (`path` is required).
- `request.path`: the path as the client sends it, with or without `/mock`, with the query string.
- `request.method`: empty means the rule's method, or `GET` for `ANY`.

Answer:

```json
{"body":"{\"id\": 42, \"page\": 3}","error":null,"headers":{},"matched":true,"status":200}
```

- `matched`: whether this rule would answer this request (method and path).
- `body`, `headers`: what the mock would send.
- `error`: `null`, or the template error. With an error, `status` is `500` and `body` is empty:

```json
{"body":"","error":"mock template: template: body:1:9: executing \"body\" at <fake \"nosuch\">: error calling fake: fake: unknown generator \"nosuch\" (list: GET /api/mocks/helpers)","headers":{},"matched":true,"status":500}
```

A syntax error gives `422`, as on save.

Example:

```bash
curl -X POST http://127.0.0.1:8000/api/mocks/preview \
  -H 'Content-Type: application/json' \
  -d '{"rule": {"path": "/users/{id}", "template": true, "body": "{\"id\": {{ path \"id\" }}, \"page\": {{ query \"page\" | default \"1\" }}}"}, "request": {"method": "GET", "path": "/users/42?page=3"}}'
```

## List of helpers and generators

`GET /api/mocks/helpers` returns `{"helpers": […], "fake": […]}`. Read it before you write a `fake` call.

A helper:

```json
{"name": "path", "group": "request", "usage": "path \"name\"", "description": "Value of a path parameter of the rule's path, as a string. \"*\" is the rest matched by a trailing *. Missing: \"\".", "example": "{\"id\": {{ path \"id\" }}}", "result": "rule /users/{id}, request /mock/users/42 → {\"id\": 42}"}
```

A generator: `params` in the order the arguments fill them:

```json
{"name": "number", "category": "number", "description": "Integer used for counting or measuring, with optional bounds", "example": "14866", "output": "int", "params": [{"name": "min", "type": "int", "optional": false, "default": "-2147483648"}, {"name": "max", "type": "int", "optional": false, "default": "2147483647"}]}
```

`output` tells how to write it: a string needs `| json`; `int`, `float`, `bool` can go in as they are; an object
(e.g. `person`) needs `| json`.

Both routes need the login when [SSO](/config/sso) is on.

## MCP tools for AI agents

With the [MCP server](/config/mcp) on, an AI agent manages mock rules without the REST API. Example: the agent reads
the helper list, tries a template with `mock_rule_preview`, then saves it with `mock_rule_create`.

| Tool | What it does |
|------|--------------|
| `mock_rules_list` | The rules in matching order: config rules first (read-only), then stored ones |
| `mock_rule_get` | One rule with its full body |
| `mock_rule_preview` | Runs a rule against a sample request; nothing is saved. Same answer as `POST /api/mocks/preview` |
| `mock_requests_list` | Requests the mock server got, newest first, with the rule that answered and `template_error` |
| `mock_template_helpers` | The helpers and the fake generators with their parameters; filter by `category` or `search` |
| `mock_rule_create` | Creates a rule |
| `mock_rule_update` | Changes a stored rule; only the given fields change |
| `mock_rule_delete` | Deletes a stored rule |
| `mock_rule_from_request` | Creates a rule from a captured request (e.g. one that got `404`) |
| `mock_import_openapi` | Imports an OpenAPI spec, see [OpenAPI import](/config/mock-server#import-an-openapi-spec) |
| `mock_group_delete` | Deletes all stored rules of a group |

The last six tools change rules. Turn them off with `mcp.mock_write: false` (env `MCP_MOCK_WRITE=false`): the agent
then only reads and previews.

## Rules in `buggregator.yaml`

Config rules take `template` and `seed` too:

```yaml
mocks:
  - method: GET
    path: /orders/{id}
    template: true
    seed: 42
    headers: { Content-Type: application/json }
    body: '{"id": {{ path "id" }}, "customer": {{ fake "name" | json }}, "total": {{ fake "price" 5 500 }}}'
```

`GET /mock/orders/7`, twice:

```json
{"id": 7, "customer": "Jessica Hills", "total": 431.73}
```

Put the body in single quotes: the template has double quotes inside. A rule whose template does not parse is
skipped at startup, with the warning `mock: skipping config rule` in the log.

## Updating a rule

`PUT /api/mocks/{id}` without the `template` or `seed` field keeps the stored value. Send `"template": false` to
turn templates off.

:::
