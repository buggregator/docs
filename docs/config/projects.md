# Configuration — Projects

From version 1.11, Buggregator lets you use "projects" to help organize your data better. Projects are
super useful for keeping your data organized.

![image](https://github.com/user-attachments/assets/cde794f7-83fb-4708-9eef-713c6f8be7cc)

**Here’s why you might want to use projects:**

1. Projects help you keep data from different teams or parts of your app separate. This means it's easier to find what
   you're looking for and keep track of changes.
2. Teams won’t get mixed up with data that isn’t relevant to them, which makes their work faster and less confusing.

### Default Project

When you start the server, Buggregator automatically sets up a default project with key `default`. All your data goes
into this `default` project if a project key is not specified in the request.

## Docker Configuration

Currently, Buggregator does not have an admin interface for managing projects. Instead, you manage them through
configuration files within a Docker container.

**Here's how you can mount a volume containing webhook configurations:**

```bash
docker run --pull always \
  -v /path/to/projects:/app/runtime/configs \
  ghcr.io/buggregator/server:latest
```

or using `docker-compose`:

```yaml
buggregator-server:
  ...
  volumes:
    - /path/to/projects:/app/runtime/configs
```

## Configuring a Project

Place each project configuration in a YAML file within the `runtime/configs` directory. Each configuration file should
contain one project setup.

Here’s what a typical webhook configuration looks like in a YAML file `dev.project.yaml`:

```yaml
project:
  key: dev
  name: Dev environment
```

> **Note:** The project configuration file name should have the following pattern: `<name>.project.yaml`
> or `<name>.project.yml`.

## Sentry Configuration

To use Sentry with your project, format your DSN like this:

```dotenv
SENTRY_DSN=http://<secret_key>@127.0.0.1:8000/<project_key>
```

> **Note:** Read more about Sentry configuration [here](/config/sentry.html).

## Inspector Configuration

To use Inspector with your project, format your DSN like this:

```dotenv
INSPECTOR_URL=http://inspector:<project_key>@127.0.0.1:8000
INSPECTOR_API_KEY=<secret_key>
```

> **Note:** Read more about Inspector configuration [here](/config/inspector.html).

## Xhprof Profiler Configuration

To set up the Profiler, use this:

```dotenv
PROFILER_ENDPOINT=http://profiler:<project_key>@127.0.0.1:8000
```

> **Note:** Read more about Xhprof Profiler configuration [here](/config/xhprof.html).

## Ray Configuration

For Ray, use these settings:

```dotenv
RAY_HOST=ray:<project_key>@127.0.0.1
RAY_PORT=8082
```

## VarDumper Configuration

At this moment, VarDumper does not support projects.

## Monolog Configuration

At this moment, Monolog does not support projects.