#!/bin/sh
# Deploy no Railway com artefato local (ver a história no Dockerfile).
# Uso: sh scripts/deploy-railway.sh   (exige RAILWAY_TOKEN no .env.local)
set -e
cd "$(dirname "$0")/.."
export RAILWAY_API_TOKEN=$(grep "^RAILWAY_TOKEN=" .env.local | cut -d= -f2-)
echo "== build local =="
npm run build
echo "== empacotando artefato como next-build/ =="
rm -rf next-build && cp -R .next next-build && rm -rf next-build/cache
echo "== upload =="
npx --yes @railway/cli@latest up --service IAgentics --detach
rm -rf next-build
echo "== enviado; acompanhe o build no dashboard =="
