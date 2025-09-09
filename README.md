# Defekt Report – Frontend (Vue) + Backend (NestJS)

Questo progetto include:
- Frontend SPA in Vue 3 + Vite (cartella root)
- Backend API in NestJS (cartella `server/`)
- Database Postgres (via Docker Compose)
- ORM Prisma per schema/migrazioni
- Invio email HTML con Nodemailer (Gmail OAuth2) + salvataggio su Google Drive

---

## Dev locale

1) Avvia Postgres + backend + frontend (Docker):
```
docker compose up --build
```
- Frontend: http://localhost:8080
- API diretta: http://localhost:4000/health

2) In sviluppo, Vite fa proxy verso il backend per i path:
- `/mail`, `/config`, `/submissions`, `/health`

---

## Configurazione OAuth2 Gmail
Vedi `server/README.md` per dettagli su:
- Variabili `.env` (CLIENT_ID/SECRET/REDIRECT_URI/REFRESH_TOKEN, SMTP_USERNAME, OWNER_EMAIL, DRIVE_PARENT_FOLDER_ID)
- Flusso `/mail/auth` e callback `/mail/oauth2callback`
- Scope usati: `https://mail.google.com/` e `https://www.googleapis.com/auth/drive.file`

---

## Deploy su DigitalOcean (Docker Droplet)

1) Connetti al droplet
```
ssh root@YOUR_DROPLET_IP
```

2) Installa git (se serve) e clona
```
apt-get update -y && apt-get install -y git
cd /opt
git clone YOUR_REPO_URL outline_defekt_report
cd outline_defekt_report
```

3) Crea `.env` in root (accanto a `docker-compose.yml`)
Usa il template in `DEPLOYMENT.md` e imposta le variabili (OAuth2, e-mail, Drive).

4) Avvio
```
docker compose up --build -d
```

5) Verifica
- Frontend: `http://YOUR_IP:8080`
- API: `http://YOUR_IP:4000/health`

6) Consenso OAuth (se necessario)
- `http://YOUR_IP:4000/mail/auth` → consenti → prendi `refresh_token` → aggiorna `.env` → `docker compose up -d`

Aggiornare release:
```
cd /opt/outline_defekt_report
git pull
docker compose up --build -d
```

Note produzione:
- Frontend usa percorsi relativi. Nginx fa proxy `/mail`, `/config`, `/submissions` al backend.
- Se non ti serve esporre Postgres, rimuovi la porta 5432 dal compose.
