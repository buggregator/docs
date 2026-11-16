---
llms_description: "Vue / Nuxt / Next.js (browser) guide: buggregator service (ghcr.io/buggregator/server:2.10.0, port 8000 published to 127.0.0.1); browser code must use the published address http://sentry@127.0.0.1:8000/1, never the compose service name; server-side code in a container uses http://sentry@buggregator:8000/1. @sentry/vue init with app, browserTracingIntegration, tracesSampleRate 1.0, enableLogs — errors in components, Pageload trace and logs checked in headless Chrome (@sentry/vue 11.13, Vue 3.5); no CORS setup. @sentry/nuxt and @sentry/nextjs not run themselves (they wrap the browser and Node SDKs that were)."
---

# Vue, Nuxt and Next.js

Send errors, traces and logs from your frontend to Buggregator. The Sentry browser SDKs talk to it directly from
the page.

Checked with @sentry/vue 11.13 and Vue 3.5 in headless Chrome against Buggregator 2.10.0.

## 1. Run Buggregator

```yaml
services:
  buggregator:
    image: ghcr.io/buggregator/server:2.10.0
    ports:
      - "127.0.0.1:8000:8000"
```

Or [install the binary](/install) and run `buggregator`.

## 2. Pick the right address

Your frontend code runs in **your browser**, not in a container. The browser cannot resolve the compose service
name. So:

| Where the code runs | DSN |
|---------------------|-----|
| In the browser (Vue, client side of Nuxt and Next.js) | `http://sentry@127.0.0.1:8000/1` |
| On the server, in a container (Nuxt and Next.js server side) | `http://sentry@buggregator:8000/1` |
| On the server, on your machine (`npm run dev`) | `http://sentry@127.0.0.1:8000/1` |

No CORS setup is needed: by default Buggregator accepts requests from any origin. If you set `CORS_ORIGINS`,
include your app's origin.

## 3. Set up the SDK

### Vue

`npm install @sentry/vue`, then in `main.js`:

```javascript
import { createApp } from "vue";
import * as Sentry from "@sentry/vue";
import App from "./App.vue";

const app = createApp(App);

Sentry.init({
  app,
  dsn: "http://sentry@127.0.0.1:8000/1",
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 1.0,
  enableLogs: true,
});

app.mount("#app");
```

An error thrown in a component now shows up as a Sentry error. The page load shows up as a trace, and
`Sentry.logger.info(...)` lines on the **Logs** tab.

### Nuxt and Next.js

`@sentry/nuxt` and `@sentry/nextjs` have a client config and a server config; Next.js also has an edge config,
and its client file is `instrumentation-client.ts`. Set the same options in each, with the DSN from the table
above:

```javascript
Sentry.init({
  dsn: "http://sentry@127.0.0.1:8000/1", // server config in a container: http://sentry@buggregator:8000/1
  tracesSampleRate: 1.0,
  enableLogs: true,
});
```

Where the files live: [Nuxt SDK docs](https://docs.sentry.io/platforms/javascript/guides/nuxt/),
[Next.js SDK docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/). These two SDKs were not run against
Buggregator themselves. The browser and Node.js SDKs they are built on were.

## 4. Check it

Open [http://127.0.0.1:8000](http://127.0.0.1:8000), then open your app and run this in the browser console:

```javascript
setTimeout(() => { throw new Error("Check error"); });
```

The `setTimeout` makes it an uncaught error of the page, the kind the SDK reports.

You should now see a Sentry error «Check error» and, on the Sentry page, **Traces** tab, a «Pageload» trace.

## See also

[Sentry → Browser JavaScript](/config/sentry#browser-javascript) · [Node.js guide](/guides/node)
