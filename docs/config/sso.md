# Configuration — Single Sign-On (SSO)

With the release of version 1.7.0, Buggregator now supports Single Sign-On (SSO).

There is a list of supported SSO providers:

- [Auth0](https://auth0.com/)
- [Kinde](https://kinde.com/)

This integration allows users to authenticate with external identity providers, providing
a secure and seamless sign-in experience.

## Auth0

First, you need to have an Auth0 account. If you don't have one, you can [sign up](https://auth0.com/signup) for free.

After creating an account, follow these steps:

1. **Enable Authentication**: Set the environment variable `AUTH_ENABLED` to `true` to enable authentication features in
   your application.

2. **Auth provider**: Set the environment variable `AUTH_PROVIDER` to `auth0` to specify that you are using Auth0 as
   your authentication provider.

3. **Create an Application**: Log in to your account and create a new "Regular Web Application". After creating, you
   will see a `Domain`, `Client ID` and `Client Secret` that you will need to use in the next steps.

4. **Configure Settings**: Set up the following environment variables with the appropriate values from your
   application:

    - `AUTH_PROVIDER_URL`: The URL of your app domain, e.g., `https://<domain>.auth0.com`
    - `AUTH_CLIENT_ID`: The client ID provided by app.
    - `AUTH_CLIENT_SECRET`: The client secret provided by app.
    - `AUTH_CALLBACK_URL`: The callback URL that app will redirect to after authentication,
      e.g., `http://buggregator.server/auth/sso/callback`. Where `buggregator.server` is the domain of your server.
    - `AUTH_SCOPES`: The scopes for which permissions are granted, typically include `openid`, `email`, and `profile`.

5. **Set Up Callback URL**: In your Auth0 application settings, configure the callback URL to point to
   the `http://buggregator.server/auth/sso/callback` endpoint. Where `buggregator.server` is the domain of your
   Buggregator server.

Finally, your `.env` file should look like this:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=auth0
AUTH_PROVIDER_URL=https://<domain>.auth0.com
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_SCOPES=openid,email,profile
```

## Kinde

First, you need to have a Kinde account. If you don't have one, you
can [sign up](https://app.kinde.com/auth/cx/_:nav&m:register&psid:83976d64db58431da88130f1f883d9a4) for free.

After creating an account, follow these steps:

1. **Enable Authentication**: Set the environment variable `AUTH_ENABLED` to `true` to enable authentication features in
   your application.

2. **Auth provider**: Set the environment variable `AUTH_PROVIDER` to `kinde`.

3. **Add an Application**: Log in to your account and add a new "Back-end web" application. After creating, you will
   see a `Domain`, `Client ID` and `Client Secret` that you will need to use in the next steps.

4. **Configure Settings**: Set up the following environment variables with the appropriate values from your
   application:

    - `AUTH_PROVIDER_URL`: The URL of your app domain, e.g., `https://<domain>.kinde.com`
    - `AUTH_CLIENT_ID`: The client ID provided by app.
    - `AUTH_CLIENT_SECRET`: The client secret provided by app.
    - `AUTH_CALLBACK_URL`: The callback URL that app will redirect to after authentication,
      e.g., `http://buggregator.server/auth/sso/callback`. Where `buggregator.server` is the domain of your server.
    - `AUTH_LOGOUT_URL`: The callback URL that app will redirect to after authentication,
      e.g., `http://buggregator.server/auth/sso/logout`.
    - `AUTH_SCOPES`: The scopes for which permissions are granted, typically include `openid`, `email`, and `profile`.

5. **Set Up Callback URL**: In your application settings, configure the allowed callback URLs to point to
   the `http://buggregator.server/auth/sso/callback` endpoint.

6. **Set Up Login URL**: In your application settings, configure the callback URL to point to
   the `http://buggregator.server/auth/sso/login` endpoint.

7. **Set Up Logout URL**: In your application settings, configure the allowed logout redirect URLs to point to
   the `http://buggregator.server/auth/sso/logout` endpoint.

Finally, your `.env` file should look like this:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=kinde
AUTH_PROVIDER_URL=https://<domain>.kinde.com
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_LOGOUT_URL=http://<server_address>/auth/sso/logout
AUTH_SCOPES=openid,email,profile
```

## Other Providers

Buggregator supports Auth0 and Kinde for now. You can try to use other SSO providers using the same steps. If it works,
please update our documentation with your results. This will help us support more options and help others too.

## Verifying the Configuration

Once you set the environment variables, start your Buggregator server. You should see a Login page with an option to
sign in. If everything is set up right, clicking this option will take you to the provider's login page.

![image](https://github.com/buggregator/server/assets/773481/3bc5dd4b-b8ac-4e2c-a9c0-5707dd053d0b)

After logging in successfully, users will be redirected back to the Buggregator server and logged in. You will see the
user's profile information in the bottom left corner of the app.

![image](https://github.com/buggregator/frontend/assets/773481/6f996c5e-f43a-4f5e-8da4-71f83110c7ba)

### Troubleshooting

If you encounter issues during the authentication process, ensure that:

- All environment variables are correctly set without any typos.
- The callback URL in your configuration matches the `AUTH_CALLBACK_URL` you specified.