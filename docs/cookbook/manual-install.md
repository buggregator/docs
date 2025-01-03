# Cookbook — Manual install dev environment

Hey, developer! 🎉 This guide will help you quickly set up a local dev environment for Buggregator.

## Clone the Repository

First of all you need to clone the repository to your local machine.

```bash
git clone git@github.com:buggregator/server.git
```

> **Note**: If you don't have access to the repository, you can fork it and clone your forked repository.

## Install Dependencies

After cloning the repository, navigate to the project directory and install the dependencies.

```bash
composer install
```

## Install RoadRunner

Buggregator uses RoadRunner as an application server. To install RoadRunner, run the following command:

```bash
./vendor/bin/rr get
```

## Download required binaries

Buggregator requires some binaries to be downloaded.

- Centrifugo server for Websockets
- DoltDB for local database

To download these binaries, run the following command:

```bash
cd ./bin
chmod +x ./get-binaries.sh
./get-binaries.sh
```

This script will download the required binaries to the `./bin` directory.

## Create a new local database

Buggregator uses DoltDB as a local database. To create a new database, run the following command:

```bash
mkdir .db
./bin/dolt --data-dir=.db sql -q "create database buggregator;"
```

## Configure the Environment

Create a new `.env` file in the project root directory:

```bash
cp .env.sample .env
```

Generate a new application key:

```bash
php app.php encrypt:key --mount=.env
```

Update the `.env` file with your configuration settings.

```dotenv
# Queue
QUEUE_CONNECTION=roadrunner

# Broadcast
BROADCAST_CONNECTION=centrifugo

# Monolog
MONOLOG_DEFAULT_CHANNEL=roadrunner
MONOLOG_DEFAULT_LEVEL=DEBUG

# Database
PERSISTENCE_DRIVER=db
DB_DRIVER=mysql # mysql, pgsql
DB_DATABASE=buggregator
DB_HOST=127.0.0.1
DB_USERNAME=root
DB_PASSWORD=

# Turn off cache for tokenizer
TOKENIZER_CACHE_TARGETS=false
```

## Start the Application

To start the application, run the following command:

```bash
./rr serve
```

RoadRunner will start the application server and also Centrifugo and DoltDB servers.

> **Warning**: In some cases when you stop the application, the Centrifugo or DoltDB servers may not stop. Kill them
> manually using the following commands:

```bash
killall centrifugo
killall dolt
killall php
```

When the application is running, you can access it at `http://localhost:8082`.


---

Now you have successfully set up your development environment for Buggregator. Happy coding! 🚀