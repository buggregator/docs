# Introduction — Getting Started

This guide will walk you through the steps to get Buggregator up and running on your local machine using Docker. Don't
worry if you're new to Docker or Buggregator; we'll keep things simple and straightforward!

## Step 1: Install Docker

Before you can run Buggregator, you need to have Docker installed on your server. Docker is a tool that allows you to
run applications in containers, which are like lightweight, standalone packages that contain everything the application
needs to run.

- If you don't have Docker installed, visit Docker's website and download the version suitable for your operating
  system (Windows, macOS, or Linux).
- Follow the installation instructions on the website to get Docker set up.

## Step 2: Choose Your Buggregator Version

Buggregator offers different versions for different needs:

### Latest Stable Release

This is the most recent officially released version, recommended for most users.

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  ghcr.io/buggregator/server:latest
```

### Latest Dev Release

This version includes the latest features and updates but might be less stable.

```bash
docker run --pull always \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  ghcr.io/buggregator/server:dev
```

### Specific Version

If you need a particular version of Buggregator, you can choose to install that specific one.

```bash
docker run \
  -p 127.0.0.1:8000:8000 \
  -p 127.0.0.1:1025:1025 \
  -p 127.0.0.1:9912:9912 \
  -p 127.0.0.1:9913:9913 \
  ghcr.io/buggregator/server:v1.0
```

> **Note:**
> If you're not using all the features and want to reduce the number of open ports, you can omit the unused ports in the
> command.

**If you prefer using Docker Compose:**

1. Create a `docker-compose.yml` file in your project directory.
2. Add the following service definition to your file:

We recommend publishing ports only on a local server, as shown in the example below:

```yaml
services:
  # ...
  buggregator:
    image: ghcr.io/buggregator/server:dev
    ports:
      - 127.0.0.1:8000:8000
      - 127.0.0.1:1025:1025
      - 127.0.0.1:9912:9912
      - 127.0.0.1:9913:9913
```
**To add the Buggregator service to an existing service in your docker-compose.yml file, you can follow these :**
```yaml
services:
  # Existing services...
  
  buggregator:
    image: ghcr.io/buggregator/server:dev
    ports:
      - 127.0.0.1::8000
    networks:
      - your_existing_network
```

Here's an example of how you can set the environment variables for Ray, Var Dump Server in your .env file:
```code

RAY_HOST=ray@buggregator
RAY_PORT=8000
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=buggregator:9912
```
3. Run `docker-compose up` in your CLI.

## Step 3: Open Buggregator in Your Browser

Once Buggregator is running, open your web browser and go to http://127.0.0.1:8000. You should now see the Buggregator
interface, ready to collect and display debugging information from your application.

And that's it! You've successfully installed it on your local machine using Docker. You can now start using it
to streamline your debugging process. If you encounter any issues or have questions, don't hesitate to refer to the
official documentation or seek help from the community.

## Port Configuration Advice:

Here are descriptions of the ports used by Buggregator:

- **8000**: This port is used for the following
  modules: [HTTP Dumps](./config/http-dumps.md), [Sentry](./config/sentry.md), [Ray](./config/ray.md), [Inspector](./config/inspector.md), [XHProf](./config/xhprof.md).
- **1025**: This port is designated for [SMTP](./config/smtp.md).
- **9912**: This port is used for [Symfony Var-Dumper](./config/var-dumper.md).
- **9913**: This port is allocated for [Monolog](./config/monolog.md).

### Stay Secure

By default, the ports are set to listen only on the localhost (`127.0.0.1`), enhancing security by preventing external
access.

> **Warning**
> Publishing container ports is insecure by default, meaning when you publish a container's ports, they become available
> not only to the Docker host but also to the outside world. If you include the localhost IP address (127.0.0.1) with,
> only the Docker host can access the published container port.

If you require external access to these ports, you can remove `127.0.0.1:` from the respective port forwarding rules.
However, be cautious as this will make the ports accessible from outside your local network.

Like this:

```bash --pull always \
  -p 8000:8000 \
  -p ...
  ghcr.io/buggregator/server:latest
```

### Reduce the Number of Open Ports

If you're not utilizing all the features and wish to reduce the number of open ports, you can omit the unused ports from
the command. This step can help minimize the attack surface and maintain a cleaner setup.

For example, if you use only var-dumper, you can omit the other ports, like this:

```bash
docker run --pull always \
  -p 127.0.0.1:9912:9912 \
  ghcr.io/buggregator/server:latest
```
