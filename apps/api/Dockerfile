# API Express + Prisma. Build multi-stage:
#  - stage "build" usa a imagem completa (tem gcc/make/python) para compilar
#    dependências nativas como o bcrypt e gerar o Prisma Client.
#  - stage final é slim, só com o necessário para correr.

FROM node:22-bookworm AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

FROM node:22-bookworm-slim
WORKDIR /app

# Prisma precisa de openssl em runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# node_modules (com bcrypt já compilado e Prisma Client gerado) vem do build.
COPY --from=build /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

# Aplica migrations pendentes e arranca a API.
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
