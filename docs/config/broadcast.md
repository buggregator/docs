---
llms_description: "Broadcast events (Pusher / Laravel Reverb / soketi server API), since server [version: to fill]: event type broadcast. Buggregator answers POST /apps/{app_id}/events and /apps/{app_id}/batch_events on the HTTP port 8000 (any path prefix; signed requests only: auth_key + auth_signature in the query, else http-dump). One event per broadcast (batch: shared batch_id). Config: broadcast.upstream / BROADCAST_UPSTREAM (empty = capture only, app gets {}, browsers get nothing), broadcast.apps [{key,secret}] / BROADCAST_APPS=key:secret,... (signature check valid|invalid|not_checked). Forward: request sent unchanged (signature stays valid), 5 s timeout, app gets upstream answer; upstream down → 502, card kept with upstream.error; loop guard X-Buggregator-Forwarded → 508; credentials in upstream URL and secret never shown. Laravel: REVERB_HOST/REVERB_PORT/REVERB_SCHEME=http (keep VITE_REVERB_* on real Reverb) or PUSHER_HOST/PUSHER_PORT/PUSHER_SCHEME. Project: X-Buggregator-Event: broadcast + X-Buggregator-Project, or broadcast:<project>@host; app id is not a project. Not stored: terminate_connections; GET channel queries not answered; encrypted channel data not decrypted. Off: modules.broadcast: false or CLIENT_SUPPORTED_EVENTS. API GET /api/events?type=broadcast."
---

# Broadcast Events (Pusher, Laravel Reverb)

Your app pushes live updates to the browser through Laravel Reverb, Pusher or soketi: «order shipped», «new
message». When the browser shows the wrong thing, you want to see what the server actually sent. Buggregator
pretends to be the broadcast server's HTTP API, so every event your backend broadcasts shows up in Buggregator with
its channel and data.

It can also pass each event on to your real Reverb or Pusher server, so the browser keeps getting live updates.

Available since server `[version: to fill]`.

## How it works

Your backend sends each broadcast as an HTTP request to the broadcast server (`POST /apps/<app-id>/events`). Point
those requests at Buggregator instead:

- **Capture only** (the default). Buggregator stores the event and answers «ok». Browsers get nothing, so live
  updates stop while the app points at Buggregator.
- **Capture and forward.** Set `upstream` to your real server. Buggregator stores the event, sends the same request on,
  and gives your app the real server's answer. Browsers keep working.

Only the server side changes. The browser still connects to the real Reverb or Pusher over WebSocket; Buggregator
does not speak that protocol.

## Setup

### Laravel Reverb

In `.env`, point the server-side settings at Buggregator, and keep the browser settings on the real Reverb:

```dotenv
BROADCAST_CONNECTION=reverb

# Server side: where Laravel sends broadcasts
REVERB_HOST=127.0.0.1
REVERB_PORT=8000
REVERB_SCHEME=http

# Browser side: the real Reverb (the default .env copies these from REVERB_*)
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

Older Laravel apps use `BROADCAST_DRIVER` instead of `BROADCAST_CONNECTION`.

### Laravel with Pusher

```dotenv
BROADCAST_CONNECTION=pusher
PUSHER_HOST=127.0.0.1
PUSHER_PORT=8000
PUSHER_SCHEME=http
```

### Pusher SDK

Any server SDK of Pusher works: set the host to Buggregator, port `8000`, no TLS. Node.js:

```js
const Pusher = require('pusher')

const pusher = new Pusher({
  appId: '1001', key: 'app-key', secret: 'app-secret',
  host: '127.0.0.1', port: '8000', useTLS: false,
})

await pusher.trigger('orders', 'OrderShipped', { id: 42 })
```

Without `upstream`, any app id, key and secret work.

### Forward to the real server

```yaml
broadcast:
  upstream: http://127.0.0.1:8080   # your real Reverb or Pusher server
```

Or `BROADCAST_UPSTREAM=http://127.0.0.1:8080`.

- Keep your real app id, key and secret in the app. Buggregator sends the request unchanged, so the real server
  accepts the signature.
- Buggregator waits up to 5 seconds for the real server. Your app gets the real server's answer.
- When the real server cannot be reached, your app gets `502` with the reason, and the event is still stored.
- Pointed `upstream` at Buggregator itself by mistake? It notices the loop and answers `508` instead of sending the
  event around forever.
- A user name and password in the `upstream` address are not shown in the UI. The app secret is never stored.

### Check the signature

List your apps, and Buggregator checks each event's signature with the secret:

```yaml
broadcast:
  apps:
    - key: app-key
      secret: app-secret
```

Or `BROADCAST_APPS=app-key:app-secret,other-key:other-secret`. The event then says `valid`, or `invalid` with a
warning. Events from keys not in the list say `not_checked`.

Environment variables win over the file; `BROADCAST_APPS` replaces the whole `apps` list.

## What you see

**Broadcast** in the menu opens a channel console:

- On the left, every channel that got events, with its kind (public, private, presence, encrypted) and the number
  of events. Type in **Filter channels** to find one, or pick **All channels**.
- On the right, the events of that channel, newest or oldest first: time, event name, size, payload.
- Open an event to see its payload, what **Changed** since the previous event of the same name on that channel,
  who sent it and to whom, the signature result and, when forwarding, the real server's answer. **Copy as cURL**
  gives the request to send it again.

A feed card for a broadcast opens the console on that event.

Each broadcast is one `broadcast` event: its name, channels (public, private, presence, encrypted or user), data,
the socket id, the signature result and, when forwarding, the real server's status and time. A batch
(`triggerBatch`) gives one event per item, marked with the same batch.

Buggregator adds warnings for data over 10 KB, more than 100 channels, no channel, data that is not JSON, and a
signature that does not match.

API: `GET /api/events?type=broadcast`.

## Projects

Events go to the `default` project. To send them to another [project](/config/projects), add both headers
`X-Buggregator-Event: broadcast` and `X-Buggregator-Project: shop`, or put the project in the address:
`http://broadcast:shop@127.0.0.1:8000`. The app id does not choose the project.

## Limits

- Only signed `POST` requests are broadcasts. A `POST` without `auth_key` and `auth_signature` is stored as an
  [HTTP dump](/config/http-dumps).
- Channel queries (`GET /apps/<id>/channels`) are not answered. With `upstream` set, send them to the real server.
- Closing a user's connections (`terminateUserConnections`) is passed on or answered, but not stored.
- Data on encrypted channels is stored as sent; Buggregator cannot decrypt it.
- Turn it off with `modules.broadcast: false` in `buggregator.yaml`, or leave `broadcast` out of
  `CLIENT_SUPPORTED_EVENTS`.
