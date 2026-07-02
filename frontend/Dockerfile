# syntax=docker/dockerfile:1
FROM node:22-slim

WORKDIR /app

# Dépendances seules d'abord -> layer mis en cache tant que package*.json ne change pas
COPY package.json package-lock.json ./
RUN npm ci

# Code applicatif (aussi monté en volume par docker-compose pour le hot-reload en dev)
COPY . .

EXPOSE 5173

# --host expose le serveur en dehors du conteneur (sinon Vite n'écoute que 127.0.0.1)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
