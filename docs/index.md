# What is Buggregator?

Buggregator is a free, open-source debugging server for PHP applications. One `docker run` command — and you get
exceptions, logs, dumps, profiling, emails, and HTTP requests in a single UI. No registration, no limits, no cost.

**Watch introduction video on [YouTube](https://www.youtube.com/watch?v=yKWbuw8xN_c)**

**Project repository:** https://github.com/buggregator/server

![Cover image](https://github.com/buggregator/server/assets/773481/47491a3c-57a3-4b40-b82e-37976afdf708)

## When you need it

- You have a **long-running PHP app** (RoadRunner, Swoole, FrankenPHP, queue workers) and `dd()` is not an option.
- You want to see **exceptions with stack traces** like in Sentry, but don’t want to set up Sentry for local dev.
- You need to **profile performance** and find memory leaks or slow functions.
- You want to **test emails** your app sends without a real mail server.
- You want to **capture SMS messages** without sending real ones through Twilio or Vonage.
- You have **multiple services** (microservices, Docker Compose) and want all debug data in one place.
- You want to **inspect HTTP requests** your app makes to external APIs.
- You just need a better `dump()` — with syntax highlighting, IDE links, and no browser pollution.

## How it works

Buggregator runs as a standalone server (typically in Docker alongside your app). Your application sends data to it
using standard integrations you probably already use — Sentry SDK, Symfony VarDumper, Monolog, Spatie Ray, Inspector,
or plain SMTP. Buggregator collects everything and shows it in a real-time web UI.

```bash
docker run -p 8000:8000 -p 1025:1025 -p 9912:9912 -p 9913:9913 -p 9914:9914 ghcr.io/buggregator/server:latest
```

Open http://127.0.0.1:8000 and start debugging. That’s it.

> For local debugging without Docker, use [Buggregator Trap](./trap/what-is-trap.md) — a lightweight CLI alternative
> with zero configuration.

## Key Features

### [XHProf Profiler](/config/xhprof) — Performance

Find slow functions and memory leaks. Buggregator visualizes profiling data as a **Call Graph**, **Flame Graph**,
and **Top Functions** table. **Compare two runs** side-by-side to verify your optimizations actually helped.

![xhprof](https://github.com/buggregator/server/assets/773481/d69e1158-599d-4546-96a9-40a42cb060f4)

### [Sentry Compatibility](/config/sentry) — Exceptions

Replace Sentry for local development. See exceptions with full **stack traces**, **breadcrumbs**, **request details**,
**device/browser info**, tags, and context. All Sentry SDKs are supported — PHP, JavaScript, Python, and more.

![sentry](https://github.com/buggregator/server/assets/773481/e979fda5-54c8-42cc-8224-a1c5d828569a)

### [Fake SMTP Server](/config/smtp) — Emails

Capture all outgoing emails. Preview HTML (with mobile/desktop viewport switcher), plain text, all addresses,
attachments, and raw source. Just point your app’s SMTP config to port `1025`.

![smtp](https://github.com/buggregator/server/assets/773481/8dd60ddf-c8d8-4a26-a8c0-b05052414a5f)

### [SMS Gateway](/config/sms) — SMS Messages

Capture SMS messages your app sends through Twilio, Vonage, Plivo, and 40+ other providers. Point your SMS
webhook URL at Buggregator and see every message with sender, recipient, text, and detected provider. Use
explicit provider URLs (`/sms/twilio`) for field validation — missing fields are highlighted in the UI while
your app gets a proper error response.

### [HTTP Dumps](/config/http-dumps) — Requests

Capture and inspect HTTP requests: method, URI, headers, cookies, POST data, uploaded files. Get a ready-to-use
**cURL command** for any captured request.

![http dumps](https://github.com/buggregator/server/assets/773481/fc823390-b490-4bbb-a787-44471eca9fb6)

### [Monolog Server](/config/monolog) — Logs

Collect application logs in real time. See log level, channel, message, context, extra fields, and source location.
Supports all PSR-3 levels.

![monolog](https://github.com/buggregator/server/assets/773481/21919110-fd4d-490d-a78e-41242d329885)

### [Symfony VarDumper](/config/var-dumper) — Variable Dumps

Redirect `dump()` output to Buggregator instead of your browser. See variables with full type info, source location,
and syntax highlighting. Click on file paths to open them in your IDE.

![var-dumper](https://github.com/buggregator/server/assets/773481/b77fa867-0a8e-431a-9126-f69959dc18f4)

### [Spatie Ray](/config/ray) — Debug Tool

A free alternative to the Ray app. Supports 18 payload types: logs, exceptions, SQL queries, Eloquent models,
Laravel jobs, mail previews, performance measurements, and more. Works with PHP, JavaScript, Ruby, Go, and Bash.

![ray](https://github.com/buggregator/server/assets/773481/168b27f7-75b1-4837-b0a1-37146d5b8b52)

### [Inspector Compatibility](/config/inspector) — Transactions

Monitor application performance. View transaction duration, memory usage, HTTP request details, and timeline
breakdown to identify bottlenecks.

![inspector](https://github.com/buggregator/server/assets/773481/ab002ecf-e1dc-4433-90d4-0e42ff8c0ab3)

## JetBrains IDE Plugin

Don’t want to leave your IDE? The [Buggregator plugin for JetBrains IDEs](https://plugins.jetbrains.com/plugin/26344-buggregator)
brings dumps, logs, and debug data directly into PhpStorm, IntelliJ IDEA, WebStorm, and other JetBrains products.
No need to switch windows — everything is in a panel next to your code, with all IDE shortcuts working.

The plugin launches [Buggregator Trap](/trap/what-is-trap) from your project and provides two views:
- **Web UI** — the full Buggregator interface embedded in the IDE’s built-in browser.
- **Terminal** — text-based output for quick inspection.

Install from **Settings** > **Plugins** > **Marketplace** > search "Buggregator", or visit the
[plugin page](https://plugins.jetbrains.com/plugin/26344-buggregator).

Read more in the [plugin documentation](/config/phpstorm-plugin).

## Also included

- **Event pinning** — pin important events so they don’t get lost.
- **Event screenshots** — export any event as an image to share with your team.
- **Keyboard shortcuts** — press `?` to see all shortcuts. Navigate with `j`/`k`, switch modules with `1`-`8`.
- **IDE integration** — click file paths to open them in VS Code, PhpStorm, or [14 other IDEs](/config/var-dumper). Custom path mappings for Docker.
- **Dark / Light themes** — follows your system preference or set manually.
- **[Multi-project support](/config/projects)** — separate events by project or team.
- **[Webhooks](/config/webhooks)** — trigger external actions when events are received.
- **[Prometheus metrics](/config/metrics)** — monitor event counts with Grafana.
- **[SSO authentication](/config/sso)** — Auth0 and Kinde support.
- **[External database](/config/external-db)** — PostgreSQL or MySQL for persistent storage.

## Tech stack

- [Spiral Framework](https://spiral.dev/) + [RoadRunner](https://roadrunner.dev/) (HTTP, WebSocket, TCP, Queue)
- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [TailwindCSS](https://tailwindcss.com/) + [Pinia](https://pinia.vuejs.org/)
- [Centrifugo](https://centrifugal.dev/) (real-time WebSocket messaging)

## Contributing

Buggregator is open-source. Contributions are welcome — bugs, features, docs.

[Contribution guidelines](./contributing.md) · [GitHub](https://github.com/buggregator/server)