---
llms_description: "Inspector.dev SDK compatibility for local APM: transaction name, duration, memory peak, result status, HTTP details, timeline breakdown. Config: INSPECTOR_URL=http://inspector@host:8000, INSPECTOR_API_KEY, INSPECTOR_INGESTION_KEY. Laravel and generic PHP setup. Project: INSPECTOR_URL=http://inspector:project_key@host (since 2.11.0; older servers: default project). Any ingestion key is accepted (not checked)."
---

# Inspector — Application Monitoring

You want to see how long your requests take, where the bottlenecks are, and how much memory each transaction
consumes — but [Inspector.dev](https://inspector.dev/) is overkill for local development. Buggregator accepts
the same Inspector SDK protocol, so your transaction and performance data lands in the same UI where you
already see exceptions, logs, and dumps.

![Inspector transaction](/images/inspector.webp)

## Use cases

- **Local APM** — monitor request duration and memory usage without sending data to external services.
- **Debug slow requests** — use the timeline breakdown to see which parts of a request are slow.
- **All in one place** — transaction data next to exceptions, logs, and dumps from the same app.

## What you see in the UI

- **Transaction name** — the name of the monitored transaction.
- **Duration** — execution time in milliseconds.
- **Memory peak** — peak memory usage.
- **Result status** — success, error, etc.
- **Transaction type** — HTTP request, process, etc.
- **HTTP details** — method, URI, host (for HTTP transactions).
- **Timeline breakdown** — visual timeline of events within the transaction.

## Configuration

### Laravel

Install the SDK: [docs.inspector.dev/laravel](https://docs.inspector.dev/laravel)

```dotenv
INSPECTOR_URL=http://inspector@127.0.0.1:8000
INSPECTOR_API_KEY=test
INSPECTOR_INGESTION_KEY=1test
INSPECTOR_ENABLE=true
```

> In Docker Compose: `INSPECTOR_URL=http://inspector@buggregator:8000`

### Other PHP

Using `inspector-apm/inspector-php`:

```php
use Inspector\Inspector;
use Inspector\Configuration;

$configuration = new Configuration('YOUR_INGESTION_KEY');
$configuration->setUrl('http://inspector@127.0.0.1:8000');
$inspector = new Inspector($configuration);
```

Other language SDKs: [docs.inspector.dev](https://docs.inspector.dev/)

## Projects

Since server 2.11.0, the key after `inspector:` in `INSPECTOR_URL` chooses the [project](/config/projects). For
example, with this URL events land in the project `shop`:

```dotenv
INSPECTOR_URL=http://inspector:shop@127.0.0.1:8000
```

Without a key, and on older servers, events land in `default`.

## Ingestion key

Buggregator does not check the ingestion key: any value in `INSPECTOR_INGESTION_KEY` (or in
`new Configuration('…')`) works, for example `test`. There is no server setting to restrict it. To keep others from
sending events, do not expose port 8000 outside your machine; see [Security and Data](/security). SSO does not help
here: it protects the UI, not event ingestion.
