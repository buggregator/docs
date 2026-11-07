---
llms_description: "Database configuration: SQLite with in-memory (default, data lost on restart) or file-based persistence. Environment variable DATABASE_DSN. Connection pool database.max_open_conns / DATABASE_MAX_OPEN_CONNS (default 4 for file databases, always 1 in memory). Storage modes for attachments: memory or filesystem. Docker volume examples for persistent data."
---

# Configuration — Database

Buggregator uses [SQLite](https://www.sqlite.org/) as its database. SQLite is embedded directly into the binary —
no external database server is needed.

## Storage Modes

### In-Memory (Default)

By default, Buggregator stores everything in memory. This is the fastest option but **all data is lost when the
server restarts**.

```yaml
database:
  dsn: ":memory:"
```

This is the default — no configuration needed.

### File-Based

To persist data across restarts, specify a file path:

```yaml
database:
  dsn: data.db
```

Or via environment variable:

```bash
DATABASE_DSN=data.db
```

A relative path like `data.db` is resolved from the directory you start Buggregator in. Use an absolute path to be sure. In Docker, make sure to
mount a volume:

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -e DATABASE_DSN=/data/buggregator.db \
  -v buggregator-data:/data \
  ghcr.io/buggregator/server:latest
```

### Docker Compose Example

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:1025:1025
      - 127.0.0.1:9912:9912
      - 127.0.0.1:9913:9913
    environment:
      DATABASE_DSN: /data/buggregator.db
      STORAGE_MODE: filesystem
      STORAGE_PATH: /data/storage
    volumes:
      - buggregator-data:/data

volumes:
  buggregator-data:
```

## Connection Pool

Since v2.6.0, a file database opens up to 4 SQLite connections. Reading the event list then no longer waits
behind incoming events, and incoming events no longer wait behind a long list.

```yaml
database:
  dsn: /data/buggregator.db
  max_open_conns: 4      # default
```

Or `DATABASE_MAX_OPEN_CONNS=4`.

- Set it to `1` for the behaviour before v2.6.0: one connection for everything.
- An in-memory database (`:memory:`) always uses one connection, whatever you set.
- With more than one connection, Buggregator adds `_pragma=busy_timeout(10000)` and `_txlock=immediate` to
  the DSN when they are missing, so two writes wait for each other instead of failing.
- The pool pays off in SQLite's WAL mode, where reads and the write do not block each other. Buggregator does
  not turn WAL on for a file database; add it to the DSN yourself:

```bash
DATABASE_DSN='file:/data/buggregator.db?_pragma=journal_mode(WAL)'
```

## Attachment Storage

SMTP attachments and HTTP dump files are stored separately from the database. Two modes are available:

| Mode | Environment Variable | Description |
|------|---------------------|-------------|
| `memory` (default) | `STORAGE_MODE=memory` | Stored in RAM. Fast but lost on restart. |
| `filesystem` | `STORAGE_MODE=filesystem` | Stored on disk in the directory specified by `STORAGE_PATH`. |

```yaml
storage:
  mode: filesystem
  path: ./storage
```

> **Tip:** If you use `DATABASE_DSN=:memory:` but `STORAGE_MODE=filesystem`, the event metadata will be lost on
> restart but the attachment files will remain on disk (orphaned). For consistency, either persist both or
> keep both in memory.

## Migrations

Buggregator automatically creates and migrates database tables on startup. No manual migration steps are required.
