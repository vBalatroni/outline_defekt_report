Deploy su DigitalOcean (Droplet Docker)

Prerequisiti
- Droplet con Docker e docker-compose (immagine "Docker" o Ubuntu + Docker installato)
- DNS opzionale per puntare un dominio all'IP del droplet

1) Connetti al droplet
```
ssh root@YOUR_DROPLET_IP
```

2) Installa dipendenze (se non presenti)
```
apt-get update -y && apt-get install -y git
```

3) Clona il repo
```
cd /opt
git clone YOUR_REPO_URL outline_defekt_report
cd outline_defekt_report
```

4) Crea il file .env per docker-compose
Usa questo esempio (salvalo in /opt/outline_defekt_report/.env):
```
# Backend mail/Gmail OAuth2
SMTP_USERNAME=your-email@domain.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://rma.outline.it/mail/oauth2callback
GOOGLE_REFRESH_TOKEN=
FROM_EMAIL=your-email@domain.com
FROM_NAME=Defekt Report System
OWNER_EMAIL=owner@domain.com
DRIVE_PARENT_FOLDER_ID=
DRIVE_PARENT_IS_ID=true

# DB: usa quello interno del compose (non esporre 5432 in prod)
```

5) Avvia lo stack
```
docker compose up --build -d
```

6) Configura SSL (HTTPS)
Prima avvia lo stack in HTTP, poi emetti il certificato:
```bash
docker compose up -d
docker compose run --rm certbot certonly --webroot --webroot-path=/var/www/certbot -d rma.outline.it --email info@outline.it --agree-tos --no-eff-email
docker compose exec frontend nginx -s reload
```

7) Verifica
- Frontend HTTPS: https://rma.outline.it
- Frontend HTTP: http://rma.outline.it (redirect a HTTPS)
- API health: https://rma.outline.it/health
- Admin: https://rma.outline.it/admin/config-editor (richiede Basic Auth)

Note importanti
- Produzione: rimuovi il binding della porta 5432 da docker-compose se non ti serve l'accesso esterno a Postgres.
- OAuth2: visita https://rma.outline.it/mail/auth e consenti l'app (scope: mail.google.com, drive.file, drive.metadata.readonly). Inserisci il refresh token in .env e riavvia.
- HTTPS: il frontend è servito su porte 80 (HTTP) e 443 (HTTPS) con redirect automatico. Nginx fa proxy verso il backend per path /mail, /config, /submissions, /health.
- DRIVE_PARENT_FOLDER_ID: se usi un ID cartella Google Drive, imposta `DRIVE_PARENT_IS_ID=true` nel .env. Se usi un percorso (es. "Clienti/2025"), lascia false e assicurati di aver dato il consenso con scope drive.metadata.readonly.

Rinnovo certificati SSL
```bash
# Manuale
sh ./renew-ssl.sh

# Automatico (cron settimanale)
crontab -e
# Aggiungi: 0 3 * * 1 cd /opt/outline_defekt_report && /bin/sh ./renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1
```

Aggiornare
```
cd /opt/outline_defekt_report
git pull
docker compose up --build -d
```


