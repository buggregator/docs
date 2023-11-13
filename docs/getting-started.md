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
docker run --pull always -p 8000:8000 -p 1025:1025 -p 9912:9912 -p 9913:9913 ghcr.io/buggregator/server:latest
```

### Latest Dev Release

This version includes the latest features and updates but might be less stable.

```bash
docker run --pull always -p 8000:8000 -p 1025:1025 -p 9912:9912 -p 9913:9913 ghcr.io/buggregator/server:dev
```

### Specific Version

If you need a particular version of Buggregator, you can choose to install that specific one.

```bash
docker run -p 8000:8000 -p 1025:1025 -p 9912:9912 -p 9913:9913 ghcr.io/buggregator/server:v1.00
```

> **Note:**
> If you're not using all the features and want to reduce the number of open ports, you can omit the unused ports in the
> command.

**If you prefer using Docker Compose:**

1. Create a `docker-compose.yml` file in your project directory.
2. Add the following service definition to your file:

```yaml
services:
  # ...

  buggregator:
    image: ghcr.io/buggregator/server:dev
    ports:
      - 8000:8000
      - 1025:1025
      - 9912:9912
      - 9913:9913
```

3. Run `docker-compose up` in your CLI.

## Step 3: Open Buggregator in Your Browser

Once Buggregator is running, open your web browser and go to http://127.0.0.1:8000. You should now see the Buggregator
interface, ready to collect and display debugging information from your application.

And that's it! You've successfully installed it on your local machine using Docker. You can now start using it
to streamline your debugging process. If you encounter any issues or have questions, don't hesitate to refer to the
official documentation or seek help from the community.
