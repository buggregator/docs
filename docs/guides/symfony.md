---
llms_description: "Symfony guide: buggregator service in compose.yaml (ghcr.io/buggregator/server:2.10.0, only port 8000 published); .env.local MAILER_DSN=smtp://buggregator:1025, SENTRY_DSN=http://sentry@buggregator:8000/1 (sentry/sentry-symfony: its contrib recipe enables the bundle and DSN for prod only; enable SentryBundle for dev and add a when@dev sentry: block with dsn + traces_sample_rate), VAR_DUMPER_SERVER=buggregator:9912 (debug-bundle recipe dump_destination tcp://%env(VAR_DUMPER_SERVER)%, no server:dump needed), Monolog socket handler with monolog.formatter.json, MONOLOG_SOCKET_HOST=buggregator:9913. Checked with Symfony 8.1, sentry-symfony 5.16, monolog-bundle 4.1, server 2.10.0."
---

# Symfony

Run Buggregator next to your Symfony app. It takes the place of `bin/console server:dump`, Mailpit and a Sentry
server at once.

Checked with Symfony 8.1, sentry-symfony 5.16 and monolog-bundle 4.1 against Buggregator 2.10.0.

## 1. Add the service

In `compose.yaml` (or `docker-compose.yml`), under `services:`:

```yaml
  buggregator:
    image: ghcr.io/buggregator/server:2.10.0
    ports:
      - "127.0.0.1:8000:8000"
```

Your PHP container reaches it by the service name `buggregator`. Only the web UI port is published.

PHP runs on your machine, not in Docker (e.g. `symfony serve`)? Publish the other ports too and use `127.0.0.1`
instead of `buggregator` below:

```yaml
    ports:
      - "127.0.0.1:8000:8000"
      - "127.0.0.1:1025:1025"
      - "127.0.0.1:9912:9912"
      - "127.0.0.1:9913:9913"
```

## 2. Point Symfony at it

Put the lines below in `.env.local`, so they stay on your machine.

### Mail

```dotenv
MAILER_DSN=smtp://buggregator:1025
```

### Dumps

Install the debug bundle: `composer require --dev symfony/debug-bundle`. Its recipe already adds
`config/packages/debug.yaml`:

```yaml
when@dev:
    debug:
        dump_destination: "tcp://%env(VAR_DUMPER_SERVER)%"
```

Set the address:

```dotenv
VAR_DUMPER_SERVER=buggregator:9912
```

You do not run `server:dump`: Buggregator is the dump server. `dump()` output appears in its UI.

### Logs

Add a socket handler to the `when@dev` part of `config/packages/monolog.yaml`:

```yaml
when@dev:
    monolog:
        handlers:
            buggregator:
                type: socket
                connection_string: '%env(MONOLOG_SOCKET_HOST)%'
                formatter: monolog.formatter.json
                level: debug
            # ... the recipe's main and console handlers stay
```

```dotenv
MONOLOG_SOCKET_HOST=buggregator:9913
```

The `monolog.formatter.json` formatter is required: without it, Buggregator cannot read the records.

### Errors (Sentry)

Install the SDK: `composer require sentry/sentry-symfony`. Its contrib recipe turns Sentry on for `prod` only:
the bundle is registered for `prod`, and the DSN sits under `when@prod:`. In dev nothing reaches Buggregator until
you change two things, whether the recipe ran or not.

In `config/bundles.php`, turn the bundle on for dev too:

```php
Sentry\SentryBundle\SentryBundle::class => ['dev' => true, 'prod' => true],
```

In `config/packages/sentry.yaml`, add a `when@dev:` block (create the file if the recipe did not):

```yaml
when@dev:
    sentry:
        dsn: '%env(SENTRY_DSN)%'
        options:
            traces_sample_rate: 1.0
```

```dotenv
SENTRY_DSN=http://sentry@buggregator:8000/1
```

## 3. Check it

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Then run a command that mails, logs, dumps and fails, e.g.:

```php
#[AsCommand(name: 'buggregator:check')]
class BuggregatorCheckCommand extends Command
{
    public function __construct(private MailerInterface $mailer, private LoggerInterface $logger)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $this->mailer->send((new Email())->from('app@example.com')->to('dev@example.com')->subject('Check')->text('Hello'));
        $this->logger->info('Hello from Symfony');
        dump(['hello' => 'Buggregator']);
        throw new \RuntimeException('Check error');
    }
}
```

Run `bin/console buggregator:check`. You should now see an email «Check», a dump, a Sentry error «Check error»,
and log records: «Hello from Symfony» plus the mailer's and console's own debug records.

## See also

[SMTP](/config/smtp) · [Sentry](/config/sentry) · [Monolog](/config/monolog) · [VarDumper](/config/var-dumper)
