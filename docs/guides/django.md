---
llms_description: "Django / Python guide: buggregator service in docker-compose (ghcr.io/buggregator/server:2.11.0, only port 8000 published); Django settings EMAIL_BACKEND smtp, EMAIL_HOST=buggregator, EMAIL_PORT=1025; sentry-sdk init with dsn http://sentry@buggregator:8000/1, traces_sample_rate=1.0, enable_logs=True: Python logging records at INFO and above go to the Sentry Logs tab (no separate log integration), but only those that pass the logger's level: WARNING by default, set LOGGING root level INFO to send info(). Plain Python: smtplib to port 1025. Checked with Django 6.1, sentry-sdk 2.75, Python 3.12, server 2.10.0."
---

# Django and Python

Run Buggregator next to your Django app. It catches outgoing mail, errors, traces and log records.

Checked with Django 6.1, sentry-sdk 2.75 and Python 3.12 against Buggregator 2.10.0.

## 1. Add the service

In `docker-compose.yml`, under `services:`:

```yaml
  buggregator:
    image: ghcr.io/buggregator/server:2.11.0
    ports:
      - "127.0.0.1:8000:8000"
```

Your app container reaches it by the service name `buggregator`. Django runs on your machine
(`manage.py runserver`)? Also publish `"127.0.0.1:1025:1025"` and use `127.0.0.1` instead of `buggregator` below.

## 2. Point Django at it

### Mail

In `settings.py`:

```python
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "buggregator"
EMAIL_PORT = 1025
```

No user, password or TLS is needed. Plain Python works the same way: `smtplib.SMTP("buggregator", 1025)`.

### Errors, traces and logs (Sentry)

Install the SDK: `pip install sentry-sdk`. In `settings.py`:

```python
import sentry_sdk

sentry_sdk.init(
    dsn="http://sentry@buggregator:8000/1",
    traces_sample_rate=1.0,
    enable_logs=True,
)
```

The SDK turns on its Django integration by itself.

With `enable_logs=True`, records from Python's standard `logging` go to Buggregator too, at INFO and above. You need
no other log handler. But the logger's own level comes first: without a `LOGGING` setting, Python drops INFO
records before the SDK sees them (the default level is WARNING). To send INFO, set the level in `settings.py`:

```python
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "root": {"level": "INFO"},
}
```

Then `logging.getLogger("app").info("Order paid")` shows up on the Sentry page, **Logs** tab.

## 3. Check it

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Then, in `python manage.py shell`:

```python
import logging, sentry_sdk
from django.core.mail import send_mail

send_mail("Check", "Hello from Django", "app@example.com", ["dev@example.com"])
logging.getLogger("app").warning("Hello from Django")
try:
    1 / 0
except ZeroDivisionError:
    sentry_sdk.capture_exception()
sentry_sdk.flush()
```

You should now see an email «Check» and a Sentry error `ZeroDivisionError`. The Sentry page, **Logs** tab, shows
«Hello from Django».

## See also

[SMTP](/config/smtp) · [Sentry → Python](/config/sentry#python)
