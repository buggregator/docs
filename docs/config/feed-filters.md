---
llms_description: "Feed filters, since server 2.14.0: narrow the event feed by machine (host), environment (env), user, Monolog channel (channel), level, release, Sentry/profiler tag (tag=name:value) and trace id (trace). API: same query params on GET /api/events and /api/events/preview; repeat a param = OR, different params = AND, prefix not. excludes (not.host=ci-1; events without that field stay). Levels match in any case. GET /api/events/facets?<same params> → {data:{host:[{value,count}],tag:feature:[…]},keys:[…]}: up to 50 values per key, most frequent first, a key's counts ignore its own filter. Values come from: Sentry server_name, environment, release, user (email > username > id > ip), level, logger as channel, tags; Monolog channel, level_name, extra.hostname (HostnameProcessor), extra/context trace_id; Ray/Inspector/profiler hostname, Inspector user, profiler tags; VarDumper request host (none for CLI); HTTP dumps Host header, sentry-trace/traceparent; SMTP trace header only. Limit: a tag name containing ':' cannot be filtered. Events stored before the upgrade are indexed in the background. UI: '+ Add filter' above the feed, Enter include, Shift+Enter exclude, filters in the URL. MCP: events_list host/env/user/channel/level/release/tag/trace/exclude_host, events_facets."
---

# Feed Filters

One Buggregator for the whole team gets busy fast. Feed filters show only the events you care about: your machine,
one environment, one user, one Monolog channel or one tag.

Example: five developers and a CI runner send to the same server. Pick `host = anna-mbp`, and the feed shows only
Anna's events.

> Available since server `2.14.0`.

## Filter the feed in the UI

1. Click **+ Add filter** above the feed.
2. Pick a field: Host, Environment, User, Monolog channel, Level, Release or a tag. The list shows which SDKs send
   each field and how many values it has.
3. Pick a value. Each value shows how many events have it. **Enter** keeps the matching events, **Shift+Enter** hides
   them (the chip shows `=` or `≠`). You can also type a value nobody has sent yet.

The filters go into the page address, for example `?host=ci-runner-3`. Send that link to a colleague, and they see the
same feed. **Copy link** and **Clear** sit at the right of the filter bar.

New events that do not match are not added to the feed. The bar counts them instead: «N new events arrived and are
hidden by this filter.»

## Which events have which fields

A filter only finds events that carry the field. Your app does not need any new setup for most of them: the SDKs
already send these values.

| Field         | Where it comes from                                                                                         |
|---------------|-------------------------------------------------------------------------------------------------------------|
| `host`        | Sentry `server_name`; Ray, Inspector and profiler hostname; Monolog `extra.hostname`; VarDumper and HTTP dumps: the host of the request |
| `env`         | Sentry `environment`                                                                                        |
| `user`        | Sentry `user`: email, else username, else id, else IP; Inspector user                                       |
| `channel`     | Monolog channel; Sentry `logger`                                                                            |
| `level`       | Monolog level name; Sentry level                                                                            |
| `release`     | Sentry `release`                                                                                            |
| `tag`         | Sentry tags; profiler tags                                                                                  |
| `trace`       | Trace id: Monolog `extra.trace_id` or `context.trace_id` (see [Logs screen](./logs.md), [Request timeline](./request-timeline.md)); mails and HTTP dumps with a `sentry-trace` or `traceparent` header (mails also `X-Trace-Id`) |

Some things to know:

- **Monolog sends no machine name by default.** Add `HostnameProcessor`, and logs get a `host`:

  ```php
  use Monolog\Processor\HostnameProcessor;

  $logger->pushProcessor(new HostnameProcessor());
  ```

- **VarDumper** has no machine name. Buggregator takes the host of the HTTP request the dump was made in. Dumps from
  the command line have no host.
- **Emails, SMS, CSP reports, broadcast events and HTML pages** have no filter fields, except the trace id of an email.
- Levels match in any case: `level=error` also finds Monolog `ERROR`.

## Filter through the API

Use the same parameters on `GET /api/events` and `GET /api/events/preview`:

```bash
# events from one machine
curl 'http://127.0.0.1:8000/api/events?host=web-1'

# web-1 or web-2, only in staging
curl 'http://127.0.0.1:8000/api/events?host=web-1&host=web-2&env=staging'

# everything except the CI runner
curl 'http://127.0.0.1:8000/api/events?not.host=ci-runner-3'

# a Sentry tag, written as name:value
curl 'http://127.0.0.1:8000/api/events?tag=feature:checkout'
```

- The same parameter twice means «either value». Different parameters mean «both». In the second example: (web-1 or
  web-2) and staging.
- `not.` before any parameter hides the matching events. Events that do not have that field at all stay in the feed.
  For example, `not.host=ci-runner-3` keeps Monolog logs without a host.
- Filters work together with `type` and `project`, for example `?type=sentry&host=web-1`.

### List the values

`GET /api/events/facets` returns the values you can filter by, with event counts:

```bash
curl 'http://127.0.0.1:8000/api/events/facets?project=default'
```

```json
{
  "data": {
    "host": [
      {"value": "web-1", "count": 2},
      {"value": "web-2", "count": 1},
      {"value": "ci-runner-3", "count": 1}
    ],
    "tag:feature": [
      {"value": "checkout", "count": 1}
    ]
  },
  "keys": ["host", "tag:feature"]
}
```

- Up to 50 values per field, the most frequent first. Tags come as `tag:<name>`.
- It takes the same filters as the feed. A field's own filter does not narrow its own counts. Example: with
  `host=web-1` set, `host` still lists every machine, so you can switch to another one.
- On a large database the call can take a second or so. Each event in `/api/events/preview` and in the live feed
  already carries its `facets`, so a client can count new events itself.

## Ask from an AI assistant

The [MCP](./mcp.md) tool `events_list` takes the same filters: `host`, `env`, `user`, `channel`, `level`, `release`,
`tag` (as `name:value`), `trace` and `exclude_host`. The tool `events_facets` lists the values with counts.

Example prompt: «Show the last errors from web-1 in staging».

## Limits

- A tag whose name contains `:` cannot be filtered: Buggregator cuts `tag=` at the first `:`. A `:` in the value is
  fine, for example `tag=url:https://shop.test/a`.
- After an upgrade, events stored before it are indexed in the background, about 1,400 events per second. They join
  the filters as they are indexed.
