# Sentry — Exceptions

You want to see exceptions with stack traces, breadcrumbs, and request context — but you don't want to deploy
a full Sentry instance just for local development. Buggregator accepts the same Sentry SDK protocol, so you
change one line in your config and get exception tracking alongside all your other debug data — logs, dumps,
emails, profiling — in a single UI.

No registration. No limits. No heavy infrastructure.

![sentry](https://github.com/buggregator/server/assets/773481/e979fda5-54c8-42cc-8224-a1c5d828569a)

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

### JavaScript

Buggregator serves a pre-configured Sentry JS bundle at `/sentry/<project>.js`:

```html
<script src="http://127.0.0.1:8000/sentry/1.js"></script>
```

Server-side env variables for customization:

```dotenv
SENTRY_JS_SDK_URL=https://browser.sentry-cdn.com/7.69.0/bundle.tracing.replay.min.js
SENTRY_JS_DSN_HOST=http://sentry@127.0.0.1:8000
```

### Other platforms

Any [Sentry SDK](https://docs.sentry.io/platforms/) works. Just set the DSN:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

## Secret key validation

By default, Buggregator accepts all events. To restrict access, set a secret key on the server:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -e SENTRY_SECRET_KEY=my-secret-key \
  ghcr.io/buggregator/server:latest
```

Then include the key in the client DSN:

```dotenv
SENTRY_DSN=http://my-secret-key:sentry@127.0.0.1:8000/1
```
