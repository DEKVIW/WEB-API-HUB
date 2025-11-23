#!/bin/sh
set -e

# 创建数据目录并设置权限
mkdir -p /app/data
chown -R nodejs:nodejs /app/data
chmod 755 /app/data

# 切换到 nodejs 用户执行应用
exec su-exec nodejs sh -c "cd /app && npx prisma db push --accept-data-loss --skip-generate --schema=./prisma/schema.prisma && node dist/index.js"

