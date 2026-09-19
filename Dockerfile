# SciROS Reference Implementation — development container skeleton
# Sprint 1: toolchain only. No Processor runtime services.

FROM node:22-bookworm-slim

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

CMD ["pnpm", "run", "build"]
