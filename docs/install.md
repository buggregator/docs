---
llms_description: "Install the standalone binary (no Docker, no dependencies): download URLs per OS and CPU (linux-amd64, linux-arm64, darwin-arm64, darwin-amd64, windows-amd64.exe, windows-arm64.exe) from GitHub releases; install scripts install.sh (curl | sh, ~/.local/bin, checksums) and install.ps1 (irm | iex); verify a download by hand (since v2.11.0): ed25519 public key MCowBQYDK2VwAyEAbFthyZgjx8k7TUu4ZekM3sa0zSxSRzOTaX2BfxaUH2I= (PEM), openssl pkeyutl -verify -pubin -inkey key.pem -rawin -in checksums.txt -sigfile checksums.txt.sig (OpenSSL 3+), then sha256sum -c; install scripts check sha256 only, not the signature; macOS quarantine (xattr) and Windows SmartScreen (Unblock-File); first start, default ports and addresses (all interfaces), flags -http-addr -smtp-addr -vardumper-addr -monolog-addr -db -config, keeping events across restarts with -db, check with GET /api/version. For an AI agent: see /agent-setup. Update: since server 2.11.0 from the UI (Settings › About & updates, «Update to X»): binary on Linux/macOS downloads, checks ed25519-signed checksums.txt + sha256, probes --version, copies the DB (<file>.pre-<old>.bak), swaps (old kept as <name>.old), restarts; Docker/Kubernetes/read-only folder get the command; with auth off only when listening on 127.0.0.1 only (UPDATE_SELF=auto|on|off); in-memory DB loses events; Linux/macOS: DB copy, restart, rollback at once if the new version fails to start, on the next start after a crash; Windows: steps download/check/probe/swap only, no DB copy, no restart, no automatic rollback (put <name>.old back). By hand: rerun install.sh/install.ps1 (BUGGREGATOR_INSTALL_DIR), docker pull / compose pull, helm upgrade --set image.tag."
---

# Install the binary

Buggregator is one file. Download it, make it executable, run it. No Docker, no PHP, no database server.

> Setting it up with an AI agent (Claude Code, Cursor, Codex)? Give it [this page for agents](/agent-setup).

## 1. Download

### With the install script

**Linux and macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh | sh
```

It picks the file for your system and CPU, checks it against the release's `checksums.txt`, and puts it in
`~/.local/bin/buggregator`. No `sudo`. If `~/.local/bin` is not in your `PATH`, the script says so; then run
`~/.local/bin/buggregator`.

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/buggregator/server/master/scripts/install.ps1 | iex
```

It puts `buggregator.exe` in `%LOCALAPPDATA%\Programs\buggregator`.

Both scripts take these environment variables:

| Variable | What it does |
|----------|--------------|
| `BUGGREGATOR_VERSION` | a release tag, e.g. `v2.6.0`; default: the latest release |
| `BUGGREGATOR_INSTALL_DIR` | another folder for the binary |
| `BUGGREGATOR_NO_VERIFY=1` | skip the checksum; only for releases without `checksums.txt` (v2.5.0 and older) |

Example — a fixed version into `~/bin`:

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh \
  | BUGGREGATOR_VERSION=v2.6.0 BUGGREGATOR_INSTALL_DIR="$HOME/bin" sh
```

> The scripts and `checksums.txt` come with v2.6.0. To install v2.5.0 or older with the script, add
> `BUGGREGATOR_NO_VERIFY=1`.

### By hand

Pick the file for your system from the [latest release](https://github.com/buggregator/server/releases/latest):

| System | File |
|--------|------|
| Linux, x86-64 | `buggregator-linux-amd64` |
| Linux, ARM64 (Raspberry Pi 4/5, AWS Graviton) | `buggregator-linux-arm64` |
| macOS, Apple Silicon (M1 and later) | `buggregator-darwin-arm64` |
| macOS, Intel | `buggregator-darwin-amd64` |
| Windows, x86-64 | `buggregator-windows-amd64.exe` |
| Windows, ARM64 (since v2.6.0) | `buggregator-windows-arm64.exe` |

Not sure which one? Run `uname -m`: `x86_64` means amd64, `arm64` or `aarch64` means arm64.

Linux and macOS, e.g. Linux x86-64:

```bash
curl -fsSL -o buggregator https://github.com/buggregator/server/releases/latest/download/buggregator-linux-amd64
chmod +x buggregator
```

Windows:

```powershell
Invoke-WebRequest https://github.com/buggregator/server/releases/latest/download/buggregator-windows-amd64.exe -OutFile buggregator.exe
```

### Verify a download

Since v2.11.0, every release has a signed list of checksums. You can check two things by hand:

1. **The list is ours.** `checksums.txt.sig` is an ed25519 signature of `checksums.txt`, made with the Buggregator
   release key.
2. **Your file is the one in the list.** `checksums.txt` holds the SHA-256 of every file of the release.

Save the public key as `buggregator-release.pem`:

```text
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAbFthyZgjx8k7TUu4ZekM3sa0zSxSRzOTaX2BfxaUH2I=
-----END PUBLIC KEY-----
```

It is the same key the server uses to check an [update from the UI](#from-the-ui)
([`internal/selfupdate/verify.go`](https://github.com/buggregator/server/blob/master/internal/selfupdate/verify.go)).

Linux, e.g. x86-64 (needs OpenSSL 3.0 or newer):

```bash
base=https://github.com/buggregator/server/releases/download/v2.11.0
curl -fsSLO "$base/checksums.txt"
curl -fsSLO "$base/checksums.txt.sig"
curl -fsSLO "$base/buggregator-linux-amd64"

openssl pkeyutl -verify -pubin -inkey buggregator-release.pem -rawin \
  -in checksums.txt -sigfile checksums.txt.sig
# Signature Verified Successfully

grep ' buggregator-linux-amd64$' checksums.txt | sha256sum -c
# buggregator-linux-amd64: OK
```

macOS: the `openssl` that comes with macOS is LibreSSL. Use OpenSSL 3 from Homebrew (`brew install openssl@3`,
then `$(brew --prefix openssl@3)/bin/openssl` in place of `openssl`), and `shasum -a 256 -c` in place of
`sha256sum -c`.

Windows (PowerShell), for the checksum:

```powershell
$want = ((Select-String -Path checksums.txt -Pattern ' buggregator-windows-amd64.exe$').Line -split '\s+')[0]
$got = (Get-FileHash buggregator-windows-amd64.exe -Algorithm SHA256).Hash.ToLower()
if ($got -eq $want) { 'OK' } else { 'MISMATCH' }
```

The signature check on Windows needs OpenSSL 3 too; the command is the same.

If `openssl` prints `Signature Verification Failure`, or the checksum does not match, do not run the file.

The install scripts check the SHA-256 against `checksums.txt`, but not the signature of `checksums.txt`. Releases
v2.10.0 and older have no `checksums.txt.sig`.

### If your system blocks it

- **macOS.** A file downloaded with `curl` (or the script) is not blocked. A file downloaded in a browser is
  marked as from the internet, and macOS refuses to open it. Clear the mark once:
  `xattr -d com.apple.quarantine buggregator`. Or right-click the file → **Open**. The binary is not notarized
  by Apple.
- **Windows.** A file downloaded in a browser may show «Windows protected your PC». Click **More info → Run
  anyway**, or run `Unblock-File .\buggregator.exe` once.

## 2. Start

```bash
buggregator                 # installed with the script, ~/.local/bin in your PATH
~/.local/bin/buggregator    # installed with the script, not in PATH
./buggregator               # downloaded by hand
```

On Windows: `& "$env:LOCALAPPDATA\Programs\buggregator\buggregator.exe"` after the script, or `.\buggregator.exe`.

Open http://127.0.0.1:8000. The UI is empty until your app sends something.

To check from the command line:

```bash
curl http://127.0.0.1:8000/api/version
# {"version":"2.6.0"}
```

## 3. Point your app at it

Change one address in your app. Examples are on [Getting Started → Just change the address](/getting-started#just-change-the-address),
and each integration page has its own (for example [Sentry](/config/sentry) or [SMTP](/config/smtp)).

## Ports

| Port | What listens | Change it with |
|------|--------------|----------------|
| `8000` | Web UI, HTTP events (Sentry, Ray, Inspector, XHProf, HTTP dumps, SMS), mock server | `-http-addr` or `HTTP_ADDR` |
| `1025` | SMTP: captured emails | `-smtp-addr` or `SMTP_ADDR` |
| `9912` | VarDumper | `-vardumper-addr` or `VAR_DUMPER_ADDR` |
| `9913` | Monolog | `-monolog-addr` or `MONOLOG_ADDR` |
| `8080` | HTTP proxy | `PROXY_ADDR` |

If a port is already taken, Buggregator stops at start. The log names the port and says `address already in use`:
`failed to start HTTP server` for `8000`, `failed to start TCP servers` for the others. Example: another mail tool holds `1025`. Move
Buggregator's SMTP elsewhere:

```bash
./buggregator -smtp-addr :2525
```

## Listen only on this machine

By default every port listens on all network interfaces (`:8000`). Other machines on your network can then reach
the UI and your captured data. To keep it on your machine only:

```bash
./buggregator \
  -http-addr 127.0.0.1:8000 \
  -smtp-addr 127.0.0.1:1025 \
  -vardumper-addr 127.0.0.1:9912 \
  -monolog-addr 127.0.0.1:9913
```

Add `PROXY_ADDR=127.0.0.1:8080` in front for the HTTP proxy: it has no flag.

## Keep events after a restart

By default events live in memory: stopping Buggregator clears them. To keep them, give it a database file:

```bash
./buggregator -db ./buggregator.db
```

The file is created on the first start. More options: [Database](/config/database).

## More settings

Every setting is a flag, an environment variable or a line in `buggregator.yaml` (flags win over variables, variables
over the file). See [Server configuration](/config/server). Example: turn on the MCP server for AI assistants:

```bash
MCP_ENABLED=true ./buggregator
```

Then connect your assistant: [MCP](/config/mcp). On Windows, use the MCP HTTP transport
(`MCP_TRANSPORT=http MCP_ADDR=127.0.0.1:8001`): the default Unix socket path `/tmp/buggregator-mcp.sock` does not
exist there. Without `MCP_ADDR`, the MCP server listens on `:8001`, on all network interfaces, with no token.

## Update

### From the UI

Since server 2.11.0, Buggregator can update itself. When a new release is out, open
**Settings › About & updates**. **Check now** asks GitHub at once. What you see depends on how you run it:

| You run it as | What the UI offers |
|---------------|--------------------|
| The binary on Linux or macOS | the button **Update to &lt;version&gt;**: it downloads, installs and restarts by itself |
| The binary on Windows | the button **Update to &lt;version&gt;**: it replaces the program; then restart Buggregator yourself |
| Docker, Kubernetes, or a binary in a folder it cannot write to | the command to run, ready to copy |

**The button is there only when it is safe.** With no login ([SSO](/config/sso)) on, it shows only if the server
listens on this machine only, e.g. `-http-addr 127.0.0.1:8000`. The default, `:8000`, listens on every network
interface, so by default you get the command instead. Then also open the UI as `http://127.0.0.1:8000` or
`http://localhost:8000`, not by another name.

What the button does on Linux and macOS, step by step:

1. Downloads the file for your system from the latest release.
2. Checks it: the release's `checksums.txt` must carry a valid ed25519 signature (`checksums.txt.sig`), and the
   file's SHA-256 must match it.
3. Starts the new version once with `--version` to make sure it runs here.
4. Copies your database file next to it (`<file>.pre-<old version>.bak`).
5. Replaces the program. The old one stays next to it as `<name>.old`.
6. Restarts.

With the default in-memory database, all events are gone after the restart. The button then reads **Delete events
and update**.

**If the new version does not start** (Linux and macOS), Buggregator puts back the old program and the database copy at once. The UI
then shows «Rolled back from &lt;version&gt;», the error and the start-up log (**Copy log**). One case is slower: if the
new version crashes on its own before it is ready, the rollback happens on the **next** start. A supervisor that
restarts the service (e.g. systemd with `Restart=on-failure`) does that by itself; without one, start Buggregator
again by hand.

When the new version serves, the database copy is deleted.

**On Windows** the button does steps 1–3 and 5: it downloads, checks and tries the new version, then replaces the
program and keeps the old one as `buggregator.exe.old` (or `<name>.old`). It makes no database copy, does not
restart and has no automatic rollback. Restart Buggregator yourself. To go back, stop it and put the `.old` file
back in place of the program.

### By hand

Run the install script again with the same folder, then restart. With `-db`, your events stay.

```bash
curl -fsSL https://raw.githubusercontent.com/buggregator/server/master/scripts/install.sh | sh
```

```powershell
irm https://raw.githubusercontent.com/buggregator/server/master/scripts/install.ps1 | iex
```

Installed somewhere else? Set `BUGGREGATOR_INSTALL_DIR` to that folder.

Docker:

```bash
docker pull ghcr.io/buggregator/server:<version>
# or, with Docker Compose: change the tag in the file, then
docker compose pull && docker compose up -d
```

Kubernetes (Helm):

```bash
helm upgrade buggregator oci://ghcr.io/buggregator/helm-chart/buggregator --reset-then-reuse-values --set image.tag=<version>
```

`--reset-then-reuse-values` needs Helm 3.14+. The update notice of server 2.11.0 shows `--reuse-values`, which also keeps the old chart's defaults: see [Helm chart › Upgrade](/config/helm-chart#upgrade).

Which version runs now: `GET /api/version`, or, since server 2.11.0, `buggregator --version`.

### Turn it off

```bash
UPDATE_SELF=off ./buggregator
```

`UPDATE_SELF` (`update.self_update`, `--update-self`):

- `auto` (default): the button where it is safe, as above;
- `on`: the button also when the server listens on all interfaces without a login;
- `off`: no update from the UI.

With `UPDATE_CHECK_ENABLED=false` the server does not look for new releases, so the UI offers no update either.
