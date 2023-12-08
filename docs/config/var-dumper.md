# Configuration — Symfony VarDumper server

Buggregator is fully compatible with
the [Symfony VarDumper](https://symfony.com/doc/current/components/var_dumper.html#the-dump-server) component. This is a
big deal for PHP developers because it makes debugging a lot smoother and more intuitive.

![var-dumper](https://github.com/buggregator/server/assets/773481/b77fa867-0a8e-431a-9126-f69959dc18f4)

## What is Symfony VarDumper?

1. **Essential Debugging Tool:** Symfony VarDumper is a powerful tool for debugging PHP applications. It helps you
   inspect and understand PHP variables in a more readable format.

2. **Default Behavior:** By default, the `dump()` and `dd()` functions output their contents in the same browser window
   or console terminal as your own application. This can be confusing at times, as it mixes the real output with the
   debug output.

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
