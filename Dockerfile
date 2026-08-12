# Build determinístico para o Railway (e qualquer outro host de containers).
#
# POR QUE EXISTE: o builder automático do Railway (Railpack) restaurava cache de
# build do primeiro deploy deste serviço — que era outra árvore de código — e o
# artefato saía com a rota raiz de lá (a home redirecionava para /app/entrar
# mesmo com o fonte correto no disco). Diagnóstico completo: mesma origem, mesmo
# node_modules e mesmo ambiente rodando `next build` puro dentro do container
# produziam a home certa; só o build do Railpack saía envenenado. Um Dockerfile
# no repo faz o Railway usar ESTE build, sem caches herdados de outra árvore.
FROM node:24-slim

WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

# Dependências primeiro, para o layer de npm ci sobreviver a mudanças de código.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
# Instrumentação de diagnóstico: o build remoto produzia uma rota raiz diferente
# da que o MESMO fonte e o MESMO comando produzem em qualquer outro lugar. As
# linhas abaixo gravam na imagem o que o builder viu — hash do fonte, ambiente e
# tamanho do artefato — para inspeção via ssh.
RUN md5sum app/page.tsx app/layout.tsx middleware.ts > /diag-fontes.txt && env | sort > /diag-env.txt
RUN npm run build
RUN wc -c .next/server/app/page.js .next/server/app/app/page.js >> /diag-fontes.txt

# O Railway injeta PORT; o next start respeita a variável.
CMD ["npx", "next", "start"]
