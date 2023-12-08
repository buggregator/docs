# Configuration — Fake SMTP server

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