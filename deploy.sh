#!/usr/bin/env bash

# Script deploy untuk VPS: tarik perubahan terbaru dari git,
# install dependency, build TypeScript, lalu restart proses PM2.
#
# Pemakaian:
#   ./deploy.sh
#
# Setup awal (sekali saja):
#   chmod +x deploy.sh

set -e

APP_NAME="finance-bot"
BRANCH="main"

echo "📥 Menarik perubahan terbaru dari git ($BRANCH)..."
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "📦 Install dependency..."
npm install

echo "🔨 Build TypeScript..."
npm run build

if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
  echo "🔄 Restart proses PM2 ($APP_NAME)..."
  pm2 restart "$APP_NAME"
else
  echo "🚀 Proses PM2 belum ada, menjalankan baru ($APP_NAME)..."
  pm2 start dist/index.js --name "$APP_NAME"
fi

pm2 save

echo "✅ Deploy selesai. Cek log dengan: pm2 logs $APP_NAME"