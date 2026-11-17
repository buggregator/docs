---
llms_description: "Laravel Sail guide: add a buggregator service (ghcr.io/buggregator/server:2.11.0, network sail, only port 8000 published) to compose.yaml; .env for mail (MAIL_HOST=buggregator, MAIL_PORT=1025), Sentry (SENTRY_LARAVEL_DSN=http://sentry@buggregator:8000/1, Laravel 11+ needs Integration::handles in bootstrap/app.php), logs (socket channel, LOG_SOCKET_URL=buggregator:9913), dumps (VAR_DUMPER_FORMAT=server, VAR_DUMPER_SERVER=buggregator:9912). Mailpit also uses port 1025 on the host. Socket log channel throws when Buggregator is down. Checked with Laravel 13.42, Sail 1.70, sentry-laravel 4.30, server 2.10.0."
---

# Laravel Sail

Run Buggregator next to your Sail containers. Your app then sends mail, errors, logs and `dump()` output to it.

Checked with Laravel 13.42, Sail 1.70 and sentry-laravel 4.30 against Buggregator 2.10.0.

## 1. Add the service

Sail keeps its services in `compose.yaml` (older apps: `docker-compose.yml`). Add `buggregator` under
`services:`:

```yaml
    buggregator:
        image: 'ghcr.io/buggregator/server:2.11.0'
        ports:
            - '127.0.0.1:8000:8000'
        networks:
            - sail
```

- The tag is pinned (`2.11.0`). Change it on purpose when you upgrade, not by surprise.
- Only the web UI port is published. Your app reaches mail, logs and dumps over the `sail` network by the
  service name `buggregator`, so ports 1025, 9912 and 9913 do not need to be open on your machine.
- Sail's `mailpit` service also takes port 1025 on your machine. Both can run: Buggregator does not publish 1025.
  You can remove `mailpit` once mail goes to Buggregator.

If `APP_PORT` is `8000`, publish the UI on another port, e.g. `'127.0.0.1:8001:8000'`.

Start it: `./vendor/bin/sail up -d`.

## 2. Point Laravel at it

### Mail

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=buggregator
MAIL_PORT=1025
```

### Errors (Sentry)

Install the SDK: `./vendor/bin/sail composer require sentry/sentry-laravel`.

```dotenv
SENTRY_LARAVEL_DSN=http://sentry@buggregator:8000/1
SENTRY_TRACES_SAMPLE_RATE=1.0
```

Laravel 11 and later also need one line in `bootstrap/app.php`. Without it, exceptions are not reported:

```php
->withExceptions(function (Exceptions $exceptions): void {
    \Sentry\Laravel\Integration::handles($exceptions);
})
```

### Logs

Add a `socket` channel to `config/logging.php`, as in [Monolog → Laravel](/config/monolog#laravel), then:

```dotenv
LOG_CHANNEL=socket
LOG_SOCKET_URL=buggregator:9913
```

If Buggregator is not running, this channel throws an error, and even `artisan` commands fail with
«Failed connecting to buggregator:9913». Set these lines only in your local `.env`.

### Dumps

```dotenv
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=buggregator:9912
```

`dump()` and `dd()` now go to Buggregator instead of the page or the console.

## 3. Check it

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Then run something that mails, logs, dumps and fails. For
example, add this to `routes/console.php`:

```php
Artisan::command('buggregator:check', function () {
    \Illuminate\Support\Facades\Mail::raw('Hello', fn ($m) => $m->to('dev@example.com')->subject('Check'));
    \Illuminate\Support\Facades\Log::info('Hello from Laravel');
    dump(['hello' => 'Buggregator']);
    throw new RuntimeException('Check error');
});
```

Run `./vendor/bin/sail artisan buggregator:check`. You should now see an email «Check», a log record «Hello from
Laravel», a dump, and a Sentry error «Check error». The error is also logged, so a second log record shows it.

## See also

[SMTP](/config/smtp) · [Sentry](/config/sentry) · [Monolog](/config/monolog) · [VarDumper](/config/var-dumper)
