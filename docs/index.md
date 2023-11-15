# What is Buggregator?

Buggregator is a free, multi-purpose server tool designed primarily for debugging PHP applications, but it's also
compatible with other programming languages. Think of it as a Swiss Army knife for developers. What makes it special is
that it offers a range of features that you would usually find in various paid tools, but it's available for free.

![Cover image](https://user-images.githubusercontent.com/773481/208718792-eeae35a6-c5a8-4be4-9474-2b96d222e750.png)

One of the coolest things about Buggregator is how well it fits into Docker environments. If you're working with Docker,
it is like a dream come true. It's easy to integrate and really powerful.

The key feature of Buggregator is its ability to bring together debugging information from different services. This
means you can see all your debugging data in one place, which makes fixing bugs a whole lot easier and faster. It's a
great tool for any developer looking to streamline their debugging process without spending a lot of money.

## Centralized Debugging with Buggregator

1. **Unified Debugging Dashboard**: Buggregator allows you to aggregate logs, dumps, and other debug information from
   all your services into a single, unified interface. This centralization of data is invaluable for developers who
   manage multiple services or microservices, as it simplifies tracking and analysis.

2. **Cross-Service Debugging**: It eliminates the need to toggle between different tools or logs, saving time and
   reducing complexity.

3. **Real-Time Monitoring on Various Devices**: You can open its GUI on different devices, such as a tablet, and observe
   all the debug information in real-time.

4. **Ease of Access and Use**: By integrating Buggregator into your Docker development infrastructure, you set up a
   system where all debug information is automatically sent to Buggregator's server.

## Tech stack

It's built on a foundation of robust and reliable technologies, including the Spiral Framework, NuxtJs 3, and
RoadRunner.

- [Spiral Framework](https://spiral.dev/)
- [RoadRunner](https://roadrunner.dev/) Http, Websocket, TCP, Queue, Cache server in one bottle
- [NuxtJs 3](https://nuxt.com/)
- [VueJs 3](https://v3.vuejs.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [Storybook](https://storybook.js.org/)

## Key Features

Buggregator is not just a debugging server; it's a comprehensive suite of tools that cater to various aspects of
application development and maintenance, all available at no cost. Here’s what you can expect:

### 1. [Xhprof Profiler](/config/xhprof)

A lightweight profiler for PHP applications, helping you identify performance bottlenecks and optimize efficiency.

### 2. [Symfony VarDumper Server](/config/var-dumper)

Enhances debugging by collecting and isolating dumped data, making it easier to spot issues.

### 3. [Spatie Ray Debug Tool](/config/ray)

Supports a wide range of applications and languages, allowing for easy dumping and debugging of various data types.

### 4. [Fake SMTP Server](/config/smtp)

A feature for testing email functionalities in your applications without the need for an external mail server.

### 5. [Sentry Compatibility](/config/sentry)

Can replace Sentry for efficient local development, allowing you to catch and fix errors before they hit production.\

### 6. [Monolog Server](/config/monolog)

A powerful logging tool that helps you track and analyze application logs for better insight into your application's
behavior.

### 7. [Inspector Compatibility](/config/inspector)

Works with Inspector reports, offering a streamlined alternative for local development and debugging.

### 8. [HTTP Requests Dump Server](/config/http-dumps)

A valuable tool for capturing and analyzing HTTP requests, aiding in the debugging and development process.

---

Buggregator is designed with simplicity and efficiency in mind, requiring no additional packages for its operation. This
makes it an accessible tool for developers at all levels, from beginners to seasoned professionals. Its Docker
compatibility ensures it can be easily integrated into your existing development setup, enhancing your workflow without
adding complexity.