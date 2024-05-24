# Integration — Sentry exceptions

Buggregator integrates seamlessly with Sentry reports, making it ideal for local development. You can easily configure
your app to send data to the Buggregator server, offering a lightweight alternative for debugging without any limits
or registration. Send exceptions as many times as you need, without any restrictions.

![sentry](https://github.com/buggregator/server/assets/773481/e979fda5-54c8-42cc-8224-a1c5d828569a)

Using Buggregator with Sentry helps you identify and fix issues before production, ensuring a smooth user experience.
For easy and efficient Sentry report handling during development, choose Buggregator.

> **Note:** For local debugging, Buggregator is an excellent tool, but Sentry is the recommended solution for full-scale
> production needs.

## What is Sentry?

[Sentry](https://sentry.io/) is an error tracking tool that helps developers monitor and fix crashes in real-time. It's
a powerful tool for understanding what's happening with your applications in production.

## Laravel

### Installation

Laravel is supported via a native package. You can read about integrations
on [official site](https://docs.sentry.io/platforms/php/guides/laravel/)

### Configuration

All you need to do is set the `SENTRY_LARAVEL_DSN` environment variable in your `.env` file:

```dotenv
SENTRY_LARAVEL_DSN=http://sentry@127.0.0.1:8000/1
```

## Spiral Framework

### Installation

Spiral Framework is supported via a native package. You can read about integrations
on [official site](https://spiral.dev/docs/extension-sentry/3.3/en)

### Configuration

All you need to do is set the `SENTRY_DSN` environment variable in your `.env` file:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

## Magento 2

### Installation

Magento 2 is supported via the following package, you can read more about
it [here](https://github.com/justbetter/magento2-sentry)

### Configuration

Refer to the [Configuration section](https://github.com/justbetter/magento2-sentry#configuration).

Either set

```dotenv
CONFIG__SENTRY__ENVIRONMENT__DSN=http://sentry@127.0.0.1:8000/1
```

or

```php
'sentry' => [
    'dsn' => 'http://sentry@127.0.0.1:8000/1',
    ...
]
```

in the `app/etc/env.php`

## WordPress

### Installation and configuration

> Make sure `WP_ENVIRONMENT_TYPE`is set to `local`. [Local](https://localwp.com/) (by WPEngine) does that by default.

1. Install [WP Sentry](https://wordpress.org/plugins/wp-sentry-integration/). You don't have to activate it. We
   will [load it early](https://github.com/stayallive/wp-sentry/tree/v7.13.0?tab=readme-ov-file#loading-sentry-before-wordpress),
   to catch errors early.

2. In `wp-config.php` add:

```php
// NOTE: WP_ENVIRONMENT_TYPE must be defined and set to 'local'.
if (defined('WP_ENVIRONMENT_TYPE') && 'local' === WP_ENVIRONMENT_TYPE) {
	define( 'WP_SENTRY_PHP_DSN', 'http://sentry@127.0.0.1:8000/1' );
	define( 'WP_SENTRY_ERROR_TYPES', E_ALL & ~E_NOTICE & ~E_USER_NOTICE );
	require_once __DIR__ . '/wp-content/plugins/wp-sentry-integration/wp-sentry.php';
}
```

## JavaScript

Buggregator provides an HTTP endpoint `/sentry/<project>.js` to include in your project. It's a fast and easy way to
start using Buggregator with your JavaScript application.

Read more about the [Sentry JavaScript SDK](https://docs.sentry.io/platforms/javascript/#install)

In order to get started using the Sentry JavaScript SDK, add the following code to the top of your application, before
all other scripts:

```html

<script src="http://127.0.0.1:8000/sentry/1.js"></script>
```

This script will load the Sentry SDK and configure it to send errors to the Buggregator.

### Configuration

Before you can use it, you need to configure server ENV variables. By default, Buggregator uses the following ENV
variables:

```dotenv
# Sentry SDK URL (Actual version can be found here https://docs.sentry.io/platforms/javascript/install/loader/#cdn)
SENTRY_JS_SDK_URL=https://browser.sentry-cdn.com/7.69.0/bundle.tracing.replay.min.js 

# Sentry DSN host that will be used in the SDK
SENTRY_JS_DSN_HOST=http://sentry@127.0.0.1:8000 
```

You can override them by setting the following ENV variables:

```bash
docker run --pull always \
  -p ... \
  -e SENTRY_JS_DSN_HOST=http://sentry@127.0.0.1:8000 \
  -e SENTRY_JS_SDK_URL=https://browser.sentry-cdn.com/7.69.0/bundle.tracing.replay.min.js \
  ghcr.io/buggregator/server:latest
```

> **Note:** Read more about server configuration [here](../getting-started.md).

## Other platforms

To report to Buggregator you’ll need to use a language-specific SDK. The Sentry team builds and maintains these for most
popular languages. You can find out documentation on [official site](https://docs.sentry.io/platforms/)

After you have installed the SDK, you can configure Sentry DSN to report to Buggregator:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```

## Secret key validation

Buggregator lets you send exceptions freely by default, but you can boost your security by setting up a secret key.

In our example, we will use `my-secret-key` as the secret key. Let's see how to set it up.

### Server configuration

To use a secret key, set the `SENTRY_SECRET_KEY` environment variable on your server.

**Here’s how to do it:**

```bash
docker run --pull always \
  -p ... \
  -e SENTRY_SECRET_KEY=my-secret-key \
  ghcr.io/buggregator/server:latest
```

> **Note:** Read more about server configuration [here](../getting-started.md).

When you set the secret key, the server checks the `X-Sentry-Auth` header to make sure it matches the secret key.

### Client configuration

To set the secret key on a client, change your DSN like this:

```dotenv
SENTRY_DSN=http://my-secret-key:sentry@127.0.0.1:8000/1 
```