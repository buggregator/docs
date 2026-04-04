---
llms_description: "HTTP forward proxy on port 8080 with MITM for HTTPS. Captures full request+response pairs (method, URL, headers, body, status code, timing) as http-dump events. Clients set proxy URL and disable SSL verification. Works with any language: PHP Guzzle (proxy+verify), Go (http.Transport Proxy+InsecureSkipVerify), JavaScript fetch/axios (https-proxy-agent), Python requests (proxies+verify), curl (-x -k), env vars (HTTP_PROXY/HTTPS_PROXY). UI shows response body with JSON tree view, HTML preview, syntax highlighting."
---

# HTTP Proxy — Request & Response Capture

Your app calls external APIs — payment gateways, webhooks, third-party services — and you need to see both what
you send **and** what you get back. Buggregator's HTTP proxy sits between your app and the internet, capturing
full request/response pairs without changing your application code. Just point your HTTP client at the proxy.

> **Looking for one-way request capture?** See [HTTP Dumps](/config/http-dumps) — it captures incoming requests
> without proxying to a real server.

## Use cases

- **API debugging** — see exactly what your app sends to Stripe, Twilio, or any external API, and what comes back.
- **Webhook testing** — send webhooks through the proxy to inspect both the outgoing payload and the remote server's response.
- **Response inspection** — view response bodies with syntax highlighting (JSON, HTML, XML) and an interactive JSON tree view.
- **Performance monitoring** — see response times for every external call your app makes.
- **No code changes** — configure the proxy at the HTTP client level; your application logic stays untouched.

## What you see in the UI

Proxied requests appear as HTTP dump events with additional data:

- **Full URL** — the complete destination URL including host and port.
- **Request and response** — headers, body, and status code for both directions.
- **Status code** — color-coded badge (green for 2xx, amber for 4xx, red for 5xx).
- **Response time** — duration in milliseconds.
- **Proxy label** — purple badge to distinguish proxied requests from regular HTTP dumps.
- **Response body viewer** — JSON tree view with collapsible nodes, HTML preview in a sandboxed iframe, syntax highlighting for XML/CSS/JS.
- **Tab navigation** — Response, Request, and Raw tabs on the detail page.

## Configuration

The proxy listens on port **8080** by default. Configure it via environment variable or config file:

```dotenv
PROXY_ADDR=:8080
```

```yaml
# buggregator.yaml
tcp:
  proxy:
    addr: ":8080"
```

In Docker Compose, expose the port:

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - "8000:8000"   # UI + API
      - "8080:8080"   # HTTP Proxy
```

## Client setup

Point your HTTP client at `http://<buggregator-host>:8080` as a proxy. For HTTPS traffic, disable SSL certificate
verification — the proxy uses an in-memory CA to intercept TLS connections. This is safe for development.

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `buggregator`).

### PHP — Guzzle

```php
use GuzzleHttp\Client;

$client = new Client([
    'proxy' => 'http://127.0.0.1:8080',
    'verify' => false,
]);

$response = $client->get('https://api.example.com/users');
```

### PHP — Laravel HTTP Client

```php
use Illuminate\Support\Facades\Http;

$response = Http::withOptions([
    'proxy' => 'http://127.0.0.1:8080',
    'verify' => false,
])->get('https://api.example.com/users');
```

To configure globally for all HTTP calls in development, add a macro in `AppServiceProvider`:

```php
// app/Providers/AppServiceProvider.php
use Illuminate\Support\Facades\Http;

public function boot(): void
{
    if ($this->app->isLocal()) {
        Http::globalOptions([
            'proxy' => env('BUGGREGATOR_PROXY_URL', 'http://127.0.0.1:8080'),
            'verify' => false,
        ]);
    }
}
```

```dotenv
BUGGREGATOR_PROXY_URL=http://buggregator:8080
```

### PHP — Symfony HttpClient

```php
use Symfony\Component\HttpClient\HttpClient;

$client = HttpClient::create([
    'proxy' => 'http://127.0.0.1:8080',
    'verify_peer' => false,
    'verify_host' => false,
]);

$response = $client->request('GET', 'https://api.example.com/users');
```

### Go

```go
import (
    "crypto/tls"
    "net/http"
    "net/url"
)

proxyURL, _ := url.Parse("http://127.0.0.1:8080")

client := &http.Client{
    Transport: &http.Transport{
        Proxy:           http.ProxyURL(proxyURL),
        TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
    },
}

resp, err := client.Get("https://api.example.com/users")
```

### JavaScript / Node.js — fetch

```js
import { ProxyAgent } from 'undici'

const agent = new ProxyAgent({
  uri: 'http://127.0.0.1:8080',
  requestTls: { rejectUnauthorized: false },
})

const response = await fetch('https://api.example.com/users', {
  dispatcher: agent,
})
```

### JavaScript / Node.js — axios

```js
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'

const agent = new HttpsProxyAgent('http://127.0.0.1:8080', {
  rejectUnauthorized: false,
})

const response = await axios.get('https://api.example.com/users', {
  httpsAgent: agent,
})
```

### Python — requests

```python
import requests

response = requests.get(
    'https://api.example.com/users',
    proxies={'https': 'http://127.0.0.1:8080'},
    verify=False,
)
```

### Python — httpx

```python
import httpx

client = httpx.Client(
    proxy='http://127.0.0.1:8080',
    verify=False,
)

response = client.get('https://api.example.com/users')
```

### curl

```bash
curl -x http://127.0.0.1:8080 -k https://api.example.com/users
```

### Environment variables (any language)

Most HTTP clients respect standard proxy environment variables:

```bash
export HTTP_PROXY=http://127.0.0.1:8080
export HTTPS_PROXY=http://127.0.0.1:8080
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Node.js only

# Then run your app normally
node app.js
python main.py
go run .
```

> **Note:** `NODE_TLS_REJECT_UNAUTHORIZED=0` disables TLS verification globally for Node.js processes.
> Use it only in development.

## How it works

1. Your app sends a request to the proxy (`http://127.0.0.1:8080`).
2. For HTTPS, the proxy performs a CONNECT handshake, generates a TLS certificate for the target host on the fly
   (signed by an in-memory CA), and establishes a TLS connection with your app.
3. The proxy forwards the request to the real destination server.
4. The full request and response are captured and stored as an `http-dump` event with a `proxy: true` flag,
   response data, and timing information.
5. The event appears in the Buggregator UI in real time via WebSocket.

The in-memory CA is generated at server startup and never written to disk. Your client skips certificate
verification (`InsecureSkipVerify`, `verify: false`, `-k`), so no CA installation is required.

## Docker Compose example

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - "8000:8000"
      - "8080:8080"

  app:
    build: .
    environment:
      BUGGREGATOR_PROXY_URL: http://buggregator:8080
    depends_on:
      - buggregator
```
