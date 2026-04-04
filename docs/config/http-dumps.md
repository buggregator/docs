---
llms_description: "HTTP request capture: method, URI, headers, cookies, POST data, uploaded files, auto-generated cURL command. Two trigger methods: HTTP auth (http-dump@host) or X-Buggregator-Event: http-dump header. Use cases: webhook development, API debugging, request replay. For capturing both request and response, see HTTP Proxy on port 8080."
---

# HTTP Dumps — Request Inspection

Your app calls external APIs, sends webhooks, or receives callbacks — and you need to see exactly what goes over
the wire. Buggregator captures full HTTP requests: method, URI, headers, cookies, POST data, and uploaded files.
You get a ready-to-use cURL command for any captured request. No need to set up a separate service like
webhook.site — it's built into the same Buggregator where you already see your logs and exceptions.

> **Need to see responses too?** Use the [HTTP Proxy](/config/http-proxy) — it captures both request and response
> by acting as a forward proxy between your app and external services.

![http dumps](https://github.com/buggregator/server/assets/773481/fc823390-b490-4bbb-a787-44471eca9fb6)

## Use cases

- **Webhook development** — build a webhook endpoint and see exactly what the other service sends you.
- **API debugging** — redirect outgoing HTTP calls to Buggregator to inspect request structure before hitting the real API.
- **Replay requests** — copy the generated cURL command and replay any captured request from your terminal.
- **All in one place** — HTTP requests alongside exceptions, logs, and dumps in the same dashboard.

## What you see in the UI

- **HTTP method** — GET, POST, PUT, DELETE, PATCH, etc. (color-coded).
- **Full URI** — complete request URL with path segments.
- **Query parameters** — parsed URL query parameters.
- **POST/form data** — submitted fields and values.
- **Headers** — all request headers.
- **Cookies** — cookies sent with the request.
- **Uploaded files** — attached files, available for download.
- **cURL command** — generated automatically for easy replay.

## Configuration

Send any HTTP request to Buggregator and mark it as a dump. Two ways:

### Using HTTP auth

Add `http-dump` to the URL username:

```bash
curl 'http://http-dump@127.0.0.1:8000/any/path?foo=bar'
```

### Using header

Add the `X-Buggregator-Event` header:

```bash
curl 'http://127.0.0.1:8000/any/path?foo=bar' \
  --header 'X-Buggregator-Event: http-dump'
```

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `buggregator`).
