# Configuration — Webhooks

Webhooks are a useful way to help Buggregator communicate in real-time with other applications when certain events
happen. This guide simplifies setting up and managing webhooks for enhancing automation and integration with other
tools.

This guide will help you understand how to set up and use webhooks.

### What is a Webhook?

A webhook allows applications to share information as soon as specific events occur. Unlike regular APIs that require
checking for updates periodically, webhooks provide this information automatically, saving time and resources.

### Why Use Webhooks in Buggregator?

- **Automate Tasks:** Automatically trigger actions in other services like [n8n](https://n8n.io/) when events happen in
  Buggregator.
- **Integrate with Other Tools:** Connect Buggregator with various tools like messaging apps, issue tracking software,
  or custom apps effortlessly.

## Docker Configuration

Currently, Buggregator does not have an admin interface for managing webhooks. Instead, you manage them through
configuration files within a Docker container.

**Here's how you can mount a volume containing webhook configurations:**

```bash
docker run --pull always \
  -v /path/to/webhooks:/app/runtime/configs \
  ghcr.io/buggregator/server:latest
```

or using `docker-compose`:

```yaml
buggregator-server:
  ...
  volumes:
    - /path/to/webhooks:/app/runtime/configs
```

## Configuring a Webhook

Place each webhook configuration in a YAML file within the `runtime/configs` directory. Each configuration file should
contain one webhook setup.

Here’s what a typical webhook configuration looks like in a YAML file `sentry.webhook.yaml`:

```yaml
webhook:
  event: sentry.received
  url: http://example.com/webhook
  headers:
    Content-Type: application/json
    Secret-Key: my-secret-key
  verify_ssl: false
  retry_on_failure: true
```

> **Note:** The webhook configuration file name should have the following pattern: `<name>.webhook.yaml` or `<name>.webhook.yml`.

**Key Components of a Webhook Configuration:**

- **Event:** The specific event in Buggregator that will trigger the webhook.
- **URL:** Where the webhook sends data.
- **Headers:** Any additional headers needed for the webhook request.
- **Verify SSL:** Choose whether to check SSL certificates during the webhook call.
- **Retry on Failure:** If the webhook should retry sending data if the first attempt fails. (3 retries with exponential
  backoff)

> **Note:** You can test webhooks using tools like https://webhook.site.

### Types of Events Supported:

Buggregator can currently handle the following events:

- `sentry.received`
- `monolog.received`
- `var-dumper.received`
- `ray.received`
- `inspector.received`
- `http-dump.received`
- `profiler.received`
- `smtp.received`