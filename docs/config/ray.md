# Integration — Spatie Ray

[Ray](https://myray.app/) is a debug tool that was created by Spatie. It is a great alternative to the Symfony
VarDumper component especially for Laravel applications. Buggregator is compatible with the Ray, and it's a good free
alternative for debugging your applications.

> **Note:** Some of the features of Ray are not available in Buggregator, like colors, sizes, and other visual features.

![ray](https://github.com/buggregator/server/assets/773481/168b27f7-75b1-4837-b0a1-37146d5b8b52)

Ray provides packages for PHP, Ruby, JavaScript, TypeScript, NodeJS, Go, and Bash applications. So using it you can
dump variables in many languages straight to the Buggregator.

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

## Framework-agnostic PHP

In framework-agnostic projects you can use this template as the ray config file.

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

## Other languages

- [JavaScript](https://myray.app/docs/javascript/vanilla-javascript/getting-started)
- [Bash](hhttps://myray.app/docs/other-languages/bash/installation)
- [Go](https://myray.app/docs/other-languages/go/getting-started)
- [Ruby](https://myray.app/docs/other-languages/ruby/getting-started)

---

That's it! Now you can use the `ray()` function as usual. The output will be sent to the remote server.
