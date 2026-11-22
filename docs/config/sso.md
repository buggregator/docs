---
llms_description: "SSO authentication with OAuth2/OIDC providers: Auth0, Google, GitHub, Keycloak, GitLab, and generic OIDC. Environment variables: AUTH_ENABLED, AUTH_PROVIDER, AUTH_PROVIDER_URL, AUTH_CLIENT_ID, AUTH_CLIENT_SECRET, AUTH_CALLBACK_URL, AUTH_SCOPES, AUTH_JWT_SECRET. OIDC auto-discovery for compatible providers. Callback endpoint /auth/sso/callback. With SSO on, UI APIs (/api/events, /api/sentry/*, profiler, SMTP testing API /api/smtp/*, attachment lists, /api/metrics, /api/mocks, /api/xdebug) need the X-Auth-Token header (UI login token, 30 days); ingestion, /mock/, /api/version, /api/settings, attachment download/preview stay open. WebSocket /connection/websocket needs the token in the connect command (else error 109, close 1008). Allow-list since [version: to fill]: auth.allowed_emails / auth.allowed_domains (env AUTH_ALLOWED_EMAILS / AUTH_ALLOWED_DOMAINS, comma lists; email OR domain; confirmed email only; google matches Workspace hd; github reads the verified primary email via scope user:email (GitHub default scopes read:user,user:email since [version: to fill]; Helm chart always sends openid,email,profile → set auth.scopes); Entra ID: AUTH_PROVIDER=oidc, tenant URL https://login.microsoftonline.com/<tenant>/v2.0 (not /common), allow-list needs optional ID-token claim xms_edov, else refused; profile name = full name, else login; checked on every request, signs out old sessions; refusal page «Access denied», state mismatch «Sign-in expired»). Without a list any account the provider accepts signs in; restrict at the provider (Google user type Internal, Auth0 sign-ups off + app connections, Keycloak realm users with registration off, self-hosted GitLab; GitHub OAuth apps cannot restrict)."
---

# Configuration — Single Sign-On (SSO)

Buggregator supports Single Sign-On (SSO) for secure user authentication via OAuth2/OIDC.

Supported providers:

- [Auth0](https://auth0.com/)
- [Google](https://console.cloud.google.com/)
- [GitHub](https://github.com/settings/developers)
- [Keycloak](https://www.keycloak.org/)
- [GitLab](https://gitlab.com/)
- Any **generic OIDC** provider, for example [Microsoft Entra ID](#microsoft-entra-id)

For OIDC-compatible providers (Auth0, Google, Keycloak, GitLab, generic OIDC), endpoints are auto-discovered
from the provider URL via `.well-known/openid-configuration`. For GitHub, endpoints are hardcoded (GitHub does
not support OIDC discovery).

## Who can sign in

By default, anyone the provider signs in gets in. Since server `[version: to fill]`, list who may sign in, by email
or by domain:

```yaml
auth:
  allowed_emails: ["anna@gmail.com"]     # env AUTH_ALLOWED_EMAILS=anna@gmail.com,max@gmail.com
  allowed_domains: ["acme.com"]          # env AUTH_ALLOWED_DOMAINS=acme.com
```

A person gets in when their email is in `allowed_emails` **or** its domain is in `allowed_domains`. Example: with
the settings above, `anna@gmail.com` and `bob@acme.com` sign in, `eve@gmail.com` does not.

- Only an email the provider has **confirmed** counts. Case does not matter.
- **Google:** `allowed_domains` matches your Google Workspace domain, not the address. A personal Google account
  with an `@acme.com` address does not pass. Name the primary Workspace domain: an alias domain never matches.
- **GitHub:** Buggregator reads the confirmed primary email, even a hidden one. This needs the scope `user:email`,
  which is in the GitHub default (`read:user,user:email`). If you set `AUTH_SCOPES` yourself, keep `user:email` in it;
  without it only the public profile email counts, and a user with no public email is refused.
- **Microsoft Entra ID (Azure AD)** does not confirm emails by default, so with a list everyone is refused. Add the
  optional claim `xms_edov` to the ID token, see [Microsoft Entra ID](#microsoft-entra-id).
- The list is checked on every request. Add a list and restart, and people who are not on it are signed out at once,
  even if they signed in before. Right after the upgrade to this version, everyone signs in once more, allowed
  people too.
- A refused person sees «Access denied: … is not allowed to sign in to this Buggregator».
- With no list, the server logs at start: `auth: no allowed_emails/allowed_domains set: every account the provider
  signs in gets access`.

::: warning Without a list, any account the provider accepts can sign in
On servers older than `[version: to fill]`, or with no list set, Buggregator does not check who signs in. If the
provider lets a person log in, that person sees all your events. Example: with GitHub SSO on a public address,
anyone with a GitHub account can open your Buggregator.

Set a list, or limit who can sign in at the provider, before you expose Buggregator:

- **Google:** on the OAuth consent screen, set **User type** to **Internal**. Then only accounts of your Google
  Workspace organization can sign in.
- **Auth0:** turn off sign-ups, and enable for the application only the connections your team uses.
- **Keycloak:** only users of the realm can sign in. Turn off **User registration** in the realm.
- **GitLab:** on gitlab.com any GitLab account can sign in. A self-hosted GitLab lets in only its own users; turn
  off sign-ups there.
- **GitHub:** a GitHub OAuth app cannot limit who signs in. Any GitHub account gets in. Use it only on a private
  network, or pick another provider.
- **Generic OIDC:** use your provider's own setting that assigns users or groups to the application.

Without a list or such a limit, do not expose Buggregator to the internet.
:::

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
  allowed_emails: []                # who may sign in, see «Who can sign in»
  allowed_domains: []
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
| `AUTH_SCOPES` | `openid,email,profile`; GitHub: `read:user,user:email` | Comma-separated OAuth2 scopes |
| `AUTH_JWT_SECRET` | — | **Required.** Secret for signing internal JWT tokens |
| `AUTH_ALLOWED_EMAILS` | — | Comma-separated emails that may sign in (since `[version: to fill]`) |
| `AUTH_ALLOWED_DOMAINS` | — | Comma-separated domains that may sign in; Google: Workspace domain (since `[version: to fill]`) |

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
# optional: who may sign in
AUTH_ALLOWED_EMAILS=anna@example.com,max@example.com
```

> **Note:** GitHub does not support OIDC, so `AUTH_PROVIDER_URL` is not needed. Leave `AUTH_SCOPES` empty: for
> GitHub the default is `read:user,user:email` (since `[version: to fill]`; older servers ask for
> `openid,email,profile`, which are not GitHub scopes). On Helm, set `auth.scopes=read:user,user:email`: the chart
> always sends its own `openid,email,profile`.

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

### Microsoft Entra ID

Entra ID (Azure AD) works as a generic OIDC provider:

```dotenv
AUTH_ENABLED=true
AUTH_PROVIDER=oidc
AUTH_PROVIDER_URL=https://login.microsoftonline.com/<tenant-id>/v2.0
AUTH_CLIENT_ID=xxx
AUTH_CLIENT_SECRET=xxx
AUTH_CALLBACK_URL=http://<server_address>/auth/sso/callback
AUTH_SCOPES=openid,email,profile
AUTH_JWT_SECRET=your-secret-key
```

- Use your tenant id in the URL. Sign-in through the shared `/common` address works, but with an allow-list the
  token's issuer does not match, and everyone is refused.
- With an allow-list (`AUTH_ALLOWED_EMAILS` / `AUTH_ALLOWED_DOMAINS`), add the optional claim `xms_edov` to the ID
  token: **App registration → Token configuration → Add optional claim → ID → `xms_edov`**. It tells Buggregator
  the email's domain is verified by your tenant (since `[version: to fill]`). Without it, everyone is refused.
- The profile picture does not show: Entra's picture link needs a Microsoft token.

## Verifying the Configuration

Once you set the environment variables, start your Buggregator server. You should see a Login page with an option to
sign in. If everything is set up right, clicking this option will take you to the provider's login page.

![SSO login page](/images/sso-login.webp)

After logging in successfully, users will be redirected back to the Buggregator server and logged in. You will see the
user's profile information in the bottom left corner of the app. The name there is the full name from the provider,
or the login when the profile has no name (since `[version: to fill]`). Example: `Anna Petrova`, or `anna-p` on
GitHub without a name.

![User menu with the signed-in user](/images/sso-user-menu.webp)

## Calling the API from Scripts

With SSO on, the APIs behind the UI need a login token in the `X-Auth-Token` header. Without it they answer
`401`. This covers `/api/events`, Sentry (`/api/sentry/*`), the profiler, the SMTP testing API
(`/api/smtp/*`), attachment lists, `/api/metrics`, mock rules (`/api/mocks*`) and Xdebug (`/api/xdebug*`).

Since v2.6.0 this includes the Sentry, profiler and SMTP testing APIs. Before, they answered without a token.
A test script that reads captured emails must now send the header:

```bash
curl http://buggregator.example.com/api/smtp/messages \
  -H "X-Auth-Token: $BUGGREGATOR_TOKEN"
```

The token is the one the UI gets after you sign in. It is valid for 30 days. To copy it, open the browser's
developer tools on the Buggregator page and read `token` from Local Storage.

These stay open, so your apps keep sending events without a token:

- event ingestion (Sentry SDK, Ray, Inspector, profiler, SMS, HTTP dumps) and the TCP ports;
- the mock server under `/mock/`;
- `/api/version`, `/api/settings` and the SSO login pages;
- attachment download and preview: `/api/{smtp,http-dump}/attachments/{eventUuid}/{uuid}` and
  `/api/{smtp,http-dump}/attachments/{eventUuid}/preview/{uuid}`. The UI opens them as plain links, which carry
  no token. A link needs both the event and the attachment UUID, and with SSO on only signed-in clients (the
  protected API and the live feed) get those;
- Prometheus `GET /metrics` on the main port, when [metrics](/config/metrics) are on and `metrics.addr` is
  empty. It has counters only, no event content. Set `metrics.addr` to move it to its own port.

The live feed needs the same token. A WebSocket client of `/connection/websocket` sends it as `token` in its
Centrifugo `connect` command. Without a valid token the connect gets error `109 unauthorized`, the socket is
closed with code `1008`, and no events are pushed. The UI does this by itself after you sign in.

With SSO off, nothing needs a token.

### Troubleshooting

If you encounter issues during the authentication process, ensure that:

- All environment variables are correctly set without any typos.
- The callback URL in your provider's configuration matches the `AUTH_CALLBACK_URL` you specified.
- `AUTH_JWT_SECRET` is set (it is required for session management).
- «Sign-in expired»: the sign-in started in another tab, or took more than 10 minutes. Start it again. Two sign-ins in two tabs at
  once end the same way for the first one.
- «Access denied»: the email is not on `allowed_emails` / `allowed_domains`, or the provider did not confirm it.
  The server log names the email and whether it was confirmed.
- For OIDC providers, the `AUTH_PROVIDER_URL` points to the issuer root (e.g., `https://xxx.auth0.com`, not `https://xxx.auth0.com/authorize`).
