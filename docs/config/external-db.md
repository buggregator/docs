# Configuration — External Database

Buggregator supports the configuration of external databases for storing events, allows for greater flexibility and
scalability in handling event data.

## Configuration Overview

Events in Buggregator are traditionally stored in local in-memory storage by default. After release 1.7.0, users can
opt to store events in external databases like **MongoDB** or **PostgreSQL**. This configuration is managed via
environment variables, enabling easy integration and setup.

Buggregator supports the following databases:

- PostgreSQL
- MongoDB

To use an external database, set the `PERSISTENCE_DRIVER` environment variable to `database` for PostgreSQL or `mongodb`
for MongoDB.

## PostgreSQL

Provide the connection details specific to the type of database you are using.

```dotenv
PERSISTENCE_DRIVER=database

DB_DRIVER=pgsql
DB_DATABASE=buggregator
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=homestead
DB_PASSWORD=secret
```

### Ensuring the Database is Ready

Before starting Buggregator, make sure that the database is already created and accessible as specified in your
environment settings.

> **Warning**: Buggregator does not create the database itself; it only creates the tables within the existing
> database.

### Running Migrations

Buggregator automatically runs migrations when it starts. However, if you encounter any issues with the automatic
migrations, or if they were not executed for some reason, you can run them manually:

1. **Connect to the Buggregator container:**
   Depending on your setup, you might use Docker, Kubernetes, or any other container service. Use the appropriate
   command to access the shell of the running Buggregator container.

   For example, if you are using Docker, you can use the following command:

   ```bash
    docker exec -it buggregator /bin/bash
   ```

   Replace `buggregator` with the name of your Buggregator container.

   If you are using Kubernetes, you can use the following command:

   ```bash
    kubectl exec -it buggregator -- /bin/bash
    ```

   Replace `buggregator` with the name of your Buggregator pod.


2. **Run the migration command:**
   Within the Buggregator container, execute the following command to force the migrations:

   ```bash
   php app.php migrate --force
   ```

   This command forcefully runs the migrations regardless of the current state, ensuring that all necessary tables are
   properly set up in the database.

## MongoDB

Provide the connection details specific to the type of database you are using.

```dotenv
PERSISTENCE_DRIVER=mongodb
MONGODB_CONNECTION=mongodb://127.0.0.1:27017
MONGODB_DATABASE=buggregator
```