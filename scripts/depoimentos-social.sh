#!/usr/bin/env bash
# Edita os depoimentos do Vinícius (2026-10-15) no conceito "moldura da
# marca": remotion/social/Depoimento.tsx, em 9:16 e 4:5, com áudio (a voz do
# vídeo + a música de fundo baixa).
#
# Os vídeos originais e a música ficam em out/publico-depoimentos/ (fora do
# site e do git); o bundle usa essa pasta como pública. Para montar a pasta:
#   depoimentos/<hora>.mp4  ← ~/Downloads/WhatsApp Video 2026-10-15 at <hora>.mp4
#   musica/bright-strategy.mp3 ← Free To Use, "Bright Strategy" (Bluewave)
#   plataforma/academy-logo.png, partner-pecege.png ← copiados de public/
# MÚSICA: a licença gratuita do Free To Use proíbe conteúdo comercial; postar
# exige a Commercial License deles.
set -euo pipefail
cd "$(dirname "$0")/.."
npx remotion bundle --public-dir=out/publico-depoimentos --out-dir=out/bundle-depoimentos >/dev/null
mkdir -p out/social
for id in 15-42-25 15-50-25 16-00-47 16-11-29; do
  for formato in vertical feed; do
    npx remotion render out/bundle-depoimentos "depoimento-$id-$formato" "out/social/depoimento-$id-$formato.mp4" \
      --codec=h264 --crf=20 --pixel-format=yuv420p --color-space=bt709 --audio-bitrate=192k --log=error
    echo "ok out/social/depoimento-$id-$formato.mp4"
  done
done
