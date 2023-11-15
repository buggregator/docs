# Configuration — Spatie Ray

Buggregator is compatible with `spatie/ray` package. The Ray debug tool supports PHP, Ruby, JavaScript, TypeScript,
NodeJS, Go and Bash applications. After installing one of the libraries, you can use the ray function to quickly dump
stuff. Any variable(s) that you pass will be sent to the Buggregator.

![Ray debug tool](https://github.com/buggregator/spiral-app/assets/773481/c2a84d40-fc99-4bde-b87f-ea81cc1daa17)

**Supported features**: Simple data, Labels, Caller, Trace, Counter, Class name of an object, Measure, Json, Xml,
Carbon, File, Table, Image, Html, Text, Notifications, Phpinfo, Exception, Show queries, Count queries, Show events,
Show jobs, Show cache, Model, Show views, Markdown, Collections, Env, Response, Request, Application log, Show Http
client requests

## Laravel

Please make sure `ray.php` config published to the project root.

You can run an artisan command to publish it in to the project root.

```bash
php artisan ray:publish-config
```

**Env variables**

```
RAY_HOST=ray@127.0.0.1  # Ray server host (Current HTTP buggregator port)
RAY_PORT=8000           # Ray server port
```

## Framework agnostic PHP

In framework agnostic projects you can use this template as the ray config file.

```php
<?php
// Save this in a file called "ray.php"

return [
    /*
    * This settings controls whether data should be sent to Ray.
    */
    'enable' => true,

    /*
     *  The host used to communicate with the Ray app.
     */
    'host' => 'ray@127.0.0.1',

    /*
     *  The port number used to communicate with the Ray app.
     */
    'port' => 8000,

    /*
     *  Absolute base path for your sites or projects in Homestead, Vagrant, Docker, or another remote development server.
     */
    'remote_path' => null,

    /*
     *  Absolute base path for your sites or projects on your local computer where your IDE or code editor is running on.
     */
    'local_path' => null,

    /*
     * When this setting is enabled, the package will not try to format values sent to Ray.
     */
    'always_send_raw_values' => false,
];
```

You can find out more information about installation and configuration
on [official site](https://spatie.be/docs/ray/v1/introduction)