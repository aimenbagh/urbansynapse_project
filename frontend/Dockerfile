FROM node:20-slim AS build

WORKDIR /app

# Variable d'API injectée au build (Railway la passe comme build arg)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install
RUN npm install --save-dev typescript@5.6.3 @types/geojson
COPY . .
RUN npm run build

# Étape de service : serveur statique léger
FROM node:20-slim
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
ENV PORT=4173
EXPOSE 4173
# -s = mode SPA (toutes les routes → index.html)
CMD ["sh", "-c", "serve -s dist -l ${PORT:-4173}"]
