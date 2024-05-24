# Integration — Inspector

Buggregator is compatible with Inspector reports, providing you with a lightweight alternative for local
development. With it, you can easily configure your Inspector client URL to send data directly to the server, making it
easier to identify and fix issues during the development phase.

![inspector](https://github.com/buggregator/server/assets/773481/ab002ecf-e1dc-4433-90d4-0e42ff8c0ab3)

## Laravel

Laravel is supported via a native package. You can read about integrations
on [official site](https://docs.inspector.dev/laravel)

```php
INSPECTOR_URL=http://inspector@127.0.0.1:8000
INSPECTOR_API_KEY=test
INSPECTOR_INGESTION_KEY=1test
INSPECTOR_ENABLE=true
```

## Other platforms

For PHP you can use `inspector-apm/inspector-php` package.

```php
use Inspector\Inspector;
use Inspector\Configuration;

$configuration = new Configuration('YOUR_INGESTION_KEY');
$configuration->setUrl('http://inspector@127.0.0.1:8000');
$inspector = new Inspector($configuration);

// ...
```

To report to Buggregator you’ll need to use a language-specific SDK. The Inspector team builds and maintains these for
most popular languages.

> **Note:**
> You can find out documentation on [official site](https://docs.inspector.dev/)

## Secret key validation

Buggregator lets you send reports freely by default, but you can boost your security by setting up a secret key.

In our example, we will use `my-secret-key` as the secret key. Let's see how to set it up.

### Server configuration

To use a secret key, set the `INSPECTOR_SECRET_KEY` environment variable on your server.

**Here’s how to do it:**

```bash
docker run --pull always \
  -p ... \
  -e INSPECTOR_SECRET_KEY=my-secret-key \
  ghcr.io/buggregator/server:latest
```

> **Note:** Read more about server configuration [here](../getting-started.md).

When you set the secret key, the server checks the `X-Inspector-Key` header to make sure it matches the secret key.

### Client configuration

To set the secret key on a client, change your DSN like this:

**Laravel**

```dotenv
INSPECTOR_INGESTION_KEY=my-secret-key
```

**Other platforms**

```php
use Inspector\Inspector;
use Inspector\Configuration;

$configuration = new Configuration('my-secret-key');
$configuration->setUrl('http://inspector@127.0.0.1:8000');
$inspector = new Inspector($configuration);

// ...
```

> **Note:** Read more about ingestion key configuration on [official site](https://docs.inspector.dev/)