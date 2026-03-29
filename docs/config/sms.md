---
llms_description: "SMS gateway interceptor: /sms endpoint with auto-detection for 40+ providers (Twilio, Vonage, Plivo, Sinch, Infobip, MessageBird, Telnyx, etc.). Explicit provider URLs (/sms/twilio) for field validation with 422 responses. Symfony Notifier DSN config, Laravel HTTP example, generic curl. Supports JSON and form-urlencoded payloads, project URL segments."
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
POST /sms/twilio       → forces Twilio field mapping + validates required fields
POST /sms/vonage       → forces Vonage field mapping + validates required fields
POST /sms              → auto-detects provider from payload
```

When using an explicit provider URL, Buggregator validates that all required fields are present. If something is missing:
- The HTTP response returns **422** with a JSON error listing missing fields.
- The event is **still captured** in the UI with validation warnings highlighted in red.

This way your app sees the error (like it would from a real provider), and you can inspect the full payload in Buggregator.

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

### Symfony Notifier

Symfony's Notifier component uses DSN-based transport configuration. Every SMS bridge has a configurable host — change it to point at Buggregator.

```dotenv
# Default (sends to real Twilio):
TWILIO_DSN=twilio://SID:TOKEN@default?from=+1234567890

# Point to Buggregator (explicit provider URL for validation):
TWILIO_DSN=twilio://SID:TOKEN@127.0.0.1:8000/sms/twilio?from=+1234567890

# Or use auto-detect:
TWILIO_DSN=twilio://SID:TOKEN@127.0.0.1:8000/sms?from=+1234567890
```

Same pattern for any Symfony SMS bridge:

```dotenv
# Vonage
VONAGE_DSN=vonage://KEY:SECRET@127.0.0.1:8000/sms/vonage?from=MyApp

# Plivo
PLIVO_DSN=plivo://AUTH_ID:AUTH_TOKEN@127.0.0.1:8000/sms/plivo?from=+1234567890

# Sinch
SINCH_DSN=sinch://ACCOUNT_ID:AUTH_TOKEN@127.0.0.1:8000/sms/sinch?from=+1234567890
```

> In Docker Compose, replace `127.0.0.1:8000` with the Buggregator service name (e.g., `buggregator:8000`).

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
# Returns 422: {"error":"validation_failed","gateway":"twilio","missing_fields":["MessageSid","Body"]}
# But the event is still visible in Buggregator UI with warnings!
```

Both `application/json` and `application/x-www-form-urlencoded` are accepted.
