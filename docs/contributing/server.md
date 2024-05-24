# Contributing — Server side

[The Server Part](https://github.com/buggregator/server) is where all the data processing and management happen. It's
crucial for handling the information that flows through Buggregator.

1. **Event Processing:** This part receives information (like errors or logs) from applications. It organizes and
   processes these events.

2. **API Communication:** It also communicates with clients through REST API, sending and receiving data as needed.

## Key Technologies:

It's built on a foundation of robust and reliable technologies, including the Spiral Framework, RoadRunner, Centrifugo
and Doltdb.

- [Spiral Framework](https://spiral.dev/) - A PHP framework that's the foundation of our server.
- [RoadRunner](https://roadrunner.dev/) - Manages different server tasks like HTTP, TCP, queues, and caching.
- [Centrifugo](https://centrifugal.dev/) - Handles real-time messaging through WebSockets.
- [Doltdb](https://github.com/dolthub/dolt) - A SQL database that's built on top of a Git repository.

## Server requirements

1. Minimum PHP version: 8.2

## Installation

To set up environment for local development read the [development environment setup guide](../cookbook/dev-env.md).