---
llms_description: "Xdebug function traces (since server [version: to fill]): record with xdebug.mode=trace and xdebug.trace_format=1 (required; other formats → 400 «not an Xdebug trace in the computer-readable format: set xdebug.trace_format=1»), upload the file over HTTP: POST / with header X-Buggregator-Event: xdebug-trace (or DSN user xdebug-trace@host), body = the .xt or .xt.gz file as is; optional headers X-Buggregator-Project, X-Buggregator-Trace-Url, X-Buggregator-Trace-Name; answer {\"status\":true}. Config xdebug_trace.max_upload (XDEBUG_TRACE_MAX_UPLOAD, 100MB, request body; larger → 400), max_size (XDEBUG_TRACE_MAX_SIZE, 256MB uncompressed read; rest not read, summary.truncated true), keep (XDEBUG_TRACE_KEEP, 20; oldest unpinned deleted first), modules.xdebug-trace (default on). Files: storage.path/xdebug-traces in filesystem mode, a temp dir otherwise; deleted with the event. UI: sidebar «Xdebug traces», tabs «Call tree» (search, args) and «Slowest & top». HTTP API GET /api/xdebug-traces/{uuid}/summary, /tree?parent=&from=&limit= (next page: from=next with the same parent), /search?q=&from=&limit= (results carry path = callers top-down); limit default 200, max 1000. A .xt.gz is decompressed from the start on every tree/search request (slow on big traces). Memory storage: files in $TMPDIR (Windows %TEMP%)/buggregator-xdebug-traces-<pid> (dirs of dead pids removed at start), gone after a restart, events without a file dropped at start; containers sharing one /tmp need their own TMPDIR. MCP tools (mcp.enabled): xdebug_traces {project?, limit? 20/100}, xdebug_trace_summary {uuid}, xdebug_trace_calls {uuid, parent?, from?, query?, limit? 50/200; next → from=next, same parent; query hits carry path}, xdebug_trace_call {uuid, offset} → {call, callees (first 50), parent, from, truncated}; more callees: xdebug_trace_calls with that parent and from; args/returns cut to 512 bytes, 20 args."
---

# Xdebug Trace — Record Every Function Call

An Xdebug function trace lists every function call of one PHP request: what was called, from which file and line,
how long it took and how much memory it used. You record the trace with Xdebug and send the file to Buggregator.
Buggregator stores it, sums it up and lets you walk the calls as a tree and search them.

Example: a page takes two seconds. The trace shows that 1.6 seconds of it went to one repository method, called
400 times in a loop.

Available since server [version: to fill]. You send the file over HTTP. Buggregator does not pick up trace files from
a folder by itself.

## Record a trace

Turn on tracing in `php.ini` (or with `-d` flags, see below):

```ini
xdebug.mode=trace
xdebug.trace_format=1
xdebug.start_with_request=trigger
xdebug.output_dir=/tmp/traces
```

- **`xdebug.mode=trace`** turns tracing on. You can combine it with other modes, e.g. `xdebug.mode=debug,trace`.
- **`xdebug.trace_format=1`** is required. It is the computer-readable format. Buggregator refuses the other formats
  (`0`, `2`, `3`, `4`) with `400`.
- **`xdebug.start_with_request`** says which requests are traced. `trigger` traces only a request with the
  `XDEBUG_TRIGGER` cookie, query or POST parameter (or env variable for a CLI script). `yes` traces every request.
- **`xdebug.output_dir`** is where Xdebug writes the files. The default is `/tmp`.

Optional:

- **`xdebug.collect_return=1`** adds return values.
- **`xdebug.collect_assignments=1`** adds variable assignments.
- **`xdebug.use_compression`** (Xdebug 3.1+, on when Xdebug has gzip support) writes `.xt.gz` files. Send them as they
  are: Buggregator reads gzip itself.

Arguments are in the trace by default; `xdebug.collect_params=0` leaves them out. Buggregator reads both.

For one CLI script, pass the settings as flags:

```bash
php -d xdebug.mode=trace -d xdebug.trace_format=1 -d xdebug.start_with_request=yes \
    -d xdebug.output_dir=/tmp/traces bin/console app:import
```

## Send the trace to Buggregator

Post the file as the request body:

```bash
curl -H 'X-Buggregator-Event: xdebug-trace' \
     --data-binary @/tmp/traces/trace.1234567890.xt.gz \
     http://127.0.0.1:8000/
```

Buggregator answers `200` with `{"status":true}` and stores the trace as an event. The answer has no event id.

Instead of the header, you can put the type in the address: `http://xdebug-trace@127.0.0.1:8000/`.

Optional headers:

| Header | What it does |
|--------|--------------|
| `X-Buggregator-Project` | Puts the trace into this project |
| `X-Buggregator-Trace-Url` | The request you traced, e.g. `GET /checkout`. Kept with the trace |
| `X-Buggregator-Trace-Name` | A name for the trace, e.g. `slow checkout` |

Example with all of them:

```bash
curl -H 'X-Buggregator-Event: xdebug-trace' \
     -H 'X-Buggregator-Project: shop' \
     -H 'X-Buggregator-Trace-Url: GET /checkout' \
     -H 'X-Buggregator-Trace-Name: slow checkout' \
     --data-binary @/tmp/traces/trace.1234567890.xt.gz \
     http://127.0.0.1:8000/
```

Errors come back as `400` with a plain-text reason. No file is left behind.

| Reason | Fix |
|--------|-----|
| `not an Xdebug trace in the computer-readable format: set xdebug.trace_format=1` | Record again with `xdebug.trace_format=1` |
| `xdebug-trace: upload is larger than 104857600 bytes (xdebug_trace.max_upload)` (the number is your limit) | Raise `max_upload`, or send the `.gz` file |

## In the UI

Traces have their own page: **Xdebug traces** in the sidebar. Each card shows the duration, peak memory, number of
calls and depth. A **cut** badge means the trace hit the size limit or has no end.

Open a trace to see two tabs:

- **Call tree.** The calls, one level at a time: click the arrow (▸) next to a call to see the calls it made. A long level ends with
  **Show more calls**. The **args** button, on calls that have them, shows the arguments and return value. Search with **Find a
  function or file**, e.g. `PDO->query`; click a hit and the tree opens down to it.
- **Slowest & top.** **Top self-time** lists functions by the time spent in their own code, callees left out.
  **Slowest calls** lists single calls by their time with callees.

## Limits and storage

```yaml
xdebug_trace:
  max_upload: ${XDEBUG_TRACE_MAX_UPLOAD:100MB}
  max_size: ${XDEBUG_TRACE_MAX_SIZE:256MB}
  keep: ${XDEBUG_TRACE_KEEP:20}
```

| Setting | Env variable | Default | What it limits |
|---------|--------------|---------|----------------|
| `max_upload` | `XDEBUG_TRACE_MAX_UPLOAD` | `100MB` | The request body, as sent (gzip or not). A larger upload is refused with `400`. |
| `max_size` | `XDEBUG_TRACE_MAX_SIZE` | `256MB` | How much of the unpacked trace Buggregator reads. A longer trace is cut there and marked as cut. |
| `keep` | `XDEBUG_TRACE_KEEP` | `20` | How many traces are kept. A new trace past this number deletes the oldest ones. Pinned traces are never deleted. |

Sizes take a number of bytes or a `KB`, `MB`, `GB` suffix (1 KB = 1024 bytes). A value that is not a size falls back
to the default and logs a warning.

**Where the files live.** Buggregator keeps each file as you sent it, gzip or not:

- `storage.mode: filesystem`: in `xdebug-traces/` under `storage.path` (default `./storage/xdebug-traces`). They
  stay after a restart, as long as the database does.
- Otherwise (the default, `memory`): in a temporary folder. The files are gone after a restart. If the database is
  a file (`DATABASE_DSN`), Buggregator drops those trace events at start, because their files are gone.
  The folder is `buggregator-xdebug-traces-<pid>` in the system temp folder (`TMPDIR` on Linux and macOS, else `/tmp`; `%TEMP%` on Windows). At start,
  Buggregator removes such folders left by processes that are no longer running, e.g. after a crash.
  **Several containers share one `/tmp` volume?** Give each its own `TMPDIR`. Each container's server is usually
  process 1, so they would all use the same folder and remove each other's traces at start. The `TMPDIR` folder
  must exist: Buggregator also unpacks its VarDumper parser there, and with a missing folder it does not start.
  With the VarDumper module off, it starts, but the trace module stays off and logs an error. Example: `-v /tmp/buggregator-a:/srv/tmp -e TMPDIR=/srv/tmp`.

Deleting the trace event deletes its files.

**Gzip or plain.** Buggregator reads a `.xt.gz` file from its start on every tree or search request. On a big gzip
trace, opening a deep call can take seconds. If that matters, send the trace unpacked (`xdebug.use_compression=0`),
or keep traces small.

**Turn the module off:**

```yaml
modules:
  xdebug-trace: false
```

## HTTP API

For scripts and agents. Same auth as the rest of `/api`.

| Route | Returns |
|-------|---------|
| `GET /api/xdebug-traces/{uuid}/summary` | File info and the summary: calls, user calls, depth, duration, peak memory, top functions by own time, slowest calls, `truncated` |
| `GET /api/xdebug-traces/{uuid}/tree?parent=&from=&limit=` | One level of calls: the top level without `parent`, or the calls made by the call at byte offset `parent`. `next` is the `from` of the next page; send it with the same `parent` |
| `GET /api/xdebug-traces/{uuid}/search?q=&from=&limit=` | Calls that match `q` (at most 256 bytes). Each result has `path`: its callers, top-down |

`limit` is 200 by default, 1000 at most. A bad number gives `400`; an unknown trace gives `404`.

A summary of a small trace (`top` and `slowest` cut to fit here). Times are seconds, memory is bytes:

```json
{
  "compressed": true,
  "file": "90494b42-e565-4f2e-889f-ea1245ac2916.xt.gz",
  "name": "",
  "size": 251,
  "summary": {
    "xdebug_version": "3.4.5",
    "file_format": 4,
    "start": "2026-11-08 10:00:00.000001",
    "end": "2026-11-08 10:00:00.010201",
    "end_time": 0.0102,
    "end_memory": 419000,
    "calls": 3,
    "user_calls": 2,
    "max_depth": 3,
    "duration": 0.0102,
    "peak_memory": 452000,
    "assignments": 0,
    "returns": false,
    "truncated": false,
    "main": "/app/index.php",
    "top": [
      {"func": "PDO->query", "user": false, "count": 1, "self": 0.0094, "incl": 0.0094}
    ],
    "slowest": [
      {"nr": 0, "func": "{main}", "file": "/app/index.php", "line": 0, "level": 1, "start": 0.0001, "incl": 0.01,
       "self": 0.00020000000000000052, "memory": 20000, "offset": 71}
    ],
    "index": [{"nr": 0, "offset": 71, "level": 1}]
  },
  "url": ""
}
```

`top` is by time spent in the function itself (`self`), `slowest` by time including callees (`incl`). `offset` is
what you pass as `parent` to `tree`.

## MCP tools

With [MCP](/config/mcp) on (`mcp.enabled: true`), an AI assistant can read traces itself:

| Tool | Arguments | Returns |
|------|-----------|---------|
| `xdebug_traces` | `project`, `limit` (20, max 100) | Traces, newest first: `uuid`, project, name, url, script, duration (s), peak memory (bytes), calls, depth, `truncated` |
| `xdebug_trace_summary` | `uuid` | Totals, the 20 functions with the most self time, the 20 slowest calls with their `offset` |
| `xdebug_trace_calls` | `uuid`, `parent`, `from`, `query`, `limit` (50, max 200) | No `parent`: top-level calls. `parent=<offset>`: its direct callees. A non-null `next`: call again with `from=next` and the same `parent`. `query`: calls whose function or file contains the text (case ignored), each with `path` (callers, top-down) |
| `xdebug_trace_call` | `uuid`, `offset` | One call (arguments, return value, incl/self time, memory change) and its first 50 direct callees. A non-null `from`: get the rest with `xdebug_trace_calls` and the `parent` and `from` of this answer |

Arguments and return values are cut to 512 bytes each, at most 20 arguments per call.

A typical path: `xdebug_traces` → `xdebug_trace_summary` → `xdebug_trace_call` on the `offset` of a slow call →
`xdebug_trace_calls` to go deeper. Example question to the assistant: «Why is the last trace slow?»
