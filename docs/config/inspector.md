---
llms_description: "Inspector.dev SDK compatibility for local APM: transaction name, duration, memory peak, result status, HTTP details, timeline breakdown. Config: INSPECTOR_URL=http://inspector@host:8000, INSPECTOR_API_KEY, INSPECTOR_INGESTION_KEY. Laravel and generic PHP setup. INSPECTOR_SECRET_KEY env for access restriction."
---

# Inspector — Application Monitoring

You want to see how long your requests take, where the bottlenecks are, and how much memory each transaction
consumes — but [Inspector.dev](https://inspector.dev/) is overkill for local development. Buggregator accepts
the same Inspector SDK protocol, so your transaction and performance data lands in the same UI where you
already see exceptions, logs, and dumps.

![inspector](https://github.com/buggregator/server/assets/773481/ab002ecf-e1dc-4433-90d4-0e42ff8c0ab3)

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

## Secret key validation

To restrict access, set a secret key on the server:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -e INSPECTOR_SECRET_KEY=my-secret-key \
  ghcr.io/buggregator/server:latest
```

Then use the key as the ingestion key in your client:

**Laravel:**

```dotenv
INSPECTOR_INGESTION_KEY=my-secret-key
```

**PHP:**

```php
$configuration = new Configuration('my-secret-key');
$configuration->setUrl('http://inspector@127.0.0.1:8000');
```
