---
llms_description: "Spring Boot / Java guide: buggregator service in docker-compose (ghcr.io/buggregator/server:2.10.0, only port 8000 published); application.properties spring.mail.host=buggregator, spring.mail.port=1025; Sentry starter (io.sentry:sentry-spring-boot-4-starter for Boot 4, sentry-spring-boot-starter-jakarta for Boot 3) with sentry.dsn=http://sentry@buggregator:8000/1, sentry.traces-sample-rate=1.0, sentry.logs.enabled=true. Sentry Java SDK io.sentry:sentry 8.64 checked against server 2.10.0 (error, transaction, log); the Spring Boot starter itself not run."
---

# Spring Boot

Run Buggregator next to your Spring Boot app. It catches mail from `JavaMailSender` and errors, traces and logs
from the Sentry Java SDK.

The Sentry Java SDK 8.64 (`io.sentry:sentry`) was checked against Buggregator 2.10.0: errors, transactions and
logs arrive. The Spring Boot starter, which is built on it, was not run itself.

## 1. Add the service

In `docker-compose.yml` (or `compose.yaml`), under `services:`:

```yaml
  buggregator:
    image: ghcr.io/buggregator/server:2.10.0
    ports:
      - "127.0.0.1:8000:8000"
```

Your app container reaches it by the service name `buggregator`. The app runs on your machine (`./mvnw
spring-boot:run`, your IDE)? Also publish `"127.0.0.1:1025:1025"` and use `127.0.0.1` instead of `buggregator`
below.

## 2. Point Spring Boot at it

Use a local profile, e.g. `application-local.properties`, so these lines never reach production.

### Mail

```properties
spring.mail.host=buggregator
spring.mail.port=1025
```

No user, password or TLS is needed. Mail sent with `JavaMailSender` now lands in Buggregator.

### Errors, traces and logs (Sentry)

Add the starter for your Spring Boot version, with the same version as the Sentry SDK:

| Spring Boot | Artifact |
|-------------|----------|
| 4.x | `io.sentry:sentry-spring-boot-4-starter` |
| 3.x | `io.sentry:sentry-spring-boot-starter-jakarta` |

```properties
sentry.dsn=http://sentry@buggregator:8000/1
sentry.traces-sample-rate=1.0
sentry.logs.enabled=true
```

## 3. Check it

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Then call the SDK once, e.g. from a test endpoint or a
`CommandLineRunner`:

```java
Sentry.logger().info("Hello from Spring Boot");
Sentry.captureException(new IllegalStateException("Check error"));
```

You should now see a Sentry error «Check error», and «Hello from Spring Boot» on the Sentry page, **Logs** tab. Send
any email from the app: it shows up on the SMTP page.

## See also

[SMTP](/config/smtp) · [Sentry](/config/sentry)
