FROM node:20-alpine AS base
RUN npm config set registry https://registry.npmmirror.com

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

FROM base AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY package.json vite.config.ts tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js index.html ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build && \
    rm -rf node_modules /tmp/* /var/cache/apk/*

FROM nginx:alpine AS runner
RUN rm -rf /usr/share/nginx/html/* && \
    echo 'server { listen 5173; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } gzip on; gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript; }' > /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5173 || exit 1
CMD ["nginx", "-g", "daemon off;"]

