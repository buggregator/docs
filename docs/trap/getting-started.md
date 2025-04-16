# Trap — Getting Started

There are several ways to get started with Trap, depending on your needs and preferences.

## Standalone Binary (No Project Dependencies)

Download and extract the pre-compiled binary for your platform. This method allows you to use Trap across multiple PHP
projects without modifying their dependencies.

**Available for platforms:**

- Linux (amd64, arm64)
- macOS (amd64, arm64)
- Windows (amd64)

> **Note:** Binaries can be found on release page https://github.com/buggregator/trap/releases

```bash
# Download (example for Linux amd64)
curl -L -o trap.tar.gz https://github.com/buggregator/trap/releases/latest/download/trap-1.13.13-linux-amd64.tar.gz

# Extract the archive
tar -xzf trap.tar.gz
rm trap.tar.gz

# Make executable
chmod +x trap

# Run
./trap
```

This command will start the Trap server, ready to receive any debug messages. Once a debug message is trapped, you will
see a convenient report about it right here in the terminal or in the browser.

## Composer Installation

To use Trap into your project, simply add it as a development dependency via Composer:

```bash
composer require --dev buggregator/trap -W
```

After installation, you can start the debugging server using:

```bash
vendor/bin/trap
```

Once Trap is running, you can start debugging with the `trap()` function:

```php
// Basic variable dump
trap($user);

// Named variable dumps
trap(id: $userId, email: $userEmail);

// Dump and continue using the value
$response = trap($api->getResponse())->return();

// Set dump depth for nested objects
trap($complexObject)->depth(3);
```

## User Interface

By adding the `--ui` flag when starting the Trap server, you can automatically open the web interface. This allows for a
more intuitive and graphical interaction with your debug data.

```bash
./trap --ui
# or
vendor/bin/trap --ui
```

And just open the URL in your browser: [http://127.0.0.1:8000](http://127.0.0.1:8000).

## What's Next?

- Read more about the `trap()` function in the [Usage](./usage.md) section.
- Explore the [Commands](./commands.md) for additional functionality.
