---
llms_description: "Webhook configuration in buggregator.yaml. Fields: event (type filter or '*' for all), url, headers, verify_ssl, retry. Supported event types: sentry, ray, var-dump, inspector, monolog, smtp, sms, http-dump, profiler, or '*' for all. Retry up to 3 times with exponential backoff. Delivery tracking via API."
---

# Configuration — Webhooks

Webhooks allow Buggregator to send HTTP POST notifications to external services when events are received.
This enables integration with tools like [n8n](https://n8n.io/), Slack, PagerDuty, or any custom endpoint.

## Why Use Webhooks?

- **Automate Tasks:** Automatically trigger actions in other services when events happen in Buggregator.
- **Integrate with Other Tools:** Connect Buggregator with messaging apps, issue tracking software, or custom apps.

## Configuration

Webhooks are configured in `buggregator.yaml`:

```yaml
webhooks:
  - event: "*"                          # Fire on any event type
    url: https://slack.example.com/webhook
    headers:
      Authorization: "Bearer token123"
    verify_ssl: false
    retry: true

  - event: sentry                       # Fire only on Sentry events
    url: https://pagerduty.example.com/alert

  - event: smtp                         # Fire only on SMTP events
    url: https://my-app.example.com/email-hook
```

**Fields:**

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `event` | Yes | — | Event type to trigger on, or `"*"` for all events |
| `url` | Yes | — | URL to send the POST request to |
| `headers` | No | — | Additional HTTP headers to include |
| `verify_ssl` | No | `false` | Whether to verify SSL certificates |
| `retry` | No | `true` | Retry up to 3 times with exponential backoff on failure |

### Supported Event Types

- `sentry`
- `monolog`
- `var-dump`
- `ray`
- `inspector`
- `http-dump`
- `profiler`
- `smtp`
- `sms`
- `*` (all events)

### Webhook Payload

Each webhook sends a JSON payload with the following structure:

```json
{
  "uuid": "event-uuid",
  "type": "sentry",
  "payload": { ... },
  "timestamp": 1234567890.123,
  "project": "default"
}
```

## Docker Examples

### Docker Compose

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
    volumes:
      - ./buggregator.yaml:/buggregator.yaml
```

With `buggregator.yaml`:

```yaml
webhooks:
  - event: "*"
    url: https://hooks.slack.com/services/xxx
    headers:
      Content-Type: application/json
```

### Docker Run with Config File

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -v ./buggregator.yaml:/buggregator.yaml \
  ghcr.io/buggregator/server:latest
```

> **Tip:** You can test webhooks using tools like https://webhook.site.

## Delivery Tracking

Buggregator tracks every webhook delivery attempt. You can view the delivery history for each webhook via the API,
including the response status code and payload. This helps you diagnose issues when webhooks fail to reach their
destination.
