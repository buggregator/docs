---
llms_description: "Security and data (server 2.11.0): what leaves the machine — server: update check GET api.github.com/repos/buggregator/server/releases/latest at start and every 12h (User-Agent buggregator/<version>; UPDATE_CHECK_ENABLED=false turns it off), Sentry JS source context: server GETs http(s) URLs from JS stack-frame filenames (3 s, 2 MiB, TLS not verified, any host in 2.10.0 and older; since server 2.11.0 loopback/private only by default, sentry.source_fetch / SENTRY_SOURCE_FETCH / --sentry-source-fetch = private|any|off); browser: UI fonts ship with the UI since 2.11.0 (2.10.0 and older load Google Fonts on every open); images and styles inside captured HTML emails and HTML dumps load from their hosts when opened (scripts do not run), no switch; only when you turn them on: SSO provider, webhooks, OpenAPI import, HTTP proxy upstreams, Xdebug IDE. No analytics or usage reporting. Listening: binary on all interfaces (:8000, :1025, :9912, :9913, HTTP proxy :8080 = open forward proxy with HTTPS MITM, no auth); opt-in: MCP over HTTP :8001 all interfaces, no auth without MCP_AUTH_TOKEN (MCP_ADDR to bind), METRICS_ADDR; bind with -http-addr/-smtp-addr/-vardumper-addr/-monolog-addr and PROXY_ADDR=127.0.0.1:8080; Docker: publish as 127.0.0.1:port:port. SSO protects UI and UI APIs only: ingestion, TCP ports, HTTP proxy, /mock/, /api/version, /api/settings, attachment links, MCP HTTP, /metrics stay open. Data: in memory by default (lost on restart), DATABASE_DSN file, attachments STORAGE_MODE; no automatic cleanup by default; since server 2.11.0 retention.max_age / RETENTION_MAX_AGE / --retention-max-age (30m, 24h, 7d) and retention.max_events / RETENTION_MAX_EVENTS / --retention-max-events, default keep all, every minute, pinned kept and not counted, attachments go too; max_age also prunes Sentry logs/metrics (received) and traces/spans (start time), max_events counts event cards only; deleting an event also deletes its Sentry error details; manual clear of events keeps Sentry logs/metrics/traces (use DELETE /api/sentry/all). Versions: semver, minor may change behaviour, pin ghcr.io/buggregator/server:2.11.0 (no v), tags latest, 2, 2.11, 2.11.0; fixes only for the latest release line."
---

# Security and data

Buggregator is a debugging tool for your own machine or a trusted dev network. It has no accounts, sends no
analytics and reports no usage. This page lists, without gaps, what it does send, who can reach it, and where
your events are kept. Everything here is true for server **2.11.0**.

## What leaves your machine

### Always on

| What | Who sends | Where to | When | How to turn it off |
|------|-----------|----------|------|--------------------|
| New-version check | the server | `https://api.github.com/repos/buggregator/server/releases/latest` | at start, then every 12 hours | `UPDATE_CHECK_ENABLED=false` |
| Source of JavaScript errors | the server | the URL of each file in a JavaScript stack trace | each Sentry error from a browser or JS app | `SENTRY_SOURCE_FETCH=off` (since 2.11.0) |
| Images and styles inside captured HTML | your browser | the hosts named in that HTML (e.g. a tracking pixel) | when you open an HTML email or an HTML HTTP dump | no switch |

**New-version check.** One GET request. Besides your IP address, it carries only the server version
(`User-Agent: buggregator/2.11.0`). Nothing about your events or projects is sent. With
`UPDATE_CHECK_ENABLED=false` the server makes no such call at all. Details:
[Server → New-Version Check](/config/server#new-version-check).

**UI fonts.** Since server 2.11.0 the fonts (DM Sans, JetBrains Mono) are part of the UI, and the browser
loads nothing from Google Fonts. Server 2.10.0 and older load them from `fonts.googleapis.com` and
`fonts.gstatic.com`, so Google sees the IP address of the browser that opens the UI. No event data goes there.

**Source of JavaScript errors.** Browser SDKs send stack frames with a file URL but no code, e.g.
`http://localhost:5173/src/App.vue`. To show the code, the server downloads that file: up to 2 MiB, 3-second
timeout, TLS certificates not checked. In server 2.10.0 and older it does this for any `http://` or `https://` URL
in a frame, not only for local ones. So whoever can send a Sentry event to your Buggregator can make it request a
URL from inside your network. Keep the server where only your apps can reach it (see below).

Since server 2.11.0, the server fetches only from loopback and private addresses by default
(`127.0.0.0/8`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`): your dev server, a Docker
service. One setting changes it: `sentry.source_fetch` in `buggregator.yaml`, `SENTRY_SOURCE_FETCH` or
`--sentry-source-fetch`, with `private` (default), `any` (every host, as in 2.10.0 and older) or `off` (never fetch).
The check is made on the resolved IP address, cloud metadata addresses are refused, and redirects go only to the
same host. Details: [Server → Sentry Source Fetch](/config/server#sentry-source-fetch).

**Images and styles inside captured HTML.** An HTML email or an HTML HTTP dump is shown as it is. Scripts in it
do not run, but its images and stylesheets load from wherever they point. So when you open a captured email, your
browser requests its images, tracking pixels included, and the sender may see that the email was opened.

### Only when you turn it on

| Feature | Where it connects |
|---------|-------------------|
| [SSO](/config/sso) | your login provider (GitHub, Google, Auth0, Keycloak, GitLab, OIDC) |
| [Webhooks](/config/webhooks) | the URLs you configure |
| [Mock server](/config/mock-server) OpenAPI import from a URL | the URL you enter |
| [HTTP proxy](/config/http-proxy) | the hosts your app sends through it |
| [Xdebug proxy](/config/xdebug) | your IDE's address |

Nothing else makes outgoing connections.

## Who can reach it

### The binary

Every port listens on **all network interfaces** by default. Anyone on your network who can reach your machine can
open the UI, read your events and send new ones.

| Port | What | Default |
|------|------|---------|
| `8000` | web UI, API, HTTP events | `:8000`, all interfaces |
| `1025` | SMTP | `:1025`, all interfaces |
| `9912` | VarDumper | `:9912`, all interfaces |
| `9913` | Monolog | `:9913`, all interfaces |
| `8080` | HTTP proxy | `:8080`, all interfaces |
| `9003` | Xdebug proxy (off by default) | `127.0.0.1:9003` |
| `8001` | MCP over HTTP (only with `MCP_ENABLED=true` and `MCP_TRANSPORT=http`) | `:8001`, all interfaces |
| `METRICS_ADDR` | Prometheus metrics on their own port (only when you set it) | the address you set |

MCP over HTTP asks for no token unless you set `MCP_AUTH_TOKEN`. Bind it with `MCP_ADDR=127.0.0.1:8001`. The
default MCP transport is a local socket file, which opens no port.

The HTTP proxy deserves a note. It forwards requests to **any host**, also HTTPS, and asks for no password. On all
interfaces, it is an open proxy for everyone on your network.

To keep everything on your machine:

```bash
PROXY_ADDR=127.0.0.1:8080 ./buggregator \
  -http-addr 127.0.0.1:8000 \
  -smtp-addr 127.0.0.1:1025 \
  -vardumper-addr 127.0.0.1:9912 \
  -monolog-addr 127.0.0.1:9913
```

The same with environment variables: `HTTP_ADDR`, `SMTP_ADDR`, `VAR_DUMPER_ADDR`, `MONOLOG_ADDR`, `PROXY_ADDR`.

### Docker

Inside the container the server listens on all interfaces; that is fine. What matters is how you publish the
ports. Always put `127.0.0.1:` in front:

```yaml
ports:
  - "127.0.0.1:8000:8000"   # only this machine
  # - "8000:8000"           # every machine that can reach yours
```

Containers on the same compose network reach Buggregator by its service name. They need no published ports at all.
Publish only what you open from your machine: usually just `8000`.

### What SSO protects

[SSO](/config/sso) puts a login in front of the UI and the APIs the UI uses. These stay **open**, also with SSO on:

- event ingestion (Sentry, Ray, Inspector, profiler, SMS, HTTP dumps) and the SMTP, VarDumper and Monolog ports;
- the HTTP proxy;
- the mock server under `/mock/`;
- `/api/version`, `/api/settings` and attachment links;
- MCP over HTTP on `:8001`: it has its own token, `MCP_AUTH_TOKEN`;
- Prometheus `GET /metrics`, when metrics are on: on port `8000`, or on `METRICS_ADDR` if set.

So SSO keeps strangers from **reading** your events, but not from **sending** them. On a shared server, also limit
who can reach the ports, e.g. with a firewall or a private network.

Scripts call the protected API with the token the UI gets after login (30 days). See
[SSO → Calling the API from Scripts](/config/sso#calling-the-api-from-scripts).

## Where your data is kept

| What | Default | To keep it on disk |
|------|---------|--------------------|
| Events | in memory: gone when the server stops | `DATABASE_DSN=/data/buggregator.db` (SQLite file) |
| Email attachments, HTTP dump files | in memory | `STORAGE_MODE=filesystem`, `STORAGE_PATH=…` |

Details: [Database](/config/database).

**How long.** By default the server deletes nothing by itself. Events stay until you clear them in the UI, call
`DELETE /api/events`, or restart a server that keeps them in memory. With a database file, the file grows until you
clear it.

Since server 2.11.0, you can let it delete old events by itself:

```bash
RETENTION_MAX_AGE=7d RETENTION_MAX_EVENTS=5000 ./buggregator
```

- `RETENTION_MAX_AGE` (`retention.max_age`, `--retention-max-age`): delete events older than this, e.g. `30m`,
  `24h`, `7d`. Empty or `0`: keep.
- `RETENTION_MAX_EVENTS` (`retention.max_events`, `--retention-max-events`): keep at most this many events, the
  newest. `0`: no cap.

Nothing is deleted unless you set one of them. The cleanup runs at start and then every minute. Attachments go
with their events. Pinned events are never deleted and do not count towards the cap.

What goes with them:

- Deleting an event (in the UI, with `DELETE /api/events`, or by retention) also deletes its Sentry error details.
- `RETENTION_MAX_AGE` also removes Sentry logs and metrics by the time they arrived, and traces and spans by their
  start time. The error details of a pinned event stay.
- `RETENTION_MAX_EVENTS` counts event cards only. It does not touch Sentry logs, metrics or traces.
- Clearing events by hand does not remove Sentry logs, metrics and traces. Remove those with **Clear** on the
  Sentry page or `DELETE /api/sentry/all` (see [Sentry → Clearing data](/config/sentry#clearing-data)).

In 2.10.0 and older, deleting an event left its Sentry error details in the database.

## Versions

Releases are numbered `major.minor.patch` (e.g. `2.11.0`). A minor release may still change behaviour, so read
the [release notes](https://github.com/buggregator/server/releases) before you upgrade.

Pin the version and upgrade on purpose:

```yaml
image: ghcr.io/buggregator/server:2.11.0
```

| Tag | What you get |
|-----|--------------|
| `2.11.0` | exactly this release, never changes |
| `2.11` | the newest `2.11.x` patch |
| `2` | the newest `2.x` release |
| `latest` | the newest release, whatever it is |

The image tags have no `v`: `2.11.0`, not `v2.11.0`. Release pages and binaries use `v2.11.0`.

Security fixes go into the newest release only. To get a fix, upgrade.

## Report a vulnerability

See [SECURITY.md](https://github.com/buggregator/server/blob/master/SECURITY.md) in the server repository.
