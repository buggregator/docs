---
llms_description: "Request timeline, since server 2.14.0: the Request tab of a Sentry trace (/sentry/traces/<id>, default view; others Waterfall, Flame graph, Call graph, Sequence) shows everything one request did on one time scale, in lanes: request, SQL queries, cache, logs, errors, HTTP dumps, outgoing calls, mail, jobs, views, other. Summary on top (e.g. 23 queries · 41 ms, 2 logs · 1 error). 5+ identical spans of a lane collapse into one block. N+1 hint: server finds 5+ identical normalized SQL queries in one transaction, trace API field n_plus_one [{transaction_id, query, count, total_ms, origin, span_ids}]; origin (file:line) only when the SDK sends it (sentry-laravel: queries over SENTRY_TRACE_SQL_ORIGIN_THRESHOLD_MS, default 100; set 0 on dev; lazy relations still have none). Linked by trace id (GET /api/events?trace=<id>&window=all): Monolog extra.trace_id/context.trace_id, mails with X-Trace-Id/sentry-trace/traceparent header (app adds it), HTTP dumps with sentry-trace/traceparent (Laravel Http:: adds it); plus the trace's Sentry errors and logs. Ray and VarDumper are not linked. Needs tracing on (SENTRY_TRACES_SAMPLE_RATE=1.0)."
---

# Request Timeline

One page shows everything a single request did, in order: SQL queries, cache calls, logs, mails, outgoing calls,
jobs and errors. It also spots the classic N+1 problem: the same query run again and again.

Example: `GET /posts` is slow. Open its trace and see 23 queries, 20 of them the same `select * from users where id
= ?`, next to the log lines and the mail this request sent.

> Available since server `2.14.0`. It builds on [Sentry](./sentry.md) traces: your app needs the Sentry
> SDK with tracing on.

## Set it up

1. Send traces to Buggregator. In Laravel, `.env`:

   ```dotenv
   SENTRY_LARAVEL_DSN=http://sentry@127.0.0.1:8000/1
   SENTRY_TRACES_SAMPLE_RATE=1.0
   # show the file and line of every query, not only of slow ones
   SENTRY_TRACE_SQL_ORIGIN_THRESHOLD_MS=0
   ```

2. Open **Sentry → Traces** and click a trace. The **Request** tab opens first.

That is enough for queries, cache, outgoing calls and jobs. To see logs and mails on the same scale, add the trace
id to them, as shown [below](#logs-mails-and-http-dumps).

## What is on the page

- **Summary** at the top, for example `23 queries · 41 ms`, `2 logs · 1 error`, `1 mail`. Parts with errors are red.
- **Lanes**, one per kind, from top to bottom: **Request**, **Queries**, **Cache**, **Logs**, **Dumps** (HTTP dumps),
  **Errors**, **HTTP out** (outgoing calls), **Mail**, **Jobs**, **Views**, **Other**. Each item sits at the moment it
  happened.
- The **Jobs** lane shows jobs the request queued. Each job's own attempts are on the [Queue Jobs](./queues.md) page.
- **Repeats in one block.** Five or more identical items in a lane, under the same parent span, are drawn as
  one block marked `×N`.
- **List** under the lanes: every item by time. Click one to see its details on the right; a log, mail or HTTP dump
  links to its own page. On a phone, only the list is shown.

The other tabs (**Waterfall**, **Flame graph**, **Call graph**, **Sequence**) are still there.

## N+1 hint

When one request runs the same SQL query five or more times, the page shows a hint above the timeline:

> **N+1** 20 identical queries `select * from users where id = ?` took 4.2 ms, from `app/Http/Controllers/PostController.php:31`.
> Load them in one query (eager loading).

**Show the queries** selects them on the timeline. Queries count as the same when only their numbers, strings and
`IN (…)` lists differ: `where id = 1` and `where id = 2` are one query.

The file and line show only when the SDK sends them. sentry-laravel sends them for queries slower than
`SENTRY_TRACE_SQL_ORIGIN_THRESHOLD_MS` (100 ms by default), so set it to `0` on your dev machine. Even then, queries
from lazy-loaded relations such as `$post->user` often come without a place in the code.

## Logs, mails and HTTP dumps

Buggregator puts other events on the timeline when they carry the same trace id:

| Event | Where the trace id comes from |
|-------|-------------------------------|
| [Monolog](./monolog.md) log | `extra.trace_id` or `context.trace_id`: add a processor, see [Logs screen](./logs.md#all-lines-of-one-request) |
| [Email](./smtp.md) | A `X-Trace-Id`, `sentry-trace` or `traceparent` header. Mailers send none: your app adds it |
| [HTTP dump](./http-dumps.md) | A `sentry-trace` or `traceparent` header. Laravel's `Http::` client adds it by itself when Sentry tracing is on |

Sentry errors and Sentry logs of the trace are shown too. Ray and VarDumper events are not linked.

Add the header to a mail in Laravel:

```php
use Illuminate\Mail\Mailables\Headers;
use Sentry\SentrySdk;

public function headers(): Headers
{
    $traceId = SentrySdk::getCurrentHub()->getSpan()?->getTraceId();

    return new Headers(text: $traceId ? ['X-Trace-Id' => (string) $traceId] : []);
}
```

## API

```bash
# the trace, with the N+1 findings
curl 'http://127.0.0.1:8000/api/sentry/traces/9a015591dbdd4332bede451901fb0040'
# "n_plus_one": [{"transaction_id": "…", "query": "select * from users where id = ?", "count": 6,
#                 "total_ms": 3, "origin": null, "span_ids": ["…"]}]

# logs, mails and HTTP dumps of the same request
curl 'http://127.0.0.1:8000/api/events?trace=9a015591dbdd4332bede451901fb0040&window=all'
```

`n_plus_one` is always a list, most repeated query first; it is empty when nothing repeats five times. The `trace`
parameter works like the other [feed filters](./feed-filters.md).

## Limits

- Only Monolog logs, mails and HTTP dumps are linked by trace id. Mails and HTTP dumps stored before the upgrade are
  not.
- The logs lane shows the first page of the trace's Sentry logs. The **Related logs** tab has all of them.
