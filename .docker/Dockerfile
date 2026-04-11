FROM node:22-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run docs:build

FROM nginx:alpine

# Default env vars for Typesense search proxy
ENV TYPESENSE_UPSTREAM=http://typesense:8108
ENV TYPESENSE_COLLECTION=buggregator_docs
ENV TYPESENSE_API_KEY=buggregator-search-key
# Only substitute TYPESENSE_* vars — preserve nginx variables ($uri, $host, etc.)
ENV NGINX_ENVSUBST_FILTER=TYPESENSE_

COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html
COPY .docker/default.conf.template /etc/nginx/templates/default.conf.template
