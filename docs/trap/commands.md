# Trap — Commands

## `run`

### Description

The `run` command starts the Trap server, which listens for debug information on specified ports and
processes it using configured senders.

### Simple Example

```bash
vendor/bin/trap run
```

### Arguments and Options

| Option     | Short | Description                                             | Default                  |
|------------|-------|---------------------------------------------------------|--------------------------|
| `--port`   | `-p`  | Port(s) to listen on (can be specified multiple times)  | `1025, 8000, 9912, 9913` |
| `--sender` | `-s`  | Sender type(s) to use (can be specified multiple times) | `console`                |
| `--ui`     | -     | Enable web UI (with optional port specification)        | `false`                  |

### Port Configuration Details

By default, Trap runs on multiple ports simultaneously: `1025, 8000, 9912, 9913`. All ports listen for the same data,
but this multi-port setup makes it compatible with various debugging tools that have their own default ports:

- Port `1025`: Default SMTP port for email testing
- Port `8000`: Used for HTTP dumps
- Port `9912`: Default port for Symfony VarDumper
- Port `9913`: Default for Monolog socket handler

If you want to listen on just one specific port, you can specify it:

```bash
vendor/bin/trap run -p 8000
```

This will make Trap listen only on port `8000`.

### Examples

Start with default settings:

```bash
vendor/bin/trap run
```

Listen on specific ports:

```bash
vendor/bin/trap run --port=8888
# or
vendor/bin/trap run -p 8888
```

Listen on multiple ports:

```bash
vendor/bin/trap run --port=8888 --port=9999
# or
vendor/bin/trap run -p 8888 -p 9999
```

Enable the web UI on default port:

```bash
vendor/bin/trap run --ui
```

Use environment variables for configuration:

```bash
TRAP_TCP_PORTS=8888,9999 TRAP_UI_PORT=8080 vendor/bin/trap run --ui
```

### Available Senders

Trap supports multiple methods ("senders") for outputting the debug information, allowing you to choose where your debug
dumps are sent:

- **Console**: Outputs dumps directly in the console.
- **Server**: Sends dumps to a remote Buggregator server for centralized management and review.
- **File**: Saves dumps to a file, useful for auditing or detailed offline analysis.

By default, dumps are displayed in the console. However, you can configure multiple senders simultaneously to suit your
workflow and requirements. For example, to use the console, file, and server senders together:

| Sender         | Description                                      |
|----------------|--------------------------------------------------|
| `console`      | Outputs debug information to the console         |
| `file`         | Writes events to files in JSON format            |
| `file-body`    | Writes event body content to separate files      |
| `mail-to-file` | Stores received emails to files                  |
| `server`       | Forwards events to a Buggregator server instance |


```bash
vendor/bin/trap run --sender=console --sender=file
```

## `test`

### Description

The `test` command sends various types of test data to the Trap server to verify that it's working correctly. This
includes XHProf data, var dumps, emails, Sentry reports, and binary data.

### Simple Example

```bash
vendor/bin/trap test
```

### Arguments and Options

The `test` command doesn't accept any arguments or options.

### Example

To send test data to a running Trap instance:

```bash
# First, start the trap server in one terminal
vendor/bin/trap run

# Then, in another terminal, run the test command
vendor/bin/trap test
```

This will:

1. Send XHProf profiling data
2. Execute various `trap()` dumps
3. Send test emails (both simple and multipart)
4. Send Sentry store and envelope data
5. Send binary data

---

## `joke`

### Description

The `joke` command prints a random joke using the trap framework. It's a fun addition that also demonstrates the trap
functionality.

### Simple Example

```bash
vendor/bin/trap joke
```

### Arguments and Options

The `joke` command doesn't accept any arguments or options.

### Example

To display a random joke:

```bash
vendor/bin/trap joke
```

The joke output will be displayed using the same output mechanism as other trap messages, which can be a good way to
verify that your trap setup is working correctly in a lightweight manner.

## Environment Variables

Trap can be configured using environment variables:

| Variable                    | Description                                | Default                             |
|-----------------------------|--------------------------------------------|-------------------------------------|
| `TRAP_TCP_PORTS`            | Comma-separated list of ports to listen on | `1025,8000,9912,9913`               |
| `TRAP_TCP_HOST`             | Host interface to bind to                  | `127.0.0.1`                         |
| `TRAP_TCP_POLLING_INTERVAL` | Socket polling interval in microseconds    | `1000`                              |
| `TRAP_UI_PORT`              | Web UI port                                | `8000`                              |
| `TRAP_UI_HOST`              | Web UI host interface                      | `127.0.0.1`                         |
| `TRAP_MAIN_LOOP_INTERVAL`   | Main loop interval in microseconds         | `100`                               |
| `TRAP_XHPROF_PATH`          | Path to XHProf files                       | Read from PHP's `xhprof.output_dir` |
| `TRAP_XHPROF_SORT`          | XHProf edges sorting algorithm (0-3)       | `3`                                 |
