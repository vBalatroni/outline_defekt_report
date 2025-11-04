## Configurazione HTTPS (Let's Encrypt) su Docker/DigitalOcean

Questa guida spiega come attivare HTTPS per questa app usando Let's Encrypt (webroot) su una Droplet DigitalOcean, con rinnovo semplice via script.

### Prerequisiti
- Dominio puntato alla Droplet (record A/AAAA corretti)
- Porte 80 e 443 aperte sul firewall (Droplet/Cloud Firewall)
- Docker e Docker Compose installati

### Panoramica
- Nginx serve `/.well-known/acme-challenge/` (webroot) e redireziona HTTP → HTTPS
- Certbot gestito via container e volumi dedicati
- Script `renew-ssl.sh` per rinnovo e reload Nginx

File coinvolti:
- `docker-compose.yml` (espone 80/443, aggiunge servizio `certbot` e volumi)
- `nginx/default.conf` (ACME + redirect + server HTTPS)
- `renew-ssl.sh` (rinnovo automatico)

### 1) Avvio dello stack
```bash
cd /Users/valerio/projects/outline_defekt_report
docker compose up -d --build
```

Assicurati che la home page risponda su HTTP (porta 80) prima di emettere i certificati.

### 2) Emissione certificato (prima volta)
Sostituisci dominio ed email con i tuoi valori, poi esegui:
```bash
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com --agree-tos --no-eff-email
```

Poi aggiorna `nginx/default.conf` sostituendo `example.com` con il tuo dominio nei percorsi certificato:
- `/etc/letsencrypt/live/your-domain.com/fullchain.pem`
- `/etc/letsencrypt/live/your-domain.com/privkey.pem`

Ricarica Nginx:
```bash
docker compose exec frontend nginx -t
docker compose exec frontend nginx -s reload || docker compose restart frontend
```

Verifica HTTPS:
```bash
curl -I https://your-domain.com
```

### 3) Rinnovo certificato (manuale semplice)
Usa lo script incluso per rinnovare e ricaricare Nginx:
```bash
sh ./renew-ssl.sh
```

Lo script esegue `certbot renew` nel container e fa reload/restart di Nginx.

### 4) Rinnovo automatico (cron su Droplet)
Configura un cron job settimanale:
```bash
crontab -e
# ogni lunedì alle 03:00
0 3 * * 1 cd /Users/valerio/projects/outline_defekt_report && /bin/sh ./renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1
```

### Troubleshooting rapido
- 404 su ACME challenge: verifica che `/.well-known/acme-challenge/` sia servito (volume `certbot_www` montato su `frontend`).
- Nginx error: `docker compose exec frontend nginx -t` e `docker compose logs frontend`.
- Verifica certificati: `docker compose run --rm certbot certificates`.
- Forza rinnovo: `docker compose run --rm certbot renew --force-renewal`.

### Note di sicurezza
- Lascia attivo solo ciò che serve (80/443) sul firewall.
- Mantieni aggiornati i container (`docker compose pull && docker compose up -d`).

### Varianti
- Più domini: aggiungi `-d altro-dominio.com` al comando di emissione e ripeti la sostituzione nei percorsi certificato se necessario.
- Ambiente staging/test: aggiungi `--staging` al comando di certbot per evitare rate limit durante i test.


