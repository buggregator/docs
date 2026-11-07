---
llms_description: "Fake SMTP server on port 1025: captures outgoing emails with HTML preview (desktop/mobile viewport), plain text, addresses (From/To/CC/BCC), attachments, raw MIME source. Config for Laravel (MAIL_HOST/MAIL_PORT), Spiral (MAILER_DSN), Symfony, Magento 2, WordPress (mu-plugin phpmailer_init hook). Testing API for e2e tests: GET /api/smtp/cursor, /api/smtp/messages (filters to, from, cc, subject, subject_contains, subject_regex, body_contains, project, since, until; order, limit, offset), /api/smtp/messages/wait (long poll, timeout max 60s, 408), /api/smtp/stats, DELETE /api/smtp/messages, /api/smtp/message/{uuid}/raw|links|codes; X-Auth-Token with SSO."
---

# SMTP — Email Testing

Your app sends emails — registration confirmations, password resets, notifications. You need to verify they look
correct without actually delivering them. Buggregator includes a fake SMTP server: point your app's mail config at
port `1025` and every email shows up in the UI. No Mailhog, no Mailtrap, no external services — just another
module in the same Buggregator instance where you already see your logs and exceptions.

![A captured email with HTML preview](/images/smtp.webp)

## Use cases

- **Email template testing** — preview HTML emails with a desktop/mobile viewport switcher to check responsive layouts.
- **Transactional email verification** — make sure the right recipients, subject, and content are set before going to production.
- **Attachment testing** — verify that attachments are generated correctly and can be downloaded.
- **All in one place** — see emails next to the exceptions, logs, and dumps from the same request flow.

## What you see in the UI

- **HTML preview** — rendered email with desktop/mobile device viewport switcher.
- **Plain text** — the plain text version of the email.
- **Addresses** — From, To, CC, BCC, Reply-To organized by type.
- **Attachments** — download or preview any attached file. Inline images display correctly in the HTML preview.
- **Raw source** — the raw MIME source for debugging encoding or header issues.

## Configuration

Point your app's SMTP settings to `127.0.0.1:1025`. No authentication required.

> In Docker Compose, replace `127.0.0.1` with the Buggregator service name (e.g., `buggregator`).

### Laravel

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
```

### Spiral Framework

```dotenv
MAILER_DSN=smtp://127.0.0.1:1025
```

### Symfony

```dotenv
MAILER_DSN=smtp://127.0.0.1:1025
```

### Magento 2

```dotenv
CONFIG__DEFAULT__SYSTEM__SMTP__TRANSPORT="smtp"
CONFIG__DEFAULT__SYSTEM__SMTP__HOST="127.0.0.1"
CONFIG__DEFAULT__SYSTEM__SMTP__PORT="1025"
```

or via CLI:

```bash
bin/magento config:set system/smtp/transport smtp
bin/magento config:set system/smtp/host 127.0.0.1
bin/magento config:set system/smtp/port 1025
```

### WordPress

Save to the [mu-plugins](https://developer.wordpress.org/advanced-administration/plugins/mu-plugins/) directory (e.g., `smtp.php`):

```php
<?php
/**
 * Plugin Name: MU Buggregator SMTP
 */

if (! defined('WP_ENVIRONMENT_TYPE') || 'local' !== WP_ENVIRONMENT_TYPE) {
	return;
}

add_action( 'phpmailer_init', function( $phpmailer ) : void {
	$phpmailer->isSMTP();
    $phpmailer->Host = '127.0.0.1';
    $phpmailer->Port = 1025;
}  );
```

### Any other app

Any application that can send email via SMTP works. Set host to `127.0.0.1` and port to `1025`.

## Testing API

End-to-end tests often need to check an email: "did the reset mail arrive, and what is the code in it?" The
testing API answers that over plain HTTP. Example: your test clicks "Forgot password", waits for the email to
`alice@example.com`, and reads the 6-digit code from it.

All routes below need the same login as the rest of `/api` when [SSO](/config/sso) is on: send the
`X-Auth-Token` header (see [Calling the API from scripts](/config/sso#calling-the-api-from-scripts)).

| Method | Path | Answer |
|--------|------|--------|
| `GET` | `/api/smtp/cursor` | `{"cursor": "2026-11-07T08:30:09.123456789Z"}`: the server time now |
| `GET` | `/api/smtp/messages` | messages that match the filters: `{"data": [event, …], "meta": {"total", "limit", "offset"}}` |
| `GET` | `/api/smtp/messages/wait` | the first message that matches, as soon as there is one; `408` on timeout |
| `GET` | `/api/smtp/stats?project=` | `{"count": 3, "last_received_at": "2026-11-07T08:30:09Z"}`; `last_received_at` is `null` with no mail |
| `DELETE` | `/api/smtp/messages?project=` | deletes the messages (of one project, or all): `{"status": true}` |
| `GET` | `/api/smtp/message/{uuid}/raw` | the original message source (`Content-Type: message/rfc822`) |
| `GET` | `/api/smtp/message/{uuid}/links` | links from the HTML and text parts: `{"data": [{"url", "text", "source"}]}`; `source` is `html` or `text` |
| `GET` | `/api/smtp/message/{uuid}/codes?pattern=` | codes found in the text and HTML parts: `{"data": ["482913"], "pattern": "\\b\\d{4,8}\\b"}` |

An `event` is a normal Buggregator event: `uuid`, `type` (`smtp`), `timestamp`, `project` and `payload`. The
`payload` has `subject`, `from`, `to`, `cc`, `reply_to` (lists of `{"email", "name"}`), `bcc`, `text`, `html` and
`raw`.

Errors are `{"message", "code"}`. An unknown `uuid` gets `404`.

### Filters

`/messages` and `/messages/wait` take the same filters. Every filter you pass must match.

| Parameter | Matches when |
|-----------|--------------|
| `to`, `from`, `cc` | any address or name in that field contains the value, ignoring case (`to=alice` finds `Alice <alice@example.com>`) |
| `subject` | the subject is exactly the value |
| `subject_contains` | the subject contains the value (case matters) |
| `subject_regex` | the subject matches the [Go regular expression](https://pkg.go.dev/regexp/syntax); an invalid one matches nothing |
| `body_contains` | the text or the HTML part contains the value (case matters) |
| `project` | the message belongs to that [project](/config/projects) |
| `since`, `until` | received at or after / at or before this time: RFC 3339 (`2026-11-07T08:30:00Z`), unix seconds, or unix milliseconds. A value that does not parse is ignored |

`/messages` also takes:

- `order`: `desc` (newest first, the default) or `asc`.
- `limit` and `offset` for pages. No `limit` returns all matches. `meta.total` counts all matches before the page.

### Waiting for an email

`/messages/wait` holds the request open until a matching message arrives. It also takes `timeout`: a Go
duration such as `10s` or `1m`, default `30s`, at most `60s`.

A message that is already stored and matches comes back at once. So take a cursor before the action, and pass it
as `since`. Otherwise an old email from an earlier test can match.

Example — a password reset test:

```bash
# 1. Remember "now"
CURSOR=$(curl -s http://127.0.0.1:8000/api/smtp/cursor | jq -r .cursor)

# 2. Your test asks the app to send the reset email to alice@example.com

# 3. Wait up to 20 seconds for it
UUID=$(curl -s -G http://127.0.0.1:8000/api/smtp/messages/wait \
  --data-urlencode "since=$CURSOR" \
  --data-urlencode "to=alice@example.com" \
  --data-urlencode "subject_contains=Reset" \
  --data-urlencode "timeout=20s" | jq -r .uuid)

# 4. Read the code from it
curl -s http://127.0.0.1:8000/api/smtp/message/$UUID/codes
# {"data":["482913"],"pattern":"\\b\\d{4,8}\\b"}
```

### Codes

`/codes` looks for a regular expression in the text part and in the HTML part (tags removed). The default
`pattern` finds numbers of 4 to 8 digits. Each code is listed once. Pass your own `pattern` for other codes, for
example `pattern=[A-Z0-9]{6}`. An invalid pattern gets `400`.

### Attachments

`GET /api/smtp/attachments/{uuid}` lists the attachments of a message: `{"data": [{"uuid", "name", "path", "size",
"mime"}]}`. It needs the login like the routes above. The download (`/api/smtp/attachments/{event uuid}/{attachment
uuid}`) and the preview (`/api/smtp/attachments/{event uuid}/preview/{attachment uuid}`) links stay open: they work
only with both ids, which only the protected API gives out.
