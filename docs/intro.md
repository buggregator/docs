# Introduction — What is Buggregator?

Welcome to Buggregator, a versatile and lightweight server designed for debugging PHP applications and more. Buggregator
stands out as a multi-functional tool akin to a Swiss Army knife for developers, particularly those working with PHP,
though it's also compatible with other programming languages.

What sets Buggregator apart is its unique position as a free alternative to many paid tools, offering a range of
functionalities typically found in various separate, often non-free, software. Designed for seamless integration into
Docker environments, Buggregator is the perfect tool for developers seeking a cost-effective, yet powerful solution for
their development needs.

![Cover image](https://user-images.githubusercontent.com/773481/208718792-eeae35a6-c5a8-4be4-9474-2b96d222e750.png)

Buggregator shines as an exceptionally convenient tool for developers, particularly for its seamless integration into
Docker-based development environments. Its standout feature is the ability to centralize debugging information from
various services, streamlining the debugging process significantly. Here's a closer look at how Buggregator enhances
your development workflow:

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

#### 1. Xhprof Profiler

A lightweight profiler for PHP applications, helping you identify performance bottlenecks and optimize efficiency.

#### 2. Symfony VarDumper Server

Enhances debugging by collecting and isolating dumped data, making it easier to spot issues.

#### 3. Fake SMTP Server

A feature for testing email functionalities in your applications without the need for an external mail server.

#### 4. Sentry Compatibility

Can replace Sentry for efficient local development, allowing you to catch and fix errors before they hit production.\

#### 5. Monolog Server

A powerful logging tool that helps you track and analyze application logs for better insight into your application's
behavior.

#### 6. Inspector Compatibility

Works with Inspector reports, offering a streamlined alternative for local development and debugging.

#### 7. HTTP Requests Dump Server

A valuable tool for capturing and analyzing HTTP requests, aiding in the debugging and development process.

#### 8. Spatie Ray Debug Tool

Supports a wide range of applications and languages, allowing for easy dumping and debugging of various data types.

---

Buggregator is designed with simplicity and efficiency in mind, requiring no additional packages for its operation. This
makes it an accessible tool for developers at all levels, from beginners to seasoned professionals. Its Docker
compatibility ensures it can be easily integrated into your existing development setup, enhancing your workflow without
adding complexity.