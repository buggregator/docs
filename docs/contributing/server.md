# Contributing — Server side

[The Server Part](https://github.com/buggregator/server) is where all the data processing and management happen. It's
crucial for handling the information that flows through Buggregator.

1. **Event Processing:** This part receives information (like errors or logs) from applications. It organizes and
   processes these events.

2. **API Communication:** It also communicates with clients through REST API, sending and receiving data as needed.

## Key Technologies:

It's built on a foundation of robust and reliable technologies, including the Spiral Framework, RoadRunner, and
Centrifugo.

- [Spiral Framework](https://spiral.dev/) - A PHP framework that's the foundation of our server.
- [RoadRunner](https://roadrunner.dev/) - Manages different server tasks like HTTP, TCP, queues, and caching.
- [Centrifugo](https://centrifugal.dev/) - Handles real-time messaging through WebSockets.

## Server requirements

1. Minimum PHP version: 8.2

## Installation

1. Clone repository `git clone https://github.com/buggregator/server.git`
2. Install backend dependencies `composer install`
3. Download RoadRunner binary `vendor/bin/rr get-binary`
4. Install Centrifugo server `cd bin && ./get-binaries.sh`
5. Run RoadRunner server `./rr serve`