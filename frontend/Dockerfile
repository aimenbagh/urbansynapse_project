FROM node:20-slim AS build

WORKDIR /app
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
# serve sert le dossier dist sur le port Railway, avec fallback SPA
CMD serve -s dist -l ${PORT:-4173}
