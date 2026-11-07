FROM node:22-slim AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run docs:build

FROM nginx:alpine
# Only TYPESENSE_* vars are substituted in templates; nginx variables ($uri, $page) stay
ENV NGINX_ENVSUBST_FILTER=TYPESENSE_

COPY --from=builder /app/docs/.vitepress/dist /usr/share/nginx/html
COPY .docker/default.conf.template /etc/nginx/templates/default.conf.template
