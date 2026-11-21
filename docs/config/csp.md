---
llms_description: "CSP and Reporting API reports, since server [version: to fill]: event type csp. POST /csp or /csp/<project>; also any POST with Content-Type application/csp-report or application/reports+json not claimed by another module. Formats: report-uri (application/csp-report, one report) and Reporting API (application/reports+json, a list: csp-violation, deprecation, intervention…), one event per request. Project: /csp/<project>, csp:<project>@host userinfo (curl/scripts only; browsers drop userinfo), or X-Buggregator-Event: csp + X-Buggregator-Project (the project header alone goes to default); an unknown project key creates that project. CORS preflight answered (204, *). Limits: body 1 MB; empty list or non-report JSON → 400. Off: modules.csp: false or leave csp out of CLIENT_SUPPORTED_EVENTS. report-to needs https or localhost on both sides; over plain http use report-uri. Deprecation/intervention reports go only to the endpoint named default. API: GET /api/events?type=csp."
---

# CSP Reports

A Content Security Policy (CSP) tells the browser which scripts, styles and images a page may load. When the browser
blocks something, it can send a report. Buggregator catches these reports, so you see what your policy blocks while
you write it, before your users do.

It also catches other browser reports from the Reporting API, for example a warning that your page uses a deprecated
feature.

Available since server `[version: to fill]`.

## Setup

Point the browser's reports at Buggregator. The address is `http://localhost:8000/csp/<project>`, where `<project>`
is a [project](/config/projects) key; leave out `/<project>` for the default project.

### report-uri (works everywhere)

Add `report-uri` to your policy. Start with `Report-Only`: the browser reports but blocks nothing.

```http
Content-Security-Policy-Report-Only: default-src 'self'; report-uri http://localhost:8000/csp/shop
```

### report-to (Reporting API)

The newer way. One header names the endpoints, the policy points at one of them:

```http
Reporting-Endpoints: buggregator="http://localhost:8000/csp/shop", default="http://localhost:8000/csp/shop"
Content-Security-Policy: default-src 'self'; report-to buggregator
```

- The endpoint named `default` also gets the deprecation and intervention reports. Browsers send those only there.
- `report-to` works only when both your app and the Buggregator address are https or `localhost`. Over plain http,
  for example `http://buggregator:8000` from Docker, the browser drops the reports without an error. Use
  `report-uri` there. You can set both.

### Laravel

With [spatie/laravel-csp](https://github.com/spatie/laravel-csp), in `.env`:

```dotenv
CSP_REPORT_URI=http://localhost:8000/csp/shop
```

### Try it with curl

```bash
curl -X POST http://localhost:8000/csp/shop \
  -H 'Content-Type: application/csp-report' \
  -d '{"csp-report":{"document-uri":"https://shop.test/checkout","effective-directive":"script-src-elem","blocked-uri":"https://cdn.example.com/x.js","disposition":"enforce"}}'
# {"status":true}
```

## What you see

- **The feed** gets one card per request: the page, then one line per report (for example «script-src-elem
  blocked https://cdn.example.com/x.js»). Report-only violations get a badge.
- **The event page** shows each report: the directive, the blocked resource, the file with line and column, the code
  sample and the message. Below are the full policy and the raw report.
- **CSP reports** in the menu lists only these events.

A Reporting API request can carry several reports, for example a violation and a deprecation. They become one event
with several reports.

## Projects

Choose the project with one of:

- the path: `/csp/shop`;
- headers: `X-Buggregator-Event: csp` and `X-Buggregator-Project: shop`. The project header alone is not enough;
- from curl or a script only, the address: `http://csp:shop@localhost:8000/`. Browsers drop the `csp:shop@` part
  from `report-uri` and `report-to`.

An unknown project key creates that project. Leave out `/<project>` for `default`.

## Details

- Buggregator also catches a POST to any other path when its `Content-Type` is `application/csp-report` or
  `application/reports+json`, unless the request is meant for another module.
- Browsers may first send a CORS check (`OPTIONS`); Buggregator answers it.
- A report body may be at most 1 MB. An empty list or JSON that is not a report gets `400`.
- API: `GET /api/events?type=csp`.
- Turn it off with `modules.csp: false` in `buggregator.yaml`, or leave `csp` out of `CLIENT_SUPPORTED_EVENTS`.
