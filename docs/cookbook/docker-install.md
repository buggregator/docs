---
llms: "optional"
llms_description: "Docker Compose dev environment setup: git clone, make build, make run. Starts Buggregator Go server with example services. Access at localhost:8000. Requires Go 1.26+, Make."
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

## 2. Build and Start

The repository includes a Docker Compose setup for a local development environment, including the Buggregator server
and example services.

### Build

```bash
make build
```

### Start the Server

```bash
make run
```

This will:

- Build the Buggregator Go binary
- Start the Buggregator server
- Launch example services for testing features

## 3. Access the Application

Once the server is up:

- **Buggregator:** http://localhost:8000

## 4. Development without Docker

If you prefer to develop without Docker, you need:

- **Go 1.26+**
- **Make**

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
yarn dev
```

Then point Buggregator at the frontend dev server:

```bash
FRONTEND_DIR=/path/to/frontend/dist ./buggregator
```

## 5. Stop the Server

```bash
# If using Docker Compose
make down

# If running directly
Ctrl+C
```

---

That's it! Your Buggregator dev environment is ready.
