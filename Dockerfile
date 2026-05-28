# syntax=docker/dockerfile:1
# cache-bust: 2026-05-27-v2
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@10

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY prisma ./prisma
RUN pnpm exec prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
