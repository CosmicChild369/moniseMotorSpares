#!/bin/bash
# Codespaces one-time setup
set -e
cd /workspaces/moniseMotorSpares 2>/dev/null || cd "$(dirname "$0")/.."

cp -n .env.example .env 2>/dev/null || cp .env.example .env

if [ -n "$CODESPACE_NAME" ]; then
  SITE="https://${CODESPACE_NAME}-3000.app.github.dev"
  grep -q '^SITE_URL=' .env && sed -i "s|^SITE_URL=.*|SITE_URL=${SITE}|" .env || echo "SITE_URL=${SITE}" >> .env
fi

npm install
npm run seed
