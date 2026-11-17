---
llms_description: "Node.js / TypeScript guide: buggregator service in docker-compose (ghcr.io/buggregator/server:2.11.0, only port 8000 published); nodemailer createTransport host buggregator port 1025 secure false; @sentry/node init dsn http://sentry@buggregator:8000/1, tracesSampleRate 1.0, enableLogs true (Sentry.logger.* → Logs tab); webhooks from Stripe/GitHub: point them at Buggregator as HTTP dumps (any unmatched POST or PUT is stored). Checked with @sentry/node 11.13, nodemailer 10.6, Node 22, server 2.10.0."
---

# Node.js

Run Buggregator next to your Node app. It catches mail sent with nodemailer, plus errors, traces and logs from the
Sentry SDK.

Checked with @sentry/node 11.13, nodemailer 10.6 and Node 22 against Buggregator 2.10.0.

## 1. Add the service

In `docker-compose.yml`, under `services:`:

```yaml
  buggregator:
    image: ghcr.io/buggregator/server:2.11.0
    ports:
      - "127.0.0.1:8000:8000"
```

Your app container reaches it by the service name `buggregator`. Node runs on your machine? Also publish
`"127.0.0.1:1025:1025"` and use `127.0.0.1` instead of `buggregator` below.

## 2. Point your app at it

### Mail (nodemailer)

```javascript
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "buggregator",
  port: 1025,
  secure: false,
});
```

No user or password is needed.

### Errors, traces and logs (Sentry)

Install the SDK: `npm install @sentry/node`. Initialize it before anything else:

```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "http://sentry@buggregator:8000/1",
  tracesSampleRate: 1.0,
  enableLogs: true,
});
```

`Sentry.logger.info("Order paid")` then shows up on the Sentry page, **Logs** tab.

### Webhooks (Stripe, GitHub, …)

To see what a webhook sends, point it at Buggregator: any `POST` or `PUT` request that is not Sentry or another
known format is stored as an [HTTP dump](/config/http-dumps). For example, `curl -X POST http://127.0.0.1:8000/stripe -d '{"type":"charge.succeeded"}'`.
A service on the internet cannot reach your machine by itself: use its CLI (e.g. `stripe listen
--forward-to http://127.0.0.1:8000/stripe`) or a tunnel.

## 3. Check it

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). Then run:

```javascript
const Sentry = require("@sentry/node");
Sentry.init({ dsn: "http://sentry@buggregator:8000/1", tracesSampleRate: 1.0, enableLogs: true });
const nodemailer = require("nodemailer");

(async () => {
  const transporter = nodemailer.createTransport({ host: "buggregator", port: 1025, secure: false });
  await transporter.sendMail({ from: "app@example.com", to: "dev@example.com", subject: "Check", text: "Hello" });
  Sentry.logger.info("Hello from Node");
  Sentry.captureException(new Error("Check error"));
  await Sentry.flush(3000);
})();
```

You should now see an email «Check» and a Sentry error «Check error». The Sentry page, **Logs** tab, shows
«Hello from Node».

## See also

[SMTP](/config/smtp) · [Sentry → Node.js](/config/sentry#node-js) · [HTTP Dumps](/config/http-dumps)
