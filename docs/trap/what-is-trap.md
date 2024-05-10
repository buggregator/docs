# Trap — What is it?

[Buggregator Trap](https://github.com/buggregator/trap) is a lightweight, standalone debugging tool designed to be
integrated with PHP applications. It is distributed as a Composer package and includes a suite of utilities that
significantly enhance the debugging capabilities traditionally available in PHP environments.

**Project repository:** https://github.com/buggregator/trap

**We care about the quality of our products' codebase and strive to provide the best user experience. Trap has passed
the Proof of Concept stage and is now an important part of the Buggregator ecosystem. We have big plans for the
development of the entire ecosystem, and we would be delighted if you join us on this journey.**

#### Key Features:

- **Dashboard Interface:** It features the same user-friendly dashboard as the full Buggregator Server, allowing for
  seamless monitoring and management of debug outputs directly from the web.

- **Console Application:** Includes a mini-server written entirely in PHP, eliminating the need for Docker or other
  container technology. This makes it easier to deploy and use in a variety of development environments.

- **Multiple Handlers:** Buggregator Trap supports various handlers for debugging such as **Symfony VarDumper**,
  **Monolog**,**Sentry**, **SMTP**, **HTTP dumps**, **Ray**, and more. This versatility allows developers to tailor the
  debugging process to their specific needs and existing development stack.

- **Protobuf Debugging:** Offers an improved way to work with Google Protocol Buffers (protobuf) by providing clearer
  and more concise debugging outputs, making the process of working with complex data structures more manageable.

## Console Application

Here's a sneak peek into the console output you can expect with Trap:

### Symfony/var-dumper (proto)

![var-dumper](https://github.com/buggregator/trap/assets/4152481/f4c855f5-87c4-4534-b72d-5b19d1aae0b0)

### Binary Data

![Binary Data](https://github.com/buggregator/trap/assets/4152481/cd8788ed-b10c-4b9a-b2e2-baa8912ea38d)

### SMTP Mail Trap

![smtp](https://github.com/buggregator/trap/assets/4152481/b11c4a7f-072a-4e66-b11d-9bbd3177bfe2)

### HTTP Dump

![http-dump](https://github.com/buggregator/trap/assets/4152481/48201ce6-7756-4402-8954-76a27489b632)