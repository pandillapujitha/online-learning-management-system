# ---- stage 1: build the React app ----
FROM node:20-alpine AS web
WORKDIR /web
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# ---- stage 2: run the Node.js API and serve both front ends ----
FROM node:20-alpine
WORKDIR /srv/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend ./
COPY landing /srv/landing
COPY --from=web /web/dist /srv/frontend/dist
ENV PORT=5000 DB_FILE=/data/db.json
VOLUME /data
EXPOSE 5000
HEALTHCHECK CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "server.js"]
