---
llms_description: "SSO authentication with OAuth2/OIDC providers: Auth0, Google, GitHub, Keycloak, GitLab, and generic OIDC. Environment variables: AUTH_ENABLED, AUTH_PROVIDER, AUTH_PROVIDER_URL, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_CALLBACK_URL, AUTH_SCOPES, AUTH_JWT_SECRET. OIDC auto-discovery for compatible providers. Callback endpoint /auth/sso/callback."
---

# Configuration — Single Sign-On (SSO)

Buggregator supports Single Sign-On (SSO) for secure user authentication via OAuth2/OIDC.

Supported providers:

- [Auth0](https://auth0.com/)
- [Google](https://console.cloud.google.com/)
- [GitHub](https://github.com/settings/developers)
- [Keycloak](https://www.keycloak.org/)
- [GitLab](https://gitlab.com/)
- Any **generic OIDC** provider

For OIDC-compatible providers (Auth0, Google, Keycloak, GitLab, generic OIDC), endpoints are auto-discovered
from the provider URL via `.well-known/openid-configuration`. For GitHub, endpoints are hardcoded (GitHub does
not support OIDC discovery).

## Configuration

### buggregator.yaml

```yaml
auth:
  enabled: true
  provider: oidc                    # auth0, google, github, keycloak, gitlab, oidc
  provider_url: https://xxx.us.auth0.com
  client_id: your-client-id
  client_secret: your-client-secret
  callback_url: http://localhost:8000/auth/sso/callback
  scopes: openid,email,profile
  jwt_secret: your-jwt-signing-secret
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTH_ENABLED` | `false` | Enable authentication |
| `AUTH_PROVIDER` | `oidc` | Provider type: `auth0`, `google`, `github`, `keycloak`, `gitlab`, `oidc` |
| `AUTH_PROVIDER_URL` | — | OIDC issuer URL (e.g., `https://xxx.us.auth0.com`) |
| `AUTH_CLIENT_ID` | — | OAuth2 client ID |
| `AUTH_CLIENT_SECRET` | — | OAuth2 client secret |
| `AUTH_CALLBACK_URL` | — | Callback URL (e.g., `http://buggregator.example.com/auth/sso/callback`) |
| `AUTH_SCOPES` | `openid,email,profile` | Comma-separated OAuth2 scopes |
| `AUTH_JWT_SECRET` | — | **Required.** Secret for signing internal JWT tokens |

> **Important:** `AUTH_JWT_SECRET` is required when authentication is enabled. It is used to sign the internal
> session JWT tokens.

## Provider Setup

### Auth0

1. [Sign up](https://auth0.com/signup) for an Auth0 account.
2. Create a new **Regular Web Application**.
3. Note the `Domain`, `Client ID`, and `Client Secret`.
4. In application settings, set **Allowed Callback URLs** to `http://<your-server>/auth/sso/callback`.
5. Configure Buggregator:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=auth0
AUTH_PROVIDER_URL=https://<domain>.auth0.com
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_SCOPES=openid,email,profile
AUTH_JWT_SECRET=your-secret-key
```

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a new **OAuth 2.0 Client ID** (Web application type).
3. Add `http://<your-server>/auth/sso/callback` to **Authorized redirect URIs**.
4. Configure Buggregator:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=google
AUTH_PROVIDER_URL=https://accounts.google.com
AUTH_CLIENT_ID=xxx.apps.googleusercontent.com
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_JWT_SECRET=your-secret-key
```

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers).
2. Create a new **OAuth App**.
3. Set **Authorization callback URL** to `http://<your-server>/auth/sso/callback`.
4. Configure Buggregator:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=github
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_JWT_SECRET=your-secret-key
```

> **Note:** GitHub does not support OIDC, so `AUTH_PROVIDER_URL` is not needed.

### Keycloak

1. Create a new **Client** in your Keycloak realm.
2. Set **Valid Redirect URIs** to `http://<your-server>/auth/sso/callback`.
3. Configure Buggregator:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=keycloak
AUTH_PROVIDER_URL=https://keycloak.example.com/realms/your-realm
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_JWT_SECRET=your-secret-key
```

### GitLab

1. Go to **Admin Area > Applications** (or **User Settings > Applications** for self-managed).
2. Create a new application with `openid`, `email`, `profile` scopes.
3. Set **Redirect URI** to `http://<your-server>/auth/sso/callback`.
4. Configure Buggregator:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=gitlab
AUTH_PROVIDER_URL=https://gitlab.com
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_JWT_SECRET=your-secret-key
```

### Generic OIDC

Any OIDC-compliant provider can be used. The server will auto-discover endpoints from
`<provider_url>/.well-known/openid-configuration`.

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=oidc
AUTH_PROVIDER_URL=https://your-oidc-provider.com
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_JWT_SECRET=your-secret-key
```

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
- The callback URL in your provider's configuration matches the `AUTH_CALLBACK_URL` you specified.
- `AUTH_JWT_SECRET` is set (it is required for session management).
- For OIDC providers, the `AUTH_PROVIDER_URL` points to the issuer root (e.g., `https://xxx.auth0.com`, not `https://xxx.auth0.com/authorize`).
