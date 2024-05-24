# Configuration — External Database

Buggregator typically uses [DoltDB](https://github.com/dolthub/dolt) by default, which is a MySQL-compatible server.
However, for those who need more flexibility or plan to scale up, Buggregator also supports external databases such as
PostgreSQL and MySQL for data storage.

This guide will walk you through how to set up and configure an external database with Buggregator.

> **Warning**: Buggregator cannot work with SQLite. SQLite’s architecture does not support non-blocking, asynchronous
> operations.

## PostgreSQL

Here’s how you can configure PostgreSQL:

> **Warning**: Buggregator doesn’t create the database; it only sets up the tables inside it.

```dotenv
PERSISTENCE_DRIVER=db # database or cycle are also supported as an alias for db

DB_DRIVER=pgsql
DB_DATABASE=buggregator
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=homestead
DB_PASSWORD=secret
```

## MySQL

Provide the connection details specific to the type of database you are using.

> **Warning**: Buggregator doesn’t create the database; it only sets up the tables inside it.

```dotenv
PERSISTENCE_DRIVER=db # database or cycle are also supported as an alias for db

DB_DRIVER=mysql
DB_DATABASE=buggregator
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USERNAME=homestead
DB_PASSWORD=secret
```

## Migrations

Buggregator automatically runs migrations when it starts. However, if you encounter any issues with the automatic
migrations, or if they were not executed for some reason, you can run them manually:

1. **Connect to the container:**
   Depending on your setup, you might use Docker, Kubernetes, or any other container service.

   For example, if you are using Docker, you can use the following command:

   ```bash
    docker exec -it buggregator /bin/bash
   ```

   Replace `buggregator` with the name of your container.

   If you are using Kubernetes, you can use the following command:

   ```bash
    kubectl exec -it buggregator -- /bin/bash
    ```

   Replace `buggregator` with the name of your pod.


2. **Run the migration command:**
   Within the container, execute the following command to force the migrations:

   ```bash
   php app.php migrate --force
   ```

   This command forcefully runs the migrations regardless of the current state, ensuring that all necessary tables are
   properly set up in the database.

## Docker compose example

Here’s an example of a `docker-compose.yml` file that sets up a PostgreSQL database for Buggregator:

```yaml
version: '3.9'

services:
  buggregator:
    image: ghcr.io/buggregator/server:latest
    depends_on:
      buggregator-database:
        condition: service_healthy
    ports:
      - 127.0.0.1:8000:8000
    environment:
      PERSISTENCE_DRIVER: db
      DB_DRIVER: pgsql
      DB_DATABASE: buggregator
      DB_HOST: buggregator-database
      DB_PORT: 5432
      DB_USERNAME: root
      DB_PASSWORD: secret

  buggregator-database:
    image: postgres:latest
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready --username=buggregator --dbname=buggregator" ]
      interval: 3s
      timeout: 3s
      retries: 1
    environment:
      POSTGRES_DB: buggregator
      POSTGRES_USER: root
      POSTGRES_PASSWORD: secret
```