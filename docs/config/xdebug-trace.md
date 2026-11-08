---
llms_description: "Xdebug function traces (since server [version: to fill]): record with xdebug.mode=trace and xdebug.trace_format=1 (required; other formats → 400 «not an Xdebug trace in the computer-readable format: set xdebug.trace_format=1»), upload the file over HTTP: POST / with header X-Buggregator-Event: xdebug-trace (or DSN user xdebug-trace@host), body = the .xt or .xt.gz file as is; optional headers X-Buggregator-Project, X-Buggregator-Trace-Url, X-Buggregator-Trace-Name; answer {\"status\":true}. Config xdebug_trace.max_upload (XDEBUG_TRACE_MAX_UPLOAD, 100MB, request body; larger → 400), max_size (XDEBUG_TRACE_MAX_SIZE, 256MB uncompressed read; rest not read, summary.truncated true), keep (XDEBUG_TRACE_KEEP, 20; oldest unpinned deleted first), modules.xdebug-trace (default on). Files: storage.path/xdebug-traces in filesystem mode, a temp dir otherwise; deleted with the event. HTTP API GET /api/xdebug-traces/{uuid}/summary, /tree?parent=&from=&limit=, /search?q=&from=&limit= (limit default 200, max 1000)."
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
  (`0`, `2`) with `400`.
- **`xdebug.start_with_request`** says which requests are traced. `trigger` traces only a request with the
  `XDEBUG_TRIGGER` cookie, query or POST parameter (or env variable for a CLI script). `yes` traces every request.
- **`xdebug.output_dir`** is where Xdebug writes the files. The default is `/tmp`.

Optional:

- **`xdebug.collect_return=1`** adds return values.
- **`xdebug.collect_assignments=1`** adds variable assignments.
- **`xdebug.use_compression`** (Xdebug 3.1+, on when Xdebug has gzip support) writes `.xt.gz` files. Send them as they
  are: Buggregator reads gzip itself.

Arguments of each call are always in the trace in Xdebug 3. There is no setting for it.

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

Buggregator answers `{"status":true}` and stores the trace as an event.

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

Errors come back as `400` with a plain-text reason:

| Reason | Fix |
|--------|-----|
| `not an Xdebug trace in the computer-readable format: set xdebug.trace_format=1` | Record again with `xdebug.trace_format=1` |
| `xdebug-trace: upload is larger than … bytes (xdebug_trace.max_upload)` | Raise `max_upload`, or send the `.gz` file |

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
- Otherwise (the default, `memory`): in a temporary folder, removed when Buggregator exits.

Deleting the trace event deletes its files.

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
| `GET /api/xdebug-traces/{uuid}/tree?parent=&from=&limit=` | One level of calls: the top level without `parent`, or the calls made by the call at byte offset `parent`. `next` is the `from` of the next page |
| `GET /api/xdebug-traces/{uuid}/search?q=&from=&limit=` | Calls that match `q` (at most 256 bytes) |

`limit` is 200 by default, 1000 at most. A bad number gives `400`; an unknown trace gives `404`.
