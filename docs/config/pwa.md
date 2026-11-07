---
llms_description: "Installable app (PWA, since frontend 1.35.0 / server v2.6.0): the Buggregator UI can be installed as a desktop app from the browser; it opens in its own window and shows a new-events badge on the app icon (Badging API, Chromium on Windows and macOS). Install is offered only on https:// or localhost / 127.0.0.1. No service worker, no offline mode, no notifications."
---

# Installable App (PWA)

You can install the Buggregator UI as an app. It then opens in its own window, without browser tabs and the
address bar, and has its own icon in the dock or taskbar. When new events arrive while the window is in the
background, the icon shows how many.

> Available since frontend 1.35.0, bundled with server v2.6.0.

## Install

1. Open Buggregator in Chrome or Edge, e.g. `http://127.0.0.1:8000`.
2. Click the install icon at the end of the address bar, or choose **Install Buggregator** in the browser menu.
3. The app opens in its own window. Next time, start it like any other app.

Other browsers may offer it in their own way, for example Safari's **Add to Dock** on macOS.

### When the browser does not offer to install

Browsers offer installation only on `https://` or on `localhost` / `127.0.0.1`. Over plain `http` with a LAN
address or a host name, there is no install option.

| Address | Install offered |
|---------|-----------------|
| `http://127.0.0.1:8000` | yes |
| `http://localhost:8000` | yes |
| `https://buggregator.example.com` | yes |
| `http://192.168.1.10:8000` | no |
| `http://buggregator:8000` | no |

If you run Buggregator in Docker, publish the port on your machine (`-p 127.0.0.1:8000:8000`) and open
`http://127.0.0.1:8000`.

## New-events badge

Each event of the current project that arrives while the app window is hidden or not focused adds one to the
number on the app icon. When you focus the window, the number is cleared.

The badge works in Chromium-based browsers (Chrome, Edge) on Windows and macOS. Elsewhere the app works, but
shows no number.

## What it does not do

- No offline mode: the app needs a running Buggregator server.
- No system notifications.
