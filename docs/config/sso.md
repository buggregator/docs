# Configuration — Single Sign-On (SSO)

With the release of version 1.7.0, Buggregator now supports Single Sign-On (SSO) using [Auth0](https://auth0.com/). This
integration allows users to authenticate with external identity providers supported by Auth0, providing a secure and
seamless sign-in experience.

![image](https://github.com/buggregator/server/assets/773481/3bc5dd4b-b8ac-4e2c-a9c0-5707dd053d0b)

By configuring SSO, you can streamline the authentication process and enhance the security of user management within
your application.

## Prerequisites

To configure SSO in Buggregator, you must have an [auth0.com](https://auth0.com/) account. If you do not have one, you
can sign up for free.

## Configuration Steps

To enable SSO, follow these steps:

1. **Enable Authentication**: Set the environment variable `AUTH_ENABLED` to `true` to enable authentication features in
   your application.

2. **Create an Auth0 Application**: Log in to your Auth0 account and create a new "Regular Web
   Application". After creating the application, you will receive a `Domain`, `Client ID` and `Client Secret` that you
   will need to use in the next steps.

3. **Configure Auth0 Settings**: Set up the following environment variables with the appropriate values from your Auth0
   application:

    - `AUTH_PROVIDER_URL`: The URL of your app domain, e.g., `https://<domain>.auth0.com`
    - `AUTH_CLIENT_ID`: The client ID provided by app.
    - `AUTH_CLIENT_SECRET`: The client secret provided by app.
    - `AUTH_CALLBACK_URL`: The callback URL that app will redirect to after authentication,
      e.g., `http://buggregator.server/auth/sso/callback`. Where `buggregator.server` is the domain of your Buggregator
      server.
    - `AUTH_SCOPES`: The scopes for which permissions are granted, typically include `openid`, `email`, and `profile`.

4. **Set Up Callback URL**: In your Auth0 application settings, configure the callback URL to point to
   the `http://buggregator.server/auth/sso/callback` endpoint. Where `buggregator.server` is the domain of your
   Buggregator server.

Resultant environment variables should look like this:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER_URL=https://<domain>.auth0.com
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://buggregator.server/auth/sso/callback
AUTH_SCOPES=openid,email,profile
```

### Verifying the Configuration

After configuring the environment variables, start your Buggregator server. You should now see Login page with the
option to sign in using Auth0. If set up correctly, clicking this option will redirect you to the Auth0 authentication
page where users can enter their credentials.

After successful authentication, users will be redirected back to the Buggregator application and logged in. And you
will see the user's profile information in the bottom left corner of the application.

![image](https://github.com/buggregator/frontend/assets/773481/6f996c5e-f43a-4f5e-8da4-71f83110c7ba)

### Troubleshooting

If you encounter issues during the authentication process, ensure that:

- All environment variables are correctly set without any typos.
- The callback URL in your Auth0 configuration matches the `AUTH_CALLBACK_URL` you specified.
- Your Auth0 account has access to the scopes specified in `AUTH_SCOPES`.