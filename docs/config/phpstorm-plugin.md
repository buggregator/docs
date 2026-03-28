# JetBrains IDE Plugin

You use PhpStorm (or another JetBrains IDE) and don't want to switch to a browser to check dumps and logs.
The Buggregator plugin embeds the full debug UI directly into your IDE — dumps, logs, exceptions, and profiling
data appear in a panel next to your code. All IDE shortcuts keep working. No context switching.

**Plugin repository:** https://github.com/buggregator/phpstorm-plugin

## How it works

The plugin launches [Buggregator Trap](/trap/what-is-trap) from your project's `vendor` directory using the PHP
interpreter configured in your IDE. Trap starts collecting debug data and the plugin displays it in two tabs:

- **Web UI** — the full interactive Buggregator interface in the IDE's built-in browser. Same UI as the standalone server.
- **Terminal** — text-based output for quick inspection.

Trap opens a web interface port (configurable in settings), which works with all standard clients — VarDumper,
Monolog, Sentry, Ray, and others.

> **Tip:** If you have the plugin running in multiple IDE windows with the same port, both Web UIs share the same
> Trap instance. A second Trap will wait until the port is free.

## Requirements

- [buggregator/trap](https://github.com/buggregator/trap) installed in your project (`composer require --dev buggregator/trap`)
- A PHP interpreter configured in your IDE settings

## Installation

### From JetBrains Marketplace (recommended)

Go to the [plugin page](https://plugins.jetbrains.com/plugin/26344-buggregator) and click **Install to ...**

### From IDE

**Settings** > **Plugins** > **Marketplace** > search for **"Buggregator"** > **Install**

### Manual

1. Download the `.jar` file from [GitHub Releases](https://github.com/buggregator/phpstorm-plugin/releases) or [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/26344-buggregator/versions).
2. **Settings** > **Plugins** > **⚙️** > **Install plugin from disk...** > select the `.jar` file.
3. Restart the IDE if prompted.

After installation, find the **Buggregator** button in the top right corner of the IDE window.

## Configuration

Open the plugin settings to customize:

- **PHP interpreter** — which PHP binary to use for running Trap.
- **Path to Trap** — defaults to `vendor/bin/trap`, change if needed.
- **Web UI port** — the port for the embedded web interface.

Click the **🌐** button on the toolbar to open the Web UI in your system browser instead of the IDE.

## Supported IDEs

The plugin works with all JetBrains IDEs that support PHP development:

- PhpStorm
- IntelliJ IDEA (with PHP plugin)
- WebStorm
- And other JetBrains products
