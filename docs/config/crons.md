---
llms_description: "Cron monitoring, since server [version: to fill]: scheduled jobs report runs via Sentry Crons check-ins (check_in envelope item to the usual DSN; monitor_config upserts the monitor) or the Sentry cron HTTP endpoint GET|POST /api/{project}/cron/{slug}/{key}/?status=in_progress|ok|error&check_in_id=&duration=<sec> (202), or the ping URL GET|POST /ping/<slug> (ok), /ping/<slug>/start (in_progress), /ping/<slug>/fail (error); body = job output, last 10 KB kept; query schedule (crontab only), tz, margin, max_runtime (minutes), project (or X-Buggregator-Project), check_in_id, environment; answer 200 OK + X-Check-In-Id; first ping creates the monitor, max 500 per project (429). Slug [A-Za-z0-9._-]{1,128}. Schedules: crontab (5 fields or @daily…, no @every/TZ=) or interval; timezone IANA default UTC; checkin_margin default 1 min, max_runtime 30 min. Server-made statuses: missed (slot + margin passed, no check-in; not while a run is in progress; one row for several slots), timeout (in_progress longer than max_runtime), unknown (slot while the server was down; file DB only); checker every 30 s. UI: Sentry → Crons (/sentry/crons: status, schedule, last/next run, last 20 runs, Needs attention, Filter jobs) and a job page (/sentry/crons/<slug>: runs, output, ping URLs). No alerts/webhooks; WebSocket sentry.stored kinds [cron]; no feed cards. API: GET /api/crons, GET /api/crons/{slug}/checkins, PUT /api/crons/{slug}, DELETE /api/crons/{slug}. Clearing Sentry data keeps monitors, drops runs. Needs a file DB (-db) to keep data across restarts."
---

# Cron Monitoring

Did last night's backup run? Is the queue cleanup stuck? Your scheduled jobs report each run to Buggregator, and it
shows which runs went fine, which failed, which never started and which never finished. Locally, without a Sentry
account.

Available since server `[version: to fill]`.

A job reports in one of two ways:

- **Sentry Crons**: the job already uses a Sentry SDK; it sends check-ins to the usual DSN.
- **A ping URL**: any script calls `curl` when it starts and when it ends.

The first report creates the job (a «monitor»). No setup in Buggregator.

::: tip
Start Buggregator with a database file (`-db buggregator.db` or `DATABASE_DSN`). The default database lives in
memory, so jobs and their runs are gone after a restart.
:::

## Sentry Crons

Point the SDK at Buggregator as usual ([Sentry](/config/sentry)), then use its cron monitoring.

Laravel:

```php
$schedule->command('report:nightly')->dailyAt('03:00')->sentryMonitor();
```

Python:

```python
from sentry_sdk.crons import monitor

@monitor(monitor_slug='nightly-report', monitor_config={
    'schedule': {'type': 'crontab', 'value': '0 3 * * *'},
    'timezone': 'Europe/Berlin',
    'checkin_margin': 5,
    'max_runtime': 30,
})
def nightly_report():
    ...
```

The schedule and limits the SDK sends update the job on every run.

Scripts without an SDK can call Sentry's cron HTTP endpoint the same way:

```bash
curl "http://127.0.0.1:8000/api/1/cron/nightly-report/sentry/?status=in_progress"
# {"id":"faa0e9526330486cba530a9cdcc4b28e"}
curl "http://127.0.0.1:8000/api/1/cron/nightly-report/sentry/?status=ok&check_in_id=faa0e9526330486cba530a9cdcc4b28e&duration=2.5"
```

## Ping URL

Three addresses per job:

| Address | Means |
|---|---|
| `/ping/<job>/start` | the run started |
| `/ping/<job>` | the run finished fine |
| `/ping/<job>/fail` | the run failed |

`GET` or `POST`, no login. A `POST` body is kept as the run's output (the last 10 KB).

```bash
B=http://127.0.0.1:8000
curl -fsS "$B/ping/backup/start?schedule=0+2+*+*+*&tz=Europe/Berlin"
if ./backup.sh > out.log 2>&1; then
  curl -fsS -X POST --data-binary @out.log "$B/ping/backup"
else
  curl -fsS -X POST --data-binary @out.log "$B/ping/backup/fail"
fi
```

Options in the query:

| Option | What it sets |
|---|---|
| `schedule` | crontab, e.g. `0+2+*+*+*` (a `+` is a space) |
| `tz` | time zone, e.g. `Europe/Berlin`; default UTC |
| `margin` | minutes a run may be late before it counts as missed; default 1 |
| `max_runtime` | minutes a run may take before it counts as hung; default 30 |
| `project` | the [project](/config/projects); or the header `X-Buggregator-Project` |
| `check_in_id` | which run a finish belongs to (the start answers it in the `X-Check-In-Id` header) |
| `environment` | e.g. `staging` |

A job name may have letters, digits, `.`, `_` and `-`, up to 128 characters.

## Missed and hung runs

Buggregator checks every 30 seconds and adds runs of its own:

| Status | When |
|---|---|
| `missed` | the run was due (schedule + margin) and nothing came. Several missed runs in a row make one entry |
| `timeout` | a run started and did not finish within `max_runtime` |
| `unknown` | the run was due while Buggregator itself was not running (only with a database file) |

The job's own reports are `in_progress`, `ok` and `error`. A job without a schedule is never marked missed.

Schedules: crontab with 5 fields or names like `@daily`, or an interval from the Sentry SDK (every N minutes, hours,
days…). `@every` and `TZ=` inside the crontab are not supported.

## Where you see it

**Sentry → Crons** lists your jobs: status, schedule, last and next run, and a strip of the last 20 runs. Jobs
that failed, hung, missed a run or are running late come first, under **Needs attention**; a button shows only those. Type in
**Filter jobs** to find one. Times are shown in each job's time zone, and the page updates by itself.

Open a job for its run history: status, start, duration and the output it sent. For a ping job, **Ping URLs of this job** gives
the `curl` commands to copy. With no jobs yet, the tab shows how to set one up.

Runs make no cards in the event feed. The same data through the API:

| Request | Gives |
|---|---|
| `GET /api/crons?project=<key>` | jobs, each with its last 20 runs |
| `GET /api/crons/<job>/checkins?project=<key>` | the runs of one job, with status, time, duration and output |
| `PUT /api/crons/<job>?project=<key>` | change the schedule, time zone, margin or max runtime |
| `DELETE /api/crons/<job>?project=<key>` | delete the job and its runs |

A change with `PUT` lasts until the job sends its own settings again: from its Sentry SDK, or a ping with
`schedule`, `tz`, `margin` or `max_runtime`.

Clearing Sentry data deletes the runs and keeps the jobs with their settings.

## Limits

- No alerts: a missed run shows up in Buggregator, nobody is notified.
- At most 500 jobs per project.
- A ping sets only a crontab schedule; intervals come from the Sentry SDK.
- Margin and max runtime are whole minutes. A status may appear up to 30 seconds late.
