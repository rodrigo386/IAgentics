#!/usr/bin/env bash
# Põe a música licenciada do Free To Use nos vídeos de lançamento da /cursos
# (2026-10-14, escolha do Rodrigo: "Snap Your Fingers", de Aylex, no
# lançamento; "Rush Factor", de Aetheric, no "O que tem dentro").
#
# LICENÇA: o plano gratuito do Free To Use proíbe "Commercial Content", e post
# da IAgentics anunciando assinatura é comercial. Postar estes arquivos exige a
# Commercial License deles (freetouse.com/license). Sem ela, use a trilha
# sintetizada (npm run video:render:social), que não tem restrição.
#
# O trecho de cada música foi escolhido medindo a energia: a retomada depois
# de uma pausa cai no corte principal do vídeo (2,5 s no lançamento, quando a
# cascata começa; 3 s no "dentro", quando entra a primeira trilha). Os vídeos
# mudos vêm de out/social/mudo/ (npm run video:render:social os gera).
set -euo pipefail
cd "$(dirname "$0")/.."
M=out/social/musica
mkdir -p "$M"

# id da faixa na API (api.freetouse.com/v3) | início do trecho (s) | vídeo | duração (s)
FAIXAS=(
  "bf10318d-acb3-6542-7b8c-248b65abd669 44.55 lancamento 17"  # Snap Your Fingers: retomada em 47,05 s
  "9bb9e170-8e47-4f86-9039-d610c0744ccd 29.68 dentro 22"      # Rush Factor: retomada em 32,68 s
)

for linha in "${FAIXAS[@]}"; do
  read -r id inicio video dur <<<"$linha"
  [ -f "$M/$id.mp3" ] || curl -sfL "https://eu.data.freetouse.com/music/tracks/$id/file/mp3/file.mp3" -o "$M/$id.mp3"
  # O ffmpeg do Remotion não tem filtros de áudio (afade, loudnorm): ele só
  # corta o trecho, e as rampas e o volume saem do python abaixo.
  npx remotion ffmpeg -y -loglevel error -ss "$inicio" -t "$dur" -i "$M/$id.mp3" -ar 48000 -ac 2 "$M/trecho-$video.wav"
  python3 - "$M/trecho-$video.wav" "$M/trilha-$video.wav" <<'PY'
import sys, wave, numpy as np
entrada, saida = sys.argv[1], sys.argv[2]
w = wave.open(entrada); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).astype(float) / 32768
n = len(x); t = np.arange(n) / sr
x *= np.minimum(1, t / 0.3)[:, None]                     # entra em 0,3 s
x *= np.minimum(1, (n / sr - t) / 1.2)[:, None]          # sai nos últimos 1,2 s
# Volume perto de -14 LUFS (a referência das redes), por RMS em blocos de
# 400 ms com porta em -40 dB; sem o filtro K, é aproximação, não medição.
blocos = [np.sqrt((x[i:i + int(0.4 * sr)] ** 2).mean()) for i in range(0, n - int(0.4 * sr), int(0.1 * sr))]
blocos = np.array([b for b in blocos if b > 10 ** (-40 / 20)])
atual = 20 * np.log10(np.sqrt((blocos ** 2).mean()))
x *= 10 ** ((-14 - atual) / 20)
teto = 10 ** (-1 / 20)                                   # pico em -1 dB, com saturação suave
x = np.where(np.abs(x) > teto * 0.8, np.sign(x) * (teto * 0.8 + (teto * 0.2) * np.tanh((np.abs(x) - teto * 0.8) / (teto * 0.2))), x)
pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
with wave.open(saida, "wb") as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(sr); o.writeframes(pcm.tobytes())
print(f"{saida}: {atual:.1f} dB -> -14")
PY
  for formato in vertical feed; do
    npx remotion ffmpeg -y -loglevel error -i "out/social/mudo/$video-$formato.mp4" -i "$M/trilha-$video.wav" \
      -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
      "out/social/iagentics-$video-$formato-musica.mp4"
    echo "ok out/social/iagentics-$video-$formato-musica.mp4"
  done
done
