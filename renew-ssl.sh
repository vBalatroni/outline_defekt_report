#!/bin/sh

# Rinnovo certificati Let's Encrypt (modalità webroot)
# Esecuzione: sh ./renew-ssl.sh
# Richiede: servizi 'frontend' e volumi 'certbot_certs' e 'certbot_www' attivi

set -e

echo "[Renew] Avvio rinnovo certificati..."

# Dry-run per verifica (commenta se non necessario)
# docker compose run --rm certbot renew --dry-run

docker compose run --rm certbot renew

echo "[Renew] Rinnovo completato. Ricarico nginx..."
docker compose exec frontend nginx -t
# reload (se supportato nel container), altrimenti restart
(docker compose exec frontend nginx -s reload) || docker compose restart frontend

echo "[Renew] Fatto."
