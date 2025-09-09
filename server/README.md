# Defekt Backend (NestJS + Prisma + Postgres)

## Requisiti
- Docker + Docker Compose (per Postgres)
- Node 18+
- npm

## Avvio rapido

1. Avvia Postgres via Docker

```
docker compose up -d
```

2. Installa le dipendenze

```
cd server
npm install
```

3. Crea `.env`

```
# copia il modello e modifica i valori
cp .env.example .env
```

4. Genera client Prisma e migrazioni

```
npm run prisma:generate
npm run prisma:migrate -- --name init
```

5. Avvia il server

```
npm run start:dev
```

API:
- Health: GET /api/health
- Invia email: POST /api/mail/send
- Config: GET /api/config/latest, POST /api/config

## Note
- Il frontend chiama gli endpoint con prefisso `/api/...` ed è Nginx a fare proxy verso il backend.
- `docker-compose.yml` è in root: espone Postgres su 5432.
