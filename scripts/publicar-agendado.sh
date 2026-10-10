#!/bin/bash
# Publica o artigo agendado do dia e faz o deploy (2026-10-09). Roda todo dia
# às 9h pelo launchd (br.com.iagentics.publicar-artigos); se o Mac estiver
# dormindo, roda quando acordar. Log: ~/Library/Logs/iagentics-publicar-artigos.log
#
# Mesmo caminho do deploy feito à mão: testes dos artigos, build limpo, e2e dos
# artigos, commit, push, deploy-railway.sh e conferência da URL no ar. Qualquer
# falha desfaz a mudança no arquivo e avisa por notificação do macOS.
set -uo pipefail
export PATH="/Users/rodrigocosta/.nvm/versions/node/v24.18.1/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "/Users/rodrigocosta/Documents/Dev/Site IAgentics" || exit 1

avisa() { /usr/bin/osascript -e "display notification \"$1\" with title \"IAgentics: artigo do dia\"" >/dev/null 2>&1 || true; }
echo "===== $(date '+%Y-%m-%d %H:%M:%S')"

if [ -n "$(git status --porcelain -- content/artigos)" ]; then
  echo "content/artigos tem mudança não commitada; não publico por cima."; avisa "Não publiquei: há mudança não commitada nos artigos."; exit 1
fi
git pull --ff-only -q || { echo "git pull falhou"; avisa "Não publiquei: git pull falhou."; exit 1; }

SLUG=$(node scripts/proximo-agendado.mjs); COD=$?
if [ $COD -eq 2 ]; then avisa "O artigo da vez tem [VALIDAR] e ficou de fora."; exit 1; fi
if [ $COD -ne 0 ]; then echo "proximo-agendado falhou ($COD)"; avisa "Falha ao escolher o artigo do dia."; exit 1; fi
if [ -z "$SLUG" ]; then echo "Nada agendado para hoje."; exit 0; fi
echo "Publicando: $SLUG"
ARQ="content/artigos/$SLUG.md"

desfaz() { echo "FALHOU em: $1"; git checkout -- "$ARQ"; avisa "Não publiquei $SLUG: falhou em $1. Veja o log."; exit 1; }

npx vitest run lib/artigos.test.ts >/dev/null 2>&1 || desfaz "testes dos artigos"
pkill -f "next start" >/dev/null 2>&1; pkill -f next-server >/dev/null 2>&1; lsof -ti:3000 | xargs kill >/dev/null 2>&1
rm -rf .next
npx next build >/dev/null 2>&1 || desfaz "build"
npx playwright test e2e/artigos.spec.ts >/dev/null 2>&1 || desfaz "e2e dos artigos"
pkill -f "next start" >/dev/null 2>&1; pkill -f next-server >/dev/null 2>&1

git add "$ARQ" && git commit -q -m "feat: publica o artigo $SLUG (agendado)" && git push -q || desfaz "commit/push"
./scripts/deploy-railway.sh >/dev/null 2>&1 || { avisa "$SLUG commitado, mas o deploy falhou. Veja o log."; echo "deploy falhou"; exit 1; }

BUILD=$(cat .next/BUILD_ID)
for i in $(seq 1 45); do
  if curl -s "https://iagentics.com.br/artigos/$SLUG" | grep -q "$BUILD"; then
    echo "No ar: https://iagentics.com.br/artigos/$SLUG"; avisa "No ar: $SLUG"; exit 0
  fi
  sleep 20
done
echo "Deploy enviado, mas a URL não confirmou em 15 min."; avisa "$SLUG enviado, mas não confirmei no ar. Veja o log."; exit 1
