FROM node:20-bookworm-slim

# Ensure OpenSSL and CA certs present
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Prisma schema and client
COPY prisma ./prisma
RUN npx prisma generate

# Copy prebuilt dist (build on host CI/local to reduce memory needs in container)
COPY dist ./dist

# Entrypoint
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

CMD ["/app/entrypoint.sh"]


