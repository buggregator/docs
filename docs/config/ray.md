---
llms_description: "Spatie Ray compatibility: free self-hosted alternative supporting 18 payload types (Log, Caller, Carbon, Trace, Exception, Table, Measure, Query, Eloquent, View, Event, Job, Lock, Mailable, Notify, Origin). Config: RAY_HOST=ray@host, RAY_PORT=8000. Setup for Laravel (ray:publish-config), PHP (ray.php config file), JavaScript, Ruby, Go, Bash SDKs."
---

# Ray — Debug Tool

[Ray](https://myray.app/) by Spatie is a popular debug tool, especially in the Laravel ecosystem. Buggregator is
a free, self-hosted alternative — you get the same `ray()` calls, but the data lands in Buggregator alongside
your exceptions, logs, emails, and profiling. One place for everything.

![ray](https://github.com/buggregator/server/assets/773481/168b27f7-75b1-4837-b0a1-37146d5b8b52)

## Use cases

- **Free Ray alternative** — no license needed. Same `ray()` function, same workflow.
- **Multi-language debugging** — Ray has SDKs for PHP, JavaScript, Ruby, Go, and Bash. All output goes to Buggregator.
- **Laravel debugging** — dump Eloquent models, SQL queries, jobs, mail, events, and more with type-specific rendering.
- **All debug data in one UI** — don't switch between Ray app, Sentry, log files, and Mailhog. It's all in Buggregator.

## Supported payload types

Buggregator renders 18 Ray payload types:

| Type | What it shows |
|---|---|
| **Log** | Text logging |
| **Custom** | Custom data dumps |
| **Caller** | Call origin (file, line, function) |
| **Carbon** | Carbon date/time objects |
| **Trace** | Full stack trace |
| **Exception** | Exception with stack trace |
| **Table** | Structured data as a table |
| **Measure** | Performance timing |
| **Query** | SQL query with bindings |
| **Eloquent** | Eloquent model data |
| **Application Log** | Application log entries |
| **View** | Template rendering info |
| **Event** | Application events |
| **Job** | Queue job details |
| **Lock** | Lock status |
| **Mailable** | Laravel Mail preview |
| **Notify** | Notification data |
| **Origin** | Call origin info |

Each payload shows its origin (file, line, function). Click file paths to open in your IDE.

## Configuration

### Laravel

Publish the Ray config:

```bash
php artisan ray:publish-config
```

Set env variables:

```dotenv
RAY_HOST=ray@127.0.0.1
RAY_PORT=8000
```

> In Docker Compose: `RAY_HOST=ray@buggregator`, `RAY_PORT=8000`.

### PHP (any framework)

Create a `ray.php` file in your project root:

```php
<?php

return [
    'enable' => true,
    'host' => 'ray@127.0.0.1',
    'port' => 8000,
    'remote_path' => null,
    'local_path' => null,
    'always_send_raw_values' => false,
];
```

### Other languages

- [JavaScript](https://myray.app/docs/javascript/vanilla-javascript/getting-started)
- [Ruby](https://myray.app/docs/other-languages/ruby/getting-started)
- [Go](https://myray.app/docs/other-languages/go/getting-started)
- [Bash](https://myray.app/docs/other-languages/bash/installation)
