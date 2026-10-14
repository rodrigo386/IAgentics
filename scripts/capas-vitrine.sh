#!/usr/bin/env bash
# Gera as capas da vitrine da /cursos marcadas `gerada` em cursos.vitrine
# (lib/content.ts), composições `capa-vitrine-<arquivo>` do Remotion, em
# public/vitrine/<arquivo>.jpg. Monta o bundle uma vez e renderiza todas.
#
# Capa refeita com o MESMO nome é servida antiga pelo cache do Cloudflare e
# do otimizador de imagem do Next: ao mudar o desenho de uma capa já no ar,
# troque o nome do arquivo em `capa` (ex.: -v2).
set -euo pipefail
cd "$(dirname "$0")/.."
BUNDLE=out/bundle-capas
npx remotion bundle --out-dir="$BUNDLE" >/dev/null
for id in $(npx remotion compositions "$BUNDLE" --quiet 2>/dev/null | tr ' ' '\n' | grep '^capa-vitrine-'); do
  arquivo="${id#capa-vitrine-}"
  npx remotion still "$BUNDLE" "$id" "public/vitrine/$arquivo.jpg" --image-format=jpeg --jpeg-quality=86 --log=error
  echo "ok $arquivo"
done
