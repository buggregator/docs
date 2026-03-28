# XHProf — Performance Profiling

Your app is slow and you don't know why. Memory grows and you can't find the leak. XHProf profiling with
Buggregator lets you see exactly which functions consume CPU, wall time, and memory — without setting up
Blackfire or any paid profiling service. Profile data goes to the same Buggregator where you already see
your exceptions and logs.

Watch introduction video on [YouTube](https://www.youtube.com/watch?v=2QbgjIVnz78).

## Use cases

- **Find slow functions** — the Call Graph and Top Functions table show exactly where time is spent.
- **Detect memory leaks** — track memory allocation per function in long-running workers and daemons.
- **Measure optimizations** — compare two profiler runs side-by-side to verify your changes actually helped.
- **Profile any request** — works with web requests, CLI commands, queue jobs, and any PHP code.
- **All in one place** — profiling data next to exceptions, logs, and dumps in the same dashboard.

## Analysis modes

### Call Graph

Function calls as a tree. Nodes colored from white to dark red — the darker, the more resources consumed.

![xhprof-callgraph](https://github.com/buggregator/server/assets/773481/1cf3c587-c1df-4742-8fcd-54a320c86252)

### Flame Graph

Stacked function calls showing where time is spent. Useful for spotting repetitive or time-consuming operations.

![xhprof-flamegraph](https://github.com/buggregator/server/assets/773481/5f75e271-527d-4c6b-a0b1-a3558f8bac51)

### Top Functions

Ranked table of the most expensive function calls — CPU time, wall time, memory, and call count.

![xhprof-top-func](https://github.com/buggregator/server/assets/773481/43dbe4c8-ac23-4cfb-8715-f5141093618f)

### Profile Comparison

Compare two profiler runs side-by-side. See performance deltas (faster/slower) for CPU time, wall clock time,
and memory usage, with per-function percentage changes.

## Setup

### 1. Install the XHProf extension

```bash
pear channel-update pear.php.net
pecl install xhprof
```

### 2. Install the profiler package

#### Laravel

```bash
composer require --dev maantje/xhprof-buggregator-laravel
```

[Package documentation](https://github.com/maantje/xhprof-buggregator-laravel)

#### Spiral Framework

```bash
composer require --dev spiral/profiler:^3.0
```

[Package documentation](https://github.com/spiral/profiler/tree/3.0)

#### Any PHP project

```bash
composer require --dev spiral-packages/profiler
```

```php
use SpiralPackages\Profiler\Profiler;
use SpiralPackages\Profiler\DriverFactory;
use SpiralPackages\Profiler\Storage\WebStorage;
use Symfony\Component\HttpClient\NativeHttpClient;

$storage = new WebStorage(
    new NativeHttpClient(),
    'http://127.0.0.1/api/profiler/store',
);

$profiler = new Profiler(
    storage: $storage,
    driver: DriverFactory::detect(),
    appName: 'My app',
    tags: ['env' => 'local'],
);

$profiler->start();

// Your code here

$profiler->end();
```

### 3. Configure the endpoint

```dotenv
PROFILER_ENDPOINT=http://profiler@127.0.0.1:8000
PROFILER_APP_NAME="My app"
```

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name.

## Custom client integration

If you're building a custom profiler client, there are three ways to send data:

- **HTTP auth** — add `profiler` to the URL: `http://profiler@127.0.0.1:8000`
- **Header** — send `X-Buggregator-Event: profiler` or `X-Profiler-Dump: true`
- **Endpoint** — POST to `/api/profiler/store`
