# Trap — Getting Started

To use Trap into your project, simply add it as a development dependency via Composer:

```bash
composer require --dev buggregator/trap -W
```

After installation, you can start the debugging server using:

```bash
vendor/bin/trap
```

This command will start the Trap server, ready to receive any debug messages. Once a debug message is trapped, you will
see a convenient report about it right here in the terminal or in the browser.

## Usage

The Trap offers a flexible and straightforward way to capture and analyze debug information in your PHP applications.

Below is a guide on how to use the `trap` function to send debug messages to the Trap server.

#### Sending Debug Messages

To begin sending debug messages, you can utilize the `trap()` function in various ways to suit your debugging needs:

```php
// Dump the current stack trace
trap()->stackTrace();

// Dump a variable with a specific depth limit
trap($var)->depth(4);

// Dump a sequence of named variables
trap($var, foo: $far, bar: $bar);

// Dump a variable and return it for further processing
$responder->respond(trap($response)->return()); 
```

> **Note:** When using `trap()`, it automatically configures `$_SERVER['REMOTE_ADDR']` and `$_SERVER['REMOTE_PORT']` if
> they are not already set. This ensures that the debug information is accurately captured and displayed.

## Default port

By default, Trap operates on port `9912`. To change the default port, you can use the `-p` option when starting the
server:

For example, to switch to port `8000`, you would use the following command:

```bash
vendor/bin/trap -p 8000
```

This command sets the Trap server to run on port `8000`.

### Choosing Your Senders

Trap supports multiple methods ("senders") for outputting the debug information, allowing you to choose where your debug
dumps are sent:

- **Console**: Outputs dumps directly in the console.
- **Server**: Sends dumps to a remote Buggregator server for centralized management and review.
- **File**: Saves dumps to a file, useful for auditing or detailed offline analysis.

By default, dumps are displayed in the console. However, you can configure multiple senders simultaneously to suit your
workflow and requirements. For example, to use the console, file, and server senders together:

```shell
vendor/bin/trap -s console -s file -s server
```

This setup ensures that you can view debug information in real-time, save it for later review, and also send it to a
remote server for centralized monitoring. Using Trap enhances your ability to diagnose and resolve issues
quickly and efficiently, making it a valuable addition to your development toolkit.

## User Interface

Trap is set to enhance its usability by introducing a convenient new feature that allows users to launch the web
interface of the Buggregator Server directly. This feature is aimed at improving accessibility and simplifying the
debugging process.

![trap-ui](https://github.com/buggregator/trap/assets/4152481/1ccc2c85-2f81-4b62-8ae7-49ee76380674)

By adding the `--ui` flag when starting the Trap server, you can automatically raise the web interface. This allows for
a more intuitive and graphical interaction with your debug data.

```bash
vendor/bin/trap --ui
```

This command will start the Trap server with the web interface enabled, facilitating direct access to the server's
dashboard through your web browser. This is particularly useful for developers who prefer a graphical interface over
command line interactions, providing a seamless experience without the need for Docker or additional setup.