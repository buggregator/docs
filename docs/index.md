---
llms_description: "Buggregator overview: self-hosted debugging server via Docker or standalone ~30 MB binary, supports XHProf profiling, Sentry exceptions, fake SMTP email capture, SMS gateway, HTTP request dumps, Monolog logs, Symfony VarDumper, Spatie Ray, Inspector APM. Includes event pinning, screenshots, keyboard shortcuts, IDE integration, multi-project support, webhooks, Prometheus metrics, SSO auth, MCP for AI assistants. Built with Go, Vue 3, SQLite. Free forever, MIT licensed."
---

# What is Buggregator?

## Debug everything. Install nothing.

One binary. One command. Exceptions, dumps, emails, profiling, logs — all in one real-time UI.
Works with the SDKs you already have. No cloud account. No code changes. No runtime dependencies.

**Free forever. No paid plans. No feature gates. [MIT License](https://github.com/buggregator/server/blob/master/LICENSE).**

**Watch introduction video on [YouTube](https://www.youtube.com/watch?v=yKWbuw8xN_c)**

**Project repository:** https://github.com/buggregator/server

<img src="/images/cover-image.webp" alt="Buggregator" width="1672" height="288">

## What's new in v2.0

Buggregator v2.0 is a **complete rewrite in Go**. The result is a single ~30 MB self-contained binary
with everything built in — web UI, WebSocket server, SQLite database. No PHP runtime, no external
services, no infrastructure to manage.

- **Single binary** — download, run, done. No Docker required (though Docker is still supported).
- **~30 MB** — the entire server with the embedded web UI weighs less than a typical node_modules folder.
- **Zero dependencies** — no PHP, no Go runtime, no database server, no message broker. Everything is inside.
- **Embedded SQLite** — in-memory by default for instant startup, or file-based for persistence.
- **MCP server** — AI assistants (Claude Code, Cursor) can query your debugging data directly.

> Looking for the PHP version (v1.x)? See the [1.x branch](https://github.com/buggregator/server/tree/1.x).

## Get started in 60 seconds

### Download and run

```bash
curl -sL https://github.com/buggregator/server/releases/latest/download/buggregator-linux-amd64 -o buggregator \
  && chmod +x buggregator \
  && ./buggregator
```

Open http://127.0.0.1:8000 — that's it. No installation, no registration, no configuration files.

### Or use Docker

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  ghcr.io/buggregator/server:latest
```

> No Docker? No binary? Use [Buggregator Trap](./trap/what-is-trap.md) — a lightweight PHP CLI
> alternative. Just `composer require --dev buggregator/trap`.

## Your app doesn't know we exist

Buggregator runs **beside** your application as a standalone server — not inside it. Your codebase doesn't
change. Your dependencies don't change. You already have the SDKs installed (Sentry, VarDumper, Monolog,
Ray) — they just need a different address in your `.env`.

**No new dependencies.** Your app's `composer.json` stays untouched. No service providers. No migrations.
No Buggregator code inside your project.

**One env variable.** Already using Sentry SDK, VarDumper, or Monolog? Change where they send data.
That's it. Your code doesn't need to know about Buggregator.

**One instance, all your apps.** Run one Buggregator container or binary. Point all your projects at it.
Microservices, monorepos, multiple teams — one dashboard.

## Replaces your local dev stack — for free

| Instead of | Buggregator gives you |
|---|---|
| Sentry (cloud) | Exceptions with full stack traces |
| Mailhog / Mailtrap | Email capture and preview |
| Ray (paid app) | Variable dumps with 18+ payload types |
| Blackfire / XHProf UI | Performance profiling with flame graphs |
| Kibana / Log viewers | Real-time application logs |
| RequestBin | HTTP request inspection |
| Inspector.dev | Application performance monitoring |
| Twilio console | SMS gateway testing |

**All of this. One command. Zero cost.**

## When you need it

- You have a **long-running PHP app** (RoadRunner, FrankenPHP, Swoole, Octane, queue workers) and `dd()` is not an option.
- You want to see **exceptions with stack traces** like in Sentry, but don't want to set up Sentry for local dev.
- You need to **profile performance** and find memory leaks or slow functions.
- You want to **test emails** your app sends without a real mail server.
- You want to **capture SMS messages** without sending real ones through Twilio or Vonage.
- You have **multiple services** (microservices, Docker Compose) and want all debug data in one place.
- You want to **inspect HTTP requests** your app makes to external APIs.
- You just need a better `dump()` — with syntax highlighting, IDE links, and no browser pollution.

## 9 debugging tools in one dashboard

### [XHProf Profiler](/config/xhprof) — Performance

Find slow functions and memory leaks. Visualize profiling data as a **Call Graph**, **Flame Graph**,
and **Top Functions** table. **Compare two runs** side-by-side to verify your optimizations actually helped.

<img src="/images/xhprof.webp" alt="xhprof" width="1399" height="803" loading="lazy">

### [Sentry Compatibility](/config/sentry) — Exceptions

Catch unhandled exceptions with full **stack traces**, **breadcrumbs**, **request details**,
**device/browser info**, tags, and context. See exactly where your code breaks.
All Sentry SDKs are supported — PHP, JavaScript, Python, and more.

<img src="/images/sentry.webp" alt="sentry" width="1399" height="803" loading="lazy">

### [Fake SMTP Server](/config/smtp) — Emails

Intercept outgoing emails during development. Preview HTML (with mobile/desktop viewport switcher),
plain text, all addresses, attachments, and raw source. No emails actually sent.

<img src="/images/smtp.webp" alt="smtp" width="1399" height="803" loading="lazy">

### [SMS Gateway](/config/sms) — SMS Messages

Intercept outgoing SMS during development. Auto-detects 40+ providers including Twilio, Vonage, Plivo,
Sinch, and more. See every message with sender, recipient, text, and detected provider.

### [HTTP Dumps](/config/http-dumps) — Requests

Capture and inspect HTTP requests: method, URI, headers, cookies, POST data, uploaded files. Get a ready-to-use
**cURL command** for any captured request.

<img src="/images/http-dumps.webp" alt="http dumps" width="1399" height="803" loading="lazy">

### [Monolog Server](/config/monolog) — Logs

Aggregate application logs in real time. See log level, channel, message, context, extra fields, and source
location. Filter by level, search by message. Supports all PSR-3 levels.

<img src="/images/monolog.webp" alt="monolog" width="1399" height="803" loading="lazy">

### [Symfony VarDumper](/config/var-dumper) — Variable Dumps

Inspect variables with `dump()`. See object properties, array contents, and types — right in the browser.
Click on file paths to open them in your IDE.

<img src="/images/var-dumper.webp" alt="var-dumper" width="1399" height="803" loading="lazy">

### [Spatie Ray](/config/ray) — Debug Tool

Debug with `ray()` — tables, queries, models, jobs, mail, counters, and 18 more payload types.
A free alternative to the Ray app. Works with PHP, JavaScript, Ruby, Go, and Bash.

<img src="/images/ray.webp" alt="ray" width="1399" height="803" loading="lazy">

### [Inspector Compatibility](/config/inspector) — Transactions

Monitor application performance with transaction tracing, memory tracking, and timeline breakdowns
to identify bottlenecks. Local APM alternative.

<img src="/images/inspector.webp" alt="inspector" width="1399" height="803" loading="lazy">

## Works with your framework

No vendor lock-in. Your existing SDK just works.

Buggregator is compatible with **Laravel**, **Symfony**, **Spiral**, **WordPress**, **Yii**, **Drupal**,
**Magento** — and JavaScript, Python, Ruby, Go via Sentry SDK.

Works with: **RoadRunner**, **FrankenPHP**, **Swoole**, **Laravel Octane**.

See [integration guides](/config/sentry) for framework-specific setup.

## The Buggregator ecosystem

### JetBrains IDE Plugin

Don't want to leave your IDE? The [Buggregator plugin for JetBrains IDEs](https://plugins.jetbrains.com/plugin/26344-buggregator)
brings dumps, logs, and debug data directly into PhpStorm, IntelliJ IDEA, WebStorm, and other JetBrains products.
No need to switch windows — everything is in a panel next to your code.

The plugin launches [Buggregator Trap](/trap/what-is-trap) from your project and provides two views:
- **Web UI** — the full Buggregator interface embedded in the IDE's built-in browser.
- **Terminal** — text-based output for quick inspection.

Install from **Settings** > **Plugins** > **Marketplace** > search "Buggregator", or visit the
[plugin page](https://plugins.jetbrains.com/plugin/26344-buggregator).

Read more in the [plugin documentation](/config/phpstorm-plugin).

### Buggregator Trap

No Docker? No problem. [Buggregator Trap](./trap/what-is-trap.md) is a lightweight PHP CLI alternative
to the full server. Covers most debugging needs — dumps, profiler, logs, inspections — without Docker.
Just a Composer package.

```bash
composer require --dev buggregator/trap -W
```

## Ready for production teams

Enterprise features when you need them:

- **[SSO Authentication](/config/sso)** — Auth0, Google, GitHub, Keycloak, GitLab, and generic OIDC.
- **[Database](/config/database)** — SQLite with in-memory or file-based persistence.
- **[Kubernetes Ready](/config/helm-chart)** — deploy as Deployment + Service with the official Helm chart.
- **[Webhooks](/config/webhooks)** — trigger external actions on incoming events.
- **[Prometheus Metrics](/config/metrics)** — monitor event counts with Grafana.
- **[Multi-project Support](/config/projects)** — separate events by project or team.
- **[MCP Server](/config/mcp)** — let AI assistants (Claude Code, Cursor) query your debugging data.

## Also included

- **Event pinning** — pin important events so they don't get lost.
- **Event screenshots** — export any event as an image to share with your team.
- **Keyboard shortcuts** — press `?` to see all shortcuts. Navigate with `j`/`k`, switch modules with `1`-`8`.
- **IDE integration** — click file paths to open them in VS Code, PhpStorm, or [14 other IDEs](/config/var-dumper). Custom path mappings for Docker.
- **Dark / Light themes** — follows your system preference or set manually.

## Tech stack

- [Go programming language](https://go.dev/) (single binary, ~30 MB, no external dependencies)
- [SQLite](https://www.sqlite.org/) (embedded database, in-memory or file-based)
- [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/)
- [TailwindCSS](https://tailwindcss.com/) + [Pinia](https://pinia.vuejs.org/)
- Built-in WebSocket server ([Centrifugo v5](https://centrifugal.dev/) protocol)

## Open source. Built with the community.

Buggregator is free forever. No paid plans, no feature gates. If it helps you, consider
[starring the repo](https://github.com/buggregator/server).

Contributions are welcome — bugs, features, docs.

[Contribution guidelines](./contributing.md) · [GitHub](https://github.com/buggregator/server) · [Discord](https://discord.gg/vDsCD3EKUB)

### Support the project

Buggregator is and will always be free. Sponsors help fund server costs, development time, and new features.

- [Support on Patreon](https://patreon.com/butschster)
- [Browse issues](https://github.com/buggregator/server/issues) — find something to work on
- [Join Discord](https://discord.gg/vDsCD3EKUB) — ask questions, share feedback
