---
llms_description: "Windows / WSL guide: pick by where the app runs. App on Windows: native binary (install.ps1 with $env:BUGGREGATOR_VERSION='v2.11.0', or buggregator-windows-amd64.exe / -arm64.exe), app uses 127.0.0.1. App in Docker Desktop: compose service ghcr.io/buggregator/server:2.11.0, app uses the service name; a container reaching a Buggregator on the Windows host uses host.docker.internal. App inside WSL 2: install the Linux binary inside WSL (install.sh, BUGGREGATOR_VERSION=v2.11.0), app uses 127.0.0.1; the Windows browser opens http://localhost:8000 through WSL's localhost forwarding. Run one copy, next to the app."
---

# Windows and WSL

On Windows, Buggregator runs three ways: as a Windows program, in Docker Desktop, or inside WSL. Pick the one that
sits **next to your app**. Then your app reaches it as `127.0.0.1` or by a service name, with no network tricks.

| Your app runs… | Run Buggregator… | Your app sends to |
|----------------|------------------|-------------------|
| on Windows (e.g. PHP from Laragon, Node, .NET) | as a Windows program | `127.0.0.1` |
| in Docker Desktop (compose, Sail) | as a compose service | the service name, e.g. `buggregator` |
| inside WSL (Ubuntu and others) | inside WSL, the Linux binary | `127.0.0.1` |

In every case you open the UI in your Windows browser at [http://localhost:8000](http://localhost:8000).

## As a Windows program

In PowerShell, install a fixed version:

```powershell
$env:BUGGREGATOR_VERSION = "v2.11.0"
irm https://raw.githubusercontent.com/buggregator/server/master/scripts/install.ps1 | iex
& "$env:LOCALAPPDATA\Programs\buggregator\buggregator.exe"
```

Or download `buggregator-windows-amd64.exe` (ARM: `buggregator-windows-arm64.exe`) from the
[v2.11.0 release](https://github.com/buggregator/server/releases/tag/v2.11.0). If Windows says «Windows protected
your PC», see [Install → If your system blocks it](/install#if-your-system-blocks-it).

## In Docker Desktop

Add the service to your `compose.yaml` or `docker-compose.yml`:

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:2.11.0
    ports:
      - "127.0.0.1:8000:8000"
```

Containers in the same compose file reach it as `buggregator`. Stack guides:
[Laravel Sail](/guides/laravel-sail), [Symfony](/guides/symfony), [Django](/guides/django),
[Node.js](/guides/node), [Spring Boot](/guides/spring-boot).

A container that must reach a Buggregator running as a Windows program uses `host.docker.internal` instead of
`127.0.0.1`, e.g. `MAIL_HOST=host.docker.internal`. Windows Firewall must let `buggregator.exe` in: allow it when
Windows asks on the first start. If you clicked «Cancel», containers cannot reach it.

## Inside WSL

Open your WSL terminal and install the Linux binary there:

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh \
  | BUGGREGATOR_VERSION=v2.11.0 sh
~/.local/bin/buggregator
```

Your app inside WSL sends to `127.0.0.1`. WSL 2 forwards `localhost` ports to Windows, so the Windows browser opens
the UI at [http://localhost:8000](http://localhost:8000).

Do not mix: a Windows program on one side and the app inside WSL on the other is harder to connect. Run one copy,
next to the app.

## Check it

```bash
curl http://127.0.0.1:8000/api/version
# {"version":"2.11.0"}
```

In PowerShell, use `curl.exe` instead of `curl`. Then send something from your app; the stack guides say what you
should see.
