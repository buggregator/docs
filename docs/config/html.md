---
llms_description: "HTML pages, since server [version: to fill]: event type html carries the sender's own markup, shown in a sandboxed iframe (the sender's CSS and JavaScript run on the event page, not on the feed card, which shows markup and CSS only; no same-origin: no access to Buggregator cookies, token or API; ingestion stays open, so do not send pages that post new html events in a loop). Send: POST to http://html@host:8000 (project: html:<project>@host) with Content-Type text/html; or POST /html or /html/<project>; or header X-Buggregator-Event: html. JSON {\"title\",\"html\"} only with Content-Type application/json, else the body is stored as markup. Charset from Content-Type converted to UTF-8. Title: JSON title, else the page's <title>, else empty (max 300 chars). Limits: 1 MB; empty markup, body over 1 MB or bad JSON → 400. Payload {title, html, size}; preview {title, size, text (visible text, 300 chars), html when ≤32 KB else truncated:true}. Search ?q= finds title and visible text (not script text). An untyped POST to /html/... is an html event, not an HTTP dump. UI: feed card = picture of the page with CSS, no scripts, «Open the page» (over 32 KB: text only); event page tabs Preview (page as is, full height, scripts run) and Source; menu Dumps › HTML pages; Ray ray()->html() shown as a page, no scripts. API requests with Origin: null (the sandboxed page) get 403; ingestion accepts them. Off: modules.html: false or leave html out of CLIENT_SUPPORTED_EVENTS. API: GET /api/events?type=html; MCP event_get."
---

# HTML Pages

Send your own HTML to Buggregator, and it shows the page next to your other events. Example: a nightly job sends a
short report with a link to the full results, and you see it in the feed the next morning.

Use it for anything Buggregator has no special screen for: a report with its own styles and scripts, a link to a
tool's page, a summary of a test run, a new kind of event you are trying out.

Available since server `[version: to fill]`.

## Send a page

One request with the markup. The page's `<title>` becomes the card's title.

```bash
curl -X POST http://html@localhost:8000 \
  -H 'Content-Type: text/html' \
  --data '<title>Nightly report</title><h1>All green</h1><a href="https://example.com">full results</a>'
# {"status":true}
```

To put it in a [project](/config/projects), add the project key to the address: `http://html:shop@localhost:8000`.
Or post to a path instead, which also works from tools that cannot put a name in the address:

```bash
curl -X POST http://localhost:8000/html/shop \
  -H 'Content-Type: text/html' \
  --data '<h1>Checkout experiment</h1><p>Variant B</p>'
```

You can also mark any request with the header `X-Buggregator-Event: html`.

### Set the title yourself

Send JSON with `Content-Type: application/json`:

```bash
curl -X POST http://localhost:8000/html/shop \
  -H 'Content-Type: application/json' \
  --data '{"title": "Checkout experiment", "html": "<p>Variant B</p>"}'
```

Without that content type, Buggregator stores the JSON text itself as the page.

### From PHP

```php
$html = '<title>Import finished</title><p>1 204 rows, 3 skipped</p>';

file_get_contents('http://buggregator:8000/html', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: text/html; charset=utf-8',
        'content' => $html,
    ],
]));
```

Here `buggregator` is the Buggregator service name in Docker Compose. Use `localhost` when your app runs on the same
machine.

## What you see

- **In the feed:** a card with a small picture of your page, with its CSS, and **Open the page**. Click the card to
  open the event. A page over 32 KB shows its text in the feed instead of the picture.
- **The event page:** **Preview** shows your page as it is, at its full height. **Source** shows the markup.
- **Menu:** **Dumps › HTML pages** lists only these events.
- **Ray:** `ray()->html('<b>…</b>')` shows as a page with its CSS. Its scripts do not run.

![HTML pages in the feed](/images/html-feed.webp)

### Your scripts and styles run

Your page runs as it would in a browser tab: its CSS and JavaScript work, so you can lay out a real report. Example:
a page that draws a chart with a script shows the chart.

It runs in a sandbox, apart from Buggregator. The page cannot read Buggregator's cookies, storage or your sign-in,
and it cannot change the Buggregator page around it. A request from the page to Buggregator's API is refused with
`403`.

Scripts run only when you open the event. In the feed, the card shows the markup and CSS without scripts, so a busy
feed stays fast.

::: warning Do not send events from the page itself
Sending events to Buggregator stays open, also from a script. A page whose script sends a new HTML event each time it
opens can fill the feed in a loop. Keep such scripts out of the pages you send.
:::

Search finds a page by its title and visible text. Text inside scripts and styles is not searched.

## Limits

- Up to 1 MB per page. A larger body gets `400` with `html: body over 1 MB`.
- An empty page gets `400` with `html: empty markup`.
- Broken JSON, or JSON that is not an object, gets `400`. JSON without `html` gets `400` with `html: empty markup`.
  Other fields are ignored.
- A title is cut at 300 characters.
- Since this module exists, a POST to `/html/…` without a type is an HTML page, not an [HTTP dump](/config/http-dumps).

## Turn it off

```yaml
modules:
  html: false
```

Or leave `html` out of `CLIENT_SUPPORTED_EVENTS`. See [Server settings](/config/server).

## API

`GET /api/events?type=html` lists the pages. Each event's `payload` is `{"title", "html", "size"}`; `size` is in
bytes. The MCP tool `event_get` returns the same, so an AI assistant can read the page too.
