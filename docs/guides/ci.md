---
llms_description: "Buggregator in CI: service container ghcr.io/buggregator/server:2.11.0. GitHub Actions: services.buggregator with ports 8000:8000, 1025:1025, the job uses localhost. GitLab CI: services name + alias buggregator, the job uses buggregator. Test flow: wait for GET /api/version, DELETE /api/events, run the app's tests with SMTP and Sentry DSN pointed at Buggregator, assert with GET /api/smtp/messages/wait (200/408) and GET /api/events?type=sentry. Working example: examples/ci/smoke_test.py (Python stdlib) in buggregator/server, run against 2.10.0 on a docker network."
---

# Use in CI

Run Buggregator as a service container next to your tests. Your app sends mail and errors to it as usual. Your
tests then ask Buggregator's API what arrived: «was the welcome email sent?», «did the payment error reach Sentry?».

## The flow

1. Start Buggregator as a service.
2. Wait until `GET /api/version` answers.
3. Clear old events: `DELETE /api/events`.
4. Run the code under test, with its SMTP host and Sentry DSN pointed at Buggregator.
5. Assert: `GET /api/smtp/messages/wait?subject=…` for an email, `GET /api/events?type=sentry` for errors.

The calls are on [API reference → Calls for tests](/api#calls-for-tests).

## GitHub Actions

The service's ports are published on the runner, so the job uses `localhost`:

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    services:
      buggregator:
        image: ghcr.io/buggregator/server:2.11.0
        ports:
          - 8000:8000 # HTTP: API, Sentry, …
          - 1025:1025 # SMTP
    env:
      MAIL_HOST: localhost
      MAIL_PORT: 1025
      SENTRY_DSN: http://sentry@localhost:8000/1
    steps:
      - uses: actions/checkout@v4
      - run: ./run-your-tests
```

## GitLab CI

The service gets an alias, and the job reaches it by that name:

```yaml
tests:
  image: python:3.12-slim
  services:
    - name: ghcr.io/buggregator/server:2.11.0
      alias: buggregator
  variables:
    MAIL_HOST: buggregator
    MAIL_PORT: "1025"
    SENTRY_DSN: http://sentry@buggregator:8000/1
  script:
    - ./run-your-tests
```

## A working example

[`examples/ci/smoke_test.py`](https://github.com/buggregator/server/tree/master/examples/ci) in the server
repository is a complete test in plain Python (no packages). It waits for the server, clears events, sends an email
and a Sentry event, and checks both through the API. It reads `BUGGREGATOR_URL` (default `http://localhost:8000`)
and `BUGGREGATOR_SMTP` (default `localhost:1025`).

```text
buggregator 2.11.0
mail ok: Welcome 435a10d5
sentry ok: Payment failed d8066d72
```

Copy its asserts into your own suite. The server repository runs it on GitHub Actions in every pull request that changes the example.

## Tips

- **Pin the version** (`2.11.0`), so a new release does not change your CI by surprise.
- **One server per job.** Events of parallel jobs would mix. If jobs share one server, give each its own
  [project](/config/projects) and clear only that one: `DELETE /api/events` with `{"project": "job-42"}`.
- **No SSO in CI.** Then the API needs no token.
