---
llms_description: "Queue jobs, since server [version: to fill]: Sentry › Queues tab (/sentry/queues; job page /sentry/queues/<id>) lists the jobs your queue worker ran, built from Sentry queue.process transactions (sentry-laravel queue tracing: one transaction per attempt). Attempts are grouped into one job by messaging.message.id (Laravel job UUID); attempt number = messaging.message.retry.count + 1; queue = messaging.destination.name, connection = messaging.destination.connection; latency_ms = messaging.message.receive.latency (laravel seconds ×1000). Job status = last attempt: Done, Retried (ok after >1 attempts), Failed (last attempt not ok). Job page: headline (e.g. Failed after 3 attempts), Dispatched from (request whose queue.publish span has the same message id, same trace), Attempts on a time scale with pauses, exception per attempt (Sentry error of the attempt's trace in its time span), Trace of attempt #N, Details (Job, Message ID, Queue, Connection, Project, Payload: not sent by Sentry). Setup: SENTRY_TRACES_SAMPLE_RATE=1, SENTRY_TRACE_QUEUE_ENABLED=true, published config/sentry.php must read it ('queue_job_transactions'); sync driver jobs not shown; restart worker. API: GET /api/sentry/queues/jobs (queue, job, status=ok|failed|retried, from/to/window, project, page/limit; {data, meta{total,page,limit}}), GET /api/sentry/queues/summary (default window 1h: jobs, failed, retried, attempts, avg_duration_ms, queues[{queue,jobs,failed}]), GET /api/sentry/queues/jobs/{id} (message id or transaction id; attempt_list[] with gap_ms, latency_ms, errors[]; dispatched_by{transaction_id,trace_id,transaction_name,start_ts} or null). MCP tool queue_jobs. Limits: no running jobs (an attempt arrives when it ends), failed-will-retry and failed-for-good look the same, no job payload, Buggregator does not retry jobs, standalone span-v2 queue.publish gives no dispatched_by."
---

# Queue Jobs

The **Queues** tab shows the jobs your queue worker ran: which failed, how many attempts they took, how long they ran
and waited, and which request queued them.

Example: a `SendReport` job sends no mail at first. Open it and see three attempts on one time line, about
11 seconds apart: two failed with `RuntimeException: SMTP connection refused`, the third worked. A link leads to
`/reports/send`, the request that queued the job.

> Available since server `[version: to fill]`. It builds on [Sentry](./sentry.md) traces: your app needs the Sentry
> SDK with tracing on. Tested with sentry-laravel 4.31.

## Set it up

1. Send traces to Buggregator and turn on queue job tracing. In Laravel, `.env`:

   ```dotenv
   SENTRY_LARAVEL_DSN=http://sentry@127.0.0.1:8000/1
   SENTRY_TRACES_SAMPLE_RATE=1
   SENTRY_TRACE_QUEUE_ENABLED=true
   ```

2. If your app has a published `config/sentry.php`, check that it reads the variable:

   ```php
   'tracing' => [
       'queue_job_transactions' => env('SENTRY_TRACE_QUEUE_ENABLED', true),
       // ...
   ],
   ```

   A published config may have `false` as the default there. Then nothing shows until you set the variable.

3. Restart the queue worker (`php artisan queue:restart`), so it reads the new settings.

4. Open **Sentry → Queues**. A job shows up when its attempt ends.

Jobs on the `sync` driver do not show: they run inside the request, not on a worker. Their spans are still on the
request's [Request timeline](./request-timeline.md), in the **Jobs** lane.

The **Queues** tab appears once there is at least one job in the period you picked. Before that, open `http://127.0.0.1:8000/sentry/queues`:
the page shows the same setup steps under **How to set up**.

## What is on the page

### Job list

- **Tiles** at the top, for the period you picked: **jobs**, **failed**, **retried** (jobs with more than one
  attempt, failed ones included) and **average duration**.
- **Queue** filter: **All** or one queue, with the number of jobs. It shows when there is more than one queue.
- **Status** filter: **All** or **Failed only**.
- **Table** with the columns **Job**, **Status**, **Queue**, **Attempts**, **Duration** and **Finished**. **Job** is
  the class name, for example `SendReport` with `App\Jobs` under it. **Attempts** says `3`, with `2 failed` under it when
  some attempts failed. **Duration** is the last attempt's, with a bar against the slowest job on the page.
- **Status** is the status of the job's last attempt:

  | Status | Meaning |
  |--------|---------|
  | ✓ **Done** | Finished on the first attempt |
  | ↻ **Retried** | Finished after more than one attempt |
  | ✕ **Failed** | The last attempt failed |

Click a row to open the job.

### Job page

- **Headline**: the status in words, for example **Failed after 3 attempts** or **Done after 2 attempts**, plus the
  queue and connection.
- **Dispatched from**: a link to the trace of the request that queued the job, for example `/reports/send`. It needs
  that request's trace in Buggregator. Without it the page says «not known: the trace that queued it is not stored
  here».
- **Tiles**: **attempts**, **last attempt took**, **waited in the queue** (time from queuing to start) and
  **first started**.
- **Attempts**, oldest first. With two or more attempts, a time scale shows each attempt as a bar and the pauses
  between them, for example an 11 s pause before a retry. Under it, each attempt has its number, status, duration, wait
  time, the exception it threw (click it to open the error) and a **Trace of attempt #N** link.
- **Details**: **Job** (full class name), **Message ID** (the job's UUID), **Queue**, **Connection**, **Project** and
  **Payload** («Sentry does not send the job payload»).

How attempts become one job: sentry-laravel sends one transaction per attempt, with the job's UUID in
`messaging.message.id`. Buggregator puts attempts with the same UUID together. The attempt number comes from
`messaging.message.retry.count`.

## API

```bash
# jobs, newest first
curl 'http://127.0.0.1:8000/api/sentry/queues/jobs?window=all'
# {"data": [{"id": "99529e42-5137-4e2a-903b-e6a536167173", "job": "App\\Jobs\\SendReport",
#            "queue": "reports", "connection": "database", "status": "ok", "failed": false,
#            "attempts": 3, "failed_attempts": 2, "retried": true, "duration_ms": 349, "latency_ms": 10,
#            "started_at": "2026-11-22T10:40:21.28Z", "finished_at": "2026-11-22T10:40:44.33Z",
#            "message_id": "99529e42-…", "trace_id": "9a015591…", "transaction_id": "9c1b807d-…",
#            "project": "default"},
#           {"id": "852e5b1c-…", "job": "App\\Jobs\\ResizeImage", "queue": "images", "attempts": 1, …}],
#  "meta": {"total": 2, "page": 1, "limit": 50}}

# totals for the tiles; the last hour when no period is given
curl 'http://127.0.0.1:8000/api/sentry/queues/summary'
# {"jobs": 2, "failed": 0, "retried": 1, "attempts": 4, "avg_duration_ms": 334.8,
#  "queues": [{"queue": "images", "jobs": 1, "failed": 0}, {"queue": "reports", "jobs": 1, "failed": 0}]}

# one job: by its message id (or a transaction id, for a job without one)
curl 'http://127.0.0.1:8000/api/sentry/queues/jobs/99529e42-5137-4e2a-903b-e6a536167173'
# {"id": "99529e42-…", "job": "App\\Jobs\\SendReport", "status": "ok", "attempts": 3, "failed_attempts": 2, …,
#  "attempt_list": [
#    {"attempt": 1, "status": "internal_error", "failed": true, "duration_ms": 420, "latency_ms": 1240,
#     "gap_ms": null, "trace_id": "9a015591…", "transaction_id": "5400451f-…",
#     "errors": [{"id": "bff1bff3…", "exception_type": "RuntimeException",
#                 "exception_value": "SMTP connection refused", "event_ts": "2026-11-22T10:40:21.69Z"}]},
#    {"attempt": 2, "status": "internal_error", "failed": true, "duration_ms": 390, "gap_ms": 10879, "errors": [{…}]},
#    {"attempt": 3, "status": "ok", "failed": false, "duration_ms": 349, "gap_ms": 11010, "errors": []}],
#  "dispatched_by": {"transaction_name": "/reports/send", "trace_id": "9a015591…",
#                    "transaction_id": "66adfe11-…", "start_ts": "2026-11-22T10:40:20.08Z"}}
```

Parameters of `/api/sentry/queues/jobs`:

| Parameter | Example | What it does |
|-----------|---------|--------------|
| `status` | `failed` | `ok`, `failed` or `retried` (more than one attempt). Other values: error 400 |
| `queue` | `reports` | One queue |
| `job` | `App\Jobs\SendReport` | One job class, exact name (URL-encode the `\`) |
| `window`, `from`, `to` | `window=1h` | Period of the last attempt, as on the other Sentry lists |
| `project` | `default` | One project |
| `page`, `limit` | `limit=20` | Paging, 50 per page by default |

`/api/sentry/queues/summary` takes the same `queue`, `job`, period and `project` parameters.

AI agents can read the same data through the [MCP](./mcp.md) tool `queue_jobs`.

## Limits

- **No running jobs.** Sentry sends an attempt when it ends, so a job shows up only after its first attempt finishes.
- **Failed for good or retried later looks the same.** **Failed** means the last attempt failed. Sentry does not say
  whether the worker will try again.
- **No job payload.** Sentry does not send the job's data, only its class, queue and UUID.
- **Buggregator does not retry jobs.** Your queue worker runs retries; Buggregator shows them.
- **Dispatched from** needs the dispatching request's trace with its `queue.publish` span. A job queued from a
  console command or another app that does not send traces here has no link.
