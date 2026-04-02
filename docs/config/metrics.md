---
llms_description: "Prometheus metrics: enable via METRICS_ENABLED=true. Serve on main HTTP server at /metrics or on a separate address via METRICS_ADDR. Event counters by type (sentry, monolog, var-dumper, ray, inspector, http-dump, profiler, smtp). HTTP request metrics, WebSocket connection gauges, TCP server status. Grafana integration."
---

# Configuration — Metrics

Buggregator collects metrics on how many events it receives. This feature lets you use tools like
Prometheus and Grafana to check on event trends, find issues, and set up alerts.

The metrics system keeps track of how many events Buggregator receives, sorted by their types:
sentry, monolog, var-dumper, ray, inspector, http-dump, profiler, and smtp. HTTP request metrics,
WebSocket connection gauges, and webhook delivery attempts are also tracked.

### How It Works

1. **Event Counting:** Each time an event is received, it's counted and sorted into its type.
2. **Metric Updating:** The system updates the metrics to show the latest counts for each event type.

## Enabling Metrics

Metrics are disabled by default. Enable them via environment variable or config file:

```bash
METRICS_ENABLED=true
```

Or in `buggregator.yaml`:

```yaml
metrics:
  enabled: true
```

## Prometheus Endpoint

There are two ways to expose the Prometheus endpoint:

### Option 1: On the Main HTTP Server (Default)

When `METRICS_ADDR` is not set, metrics are served at `/metrics` on the main HTTP server (port 8000 by default):

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -e METRICS_ENABLED=true \
  ghcr.io/buggregator/server:latest
```

Access metrics at `http://127.0.0.1:8000/metrics`.

### Option 2: On a Separate Server

For production environments where you want to keep metrics on a separate port:

```yaml
metrics:
  enabled: true
  addr: ":9090"
```

Or via environment variable:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:9090:9090 \
  -e METRICS_ENABLED=true \
  -e METRICS_ADDR=:9090 \
  ghcr.io/buggregator/server:latest
```

Access metrics at `http://127.0.0.1:9090/metrics`.

## Metric Format

Here is what the metric format looks like:

```plaintext
# HELP events The total number of received events.
# TYPE events counter
events{type="sentry"} 10
events{type="smtp"} 1
```

Each line shows how many events of a specific type have been received.

## Grafana Integration

You can use these metrics to make dashboards in Grafana. This helps you see the data in a way that makes sense for you.

### Setting Up Grafana

1. **Add Prometheus as a Data Source:** First, connect Prometheus (which scrapes your Buggregator metrics) to Grafana.
2. **Create Dashboards:** Next, create dashboards in Grafana to show the metrics. You can make graphs and charts that
   help you understand the event trends.
