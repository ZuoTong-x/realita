FROM node:22-bullseye-slim AS base

ENV http_proxy=http://10.161.32.26:30200
ENV https_proxy=http://10.161.32.26:30200
ENV HTTP_PROXY=http://10.161.32.26:30200
ENV HTTPS_PROXY=http://10.161.32.26:30200

RUN corepack enable
RUN corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN pnpm config set registry https://registry.npmmirror.com/

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build-prod

FROM nginx:alpine AS runner

# 复制构建产物到 nginx 静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

ENV http_proxy=
ENV https_proxy=
ENV HTTP_PROXY=
ENV HTTPS_PROXY=

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
