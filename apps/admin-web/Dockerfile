# Built from the monorepo root (see docker-compose.yml: context: .) — a
# pnpm workspace needs the whole repo present to resolve internal deps.
FROM node:20-slim

RUN corepack enable

WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter admin-web build

WORKDIR /repo/apps/admin-web
EXPOSE 3001
CMD ["pnpm", "start"]
