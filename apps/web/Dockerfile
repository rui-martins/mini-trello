# Build do frontend React/Vite e serve estático via nginx.
FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine

# Config que serve a SPA e faz proxy de /api para o serviço da API.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
