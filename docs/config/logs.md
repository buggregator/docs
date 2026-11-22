---
llms_description: "Logs screen (/logs, sidebar «Logs»), since server 2.14.0: all Monolog records as one stream. Search q= (every word as a substring, any case; message, channel, context and extra keys and values, first 4 KB; words of 1-2 letters: case-insensitive for ASCII only), level and channel filters with counts, time window (default last hour, window=all), per-minute chart, live stream with pause, expandable row with context/extra, «All lines of this request» by trace id (extra.trace_id or context.trace_id, set by an app processor) and «This trace in Sentry». URL keeps the view: ?q=&level=&channel=&window=&trace=. API: GET /api/events/preview?type=monolog&q=&level=&channel=&trace=&window=; GET /api/events/facets?type=monolog (level, channel, trace counts); GET /api/events/histogram?type=monolog&bucket=60 → {bucket,data:[{t,count,levels}]}, empty buckets omitted, at most 1440 buckets (bucket grows, read it from the answer). Search index ≈500 bytes per log line. MCP events_list query + trace."
---

# Logs Screen

The Logs screen shows every Monolog record as one stream, like `tail -f` with search. Find the line you need,
see how many errors came in the last minutes, and open all lines of the same request.

> Available since server `2.14.0`. Logs come from the [Monolog](./monolog.md) integration: set it up
> first.

Open **Logs** in the sidebar, or go to `http://127.0.0.1:8000/logs`.

## What is on the screen

- **Search.** Type words, and only lines that contain every word stay. Upper or lower case does not matter. The
  search looks in the message, the channel, and the keys and values of `context` and `extra`. The found words are
  highlighted.
- **Levels.** One chip per level with the number of lines, for example `error 12`. All are on at the start. Click a
  chip to hide or show its level. To see only errors, turn the other levels off.
- **Channel.** Pick one or more Monolog channels: `payments`, `db`, `cache`…
- **Time.** The last hour by default. Pick another period, up to **All time**.
- **Chart.** Lines per minute, colored by level (wider bars for long periods). A spike of red bars is a burst of errors.
- **Live stream with pause.** New lines appear as they come. Press pause to read in peace. The screen then counts
  what came in: «3 new lines while paused (1 match)». **Show them** adds them and goes on.
- **Line details.** Click a line to open its `context` and `extra`.

The page address keeps the view, for example
`/logs?q=order+failed&level=error&channel=payments&window=3h`. Send it to a colleague, and they see the same lines.

## All lines of one request

When a line has a trace id, its details show two links:

- **All lines of this request** shows only the lines with the same trace id, over all time.
- **This trace in Sentry** opens the request's trace, if your app also sent it to [Sentry](./sentry.md). There the
  [Request timeline](./request-timeline.md) shows the log next to the queries, mails and errors of the same request.

Buggregator reads the trace id from `extra.trace_id` or `context.trace_id`. Monolog does not add it by itself: add
a processor in your app. With the Sentry PHP SDK and Monolog 3:

```php
use Monolog\LogRecord;
use Sentry\SentrySdk;

$logger->pushProcessor(function (LogRecord $record): LogRecord {
    $span = SentrySdk::getCurrentHub()->getSpan();
    if ($span !== null) {
        $record->extra['trace_id'] = (string) $span->getTraceId();
    }

    return $record;
});
```

Without a trace id, everything else on the screen works; the two links are just not there.

## API

The screen uses the same API as the feed. Examples:

```bash
# lines with both words, errors and warnings only
curl 'http://127.0.0.1:8000/api/events/preview?type=monolog&q=card+declined&level=error&level=warning'

# all lines of one request
curl 'http://127.0.0.1:8000/api/events/preview?type=monolog&trace=771a43a4192642f0b136d5159a501700&window=all'

# counts per level, channel and trace id under a search
curl 'http://127.0.0.1:8000/api/events/facets?type=monolog&q=card'

# lines per minute
curl 'http://127.0.0.1:8000/api/events/histogram?type=monolog&bucket=60'
# {"bucket":60,"data":[{"t":1795341600,"count":4,"levels":{"debug":1,"error":1,"info":1,"warning":1}}]}
```

- `q` works on `/api/events`, `/api/events/preview`, `/api/events/facets` and `/api/events/histogram`.
- The chart answer leaves out empty minutes. It has at most 1,440 bars: for a long period the server makes each bar
  wider, so read `bucket` from the answer.
- `level`, `channel` and `trace` work like the other [feed filters](./feed-filters.md): repeat a parameter for «either
  value», put `not.` in front to exclude.

For AI assistants, the [MCP](./mcp.md) tool `events_list` takes the search as `query` and the trace id as `trace`.

## Limits

- Search reads the first 4 KB of each line's text. A word deep inside a huge `context` may not be found.
- A search word of one or two letters ignores case only for Latin letters. `ä` does not find `Ä`; three letters
  and more do.
- The search index adds about 500 bytes per log line to the database. Example: 100,000 lines take about 92 MB
  instead of 42 MB.
