---
llms_description: "Helm chart installation for Kubernetes. Standalone mode (embedded DoltDB), external database (PostgreSQL/MySQL), SSO (Auth0/Kinde). Configurable RoadRunner workers, CORS, logging, Ingress, Prometheus ServiceMonitor, PVC storage. Service ports: 8000 HTTP, 1025 SMTP, 9912 VarDumper, 9913 Monolog, 9914 Profiler, 2112 metrics."
---

# Configuration — Helm Chart

Deploy Buggregator on Kubernetes using the official Helm chart. The chart supports three deployment modes:

- **Standalone** — embedded DoltDB database, zero external dependencies
- **External database** — connects to your PostgreSQL or MySQL instance
- **With SSO** — enables Auth0 or Kinde authentication

## Prerequisites

- Kubernetes 1.23+
- Helm 3.x

## Installation

### Standalone (default)

The simplest setup — uses the built-in DoltDB, no external dependencies required:

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator
```

Open the web UI:

```bash
kubectl port-forward svc/buggregator 8000:8000
```

Then navigate to http://localhost:8000.

### With external database

For production or multi-replica deployments, connect to an external PostgreSQL or MySQL database:

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set persistence.driver=db \
  --set externalDatabase.driver=pgsql \
  --set externalDatabase.host=my-postgres.database.svc \
  --set externalDatabase.port=5432 \
  --set externalDatabase.database=buggregator \
  --set externalDatabase.username=buggregator \
  --set externalDatabase.password=changeme
```

For MySQL, use `externalDatabase.driver=mysql` and `externalDatabase.port=3306`.

> **Warning:** Buggregator does not create the database — only the tables inside it. Create the database beforehand.

### With SSO

Enable SSO to restrict access to the web UI. Supported providers: [Auth0](https://auth0.com/)
and [Kinde](https://kinde.com/).

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set auth.enabled=true \
  --set auth.provider=auth0 \
  --set auth.providerUrl=https://your-tenant.auth0.com \
  --set auth.clientId=YOUR_CLIENT_ID \
  --set auth.clientSecret=YOUR_CLIENT_SECRET \
  --set auth.callbackUrl=https://buggregator.example.com/auth/sso/callback
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

## Connecting your PHP application

Once deployed, configure your PHP application to send data to Buggregator using the Kubernetes service name.

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

## Tuning RoadRunner workers

Adjust worker pool sizes based on your load. More workers = more concurrent request handling, but also more memory
usage.

```yaml
roadrunner:
  http:
    numWorkers: 4      # HTTP request handling
  jobs:
    numWorkers: 4      # Background job processing
  centrifuge:
    numWorkers: 2      # WebSocket connections
```

For logging configuration:

```yaml
roadrunner:
  logLevel: info         # error, warn, info, debug
  logEncoding: json      # json or console
  logMode: production    # production, development, raw
```

## Prometheus metrics

Buggregator exposes Prometheus-compatible metrics on port 2112. Enable the ServiceMonitor for automatic scraping:

```yaml
metrics:
  serviceMonitor:
    enabled: true
    interval: 30s
```

## Using existing secrets

For production environments, store sensitive values in pre-created Kubernetes secrets instead of passing them via Helm
values:

```bash
# Create secrets
kubectl create secret generic buggregator-app --from-literal=encrypter-key=YOUR_KEY
kubectl create secret generic buggregator-db --from-literal=db-password=YOUR_DB_PASSWORD
kubectl create secret generic buggregator-auth \
  --from-literal=client-id=YOUR_CLIENT_ID \
  --from-literal=client-secret=YOUR_CLIENT_SECRET

# Reference them in values
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set app.existingSecret=buggregator-app \
  --set externalDatabase.existingSecret=buggregator-db \
  --set auth.existingSecret=buggregator-auth
```

## Storage

The chart creates a PersistentVolumeClaim for `/app/runtime` (attachments, XHProf profiles). To customize:

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

## Full configuration reference

| Parameter                          | Description                                  | Default                      |
|------------------------------------|----------------------------------------------|------------------------------|
| `replicaCount`                     | Number of replicas (>1 requires external DB) | `1`                          |
| `image.repository`                 | Container image                              | `ghcr.io/buggregator/server` |
| `image.tag`                        | Image tag (defaults to appVersion)           | `""`                         |
| `app.env`                          | Application environment                      | `production`                 |
| `app.debug`                        | Enable debug mode                            | `false`                      |
| `app.encrypterKey`                 | Encryption key (auto-generated if empty)     | `""`                         |
| `app.existingSecret`               | Existing secret for encrypter key            | `""`                         |
| `persistence.driver`               | `cache` (embedded) or `db` (external)        | `cache`                      |
| `externalDatabase.driver`          | `pgsql` or `mysql`                           | `pgsql`                      |
| `externalDatabase.host`            | Database host                                | `""`                         |
| `externalDatabase.port`            | Database port                                | `5432`                       |
| `externalDatabase.database`        | Database name                                | `buggregator`                |
| `externalDatabase.username`        | Database username                            | `buggregator`                |
| `externalDatabase.password`        | Database password                            | `""`                         |
| `externalDatabase.existingSecret`  | Existing secret for DB password              | `""`                         |
| `auth.enabled`                     | Enable SSO                                   | `false`                      |
| `auth.provider`                    | `auth0` or `kinde`                           | `auth0`                      |
| `auth.providerUrl`                 | Provider URL                                 | `""`                         |
| `auth.clientId`                    | OAuth client ID                              | `""`                         |
| `auth.clientSecret`                | OAuth client secret                          | `""`                         |
| `auth.callbackUrl`                 | OAuth callback URL                           | `""`                         |
| `auth.scopes`                      | OAuth scopes                                 | `openid,email,profile`       |
| `auth.existingSecret`              | Existing secret for auth                     | `""`                         |
| `roadrunner.http.numWorkers`       | HTTP workers                                 | `2`                          |
| `roadrunner.jobs.numWorkers`       | Job queue workers                            | `2`                          |
| `roadrunner.centrifuge.numWorkers` | WebSocket workers                            | `2`                          |
| `roadrunner.logLevel`              | Log level                                    | `warn`                       |
| `roadrunner.logEncoding`           | Log format                                   | `json`                       |
| `roadrunner.logMode`               | Log mode                                     | `production`                 |
| `roadrunner.cors.allowedOrigin`    | CORS origins                                 | `*`                          |
| `roadrunner.cors.allowedHeaders`   | CORS headers                                 | `*`                          |
| `roadrunner.cors.allowCredentials` | CORS credentials                             | `true`                       |
| `service.type`                     | Service type                                 | `ClusterIP`                  |
| `service.httpPort`                 | Web UI port                                  | `8000`                       |
| `service.smtpPort`                 | SMTP port                                    | `1025`                       |
| `service.varDumperPort`            | VarDumper port                               | `9912`                       |
| `service.monologPort`              | Monolog port                                 | `9913`                       |
| `service.profilerPort`             | Profiler port                                | `9914`                       |
| `service.metricsPort`              | Metrics port                                 | `2112`                       |
| `ingress.enabled`                  | Enable Ingress                               | `false`                      |
| `storage.enabled`                  | Enable PVC                                   | `true`                       |
| `storage.size`                     | PVC size                                     | `5Gi`                        |
| `metrics.serviceMonitor.enabled`   | Enable ServiceMonitor                        | `false`                      |
| `supportedEvents`                  | Enabled event types                          | all                          |

## Uninstall

```bash
helm uninstall buggregator
```

> **Note:** The PVC is not deleted automatically. To remove it:
> ```bash
> kubectl delete pvc buggregator-runtime
> ```
