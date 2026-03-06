FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/index.js ./
COPY server/schema.sql ./
COPY index.html styles.css ./public/
COPY js ./public/js/

EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "index.js"]
