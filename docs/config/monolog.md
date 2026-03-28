# Monolog — Logs

Your app writes logs — but where do they go during development? A file you `tail -f`? Docker container output
you scroll through? With Buggregator, logs from all your services land in the same UI where you already see
exceptions, dumps, and emails. Filter by level, see structured context, click on source locations — all without
setting up Elasticsearch or a separate logging stack.

![monolog](https://github.com/buggregator/server/assets/773481/21919110-fd4d-490d-a78e-41242d329885)

## Use cases

- **Structured log viewer** — see context and extra fields as formatted JSON, not a raw string in a terminal.
- **Multi-service logging** — collect logs from all containers in one place.
- **Debug long-running apps** — workers, daemons, and queue consumers write logs that are easy to miss in stdout. Buggregator catches them all.
- **All in one place** — correlate logs with exceptions and dumps from the same request flow.

## What you see in the UI

- **Channel** — the logger channel (`app`, `security`, `database`, etc.).
- **Message** — the log message.
- **Severity level** — all PSR-3 levels: emergency, alert, critical, error, warning, notice, info, debug.
- **Timestamp** — when the log was recorded.
- **Context** — structured context data in JSON format.
- **Extra fields** — additional data from Monolog processors.
- **Source** — file, line, and function where the log was generated.

## Configuration

Buggregator receives logs via Monolog's `SocketHandler` on port **9913**. The formatter **must** be `JsonFormatter`.

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `buggregator:9913`).

### Laravel

```php
// config/logging.php
return [
    // ...
    'channels' => [
        // ...
        'socket' => [
            'driver' => 'monolog',
            'level' => env('LOG_LEVEL', 'debug'),
            'handler' => \Monolog\Handler\SocketHandler::class,
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
            'handler_with' => [
                'connectionString' => env('LOG_SOCKET_URL', '127.0.0.1:9913'),
            ],
        ],
    ],
];
```

```dotenv
LOG_CHANNEL=socket
LOG_SOCKET_URL=127.0.0.1:9913
```

### Spiral Framework

```php
<?php

declare(strict_types=1);

namespace App\Bootloader;

use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\SocketHandler;
use Spiral\Boot\Bootloader\Bootloader;
use Spiral\Boot\EnvironmentInterface;
use Spiral\Monolog\Bootloader\MonologBootloader;

class LoggingBootloader extends Bootloader
{
    public function init(MonologBootloader $monolog, EnvironmentInterface $env): void
    {
        $handler = new SocketHandler($env->get('MONOLOG_SOCKET_HOST'), chunkSize: 10);
        $handler->setFormatter(new JsonFormatter(JsonFormatter::BATCH_MODE_NEWLINES));
        $monolog->addHandler('socket', $handler);
    }
}
```

```dotenv
MONOLOG_DEFAULT_CHANNEL=socket
MONOLOG_SOCKET_HOST=127.0.0.1:9913
```

### Symfony

```php
# config/packages/dev/monolog.php
<?php

namespace Symfony\Component\DependencyInjection\Loader\Configurator;

use Symfony\Config\MonologConfig;

return static function (MonologConfig $monologConfig): void {
    $monologConfig
        ...
        ->handler('socket')
            ->level('debug')
            ->formatter('monolog.formatter.json')
            ->type('socket')
            ->connectionString(env('MONOLOG_SOCKET_HOST'));
};
```

```dotenv
MONOLOG_SOCKET_HOST=127.0.0.1:9913
```

> **Important:** The `monolog.formatter.json` formatter is required. Without it, Buggregator cannot parse the log records.

### Any PHP project

```bash
composer require monolog/monolog
```

```php
<?php

use Monolog\Logger;
use Monolog\Handler\SocketHandler;
use Monolog\Formatter\JsonFormatter;

$log = new Logger('buggregator');
$handler = new SocketHandler('127.0.0.1:9913');
$handler->setFormatter(new JsonFormatter());
$log->pushHandler($handler);

$log->warning('Foo');
$log->error('Bar');
```
