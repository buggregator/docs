---
llms_description: "JetBrains IDE plugin (Marketplace id 26344, vendor xepozz, version 2026.1.0, IDE 2025.3+, Freemium with a 30-day trial): a Buggregator tool window with the UI in the IDE's built-in browser (JCEF). Two ways: show your Buggregator server (Settings > Languages & Frameworks > Buggregator: Trap > Run automatically off, Web UI > URL http://127.0.0.1:8000 or the server's address) or start Buggregator Trap from the project (default: Run automatically on, URL http://127.0.0.1:5007, Trap port 5007, vendor/bin/trap). The plugin only loads that URL; it calls no server API. Install from Marketplace or a .zip from the Marketplace versions page (GitHub releases end at 2025.0.11). Issues: github.com/buggregator/phpstorm-plugin (no source code there)."
---

# JetBrains IDE Plugin

You use PhpStorm (or another JetBrains IDE) and don't want to switch to a browser to check dumps and logs.
The Buggregator plugin shows the Buggregator UI in a panel of your IDE, next to your code.

The plugin is a browser window inside the IDE. It opens one address and shows that page. It works in two ways:

- **With your Buggregator server.** The panel shows your server's UI: every module, your projects, live updates.
- **With Buggregator Trap.** The plugin starts [Trap](/trap/what-is-trap) from your project and shows Trap's UI.

The plugin starts in the Trap way. To see your server, change two settings: see
[Connect to your Buggregator server](#connect-to-your-buggregator-server).

## Installation

The plugin is on [JetBrains Marketplace](https://plugins.jetbrains.com/plugin/26344-buggregator). Version 2026.1.0
needs an IDE from version 2025.3 on.

The plugin is **Freemium**: Marketplace offers a 30-day trial of its paid part. The plugin page does not say which
features are paid.

### From the IDE

**Settings** > **Plugins** > **Marketplace** > search for **"Buggregator"** > **Install**

### Manual

1. Download the `.zip` file from the [versions page](https://plugins.jetbrains.com/plugin/26344-buggregator/versions).
2. **Settings** > **Plugins** > **⚙️** > **Install Plugin from Disk...** > select the `.zip` file.
3. Restart the IDE if prompted.

GitHub Releases of the plugin end at 2025.0.11. Newer versions are only on Marketplace.

After installation, find the **Buggregator** tool window on the right side of the IDE.

## Connect to your Buggregator server

1. Start your Buggregator server, e.g. with Docker:

   ```bash
   docker run --pull always -p 127.0.0.1:8000:8000 ghcr.io/buggregator/server:latest
   ```

2. Open **Settings** > **Languages & Frameworks** > **Buggregator**.
3. Under **Trap**, turn off **Run automatically**. The plugin then does not look for `vendor/bin/trap`.
4. Under **Web UI**, set **URL** to your server's address: `http://127.0.0.1:8000`. For a server on another machine,
   use its address, e.g. `http://192.168.1.20:8000`.
5. Open the **Buggregator** tool window. It shows the same UI as your browser at that address.

The settings are per project. Set them in each project where you want the server.

Your apps send events to the server, not to the plugin. Set them up as usual, e.g.
[Sentry](/config/sentry), [VarDumper](/config/var-dumper), [SMTP](/config/smtp).

If your server uses [SSO](/config/sso), you sign in inside the IDE's browser. Some login providers refuse
built-in browsers; this was not tested.

## Use with Trap

By default the plugin starts Trap from your project (`vendor/bin/trap`, port `5007`) and shows its UI at
`http://127.0.0.1:5007`. Trap needs:

- [buggregator/trap](https://github.com/buggregator/trap) in your project (`composer require --dev buggregator/trap`)
- a PHP interpreter set up in your IDE

Under **Trap** you choose how Trap runs (**Execution Mode**, **Binary**, **Command**) and its **Port**.

> **Tip:** If several IDE windows use the same port, their Web UIs share one Trap. A second Trap waits until the
> port is free.

## Toolbar

The tool window has buttons to reload the page, open it in your system browser, start and stop Trap, and open the
settings.

## Supported IDEs

All JetBrains IDEs from version 2025.3 on: PhpStorm, IntelliJ IDEA, WebStorm and others. The PHP plugin is needed
only to run Trap with the IDE's PHP interpreter.

## Feedback

The plugin is published by its author (vendor `xepozz` on Marketplace). Report problems in
[buggregator/phpstorm-plugin](https://github.com/buggregator/phpstorm-plugin/issues). That repository holds no source
code.
