FROM node:20-alpine

# Prisma needs OpenSSL 1.1 on Alpine (musl); add compat libs
RUN apk add --no-cache openssl1.1-compat libc6-compat

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


