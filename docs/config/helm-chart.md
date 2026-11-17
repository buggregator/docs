---
llms_description: "Helm chart 3.0.x (3.0.1: server 2.11.1) for Kubernetes: helm install oci://ghcr.io/buggregator/helm-chart/buggregator. One replica only (SQLite, ReadWriteOnce; other replicaCount fails to render), Recreate strategy. PVC 5Gi at /data (DB /data/buggregator.db, attachments /data/storage); storage.enabled=false = in memory. Non-root 65532, read-only root FS, /tmp emptyDir. Upgrade with --reset-then-reuse-values (Helm 3.14+; older: helm get values -o yaml > f, upgrade -f f); --reuse-values keeps old chart defaults. From 2.x: volumePermissions.enabled=true where fsGroup is ignored; Helm 4 first upgrade --server-side=false; clear database.dsn/attachmentStorage.mode/supportedEvents. config: becomes buggregator.yaml (projects, webhooks). Ingress = HTTP only; tcpService.enabled=true adds a LoadBalancer for SMTP 1025, VarDumper 9912, Monolog 9913, Xdebug 9003 (no auth: loadBalancerSourceRanges); HTTP proxy 8080 only with tcpService.proxy=true. ingress-nginx timeouts 3600 for WebSocket. SSO auth.*, jwtSecret generated and kept (lookup; set it for Argo CD; Flux keeps it). Values: retention, ui, sentry.sourceFetch, update, xdebug, xdebugTrace, mcp, metrics. Uninstall: chart 3.0.1+ keeps the PVC (helm.sh/resource-policy: keep; storage.keepOnUninstall=false deletes it; PVC <release>-buggregator-data, buggregator-data for release buggregator; reinstall same name+namespace reuses events); chart 3.0.0 deletes it."
---

# Configuration — Helm Chart

Deploy Buggregator on Kubernetes with the official Helm chart. The chart runs one Go binary with an embedded SQLite
database: no other services are needed.

This page describes chart **3.0.1** (server 2.11.1). Coming from chart 2.x? Read
[Upgrade from chart 2.x](#upgrade-from-chart-2-x) first.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8+ (for OCI registries); Helm 3.14+ for `--reset-then-reuse-values` on upgrade
- A default StorageClass, or set `storage.storageClassName`

## Install

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator
```

Open the web UI:

```bash
kubectl port-forward svc/buggregator 8000:8000
```

Then go to http://localhost:8000.

A specific chart version: add `--version 3.0.1`. A specific server image: `--set image.tag=2.11.1`. By default the
chart uses the server version it was released with (its `appVersion`).

## Data

By default the chart creates a PersistentVolumeClaim (a disk that outlives the pod) of 5Gi and mounts it at `/data`:

- the database: `/data/buggregator.db`
- attachments (SMTP attachments, HTTP dump files): `/data/storage`

So events survive a pod restart or an upgrade. To change the size or the storage class:

```yaml
storage:
  size: 10Gi
  storageClassName: fast-ssd
```

With `storage.enabled=false` everything is kept in memory. A restart then deletes all events.

Buggregator runs as **one replica**. SQLite allows one writer, and the volume can be mounted by one pod
(ReadWriteOnce). Any `replicaCount` other than `1` makes the chart fail to render.

Old events can be deleted automatically. For example, keep one week and at most 10,000 events:

```yaml
retention:
  maxAge: 7d
  maxEvents: 10000
```

Pinned events are never deleted.

## Projects, webhooks and other file settings

Some server settings have no value in the chart: projects, webhooks, mock rules. Put them under `config`. The chart
writes its contents to `buggregator.yaml` (a ConfigMap) and starts the server with `--config`:

```yaml
config:
  projects:
    - key: shop
      name: Shop backend
  webhooks:
    - event: sentry
      url: https://hooks.example.com/buggregator
```

The keys are the same as in the [server configuration file](./server.md). When the chart also sets the same setting
as an environment variable, the environment variable wins.

Any other server variable: `extraEnv` (a list of `{name, value}` or `valueFrom`) or `envFrom`.

## Connecting your application

Inside the cluster, use the Service name. For a release `buggregator` in the namespace `default`:

| What | Address |
|---|---|
| Sentry DSN | `http://sentry@buggregator.default.svc:8000/1` |
| Ray | host `buggregator.default.svc`, port `8000` |
| SMTP | `buggregator.default.svc:1025` |
| VarDumper | `tcp://buggregator.default.svc:9912` |
| Monolog (socket handler) | `buggregator.default.svc:9913` |
| HTTP dumps, Inspector, profiler | `http://buggregator.default.svc:8000` |
| HTTP proxy | `http://buggregator.default.svc:8080` |
| Xdebug (with `xdebug.enabled=true`) | `buggregator.default.svc:9003` |

For a Laravel app, the `.env` looks like this:

```dotenv
SENTRY_LARAVEL_DSN=http://sentry@buggregator.default.svc:8000/1

RAY_HOST=buggregator.default.svc
RAY_PORT=8000

MAIL_MAILER=smtp
MAIL_HOST=buggregator.default.svc
MAIL_PORT=1025

VAR_DUMPER_FORMAT=server
VAR_DUMPER_SERVER=buggregator.default.svc:9912

LOG_CHANNEL=socket
LOG_SOCKET_URL=buggregator.default.svc:9913
```

In the same namespace the short name `buggregator` works too.

## Access from outside the cluster

### Web UI: Ingress

An Ingress carries the web UI and everything else on HTTP port 8000 (Sentry, Ray, HTTP dumps, Inspector, profiler).

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    # The UI keeps a WebSocket open; ingress-nginx closes idle ones after 60 s by default.
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
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

Without the two timeout annotations, ingress-nginx closes the live event stream (`/connection/websocket`) after 60 seconds without traffic.

### SMTP, VarDumper, Monolog, Xdebug: TCP Service

These are plain TCP ports, so an Ingress cannot carry them. `tcpService.enabled=true` adds a second Service,
`buggregator-tcp`, with only these ports: SMTP 1025, VarDumper 9912, Monolog 9913, and Xdebug 9003 when
`xdebug.enabled=true`. Its type is `LoadBalancer` by default (`tcpService.type`). The web UI stays behind the Ingress.

::: warning
These ports have no authentication. On most clouds a `LoadBalancer` gets a public IP. Limit who can connect, or use
your cloud's internal load balancer annotation:

```yaml
tcpService:
  enabled: true
  extraSpec:
    loadBalancerSourceRanges: ["203.0.113.0/24"]
```
:::

The HTTP proxy (8080) is left out of this Service. It forwards any request, HTTPS included, so on a public IP anyone
could send traffic through your cluster. Add it with `tcpService.proxy=true` only behind such a limit.

## Authentication (SSO)

Restrict the web UI to signed-in users. Providers: `auth0`, `google`, `github`, `keycloak`, `gitlab`, `oidc`.

```bash
helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set auth.enabled=true \
  --set auth.provider=auth0 \
  --set auth.providerUrl=https://your-tenant.auth0.com \
  --set auth.clientId=YOUR_CLIENT_ID \
  --set auth.clientSecret=YOUR_CLIENT_SECRET \
  --set auth.callbackUrl=https://buggregator.example.com/auth/sso/callback
```

The session signing key (`auth.jwtSecret`) is generated on install and kept across upgrades, so users stay signed in.
You can also set it yourself.

The chart keeps the key by reading the release's Secret from the cluster. Tools that only render templates, such as
Argo CD, cannot read it, so they would make a new key on every sync and sign everyone out. (Flux runs real Helm
upgrades, so the key is kept there.) With Argo CD, set `auth.jwtSecret` or use your own Secret:

```bash
kubectl create secret generic buggregator-auth \
  --from-literal=client-id=YOUR_CLIENT_ID \
  --from-literal=client-secret=YOUR_CLIENT_SECRET \
  --from-literal=jwt-secret=$(openssl rand -hex 32)

helm install buggregator oci://ghcr.io/buggregator/helm-chart/buggregator \
  --set auth.enabled=true \
  --set auth.existingSecret=buggregator-auth
  # plus auth.provider, auth.providerUrl, auth.callbackUrl as above
```

Provider setup: [SSO guide](./sso.md).

## Prometheus metrics

```yaml
metrics:
  enabled: true
  addr: ":9090"
  serviceMonitor:
    enabled: true
```

`/metrics` has no authentication. Without `metrics.addr` it is served on the main port, so an Ingress makes it public.
With `metrics.addr` it moves to its own port. `serviceMonitor.enabled` needs the Prometheus Operator.

## Security

The pod runs as user 65532 (not root), with a read-only root filesystem, all Linux capabilities dropped and the
`RuntimeDefault` seccomp profile. `fsGroup` makes the volume writable for that user. `/tmp` is a writable `emptyDir`:
the VarDumper parser is unpacked and run from there.

## Upgrade

```bash
helm upgrade buggregator oci://ghcr.io/buggregator/helm-chart/buggregator --reset-then-reuse-values
```

`--reset-then-reuse-values` (Helm 3.14+) takes the new chart's defaults plus the values you set yourself.
`--reuse-values` keeps the **old** chart's defaults too, so new settings never arrive. Since server 2.11.1 the update
notice shows both commands; server 2.11.0 shows only `--reuse-values`, so use `--reset-then-reuse-values` instead.

Helm older than 3.14: save the values you set yourself, then pass them back:

```bash
helm get values buggregator -o yaml > my-values.yaml
helm upgrade buggregator oci://ghcr.io/buggregator/helm-chart/buggregator -f my-values.yaml
```

Use the same `-f my-values.yaml` in place of `--reset-then-reuse-values` in the steps below.

The chart replaces the pod with the `Recreate` strategy: the old pod stops before the new one starts, because both
would open the same SQLite file. Expect a few seconds of downtime.

### Upgrade from chart 2.x

Chart 2.x kept data in memory and ran as root. Chart 3.x keeps data on a volume and runs as user 65532. Events
stored in memory by the 2.x release are not carried over.

1. **Settings you set yourself.** If you set `database.dsn: ":memory:"`, `attachmentStorage.mode: memory` or a
   `supportedEvents` list, clear them on this upgrade to take the new defaults. Check with
   `helm get values buggregator`:

   ```bash
   helm upgrade buggregator oci://ghcr.io/buggregator/helm-chart/buggregator --reset-then-reuse-values \
     --set database.dsn= --set attachmentStorage.mode= --set supportedEvents=
   ```

   The old `supportedEvents` default had no `xdebug-trace`.

2. **File ownership.** Most volume plugins hand the volume to the pod's group on mount, so nothing is needed. Some
   ignore it: hostPath, local-path, many NFS setups. There the server cannot write the old database and restarts with
   «attempt to write a readonly database». Add `--set volumePermissions.enabled=true` on this upgrade: an init
   container gives `/data` to user 65532 before the server starts. It runs as root, so clusters with the "restricted"
   Pod Security level reject it.

3. **Helm 4.** Chart 2.x used the RollingUpdate strategy. Helm 4's server-side apply cannot remove its leftover
   settings, so the first upgrade fails with `spec.strategy.rollingUpdate: Forbidden`. Run that first upgrade once with
   `--server-side=false`. Releases installed with Helm 3 upgrade as is.

## Values

| Parameter | Description | Default |
|---|---|---|
| `image.repository` | Server image | `ghcr.io/buggregator/server` |
| `image.tag` | Image tag | chart `appVersion` |
| `database.dsn` | SQLite DSN | `/data/buggregator.db` with storage, else `:memory:` |
| `database.maxOpenConns` | SQLite connection pool size | server default |
| `attachmentStorage.mode` | `filesystem` or `memory` | `filesystem` with storage, else `memory` |
| `attachmentStorage.path` | Attachments directory | `/data/storage` |
| `storage.enabled` | PVC at `/data` | `true` |
| `storage.size` | PVC size | `5Gi` |
| `storage.storageClassName` | Storage class | `""` (cluster default) |
| `storage.keepOnUninstall` | Keep the PVC on `helm uninstall` (chart 3.0.1+) | `true` |
| `retention.maxAge` | Delete events older than this (`24h`, `7d`) | keep |
| `retention.maxEvents` | Keep at most this many events | no cap |
| `config` | Contents of `buggregator.yaml` (projects, webhooks, mocks) | `{}` |
| `extraEnv`, `envFrom` | More environment for the container | `[]` |
| `cors.origins` | Allowed CORS origins | `*` |
| `supportedEvents` | Enabled event types (comma-separated) | all |
| `ui.defaultLimit`, `ui.maxLimit`, `ui.defaultWindow` | Event list limits | server defaults |
| `sentry.sourceFetch` | Fetch JS sources for stack frames: `private`, `any`, `off` | `private` |
| `update.checkEnabled`, `update.checkInterval` | New-version notice | on, `12h` |
| `update.selfUpdate` | Update from the UI: `auto`, `on`, `off`. In Kubernetes `auto` shows the `helm upgrade` command | `auto` |
| `xdebug.enabled` | Xdebug proxy on port 9003 | `false` |
| `xdebug.ideAddr`, `xdebug.mode`, `xdebug.idleTimeout`, `xdebug.allowEval`, `xdebug.allowControl`, `xdebug.pauseOnFirstLine` | Xdebug proxy settings | server defaults |
| `xdebugTrace.maxUpload`, `xdebugTrace.maxSize`, `xdebugTrace.keep` | Uploaded Xdebug traces | `100MB`, `256MB`, `20` |
| `auth.enabled` | SSO | `false` |
| `auth.provider` | `auth0`, `google`, `github`, `keycloak`, `gitlab`, `oidc` | `oidc` |
| `auth.providerUrl`, `auth.clientId`, `auth.clientSecret`, `auth.callbackUrl` | SSO settings | `""` |
| `auth.scopes` | OAuth scopes | `openid,email,profile` |
| `auth.jwtSecret` | Session signing key | generated once, kept |
| `auth.existingSecret` | Secret with `client-id`, `client-secret`, `jwt-secret` | `""` |
| `mcp.enabled`, `mcp.transport`, `mcp.addr`, `mcp.authToken` | MCP server for AI assistants | off, `socket`, `:8001`, `""` |
| `mcp.existingSecret`, `mcp.existingSecretKey` | Take the MCP token from a Secret | `""`, `mcp-auth-token` |
| `metrics.enabled` | Prometheus `/metrics` (no auth) | `false` |
| `metrics.addr` | Separate metrics address (e.g. `:9090`); empty = main port | `""` |
| `metrics.serviceMonitor.enabled` | Prometheus Operator ServiceMonitor | `false` |
| `service.type` | Service type | `ClusterIP` |
| `service.httpPort`, `smtpPort`, `varDumperPort`, `monologPort`, `proxyPort`, `xdebugPort` | Service ports | `8000`, `1025`, `9912`, `9913`, `8080`, `9003` |
| `service.annotations` | Service annotations | `{}` |
| `tcpService.enabled`, `type`, `proxy`, `annotations`, `extraSpec` | Second Service for the TCP ports; `proxy` adds the HTTP proxy | off, `LoadBalancer`, `false` |
| `ingress.*` | Ingress for the web UI | off |
| `podSecurityContext`, `securityContext` | Non-root, read-only root filesystem (see [Security](#security)) | set |
| `volumePermissions.enabled` | Root init container that gives `/data` to the pod's user (upgrades from 2.x) | `false` |
| `resources` | Requests 50m CPU, 128Mi memory; no limits | |
| `nodeSelector`, `tolerations`, `affinity` | Scheduling | empty |

Every option with comments: [`values.yaml`](https://github.com/buggregator/helm-chart/blob/master/values.yaml).

## Uninstall

```bash
helm uninstall buggregator
```

From chart 3.0.1 the volume is kept: `helm uninstall` leaves the PVC and your events on it. Install again with the
same release name and namespace, and Buggregator picks the old events up. To delete the data too:

```bash
kubectl delete pvc buggregator-data
```

The name is `<release>-buggregator-data`, or `<release>-data` when the release name contains `buggregator`.
`kubectl get pvc` lists it. To delete the PVC with the release, as before, set `storage.keepOnUninstall=false` on install or with
`helm upgrade` before you uninstall: `helm uninstall` takes no `--set`.

Chart 3.0.0 deletes the PVC with the release. With the usual StorageClass setting (`reclaimPolicy: Delete`) the
volume and the database go with it; with `Retain` the volume stays. Copy `/data/buggregator.db` first if you need it.
