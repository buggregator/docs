---
llms_description: "OpenTelemetry (OTLP/HTTP) ingestion, since server 2.12.0: POST /v1/traces and /v1/logs on the main HTTP port (8000), also /api/<project>/integration/otlp/v1/traces|logs. Protobuf (default) or JSON (Content-Type application/json), gzip ok. No gRPC (4317), no metrics. OTel SDK: OTEL_EXPORTER_OTLP_ENDPOINT=http://buggregator:8000, OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf|http/json, project via OTEL_EXPORTER_OTLP_HEADERS=X-Buggregator-Project=<key>. Collector (any version): exporter otlphttp (otlp_http in new versions) endpoint http://buggregator:8000, optional headers X-Buggregator-Project, add to traces and logs pipelines; replaces the old sentry exporter dsn config; the new sentry exporter (url/org_slug/auth_token) is not supported. Project order: path segment > X-Buggregator-Event detection > X-Buggregator-Project header > Sentry DSN key; only existing projects, else default. Shown on the Sentry page: Traces (source label OTel, the trace's services chain; Service column in the span waterfall; filters ?source=otel|sentry and ?service=) and Logs (?source=); logs link to their trace; no cards in the main event feed. Mapping: service.name -> service, service.version -> release, deployment.environment(.name) -> environment, span status ERROR -> error, severity -> log level. Needs the sentry event type enabled."
---

# OpenTelemetry — Traces and logs

Your app already uses [OpenTelemetry](https://opentelemetry.io/) (OTel), the open standard for traces and logs. You
want to see those traces and logs locally, without Jaeger, Grafana or a cloud account. Buggregator accepts them over
OTLP, the protocol OTel uses to send data. Point your SDK or your Collector at Buggregator and the data shows up
next to your Sentry errors, dumps and emails.

Available since server 2.12.0.

## What it accepts

| | |
|---|---|
| Signals | **traces** and **logs** |
| Protocol | OTLP over HTTP, on the main port (`8000`) |
| Encoding | protobuf (the default) or JSON; gzip-compressed bodies too |
| Not supported | OTLP over gRPC (port `4317`), metrics |

Endpoints (`POST`):

| Path | Use |
|---|---|
| `/v1/traces`, `/v1/logs` | the standard OTLP paths: SDKs and the Collector add them to the base URL |
| `/api/<project>/integration/otlp/v1/traces`, `.../v1/logs` | the same, with the [project](#projects) in the path |

## OTel SDK

Any language. Set the standard OTel variables in your app's environment:

```dotenv
OTEL_SERVICE_NAME=checkout
OTEL_EXPORTER_OTLP_ENDPOINT=http://buggregator:8000
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
```

- `buggregator` is the host where Buggregator runs: the service name in Docker Compose, or `127.0.0.1` on your machine.
- `OTEL_EXPORTER_OTLP_PROTOCOL` must be `http/protobuf` or `http/json`. The default of some SDKs is `grpc`, which
  Buggregator does not accept.
- The service name you set is what the UI shows in the **Service** column.

## OpenTelemetry Collector

Send from the Collector with the `otlphttp` exporter. It works with any Collector version:

```yaml
exporters:
  otlphttp:
    endpoint: http://buggregator:8000
    # headers:
    #   X-Buggregator-Project: shop

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlphttp]
    logs:
      receivers: [otlp]
      exporters: [otlphttp]
```

Add `otlphttp` to the pipelines you already have; keep your receivers and processors. Newer Collector versions also
name this exporter `otlp_http`, and log a warning about the old name; both work.

### Coming from the `sentry` exporter

Did you send to Buggregator with the Collector's `sentry` exporter and a `dsn:`? That setup stopped working in
Collector contrib 0.145.0. Replace the `sentry` exporter with `otlphttp` as above.

The new `sentry` exporter (with `url`, `org_slug` and `auth_token`) is not supported yet.

## Projects

By default the data goes to the `default` project. To send it to another [project](/config/projects), use one of:

- **A header.** SDK: `OTEL_EXPORTER_OTLP_HEADERS=X-Buggregator-Project=shop`. Collector: `headers:` under the
  exporter, as in the example above.
- **The path.** `POST /api/shop/integration/otlp/v1/traces`.

If both are set, the path wins. The project must exist: an unknown name goes to `default`, and no new project is
created.

## Where you see it

On the **Sentry** page, next to the data from Sentry SDKs:

- **Traces**: one row per trace. A label shows where the data came from (**OTel** or **Sentry SDK**), next to the
  services the trace went through (`checkout → payments`). Open a trace to see its spans as a waterfall, with a
  **Service** column.
- **Logs**: each log with its level, service and attributes. A log written inside a span links to its trace.

OTel data creates no cards in the main event feed.

How OTel fields show up:

| OTel | In Buggregator |
|---|---|
| `service.name` (`OTEL_SERVICE_NAME`) | service |
| `service.version` | release |
| `deployment.environment.name` or `deployment.environment` | environment |
| span status `ERROR` | the span is an error |
| log severity | log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) |

The REST API filters by source and service:

```bash
curl 'http://127.0.0.1:8000/api/sentry/traces?source=otel&service=checkout'
curl 'http://127.0.0.1:8000/api/sentry/logs?source=otel'
```

`source` takes `otel` or `sentry`. More filters: [Sentry › Filters](/config/sentry#filters).

## Try it with curl

Send one span as JSON, timed now and lasting 150 ms:

```bash
start=$(date +%s)000000000
end=$(date +%s)150000000
curl -X POST http://127.0.0.1:8000/v1/traces \
  -H 'Content-Type: application/json' \
  -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"checkout"}}]},
  "scopeSpans":[{"spans":[{"traceId":"5b8efff798038103d269b633813fc60c","spanId":"eee19b7ec3c1b174",
  "name":"POST /checkout","kind":2,"startTimeUnixNano":"'$start'","endTimeUnixNano":"'$end'"}]}]}]}'
# {}
```

Open **Sentry → Traces**: the trace `POST /checkout` from the service `checkout` is there.

::: tip
OTLP is handled by the Sentry module. If you limit event types with `CLIENT_SUPPORTED_EVENTS`, keep `sentry` in the
list.
:::
