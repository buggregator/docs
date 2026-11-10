---
llms_description: "Sentry SDK compatibility: DSN format http://sentry@host:8000/1. Setup for Laravel (SENTRY_LARAVEL_DSN), Spiral, Symfony, Magento 2, WordPress (WP Sentry plugin), JavaScript (browser, Node.js, Next.js), Python (Django), Go: tested since server v2.9.0 with @sentry/browser and @sentry/node 11.11, sentry-python 2.74 (Brotli bodies), sentry-go 0.50; stored: errors, messages, transactions/spans, logs (JS enableLogs, Python enable_logs; sentry-go 0.50 sends NewLogger logs with no option); not stored: sessions, client reports, check-ins, profiles, replays, attachments/minidumps; tracesSampleRate 1.0 needed; browser needs no CORS setup. Other SDKs (Ruby, .NET, …) not verified. UI shows stack traces, breadcrumbs, request/device/app info, tags, modules. Projects: non-numeric DSN path (http://sentry@host:8000/shop) or headers X-Buggregator-Event: sentry + X-Buggregator-Project (the project header alone is ignored for SDK requests); numeric DSN goes to 'default'. Sentry page tabs Exceptions, Traces, Logs, Metrics, filtered by project and period on the server, refreshed live via the sentry.stored WebSocket notice. Clear deletes one project's Sentry data and keeps pinned errors: DELETE /api/sentry/all?project=<key>&keep_pinned=1."
---

# Sentry — Exceptions

You want to see exceptions with stack traces, breadcrumbs, and request context — but you don't want to deploy
a full Sentry instance just for local development. Buggregator accepts the same Sentry SDK protocol, so you
change one line in your config and get exception tracking alongside all your other debug data — logs, dumps,
emails, profiling — in a single UI.

No registration. No limits. No heavy infrastructure.

![Sentry exceptions](/images/sentry.webp)

## Use cases

- **Long-running apps** (RoadRunner, Swoole, queue workers) — exceptions don't show in the browser, but they show in Buggregator.
- **Microservices / Docker Compose** — collect exceptions from all services in one place instead of checking each container's logs.
- **Frontend + Backend** — catch JavaScript errors alongside PHP exceptions in the same dashboard.
- **Quick local debugging** — don't wait for errors to appear in a remote Sentry instance. See them instantly.

## What you see in the UI

- **Exception** — frame-by-frame stack trace with file paths, line numbers, and code context. Click to open in your IDE.
- **Breadcrumbs** — timeline of user actions and system events leading up to the error.
- **Request** — HTTP method, URI, headers, cookies, POST data.
- **Device** — browser, OS, device type.
- **App** — application name, version, build.
- **Tags & Extra** — custom key-value data attached to the event.
- **Modules** — loaded packages with versions.

## Configuration

Point your Sentry DSN at Buggregator. The format is the same for all platforms:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `buggregator`).

### Laravel

```dotenv
SENTRY_LARAVEL_DSN=http://sentry@127.0.0.1:8000/1
```

Install the SDK: [docs.sentry.io/platforms/php/guides/laravel](https://docs.sentry.io/platforms/php/guides/laravel/)

### Spiral Framework

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

Install the SDK: [spiral.dev/docs/extension-sentry](https://spiral.dev/docs/extension-sentry/3.3/en)

### Symfony

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

Install the SDK: [docs.sentry.io/platforms/php/guides/symfony](https://docs.sentry.io/platforms/php/guides/symfony/)

### Magento 2

Using [justbetter/magento2-sentry](https://github.com/justbetter/magento2-sentry):

```dotenv
CONFIG__SENTRY__ENVIRONMENT__DSN=http://sentry@127.0.0.1:8000/1
```

or in `app/etc/env.php`:

```php
'sentry' => [
    'dsn' => 'http://sentry@127.0.0.1:8000/1',
    ...
]
```

### WordPress

> `WP_ENVIRONMENT_TYPE` must be set to `local`. [Local](https://localwp.com/) does that by default.

1. Install [WP Sentry](https://wordpress.org/plugins/wp-sentry-integration/) (no need to activate).
2. Add to `wp-config.php`:

```php
if (defined('WP_ENVIRONMENT_TYPE') && 'local' === WP_ENVIRONMENT_TYPE) {
	define( 'WP_SENTRY_PHP_DSN', 'http://sentry@127.0.0.1:8000/1' );
	define( 'WP_SENTRY_ERROR_TYPES', E_ALL & ~E_NOTICE & ~E_USER_NOTICE );
	require_once __DIR__ . '/wp-content/plugins/wp-sentry-integration/wp-sentry.php';
}
```

### JavaScript, Python, Go

Since server v2.9.0, Buggregator accepts events from the official JavaScript, Python and Go SDKs. They
were tested with real requests from these versions:

| SDK | Tested version |
|-----|----------------|
| `@sentry/browser` | 11.11 |
| `@sentry/node` | 11.11 |
| `sentry-python` | 2.74 (also with Brotli-compressed bodies) |
| `sentry-go` | 0.50 |

What Buggregator stores and shows from them: errors, messages, transactions and traces with their spans, and logs.
What it does not store: sessions, client reports, cron check-ins, profiles, replays, attachments and minidumps.

Two settings matter in every SDK:

- **The DSN.** Any key before `@` works, e.g. `http://sentry@127.0.0.1:8000/1`. A number at the end puts the event
  into the `default` project; a name such as `/shop` puts it into that project (see [Projects](#projects)).
- **The trace sample rate.** Set it to `1.0`, or traces are sampled away and never sent.

In Docker, replace `127.0.0.1` with the Buggregator host or service name, e.g. `http://sentry@buggregator:8000/1`.

#### Browser JavaScript

```javascript
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: "http://sentry@127.0.0.1:8000/1",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  enableLogs: true,
});
```

No CORS setup is needed: Buggregator accepts requests from any origin by default.

#### Node.js

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "http://sentry@127.0.0.1:8000/1",
  tracesSampleRate: 1.0,
  enableLogs: true,
});
```

#### Next.js

`@sentry/nextjs` is built on the Node.js and browser SDKs above. Set the same DSN and options in each `Sentry.init`
call of its setup ([Next.js SDK docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)):

```javascript
Sentry.init({
  dsn: "http://sentry@127.0.0.1:8000/1",
  tracesSampleRate: 1.0,
  enableLogs: true,
});
```

`@sentry/nextjs` itself was not run against Buggregator; the SDKs it wraps were.

#### Python

```python
import sentry_sdk

sentry_sdk.init(
    dsn="http://sentry@127.0.0.1:8000/1",
    traces_sample_rate=1.0,
    enable_logs=True,
)
```

#### Django

Django uses the same `sentry-python` SDK. Call `sentry_sdk.init(...)` as above in `settings.py`; the SDK turns on its
Django integration by itself. The Django integration itself was not run against Buggregator; the SDK was.

#### Go

```go
err := sentry.Init(sentry.ClientOptions{
    Dsn:              "http://sentry@127.0.0.1:8000/1",
    EnableTracing:    true,
    TracesSampleRate: 1.0,
})
if err != nil {
    log.Fatal(err)
}
defer sentry.Flush(2 * time.Second)
```

In `sentry-go` 0.50, logs from `sentry.NewLogger(ctx)` are sent without any extra option.

### Other platforms

Other Sentry SDKs (Ruby, .NET, Java and others) are not verified yet. Set the DSN as above and try; if an event does
not show up, please [open an issue](https://github.com/buggregator/server/issues) with the SDK name and version.

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

## Projects

Send each app to its own [project](/config/projects), and the Sentry page shows only that project's data.
Without a project, everything goes to `default`.

Put the project key in the DSN path instead of the number:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/shop
```

A number in the path (`/1`, `/42`) is the SDK's own project id, not a Buggregator project. Such events go to
`default`. Some SDKs accept only a number there: the Sentry JavaScript SDK, for example. Then keep the number
and, if your SDK lets you add HTTP headers, send two headers together:

```
X-Buggregator-Event: sentry
X-Buggregator-Project: shop
```

`X-Buggregator-Project` alone is not enough: a Sentry SDK request is recognized by its `X-Sentry-Auth` header,
and that path ignores `X-Buggregator-Project`.

| How | Example |
|-----|---------|
| DSN path (wins over the headers) | `http://sentry@127.0.0.1:8000/shop` |
| Headers | `X-Buggregator-Event: sentry` + `X-Buggregator-Project: shop` |

A project that does not exist yet is added to the project list when its first error arrives. A project that
receives only traces, logs or metrics is not added: put it in `buggregator.yaml` (see [Projects](/config/projects)).

Errors, traces, logs and metrics all land in the same project, however you set it.

> **Upgrading to v2.6.0:** Sentry errors sent with a numeric DSN, and traces, logs and metrics stored by
> earlier versions, had no project. On first start, v2.6.0 moves them to `default`. Nothing is deleted.

## Traces, logs and metrics

Besides errors, Buggregator stores what the Sentry SDK sends as traces (transactions and spans), logs and
metrics. The **Sentry** page has a tab for each:

- **Exceptions** — errors, as a list or grouped by fingerprint.
- **Traces** — transactions with their spans.
- **Logs** — Sentry structured logs.
- **Metrics** — Sentry metrics.

### Filters

Every tab shows the current project and the chosen period (last hour, last 24 hours, last 7 days, all time, …).
Filtering happens on the server, so a filter does not miss rows past the first page.

The REST API accepts more filters than the page shows:

| Endpoint | Filters |
|----------|---------|
| `GET /api/sentry/exceptions` | `project`, `environment`, `level`, `handled`, `grouped=true`, `from`, `to`, `window` |
| `GET /api/sentry/traces` | `project`, `environment`, `release`, `from`, `to`, `window` |
| `GET /api/sentry/logs` | `project`, `level` (several, comma-separated), `trace_id`, `from`, `to`, `window` |
| `GET /api/sentry/metrics` | `project`, `name`, `type`, `trace_id`, `search` (part of the name), `from`, `to`, `window` |
| `GET /api/sentry/counts` | `project`, `from`, `to`, `window` |

`window` is a period like `15m`, `24h` or `7d`. `from` and `to` take unix seconds or ISO 8601.

### Live updates

The tabs refresh by themselves when new rows arrive. Example: your app writes a Sentry log, and the open
**Logs** tab shows it without a reload. Each tab reloads only for its own kind of data.

For clients of the WebSocket: when a request stored logs, metrics or traces, the server sends one
`sentry.stored` notice on the project's channel `events.project.<key>`:

```json
{"project": "default", "kinds": ["log", "metric"]}
```

Kinds are `log`, `metric` and `trace`. An error alone sends the usual `event.received`.

## Clearing data

**Clear** on the Sentry page deletes the Sentry data of the current project only: errors, traces, logs and
metrics. Pinned errors stay. Other projects are not touched.

The same through the API:

| Call | Deletes |
|------|---------|
| `DELETE /api/sentry/all?project=shop` | everything Sentry stored for `shop` |
| `DELETE /api/sentry/all?project=shop&keep_pinned=1` | the same, but pinned errors stay |
| `DELETE /api/sentry/all` | Sentry data of **every** project |

A trace can hold spans of several projects. After a project is cleared, a trace with no spans left is deleted;
a trace with spans of other projects stays.

`DELETE /api/sentry/all` clears the Sentry tables (traces, logs, metrics, error details). The error cards in the
event feed are events: clear them with `DELETE /api/events` and the body
`{"type": "sentry", "project": "shop", "keep_pinned": true}`.

