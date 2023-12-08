# What is Buggregator?

Buggregator is a free, multi-purpose server tool designed primarily for debugging PHP applications, but it's also
compatible with other programming languages. Think of it as a Swiss Army knife for developers. What makes it special is
that it offers a range of features that you would usually find in various paid tools, but it's available for free.

![Cover image](https://github.com/buggregator/server/assets/773481/47491a3c-57a3-4b40-b82e-37976afdf708)

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

![xhprof](https://github.com/buggregator/server/assets/773481/d69e1158-599d-4546-96a9-40a42cb060f4)

### 2. [Symfony VarDumper Server](/config/var-dumper)

Enhances debugging by collecting and isolating dumped data, making it easier to spot issues.

![var-dumper](https://github.com/buggregator/server/assets/773481/b77fa867-0a8e-431a-9126-f69959dc18f4)

### 3. [Spatie Ray Debug Tool](/config/ray)

Supports a wide range of applications and languages, allowing for easy dumping and debugging of various data types.

![ray](https://github.com/buggregator/server/assets/773481/168b27f7-75b1-4837-b0a1-37146d5b8b52)

### 4. [Fake SMTP Server](/config/smtp)

A feature for testing email functionalities in your applications without the need for an external mail server.

![smtp](https://github.com/buggregator/server/assets/773481/8dd60ddf-c8d8-4a26-a8c0-b05052414a5f)

### 5. [Sentry Compatibility](/config/sentry)

Can replace Sentry for efficient local development, allowing you to catch and fix errors before they hit production.

![sentry](https://github.com/buggregator/server/assets/773481/e979fda5-54c8-42cc-8224-a1c5d828569a)

### 6. [Monolog Server](/config/monolog)

A powerful logging tool that helps you track and analyze application logs for better insight into your application's
behavior.

![monolog](https://github.com/buggregator/server/assets/773481/21919110-fd4d-490d-a78e-41242d329885)

### 7. [Inspector Compatibility](/config/inspector)

Works with Inspector reports, offering a streamlined alternative for local development and debugging.

![inspector](https://github.com/buggregator/server/assets/773481/ab002ecf-e1dc-4433-90d4-0e42ff8c0ab3)

### 8. [HTTP Requests Dump Server](/config/http-dumps)

A valuable tool for capturing and analyzing HTTP requests, aiding in the debugging and development process.

![http dumps](https://github.com/buggregator/server/assets/773481/fc823390-b490-4bbb-a787-44471eca9fb6)

### 9. Dumps sharing

You can share dumps with your colleagues or friends. Just click on the share button and copy your dump as an image.

![share](https://github.com/buggregator/server/assets/773481/a524ffcb-8208-4b89-96b8-9c9199142f51)

---

Buggregator is designed with simplicity and efficiency in mind, requiring no additional packages for its operation. This
makes it an accessible tool for developers at all levels, from beginners to seasoned professionals. Its Docker
compatibility ensures it can be easily integrated into your existing development setup, enhancing your workflow without
adding complexity.