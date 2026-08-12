# Imagem de runtime: serve o .next BUILDADO LOCALMENTE (e validado por 18 e2e).
#
# HISTÓRIA, para quem mexer depois: o builder remoto do Railway produzia, a
# partir dos MESMOS bytes de fonte (provado por md5 gravado na imagem), um
# artefato com a rota raiz errada — a home redirecionava para /app/entrar.
# Reproduções dentro do próprio container de produção (next build puro, npm run
# build, env estéril idêntico ao do builder, com e sem OTEL) geravam SEMPRE o
# artefato correto. Esgotadas as variáveis observáveis, o build saiu do builder:
# o .next entra pronto no contexto (ver .railwayignore, que existe para deixar o
# .next passar) e a imagem só instala dependências de runtime e serve.
#
# Consequência operacional: rode `npm run build` ANTES de `railway up`. O deploy
# via GitHub (sem artefato no contexto) NÃO funciona com este Dockerfile.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

# O Railway injeta PORT; o next start respeita a variável.
CMD ["npx", "next", "start"]
