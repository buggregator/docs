# Integration — Xhprof profiler

Buggregator is not just useful for dumping variables; it’s an essential instrument for deeply analyzing your PHP
applications to locate and resolve efficiency issues.

To start, you only need to install the profiling package into your PHP application and begin collecting metrics. The
collected metrics will be automatically sent to Buggregator, where you can analyze the PHP function call trace. With a
comprehensive set of tools, you can identify slow calls and work on optimizing them. You can keep sending metrics after
making changes to ensure that all unoptimized code is streamlined.

Watch introduction video on [YouTube](https://www.youtube.com/watch?v=2QbgjIVnz78).

### Buggregator offers three types of analysis to help you enhance the performance of your PHP applications:

1. **Call Graph** – This shows the function calls in a tree structure. The nodes in the call tree vary in color from
   white to dark red. The darker the color, the more resources are being consumed by that call. This visual
   representation helps you quickly identify which parts of your code are using the most resources, allowing you to
   pinpoint where optimizations are most needed.

   ![xhprof-callgraph](https://github.com/buggregator/server/assets/773481/1cf3c587-c1df-4742-8fcd-54a320c86252)

2. **FlameGraph** – This graphical representation stacks function calls and shows which functions are called by which
   other functions. It's particularly useful for spotting repetitive or time-consuming operations that might not be
   obvious. The FlameGraph helps you see how functions interact and where time is being spent in your application,
   making it easier to target specific areas for improvement.

   ![xhprof-flamegraph](https://github.com/buggregator/server/assets/773481/5f75e271-527d-4c6b-a0b1-a3558f8bac51)

3. **Top 100 Functions** – This table lists the top 100 function calls that consume the most resources. It provides a
   clear, focused list of potential problem areas, so you can start optimizing the parts of your application that will
   make the biggest difference to overall performance.

   ![xhprof-top-func](https://github.com/buggregator/server/assets/773481/43dbe4c8-ac23-4cfb-8715-f5141093618f)

## Installation extension

One of the way to install Xhprof is to use [PECL](https://pecl.php.net/package/xhprof) package.

```bash
pear channel-update pear.php.net
pecl install xhprof
```

## Spiral Framework

If you are using Spiral Framework you just need to install
the [spiral/profiler](https://github.com/spiral/profiler/tree/3.0) package.

```bash
composer require --dev spiral/profiler:^3.0
```

> **Note:**
> Read more about package usage in the [package documentation](https://github.com/spiral/profiler/tree/3.0).

## Laravel

If you are using Laravel Framework you just need to install
the [maantje/xhprof-buggregator-laravel](https://github.com/maantje/xhprof-buggregator-laravel) package.

```bash
composer require --dev maantje/xhprof-buggregator-laravel
```

> **Note:**
> Read more about package usage in the [package documentation](https://github.com/maantje/xhprof-buggregator-laravel).

## Configuration

After installing the package, you need to configure it. The package provides predefined environment variables to
configure the profiler.

```dotenv
PROFILER_ENDPOINT=http://profiler@127.0.0.1:8000
PROFILER_APP_NAME="My super app"
```

## Client configuration

When integrating with Buggregator, especially if you're developing a custom client, it's essential to understand how to
correctly configure the data transmission. This guide outlines various methods to designate your requests as xhprof
requests

### Using HTTP auth

Add `profiler` to the host name, e.g. `http://profiler@...`

### Using header

Add a header `X-Buggregator-Event` with value `profiler` or just add `X-Profiler-Dump` with any value.

### Special endpoint

You can use special endpoint `/profiler/store` to send data to Buggregator.