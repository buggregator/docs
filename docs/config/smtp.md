# Configuration — Fake SMTP server

Buggregator is more than just a PHP debugging tool. It also includes a powerful email testing feature that allows you to
install and configure a local email server with ease.

For example, you can configure a local WordPress site to use Buggregator's SMTP server for email deliveries. This makes
it effortless to test email functionality during the development phase, ensuring that everything works as expected
before deployment. So, if you're looking for a reliable and easy-to-use email testing tool, Buggregator's fake SMTP
server is the way to go.

![smtp](https://user-images.githubusercontent.com/773481/208727862-229fda5f-3504-4377-921e-03f0ff602cb9.png)

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