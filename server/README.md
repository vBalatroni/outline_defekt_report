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
- Health: GET http://localhost:4000/health
- Invia email: POST http://localhost:4000/mail/send
- Config: GET http://localhost:4000/config/latest, POST http://localhost:4000/config

## Note
- Il frontend chiama l'endpoint `http://localhost:4000/mail/send` per inviare le email HTML.
- `docker-compose.yml` è in root: espone Postgres su 5432.
