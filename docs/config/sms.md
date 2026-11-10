---
llms_description: "SMS gateway interceptor: /sms endpoint with auto-detection for 40+ providers (Twilio, Vonage, Plivo, Sinch, Infobip, MessageBird, Telnyx, etc.). Explicit provider URLs (/sms/twilio) for field validation (missing fields → warnings on the stored event, HTTP 200). Symfony Notifier DSNs do not work (bridges call the provider's own HTTPS API path), Laravel HTTP example, generic curl. Supports JSON and form-urlencoded payloads, project URL segments."
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

### Symfony Notifier

Pointing a Symfony Notifier DSN at Buggregator does not work. Each SMS bridge calls its provider's own API path over
HTTPS (Twilio: `/2010-04-01/Accounts/{SID}/Messages.json`) and expects the provider's answer (Twilio: `201` with a
`sid`). Buggregator answers neither. Send the SMS payload to Buggregator over HTTP instead, as in the examples below.

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
