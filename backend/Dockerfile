FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat && \
    npm config set registry https://registry.npmmirror.com
ENV PRISMA_ENGINES_MIRROR=https://npmmirror.com/mirrors/prisma

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --production; fi && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && \
    npm cache clean --force
COPY src/ ./src/
COPY prisma/ ./prisma/
RUN npx prisma generate && npm run build && \
    rm -rf node_modules/.cache /tmp/*

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache su-exec && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --shell /bin/sh nodejs
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
ENTRYPOINT ["docker-entrypoint.sh"]

