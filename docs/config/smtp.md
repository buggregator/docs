---
llms_description: "Fake SMTP server on port 1025: captures outgoing emails with HTML preview (desktop/mobile viewport), plain text, addresses (From/To/CC/BCC), attachments, raw MIME source. Config for Laravel (MAIL_HOST/MAIL_PORT), Spiral (MAILER_DSN), Symfony, Magento 2, WordPress (mu-plugin phpmailer_init hook)."
---

# SMTP — Email Testing

Your app sends emails — registration confirmations, password resets, notifications. You need to verify they look
correct without actually delivering them. Buggregator includes a fake SMTP server: point your app's mail config at
port `1025` and every email shows up in the UI. No Mailhog, no Mailtrap, no external services — just another
module in the same Buggregator instance where you already see your logs and exceptions.

![smtp](https://github.com/buggregator/server/assets/773481/8dd60ddf-c8d8-4a26-a8c0-b05052414a5f)

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
