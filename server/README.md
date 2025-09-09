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

## Configurazione OAuth2 Gmail (Google Workspace)

Per usare Gmail con OAuth2 (consigliato) invece di una App Password SMTP:

1. Crea credenziali OAuth 2.0 su Google Cloud Console (tipo Applicazione Web).
   - Autorizza l'URI di reindirizzamento: `http://localhost:4000/mail/oauth2callback`
2. Imposta queste variabili d'ambiente nel file `.env` in `server/` (vedi esempio più sotto):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (es. `http://localhost:4000/mail/oauth2callback`)
   - `SMTP_USERNAME` (l'indirizzo che invia le email)
3. Avvia il backend e visita `http://localhost:4000/mail/auth` per dare il consenso.
4. Alla callback `/mail/oauth2callback` otterrai i `tokens` (il primo consenso include `refresh_token`).
5. Copia il `refresh_token` in `.env` come `GOOGLE_REFRESH_TOKEN` e riavvia il backend.

Note:
- Se sono configurati `GOOGLE_CLIENT_ID/SECRET` e `GOOGLE_REFRESH_TOKEN`, l'invio userà automaticamente OAuth2.
- In assenza, verrà usato il fallback SMTP user/pass (App Password).

### Esempio `.env` (estratto)

```
PORT=4000
DATABASE_URL=postgresql://nest:nest@localhost:5432/nest_db?schema=public

FROM_EMAIL=your-email@your-domain.com
FROM_NAME=Defekt Report System
SUPPLIER_TO=
TESTING_TO=

# Fallback SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=tls
SMTP_USERNAME=your-email@your-domain.com
SMTP_PASSWORD=your-app-password

# Gmail OAuth2
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/mail/oauth2callback
GOOGLE_REFRESH_TOKEN=...
```

In alternativa, puoi copiare `server/ENV_EXAMPLE.txt` in `.env` e riempire i valori.
