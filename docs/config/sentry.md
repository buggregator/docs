# Integration — Sentry exceptions

Buggregator offers seamless integration with Sentry reports, making it a reliable tool for local development. With
it, you can easily configure your Sentry DSN to send data directly to the server, providing you with a lightweight
alternative for debugging your application.

![sentry](https://github.com/buggregator/server/assets/773481/e979fda5-54c8-42cc-8224-a1c5d828569a)

By using Buggregator to receive Sentry reports, you can identify and fix issues with your application before deploying
it to production. This ensures that your application is robust and efficient, providing a smooth experience for your
users. So, if you're looking for an easy and efficient way to receive Sentry reports during local development,
Buggregator is the perfect tool for you.

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

Magento 2 is supported via the following package, you can read more about it [here](https://github.com/justbetter/magento2-sentry)

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

## Other platforms

To report to Buggregator you’ll need to use a language-specific SDK. The Sentry team builds and maintains these for most
popular languages. You can find out documentation on [official site](https://docs.sentry.io/platforms/)

After you have installed the SDK, you can configure Sentry DSN to report to Buggregator:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/1
```
