# syntax=docker/dockerfile:1
# Shared base for both installs: node + pnpm + the manifests. Branching the two
# dependency stages off one base means pnpm is installed once, and BuildKit runs
# those stages in parallel instead of one after the other.
#
# Debian rather than alpine: the Prisma schema engine that `prisma db push`
# needs is a native binary linked against glibc/openssl, and the musl build
# has been the source of enough "engine not found" surprises to not be worth it.
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./


# Production dependency tree only. Independent of the compile, so it runs
# alongside the builder stage rather than after it. `prisma generate` here so
# the runtime node_modules carries the generated client.
FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --prod
COPY prisma ./prisma
COPY prisma.config.js ./
RUN pnpm exec prisma generate


# Full dependency tree + TypeScript compile.
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY prisma ./prisma
COPY prisma.config.js ./
RUN pnpm exec prisma generate
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN pnpm run build


FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production

# openssl for the Prisma schema engine; deploy.sh runs `prisma db push` from
# this image before it starts the new colour.
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules ./node_modules
COPY package.json prisma.config.js ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/main.js"]
