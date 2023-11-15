# Configuration — Inspector

Buggregator is also compatible with Inspector reports, providing you with a lightweight alternative for local
development. With it, you can easily configure your Inspector client URL to send data directly to the server, making it
easier to identify and fix issues during the development phase.

![inspector](https://user-images.githubusercontent.com/773481/208734651-e8dca2bf-6674-4aed-b6fc-601bc877f7ce.png)

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
