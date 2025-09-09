FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Prisma schema and client
COPY prisma ./prisma
RUN npx prisma generate

# Build NestJS
COPY tsconfig.json ./tsconfig.json
COPY src ./src
COPY nest-cli.json ./nest-cli.json 2>/dev/null || true
RUN npm run build

# Entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["/app/entrypoint.sh"]


