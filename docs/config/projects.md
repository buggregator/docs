---
llms_description: "Multi-project support: configured in buggregator.yaml with key/name pairs. Default project key 'default'. Per-project DSN formats for Sentry (http://key@host/project_key), Inspector (inspector:project_key@host), XHProf (profiler:project_key@host), Ray (ray:project_key@host). Monolog and VarDumper: a 'project' key in the record or dump context. Mock server: X-Buggregator-Project header or Basic Auth mock:project_key. Unknown project keys are added on the first event card (not by Sentry traces/logs/metrics alone)."
---

# Configuration — Projects

Buggregator lets you use "projects" to help organize your data. Projects are useful for keeping events from
different teams, applications, or environments separate.

![image](https://github.com/user-attachments/assets/cde794f7-83fb-4708-9eef-713c6f8be7cc)

**Here's why you might want to use projects:**

1. Projects help you keep data from different teams or parts of your app separate. This means it's easier to find what
   you're looking for and keep track of changes.
2. Teams won't get mixed up with data that isn't relevant to them, which makes their work faster and less confusing.
3. The sidebar displays a project selector dropdown, allowing you to quickly switch between projects and view only
   the events relevant to the selected project.

### Default Project

When you start the server, Buggregator automatically sets up a default project with key `default`. All your data goes
into this `default` project if a project key is not specified in the request.

## Configuration

Projects are configured in `buggregator.yaml`:

```yaml
projects:
  - key: my-app
    name: My Application
  - key: staging
    name: Staging Environment
  - key: mobile
    name: Mobile App
```

### Docker Compose Example

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    ports:
      - 127.0.0.1:8000:8000
    volumes:
      - ./buggregator.yaml:/buggregator.yaml
```

With `buggregator.yaml`:

```yaml
projects:
  - key: backend
    name: Backend API
  - key: frontend
    name: Frontend App
```

## Sentry Configuration

To use Sentry with your project, format your DSN like this:

```dotenv
SENTRY_DSN=http://sentry@127.0.0.1:8000/<project_key>
```

A numeric last segment (`/1`) is the SDK's own project id and sends events to `default`. If your SDK accepts
only numbers there, send both `X-Buggregator-Event: sentry` and `X-Buggregator-Project: <project_key>`; the
project header alone is ignored for Sentry SDK requests.

> **Note:** Read more in [Sentry → Projects](/config/sentry.html#projects).

## Mock Server

Rules can be limited to one project, and requests choose their project with the `X-Buggregator-Project`
header or Basic Auth `mock:<project_key>`. See [Mock Server → Projects](/config/mock-server.html#projects).

## Projects created on the fly

A project key that is not in `buggregator.yaml` is added to the list when its first event card arrives, with
the key as its name. Example: an error sent to `http://sentry@127.0.0.1:8000/billing` adds the project
`billing`. Sentry traces, logs and metrics make no card, so a project that gets only those is not added: list it
in `buggregator.yaml`.

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
RAY_PORT=8000
```

## VarDumper Configuration

A dump goes to the project named by the `project` key of its context. A plain `dump()` has no such key, so it
lands in `default`.

## Monolog Configuration

A log record goes to the project named by `project` in its context:

```php
$logger->error('Payment failed', ['project' => 'shop']);
```

Records without it land in `default`.
