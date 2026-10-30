# The catalogue viewer with this repository's catalogue baked in, for hosting (see HOSTING.md).
# For local use, visualizer/Dockerfile mounts the repository instead.
FROM node:22-alpine

WORKDIR /app
COPY visualizer/package.json visualizer/server.mjs visualizer/postman.mjs ./
COPY visualizer/public ./public
COPY --chown=node:node . /data

ENV PORT=8080
ENV CATALOGUE_DATA_DIR=/data
ENV NODE_ENV=production
# The hosted viewer must never run without its login; see HOSTING.md.
ENV AUTH_REQUIRED=true
EXPOSE 8080

USER node
CMD ["node", "server.mjs"]
