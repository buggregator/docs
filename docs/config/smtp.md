# Integration — Fake SMTP server

Buggregator is more than just a PHP debugging tool. It also includes a powerful email testing feature that allows you to
install and configure a local email server with ease.

For example, you can configure a local WordPress site to use Buggregator's SMTP server for email deliveries. This makes
it effortless to test email functionality during the development phase, ensuring that everything works as expected
before deployment. So, if you're looking for a reliable and easy-to-use email testing tool, Buggregator's fake SMTP
server is the way to go.

![smtp](https://github.com/buggregator/server/assets/773481/8dd60ddf-c8d8-4a26-a8c0-b05052414a5f)

## Spiral Framework

```dotenv
MAILER_DSN=smtp://127.0.0.1:1025
```

## Laravel

```dotenv
MAIL_MAILER=smtp
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
```

## Magento 2

```dotenv
CONFIG__DEFAULT__SYSTEM__SMTP__TRANSPORT="smtp"
CONFIG__DEFAULT__SYSTEM__SMTP__HOST="127.0.0.1"
CONFIG__DEFAULT__SYSTEM__SMTP__PORT="1025"
```

or

```bash
bin/magento config:set system/smtp/transport smtp
bin/magento config:set system/smtp/host 127.0.0.1
bin/magento config:set system/smtp/port 1025
```

## WordPress

Save the following code to a file in the [mu-plugins](https://developer.wordpress.org/advanced-administration/plugins/mu-plugins/) directory (e.g. `smtp.php`):

```php
<?php
/**
 * Plugin Name: MU Buggregator SMTP
 */

if (! defined('WP_ENVIRONMENT_TYPE') || 'local' !== WP_ENVIRONMENT_TYPE) {
	return;
}

/**
 * Send emails to Buggregator
 *
 * @param \PHPMailer $phpmailer The PHPMailer instance (passed by reference).
 */
add_action( 'phpmailer_init', function( $phpmailer ) : void {
	$phpmailer->isSMTP();
    $phpmailer->Host = '127.0.0.1';
    $phpmailer->Port = 1025;
}  );
```
