---
llms_description: "SMS gateway interceptor: /sms endpoint with auto-detection for 40+ providers (Twilio, Vonage, Plivo, Sinch, Infobip, MessageBird, Telnyx, etc.). Explicit provider URLs (/sms/twilio) for field validation (missing fields → warnings on the stored event, HTTP 200). Twilio send API POST /2010-04-01/Accounts/{SID}/Messages.json (since server [version: to fill]; 201 + sid SM…, status queued; missing To/From/Body → 400 Twilio 21604/21603/21602, still stored; project default). Symfony: only the Twilio bridge works, via a TLS proxy (bridge always uses https; socat recipe; DSN + as %2B; dev verify_peer/verify_host false); other bridges cannot reach Buggregator. Laravel HTTP example, generic curl. Supports JSON and form-urlencoded payloads, project URL segments."
---

# SMS Gateway Interceptor

Your app sends SMS messages — OTP codes, delivery notifications, alerts. During development you don't want to send
real messages through Twilio or Vonage. Buggregator acts as a fake SMS gateway: point your app's SMS webhook URL at
Buggregator and every message shows up in the UI — with sender, recipient, message text, and detected provider.

## Use cases

- **OTP testing** — verify that verification codes are generated and sent correctly.
- **Notification preview** — see the exact text your users will receive.
- **Provider migration** — switch between Twilio, Vonage, Plivo etc. and verify the payload format.
- **Validation feedback** — use explicit provider URLs to catch missing required fields before going to production.

## How it works

Buggregator exposes a single `/sms` endpoint. When your app sends an HTTP POST with SMS data, Buggregator:

1. **Auto-detects the provider** by inspecting request body fields (e.g. `MessageSid` → Twilio, `api_key`+`api_secret` → Vonage).
2. **Extracts** `from`, `to`, and `message` using provider-specific field mappings.
3. **Displays** the SMS in the UI with a colored provider badge.

If the payload doesn't match any known provider, the generic fallback tries common field names (`from`/`to`/`message`/`body`/`text`).

### Explicit provider URL

You can also specify the provider in the URL for stricter validation:

```
POST /sms/twilio       → forces Twilio field mapping + validates required fields (From, To, Body)
POST /sms/vonage       → forces Vonage field mapping + validates required fields
POST /sms              → auto-detects provider from payload
```

When using an explicit provider URL, Buggregator checks that the provider's required fields are present. If something
is missing, the event is still stored and the UI shows the missing fields as warnings. The HTTP answer is `200` either
way, so your app does not see an error: check the warnings in Buggregator.

### Project support

Append a project name as an additional URL segment:

```
POST /sms/twilio/myproject    → explicit provider + project
POST /sms/myproject           → auto-detect + project
```

## Supported providers

Over 40 providers are auto-detected. Here are the most common ones:

| Provider | Detect fields | From | To | Message |
|----------|--------------|------|-----|---------|
| Twilio | `MessageSid`, `Body` | `From` | `To` | `Body` |
| Vonage | `api_key`, `api_secret` | `from`, `msisdn` | `to` | `text` |
| Plivo | `MessageUUID` | `From`, `src` | `To`, `dst` | `Text` |
| Sinch | `batch_id`, `body` | `from` | `to` | `body` |
| Infobip | `messages` | `from` | `to` | `text` |
| MessageBird | `originator`, `recipients` | `originator` | `recipients` | `body` |
| Telnyx | `messaging_profile_id` | `from` | `to` | `text` |
| Bandwidth | `applicationId`, `text` | `from` | `to` | `text` |
| Brevo | `sender`, `recipient`, `content` | `sender` | `recipient` | `content` |
| Clickatell | `from`, `to`, `text` | `from` | `to` | `text` |
| SMS.ru | `api_id`, `msg` | `from` | `to` | `msg` |
| SMSC | `login`, `psw`, `phones` | `sender` | `phones` | `mes` |
| Generic | _(always matches)_ | `from`/`From`/`sender` | `to`/`To`/`recipient` | `message`/`body`/`text` |

Full list: Twilio, Vonage, Plivo, Sinch, Infobip, MessageBird, Telnyx, Bandwidth, Brevo, Termii, Clickatell, MessageMedia, Lox24, Unifonic, Yunpian, Octopush, GatewayApi, SevenIo, SmsFactor, Redlink, OvhCloud, Smsc, 46elks, Mobyt, Smsapi, Sendberry, TurboSms, SimpleTextin, Isendpro, RingCentral, ClickSend, SMS.ru, SMS Aero, Devino, IQSms, MTS, Beeline, Megafon.

## Configuration

### Twilio API

Since server [version: to fill], Buggregator also answers Twilio's own send API, so a Twilio client can talk to it
unchanged:

```
POST /2010-04-01/Accounts/{AccountSid}/Messages.json
```

It takes a form or JSON body with `To`, `From` (or `MessagingServiceSid`) and `Body`, and answers like Twilio:

- **All fields present:** `201` with a Twilio message: `sid` (`SM…`), `status: "queued"`, `to`, `from`, `body`, `uri`.
- **A field missing:** `400` with a Twilio error: `21604` (no `To`), `21603` (no `From`), `21602` (no `Body`). The
  message is still stored, with a warning.

These messages go to the `default` project.

```bash
curl -X POST http://127.0.0.1:8000/2010-04-01/Accounts/AC123/Messages.json \
  --data-urlencode 'To=+15550002222' --data-urlencode 'From=+15550001111' \
  --data-urlencode 'Body=Your code is 1234'
```

### Symfony Notifier

Only the Twilio bridge can reach Buggregator, through the Twilio API above. The other bridges (Vonage, Plivo, Sinch, …)
call their provider's own API path, so a DSN pointed at Buggregator does not work for them.

The Twilio bridge always uses HTTPS. A DSN pointing at plain `127.0.0.1:8000` fails at the TLS handshake. Put a TLS
proxy in front of Buggregator, e.g. with `socat` and a self-signed certificate:

```bash
openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -days 365 -subj /CN=localhost
socat OPENSSL-LISTEN:8443,cert=cert.pem,key=key.pem,verify=0,fork,reuseaddr TCP:127.0.0.1:8000
```

Point the DSN at the proxy. Write `+` in the number as `%2B`, or Symfony rejects it:

```dotenv
TWILIO_DSN=twilio://ACxxx:token@localhost:8443?from=%2B15550001111
```

In dev, let the HTTP client accept the self-signed certificate:

```yaml
# config/packages/dev/framework.yaml
framework:
  http_client:
    default_options:
      verify_peer: false
      verify_host: false
```

Tested with `symfony/twilio-notifier` 8.1.7.

### Laravel

Laravel doesn't have built-in SMS, but if you use an HTTP-based SMS package, you can override the API base URL:

```php
// Example: sending directly via HTTP
Http::post('http://127.0.0.1:8000/sms/twilio', [
    'MessageSid' => Str::uuid(),
    'From' => '+1234567890',
    'To' => $user->phone,
    'Body' => "Your code is {$code}",
]);
```

### Any language / any framework

Send an HTTP POST to Buggregator with the provider's payload format:

```bash
# Twilio format
curl -X POST http://127.0.0.1:8000/sms/twilio \
  -H "Content-Type: application/json" \
  -d '{"MessageSid":"SM123","From":"+1234","To":"+5678","Body":"Hello!"}'

# Generic format (auto-detect)
curl -X POST http://127.0.0.1:8000/sms \
  -H "Content-Type: application/json" \
  -d '{"from":"+1234","to":"+5678","message":"Hello!"}'

# Test validation (missing required fields)
curl -X POST http://127.0.0.1:8000/sms/twilio \
  -H "Content-Type: application/json" \
  -d '{"From":"+1234","To":"+5678"}'
# Returns 200; the event shows the missing fields as warnings in the UI
```

Both `application/json` and `application/x-www-form-urlencoded` are accepted.
