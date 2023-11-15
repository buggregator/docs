# Contributing — Architecture

As a contributor to Buggregator, it's essential to understand its three main components: the Server Part, the Frontend
Part, and the Trap tool. Each plays a distinct role in making Buggregator a versatile tool for debugging PHP
applications.

## Server Part: The Core of Buggregator

[The Server Part](https://github.com/buggregator/server) is where all the data processing and management happen. It's
crucial for handling the information that flows through Buggregator.

1. **Event Processing:** This part receives information (like errors or logs) from applications. It organizes and
   processes these events.

2. **API Communication:** It also communicates with clients through REST API, sending and receiving data as needed.

### Key Technologies:

It's built on a foundation of robust and reliable technologies, including the Spiral Framework, RoadRunner, and
Centrifugo.

- [Spiral Framework](https://spiral.dev/) - A PHP framework that's the foundation of our server.
- [RoadRunner](https://roadrunner.dev/) - Manages different server tasks like HTTP, TCP, queues, and caching.
- [Centrifugo](https://centrifugal.dev/) - Handles real-time messaging through WebSockets.

## Frontend Part: The User Interface

[The Frontend Part](https://github.com/buggregator/frontend) is what users interact with. It displays the events and
information processed by the server in a user-friendly way. Users can see live updates of events like errors or logs.

### Key Technologies:

- [VueJs 3](https://v3.vuejs.org/) - This framework builds the interactive user interface.
- [TailwindCSS](https://tailwindcss.com/) - Styles the frontend, making it look good and responsive.
- [Storybook](https://storybook.js.org/) - Helps us develop and organize UI components.

This architecture supports a robust system for monitoring and managing application events. As a contributor, your work
in either part plays a crucial role in enhancing Buggregator's functionality and user experience. If you have any
specific areas you're interested in or questions about the architecture, feel free to ask!

## Trap Tool

[Trap](https://github.com/buggregator/trap) is a Command Line Interface (CLI) tool designed to revolutionize PHP
application debugging. It's an alternative to the `symfony/var-dumper`, offering more capabilities and insights. Here's
what makes Trap special:

- **Diverse Debugging Features:** It supports various debugging traps like `Symfony var-dumper`, `Monolog`, `Sentry`,
  `SMTP`, `HTTP dumps`, `Ray`, and more. This variety allows developers to choose the best debugging approach for their
  needs.
- **Ease of Installation and Use:** You can easily integrate Trap into your PHP application using a Composer package. It
  runs a local server tailored for in-depth debugging.
- **Enhanced Debugging Experience:** Trap isn't just a debugging tool; it's a more advanced version of the
  `symfony/var-dumper` server, offering deeper insights into your code.