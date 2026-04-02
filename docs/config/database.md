---
llms_description: "Database configuration: SQLite with in-memory (default, data lost on restart) or file-based persistence. Environment variable DATABASE_DSN. Storage modes for attachments: memory or filesystem. Docker volume examples for persistent data."
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

The database file will be created next to the binary (or at the specified path). In Docker, make sure to
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
