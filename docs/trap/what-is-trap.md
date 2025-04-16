# Trap — What is it?

Trap is a powerful, lightweight debugging tool designed to supercharge your PHP development experience. It
serves as an excellent alternative to Symfony VarDumper by providing all the functionality you need for debugging with
the addition of a clean, intuitive user interface built right in.

**Project repository:** https://github.com/buggregator/trap
> Star the project to show your support and help us grow! ⭐️ We appreciate your support!

## What Makes Trap Special

Unlike traditional debugging tools that output to the console or directly into your application's response, Trap
captures debugging information and presents it both in a dedicated dashboard and console. This separation keeps your
application output clean while giving you a comprehensive view of all debugging data in one place.

### Key Features:

- **Zero Configuration**: Works immediately after installation with sensible defaults.
- **Cross-Project Compatibility**: Allows to debug multiple applications simultaneously with a single Trap instance
- **Dashboard Interface:** It features the same user-friendly dashboard as the full Buggregator Server, allowing for
  seamless monitoring and management of debug outputs directly from the web.
- **Standalone Binary**: Use without adding dependencies to your project on Windows, Linux, or MacOS.
- **Console Application:** Includes a mini-server written entirely in PHP, eliminating the need for Docker or other
  container technology. This makes it easier to deploy and use in a variety of development environments.
- **Multiple Handlers:** Trap supports various handlers for debugging such as **Symfony VarDumper**,
  **Monolog**,**Sentry**, **SMTP**, **HTTP dumps**, **Ray**, and more. This versatility allows developers to tailor the
  debugging process to their specific needs and existing development stack.
- **Protobuf Debugging:** Offers an improved way to work with Google Protocol Buffers (protobuf) by providing clearer
  and more concise debugging outputs.



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