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
GOOGLE_REDIRECT_URI=http://YOUR_DOMAIN_OR_IP/mail/oauth2callback
GOOGLE_REFRESH_TOKEN=
FROM_EMAIL=your-email@domain.com
FROM_NAME=Defekt Report System
OWNER_EMAIL=owner@domain.com
DRIVE_PARENT_FOLDER_ID=

# DB: usa quello interno del compose (non esporre 5432 in prod)
```

5) Avvia lo stack
```
docker compose up --build -d
```

6) Verifica
- Frontend: http://YOUR_DOMAIN_OR_IP:8080
- API diretta: http://YOUR_DOMAIN_OR_IP:4000/health
- Via Nginx: http://YOUR_DOMAIN_OR_IP:8080/health

Note importanti
- Produzione: rimuovi il binding della porta 5432 da docker-compose se non ti serve l'accesso esterno a Postgres.
- OAuth2: prima dell'uso, visita http://YOUR_DOMAIN_OR_IP:4000/mail/auth e consenti l'app (scope: mail.google.com, drive.file). Inserisci il refresh token in .env e riavvia.
- Nginx: il frontend è servito su 8080 e fa proxy verso il backend per path /mail, /config, /submissions, /health.

Attenzione sul frontend
- Il codice attuale contiene chiamate hardcoded a http://localhost:4000 per alcune API.
- In produzione su droplet, sostituisci questi endpoint con percorsi relativi (es. "/mail/...", "/config/...", "/submissions") oppure imposta una variabile BASE_URL.
- Se vuoi, posso aggiornare il codice per usare automaticamente percorsi relativi quando NODE_ENV=production.

Aggiornare
```
cd /opt/outline_defekt_report
git pull
docker compose up --build -d
```


