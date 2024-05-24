# Configuration — Metrics

Buggregator has a new feature that collects metrics on how many events we receive. This feature lets you use tools like
Prometheus and Grafana to check on event trends, find issues, and set up alerts.

This new feature will keep track of how many events Buggregator gets. It will sort these events by their types like
sentry, monolog, var-dumper, ray, inspector, http-dump, profiler, and smtp.

### How It Works

1. **Event Counting:** Each time an event is received, it’s counted and sorted into its type.
2. **Metric Updating:** The system updates the metrics to show the latest counts for each event type.

## Prometheus Endpoint

Buggregator has a built-in Prometheus friendly endpoint that you can use to collect metrics. Metrics are available at
`2112` port inside the container. To access the metrics outside the container, you need to expose the port.

```bash
docker run --pull always \
  ... \
  -p 2112:2112 \
  ghcr.io/buggregator/server:latest
```

> **Note:** Read more about server configuration [here](../getting-started.md).

After starting the server, you can access the metrics at `http://<server_address>:2112` address.

## Metric Format

Here is what the metric format looks like:

```plaintext
# HELP events The total number of received events.
# TYPE events counter
events{type="sentry"} 10
events{type="smtp"} 1
```

Each line shows how many events of a specific type we have received.

## Grafana Integration

You can use these metrics to make dashboards in Grafana. This helps you see the data in a way that makes sense for you.
We will provide steps on how to connect Buggregator’s metrics to Grafana.

### Setting Up Grafana

1. **Add Prometheus as a Data Source:** First, connect Prometheus (which has your Buggregator metrics) to Grafana.
2. **Create Dashboards:** Next, create dashboards in Grafana to show the metrics. You can make graphs and charts that
   help you understand the event trends.