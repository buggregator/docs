---
llms_description: "Helm chart installation for Kubernetes. Standalone mode (embedded SQLite), SSO (Auth0, Google, GitHub, Keycloak, GitLab, OIDC). Configurable CORS, logging, Ingress, Prometheus ServiceMonitor, PVC storage. Service ports: 8000 HTTP, 1025 SMTP, 9912 VarDumper, 9913 Monolog."
---

# Configuration — Helm Chart

Deploy Buggregator on Kubernetes using the official Helm chart. The chart deploys a single Go binary
with an embedded SQLite database — no external dependencies required.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.x

## Installation

### Standalone (default)

The simplest setup — uses embedded SQLite, no external dependencies:

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator
```

Open the web UI:

```bash
kubectl port-forward svc/buggregator 8000:8000
```

Then navigate to http://localhost:8000.

### With SSO

Enable SSO to restrict access to the web UI. Supported providers: Auth0, Google, GitHub, Keycloak,
GitLab, and generic OIDC.

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set auth.enabled=true \
  --set auth.provider=auth0 \
  --set auth.providerUrl=https://your-tenant.auth0.com \
  --set auth.clientId=YOUR_CLIENT_ID \
  --set auth.clientSecret=YOUR_CLIENT_SECRET \
  --set auth.callbackUrl=https://buggregator.example.com/auth/sso/callback \
  --set auth.jwtSecret=YOUR_JWT_SECRET
```

For detailed SSO configuration, see the [SSO guide](./sso.md).

### With Ingress

Expose the web UI via an Ingress controller:

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set ingress.enabled=true \
  --set ingress.className=nginx \
  --set 'ingress.hosts[0].host=buggregator.example.com' \
  --set 'ingress.hosts[0].paths[0].path=/' \
  --set 'ingress.hosts[0].paths[0].pathType=Prefix'
```

With TLS (using cert-manager):

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: buggregator.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: buggregator-tls
      hosts:
        - buggregator.example.com
```

## Connecting your application

Once deployed, configure your application to send data to Buggregator using the Kubernetes service name.

Assuming the release is named `buggregator` in the `default` namespace:

```dotenv
# Sentry
SENTRY_LARAVEL_DSN=http://sentry@buggregator.default.svc:8000/1

# Ray
RAY_HOST=buggregator.default.svc
RAY_PORT=8000

# SMTP
MAIL_MAILER=smtp
MAIL_HOST=buggregator.default.svc
MAIL_PORT=1025

# VarDumper
VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=buggregator.default.svc:9912

# Monolog (SocketHandler)
LOG_CHANNEL=socket
LOG_SOCKET_URL=buggregator.default.svc:9913
```

If your application runs in the same namespace, you can use the short service name `buggregator` instead of the FQDN.

## Prometheus Metrics

Enable metrics and create a ServiceMonitor for automatic scraping:

```yaml
metrics:
  serviceMonitor:
    enabled: true
    interval: 30s
```

## Using Existing Secrets

For production environments, store sensitive values in pre-created Kubernetes secrets:

```bash
# Create secrets
kubectl create secret generic buggregator-auth \
  --from-literal=client-id=YOUR_CLIENT_ID \
  --from-literal=client-secret=YOUR_CLIENT_SECRET

# Reference them in values
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set auth.existingSecret=buggregator-auth
```

## Storage

The chart creates a PersistentVolumeClaim for data persistence (SQLite database, attachments). To customize:

```yaml
storage:
  enabled: true
  size: 10Gi
  storageClassName: fast-ssd
```

Disable if you don't need persistent storage (data will be lost on pod restart):

```yaml
storage:
  enabled: false
```

## Full Configuration Reference

| Parameter | Description | Default |
|------------------------------------|----------------------------------------------|------------------------------|
| `replicaCount` | Number of replicas | `1` |
| `image.repository` | Container image | `ghcr.io/buggregator/server` |
| `image.tag` | Image tag (defaults to appVersion) | `""` |
| `auth.enabled` | Enable SSO | `false` |
| `auth.provider` | SSO provider | `auth0` |
| `auth.providerUrl` | Provider URL | `""` |
| `auth.clientId` | OAuth client ID | `""` |
| `auth.clientSecret` | OAuth client secret | `""` |
| `auth.callbackUrl` | OAuth callback URL | `""` |
| `auth.scopes` | OAuth scopes | `openid,email,profile` |
| `auth.existingSecret` | Existing secret for auth | `""` |
| `supportedEvents` | Enabled event types | all |
| `service.type` | Service type | `ClusterIP` |
| `service.httpPort` | Web UI port | `8000` |
| `service.smtpPort` | SMTP port | `1025` |
| `service.varDumperPort` | VarDumper port | `9912` |
| `service.monologPort` | Monolog port | `9913` |
| `ingress.enabled` | Enable Ingress | `false` |
| `storage.enabled` | Enable PVC | `true` |
| `storage.size` | PVC size | `5Gi` |
| `metrics.serviceMonitor.enabled` | Enable ServiceMonitor | `false` |

## Uninstall

```bash
helm uninstall buggregator
```

> **Note:** The PVC is not deleted automatically. To remove it:
> ```bash
> kubectl delete pvc buggregator-storage
> ```
