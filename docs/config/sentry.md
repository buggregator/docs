---
llms_description: "Sentry SDK compatibility (since 2.13.0: user feedback — feedback/user_report envelope items stored, shown on the error page and the Feedback tab, GET /api/sentry/feedback, no feed card, screenshots not stored; desktop notifications in Settings › Notifications for new errors while the tab is hidden, https or localhost only; cron monitors — see /config/crons): DSN format http://sentry@host:8000/1. Setup for Laravel (SENTRY_LARAVEL_DSN), Spiral, Symfony, Magento 2, WordPress (WP Sentry plugin), JavaScript (browser, Node.js, Next.js), Python (Django), Go: tested since server v2.9.0 with @sentry/browser and @sentry/node 11.11, sentry-python 2.74 (Brotli bodies), sentry-go 0.50; stored: errors, messages, transactions/spans, logs (JS enableLogs, Python enable_logs; sentry-go 0.50 sends NewLogger logs with no option); not stored: sessions, client reports, profiles, replays, attachments/minidumps; tracesSampleRate 1.0 needed; browser needs no CORS setup. Java SDK checked with Spring Boot (guides/spring-boot); other SDKs (Ruby, .NET, …) not verified. UI shows stack traces, breadcrumbs, request/device/app info, tags, modules. Projects: non-numeric DSN path (http://sentry@host:8000/shop) or headers X-Buggregator-Event: sentry + X-Buggregator-Project (the project header alone is ignored for SDK requests); numeric DSN goes to 'default', unless (since server v2.10.0) its public key names an existing project; since 2.11.0 a key with _ also finds the project with - (http://billing@host:8000/1 → billing; key from sentry_key query or X-Sentry-Auth; key 'sentry' reserved; unknown key → default, no project created). Order: DSN path > X-Buggregator-Project / Basic Auth > public key > default. Sentry page tabs Exceptions, Traces, Logs, Metrics (Traces and Logs also hold OpenTelemetry OTLP data, see /config/opentelemetry), filtered by project and period on the server, refreshed live via the sentry.stored WebSocket notice. Clear deletes one project's Sentry data and keeps pinned errors: DELETE /api/sentry/all?project=<key>&keep_pinned=1."
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
- **Request** — HTTP method, URL and headers.
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
What it does not store: sessions, client reports, profiles, replays, attachments and minidumps.

Two settings matter in every SDK:

- **The DSN.** Any key before `@` works, e.g. `http://sentry@127.0.0.1:8000/1`. A number at the end puts the event
  into the `default` project; a name such as `/shop` puts it into that project. The key before `@` can also pick
  an existing project (see [Projects](#projects)).
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

The Java SDK was checked with Spring Boot: see the [Spring Boot guide](/guides/spring-boot). Other Sentry SDKs
(Ruby, .NET and others) are not verified yet. Set the DSN as above and try; if an event does
not show up, please [open an issue](https://github.com/buggregator/server/issues) with the SDK name and version.

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

## Projects

Send each app to its own [project](/config/projects), and the Sentry page shows only that project's data.
Without a project, everything goes to `default`.

With the Sentry PHP SDK, put the project key in the DSN path instead of the number:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/shop
```

A number in the path (`/1`, `/42`) is the SDK's own project id, not a Buggregator project. Such events go to
`default`, unless the key before `@` or the headers below name a project.

### Project per service with a numeric DSN

Other SDKs accept only a number at the end of the DSN. The Sentry JavaScript and Python SDKs, for example,
refuse `http://sentry@127.0.0.1:8000/shop`. Since server v2.10.0, you can keep the number and put the project key
before `@` instead:

```dotenv
# PHP backend
SENTRY_DSN=http://billing@127.0.0.1:8000/1
# JavaScript frontend
SENTRY_DSN=http://storefront@127.0.0.1:8000/1
```

The JavaScript SDK takes only letters, digits and `_` before `@`. A key with `-`, like `store-front`, makes the
DSN invalid and the SDK sends nothing. Since server 2.11.0, write `_` instead of `-`: the key `store_front` finds the
project `store-front`. A project whose key matches exactly still wins. On older servers, name such a project
`store_front` or `storefront`.

The key before `@` is the DSN's public key. The SDK sends it with every event, and Buggregator uses it as the
project key, but only when that project already exists. List the projects in `buggregator.yaml`:

```yaml
projects:
  - key: billing
    name: Billing
  - key: storefront
    name: Storefront
```

A project also exists once an event has created it, for example an error sent earlier to
`http://sentry@127.0.0.1:8000/billing`.

What happens with other keys:

- `sentry` (the key in our examples) never names a project. Such events go to `default`, as before.
- A key with no such project, such as a random key copied from a real Sentry DSN, sends events to `default`.
  Buggregator does not create a project from a key.

### Project by headers

If your SDK lets you add HTTP headers, you can send two headers together:

```
X-Buggregator-Event: sentry
X-Buggregator-Project: shop
```

`X-Buggregator-Project` alone is not enough: a Sentry SDK request is recognized by its `X-Sentry-Auth` header,
and that path ignores `X-Buggregator-Project`.

### Which one wins

When a request carries more than one, the first match in this list wins:

| Order | How | Example |
|-------|-----|---------|
| 1 | DSN path | `http://sentry@127.0.0.1:8000/shop` |
| 2 | Headers | `X-Buggregator-Event: sentry` + `X-Buggregator-Project: shop` |
| 3 | DSN public key, existing project only | `http://billing@127.0.0.1:8000/1` |
| 4 | Nothing of the above | `default` |

A project that does not exist yet is added to the project list when its first error arrives. A project that
receives only traces, logs or metrics is not added: put it in `buggregator.yaml` (see [Projects](/config/projects)).

Errors, traces, logs and metrics all land in the same project, however you set it.

> **Upgrading to v2.6.0:** Sentry errors sent with a numeric DSN, and traces, logs and metrics stored by
> earlier versions, had no project. On first start, v2.6.0 moves them to `default`. Nothing is deleted.

## Traces, logs and metrics

Besides errors, Buggregator stores what the Sentry SDK sends as traces (transactions and spans), logs and
metrics. The **Sentry** page has a tab for each:

- **Exceptions** — errors, as a list or grouped by fingerprint.
- **Traces** — transactions with their spans. A trace opens on the [Request timeline](./request-timeline.md):
  everything the request did on one scale, with an N+1 hint.
- **Logs** — Sentry structured logs.
- **Metrics** — Sentry metrics.

Traces and logs from OpenTelemetry (OTLP) land in the same **Traces** and **Logs** tabs, marked **OTel**:
see [OpenTelemetry](/config/opentelemetry).

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

## Cron monitors

Check-ins from Sentry Crons (`check_in`) are stored: see [Cron Monitoring](/config/crons).

## User feedback

Since server 2.13.0 Buggregator keeps the feedback your users send through a Sentry SDK: the
feedback widget, `captureFeedback`, or the older `captureUserFeedback`. Nothing to set up beyond the usual DSN.

```js
const eventId = Sentry.captureException(new Error('Checkout failed'))

Sentry.captureFeedback({
  name: 'Jane Doe',
  email: 'jane@example.com',
  message: 'The pay button did nothing',
  associatedEventId: eventId,
})
```

- Feedback tied to an error shows on that error's page, above the tabs: name, email, message, page URL and time.
- The **Feedback** tab on the Sentry page lists all feedback, also the one sent without an error.
- Feedback makes no card of its own in the event feed.
- Screenshots attached to feedback are not stored.
- API: `GET /api/sentry/feedback` (filters `event_id`, `project`, `from`, `to`, `window`).

Clearing Sentry data clears feedback too, except the feedback of pinned errors.

## Desktop notifications

Want to know about a new error while you work in another window? Turn on **Settings › Notifications › Desktop
notifications** (since server 2.13.0). The browser asks for permission once and shows a test notice.

- You get a notice for each new Sentry error (an exception, or a message at level error or fatal) from any project,
  while the Buggregator tab is in the background. Click it to open the error.
- Several errors within 10 seconds come as one notice: «3 new errors».
- With several Buggregator tabs open, only one notifies, and none while you are looking at one of them.
- The tab must stay open; a closed tab shows nothing.
- It works only when you open Buggregator as https or `localhost`, e.g. `http://localhost:8000`. Chrome on Android
  does not show notifications from a page.

## Clearing data

**Clear** on the Sentry page deletes the Sentry data of the current project only: errors, traces, logs, metrics,
user feedback and the run history of [cron monitors](/config/crons). Pinned errors stay, and so does their feedback.
The cron monitors stay with their settings; their last status starts over. Other projects are not touched.

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

