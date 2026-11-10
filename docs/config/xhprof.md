---
llms_description: "XHProf profiling integration: Call Graph, Flame Graph, Top Functions table, profile comparison. Setup: pecl install xhprof, packages for Laravel (maantje/xhprof-buggregator-laravel), Spiral (spiral/profiler), generic PHP (spiral-packages/profiler). XHPROF_ENABLED=true (Laravel package, off by default), PROFILER_ENDPOINT (default path /api/profiler/store), Symfony bundle enabled: true, custom client via HTTP auth, X-Buggregator-Event header, or /api/profiler/store endpoint."
---

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

![XHProf call graph](/images/xhprof-callgraph.webp)

### Flame Graph

Stacked function calls showing where time is spent. Useful for spotting repetitive or time-consuming operations.

![XHProf flame graph](/images/xhprof-flamegraph.webp)

### Top Functions

Ranked table of the most expensive function calls — CPU time, wall time, memory, and call count.

![XHProf top functions](/images/xhprof-top-functions.webp)

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

#### Symfony Framework

Please mind, bundle in early development stage - feedback much appreciated

```bash
composer require --dev velpl/buggregator-profiler-bundle:^0.3
```

[Package documentation](https://github.com/velPL/buggregator-profiler-bundle)

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

### 3. Turn profiling on and set the endpoint

The packages differ here. The Laravel package and the Symfony bundle send nothing until you turn them on.

#### Laravel

Profiling is off by default (`XHPROF_ENABLED` defaults to `false`). Turn it on and set the endpoint:

```dotenv
XHPROF_ENABLED=true
PROFILER_ENDPOINT=http://127.0.0.1:8000/api/profiler/store
```

The profile is named after your app's `APP_NAME`. Turn profiling off when you do not need it: it slows every
request down. The package can also switch it per request with the `X-Xhprof-Enabled` header, see its
[documentation](https://github.com/maantje/xhprof-buggregator-laravel).

#### Spiral Framework

Profiling is on by default (`PROFILER_ENABLE=true`). Set the endpoint and the app name:

```dotenv
PROFILER_ENDPOINT=http://127.0.0.1:8000/api/profiler/store
PROFILER_APP_NAME="My app"
```

#### Symfony Framework

The bundle is off by default. Turn it on in `config/packages/buggregator_profiler.yaml`:

```yaml
buggregator_profiler:
    enabled: true
    application_name: 'My app'
    profiler_url: 'http://127.0.0.1:8000'
```

#### Any PHP project

The endpoint is the second argument of `WebStorage` in the example above.

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name.

## Custom client integration

If you're building a custom profiler client, there are three ways to send data:

- **HTTP auth** — add `profiler` to the URL: `http://profiler@127.0.0.1:8000`
- **Header** — send `X-Buggregator-Event: profiler` or `X-Profiler-Dump: true`
- **Endpoint** — POST to `/api/profiler/store`
