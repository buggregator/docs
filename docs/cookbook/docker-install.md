---
llms: "optional"
llms_description: "Docker Compose dev environment setup: git clone, docker compose up --build. Starts Buggregator Go server with a Laravel example app (port 8080). Access at localhost:8000. Requires Go 1.26+, Make."
---

# Cookbook — Dev environment using Docker Compose

This guide will help you quickly set up a local development environment for Buggregator.

## 1. Clone the Repository

Start by cloning the repository:

```bash
git clone git@github.com:buggregator/server.git
cd server
```

> **Note:** If you don't have access, fork the repository and clone your fork instead.

## 2. Start with Docker Compose

The repository has a `docker-compose.yaml` with the Buggregator server and a Laravel example app that sends
every kind of event.

```bash
docker compose up --build
```

This will:

- Build the Buggregator image from the `Dockerfile`
- Start the Buggregator server
- Start the example app for testing features

> The example app mounts code from an `examples` checkout next to `server` (`../examples/app`,
> `../examples/routes`, `../examples/resources`, `../examples/config/sentry.php`). Clone it first:
>
> ```bash
> git clone git@github.com:buggregator/examples.git ../examples
> ```

> The compose file mounts `../frontend/dist` and sets `FRONTEND_DIR`, so the server serves a frontend build
> from a `frontend` checkout next to `server`. Build it there first (`yarn install && yarn build:prod`), or remove
> those two lines to use the embedded UI.

## 3. Access the Application

Once the server is up:

- **Buggregator:** http://localhost:8000
- **Example app:** http://localhost:8080

## 4. Development without Docker

If you prefer to develop without Docker, you need:

- **Go 1.26+**
- **Make**
- **PHP and Composer** — `make build` compiles the VarDumper parser from `php/vardumper` the first time.
  The server itself does not need PHP to run.

```bash
# Build and run
make build
make run

# Or just compile
go build ./cmd/buggregator

# Run tests
go test ./...
```

### Frontend Development

The frontend is a pre-built SPA that gets embedded into the binary during the build process. To develop
the frontend separately:

```bash
git clone git@github.com:buggregator/frontend.git
cd frontend
yarn install
yarn build:prod      # writes the build to dist/
```

Then let Buggregator serve that build instead of the embedded one:

```bash
FRONTEND_DIR=/path/to/frontend/dist ./buggregator
```

For live reload while you work on the UI, see [Contributing → Frontend](/contributing/frontend).

## 5. Stop the Server

```bash
# If using Docker Compose
docker compose down

# If running directly
Ctrl+C
```

---

That's it! Your Buggregator dev environment is ready.
