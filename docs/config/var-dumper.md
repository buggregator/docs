# Integration — Symfony VarDumper server

The Symfony VarDumper tool is essential for debugging PHP applications. It helps inspect and understand PHP variables
clearly. Normally, `dump()` and `dd()` functions show their output in the browser or console.

A great feature of VarDumper is redirecting debug outputs to a remote server. Using Buggregator as the remote server,
you can receive all debug outputs from your application, making debugging smoother and more intuitive for PHP
developers.

For more details, check
the [official documentation](https://symfony.com/doc/current/components/var_dumper.html#the-dump-server).

![var-dumper](https://github.com/buggregator/server/assets/773481/b77fa867-0a8e-431a-9126-f69959dc18f4)

## Installation

To use the package, you first need to install it.

Just run the following command in your terminal:

```bash
composer require --dev symfony/var-dumper
```

This command installs the package development-only dependency in your project.

## Configuration

You should change dumper format to `server` for var-dumper component. There is a `VAR_DUMPER_FORMAT` env variable in the
package to do it.

```dotenv
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=127.0.0.1:9912
```

or via PHP if there is no `.env` file in your project:

```php
// Plain PHP
$_SERVER['VAR_DUMPER_FORMAT'] = 'server';
$_SERVER['VAR_DUMPER_SERVER'] = '127.0.0.1:9912';
```

You can also set these variables using a bash script.

```bash
#!/bin/bash

export VAR_DUMPER_FORMAT="server"
export VAR_DUMPER_SERVER="127.0.0.1:9912"
```

That's it! Now you can use the `dump()` and `dd()` functions as usual. The output will be sent to the remote server.

## Browser performance

VarDumper send data to the server in HTML format. So if you dump an object with a lot of properties and nested objects,
it can significantly slow down the browser. To partially solve this issue, you can use `VAR_DUMPER_PREVIEW_MAX_DEPTH`
env variable to limit the depth of the preview on the events list page.

All you need to do is add environment variable to a command that starts Buggerator server:

```bash
docker run --pull always \
  -p ... \
  -e VAR_DUMPER_PREVIEW_MAX_DEPTH=3 \
  ghcr.io/buggregator/server:latest
```

> **Note:** Read more about server configuration [here](../getting-started.md).

And the server will show only 3 levels of nested objects in the preview, but you can still see the full dump by opening
the event page.

## Syntax Highlighting

When you dump a variable that contains only text, you can enable syntax highlighting for it. The easiest way to do this
is to use the `trap` function from the [Buggregator Trap](../trap/what-is-trap.md) package.

All you need to do is install the package and use the `trap` function with context:

```php
$code = <<<PHP
<?php

declare(strict_types=1);

echo 'Hello, World!';
PHP;

trap($code)->context(language: 'php');
```

And the output will be highlighted as PHP code.

![image_2024-05-01_00-39-56](https://github.com/buggregator/frontend/assets/773481/9cddfbfa-e3a3-427e-a987-0f4aa1bdb504)

## Trap

Please consider to use [Buggregator Trap](../trap/what-is-trap.md) to dump variables in your application. It uses
the Symfony VarDumper component under the hood, but it's more powerful and has additional features.