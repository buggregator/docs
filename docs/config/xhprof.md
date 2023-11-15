# Configuration — Xhprof profiler

The Xhprof profiler is an essential feature of Buggregator that offers a lightweight and hierarchical profiling solution
for PHP applications. It uses instrumentation to keep track of call counts and inclusive metrics for arcs in the dynamic
callgraph of your program during the data collection phase. In the reporting and post-processing phase, the profiler
computes exclusive metrics such as wall (elapsed) time, CPU time, and memory usage.

With the Xhprof profiler, you can easily identify performance bottlenecks and optimize your application's code for
better efficiency. So, if you're looking to fine-tune your PHP application's performance, the Xhprof profiler is the
perfect tool for the job.

![xhprof](https://user-images.githubusercontent.com/773481/208724383-3790a3e1-9ebe-4616-8d4d-d1869f8f2b7c.png)

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
PROFILER_APP_NAME=My super app
```
