# Clone the project
FROM alpine/git as git

ARG REPOSITORY=https://github.com/buggregator/docs
ARG BRANCH=master
RUN git clone -b $BRANCH $REPOSITORY /app

FROM node:19 as node

COPY --from=git /app /app
WORKDIR /app

RUN npm add -D vitepress
RUN npm i
RUN npm run docs:build

FROM nginx:alpine as server

COPY --from=node /app/docs/.vitepress/dist /usr/share/nginx/html