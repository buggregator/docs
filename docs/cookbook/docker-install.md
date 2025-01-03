# Cookbook — Dev environment using docker compose

Hey, developer! 🎉 This guide will help you quickly set up a local dev environment for Buggregator.

## 1. Clone the Repository

Start by cloning the repository:

```bash
git clone git@github.com:buggregator/server.git
cd server
```

> **Note:** If you don't have access, fork the repository and clone your fork instead.

## 2. Install Dependencies

Run the following to install PHP dependencies:

```bash
composer install
```

## 3. Build and Start the Docker Environment

The repository includes a Docker Compose setup for a local development environment, including the Buggregator server,
PostgreSQL, and service with examples.

### Build Docker Images

```bash
make build
```

### Start the Server

```bash
make up
```

> **Note:** Make sure you have make installed on your system. If not, you need to install it first.

This will:

- Start the Buggregator server.
- Spin up a PostgreSQL database.
- Launch the example server for testing features.

#### Mounted Directories in Docker Setup

The Docker Compose setup uses **mounted directories** to ensure that changes made to your local files are immediately
reflected inside the running containers. This makes development faster and more seamless.

1. **Application Code**  
   Local directory: `./app`  
   Mounted in the container: `/app/app`

2. **Runtime Files**  
   Local directory: `./runtime`  
   Mounted in the container: `/app/runtime`

3. **Vendor Directory**  
   Local directory: `./vendor`  
   Mounted in the container: `/app/vendor`

## 4. Access the Application

Once the server is up, you can access the following:

- **Buggregator:** [http://buggregator.localhost](http://buggregator.localhost)
- **Examples:** [http://examples.buggregator.localhost](http://examples.buggregator.localhost)

## 5. Environment Configuration (Optional)

The default `.env` file is pre-configured, but you can customize it if needed:

```bash
cp .env.sample .env
```

## 6. Stop the Server

To stop the server and clean up, run:

```bash
make down
```

> **Note:** If any services like PostgreSQL don't stop, you can manually kill them with `docker ps` and `docker kill`.

---

That's it! 🚀 Your Buggregator dev environment is ready. Happy coding! 😊