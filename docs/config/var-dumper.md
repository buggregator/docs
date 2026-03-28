# VarDumper — Variable Dumps

You call `dump()` or `dd()` and the output lands in the browser response, mixes with HTML, or gets lost in CLI
output. With Buggregator, dumps go to a dedicated TCP server and show up in a clean UI — alongside your logs,
exceptions, and everything else. No browser pollution, no output buffering issues, no lost dumps in long-running
processes.

![var-dumper](https://github.com/buggregator/server/assets/773481/b77fa867-0a8e-431a-9126-f69959dc18f4)

## Use cases

- **Long-running apps** (RoadRunner, Swoole, queue workers) — `dd()` doesn't print to a browser here, but Buggregator catches it.
- **API development** — dump variables without breaking JSON responses.
- **Microservices** — collect dumps from all services in one place.
- **IDE integration** — click the source location to jump straight to the file in your editor.

## What you see in the UI

- **Dumped value** — full variable content with type information, rendered as an interactive expandable tree.
- **Source location** — file and line where `dump()` was called. Clickable — opens in your IDE.
- **Variable name and label** — custom labels if provided.
- **Syntax highlighting** — for text-only dumps (see below).

## Setup

Install the Symfony VarDumper component:

```bash
composer require --dev symfony/var-dumper
```

Set two env variables to redirect output to Buggregator:

```dotenv
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=127.0.0.1:9912
```

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `VAR_DUMPER_SERVER=buggregator:9912`).

That's it. Use `dump()` and `dd()` as usual — the output goes to Buggregator.

If your project doesn't use `.env` files, set via PHP:

```php
$_SERVER['VAR_DUMPER_FORMAT'] = 'server';
$_SERVER['VAR_DUMPER_SERVER'] = '127.0.0.1:9912';
```

## Performance tip

Large objects with deep nesting can slow down the browser. Limit the preview depth on the events list page:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:9912:9912 \
  -e VAR_DUMPER_PREVIEW_MAX_DEPTH=3 \
  ghcr.io/buggregator/server:latest
```

The full dump is still available when you open the event detail page.

## Syntax highlighting

Dump a text string with syntax highlighting using [Buggregator Trap](../trap/what-is-trap.md):

```php
$code = <<<PHP
<?php

declare(strict_types=1);

echo 'Hello, World!';
PHP;

trap($code)->context(language: 'php');
```

![image_2024-05-01_00-39-56](https://github.com/buggregator/frontend/assets/773481/9cddfbfa-e3a3-427e-a987-0f4aa1bdb504)

## Buggregator Trap

Consider using [Buggregator Trap](../trap/what-is-trap.md) instead of raw VarDumper — it uses VarDumper under the
hood but adds extra features like `trap()`, `tr()`, and `td()` helpers.
