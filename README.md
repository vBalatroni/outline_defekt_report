# Defekt Report – Frontend (Vue) + Backend (NestJS)

Sistema multi-step form per la gestione di report di difetti (defekts) di prodotti.

## Caratteristiche Principali

- **Multi-step Form**: 5 step (Confirmation → General Data → Products → Summary → Success)
- **WYSIWYG Editor**: Editor Tiptap per contenuti HTML con modalità WYSIWYG/HTML Raw/Split
- **Custom CSS**: Sistema di styling personalizzabile con CSS locale per sviluppo
- **Dynamic Forms**: Form dinamici per prodotti e difetti basati su configurazione
- **File Upload**: Upload immagini/video con preview e validazione
- **Serial Validation**: Validazione formati seriali personalizzabili
- **Email HTML**: Invio email HTML con report completo
- **Admin Panel**: Editor configurazione completo per personalizzare il form

## Stack Tecnologico

- **Frontend**: Vue 3 + Vite + Pinia + Vue Router
- **Backend**: NestJS + Prisma ORM + PostgreSQL
- **Editor**: Tiptap (WYSIWYG)
- **Styling**: Bootstrap 5 + Custom CSS
- **Email**: Nodemailer + Gmail OAuth2
- **Storage**: Google Drive API

## Documentazione

- **`ARCHITECTURE.md`**: Documentazione completa per LLM sull'architettura e flussi
- **`DEPLOYMENT.md`**: Guida deploy su DigitalOcean
- **`server/README.md`**: Documentazione backend e OAuth2

---

## Setup Sviluppo Locale

### Prerequisiti
- Node.js 18+
- Docker + Docker Compose
- npm

### 1. Avvia Database
```bash
docker compose up -d postgres
```

### 2. Setup Backend
```bash
cd server
npm install
cp ENV_EXAMPLE.txt .env
# Modifica .env con le tue configurazioni
npm run prisma:generate
npm run prisma:migrate
npm run start:dev
```

Backend sarà disponibile su: `http://localhost:4000`

### 3. Setup Frontend
```bash
# Dalla root del progetto
npm install
npm run dev
```

Frontend sarà disponibile su: `http://localhost:5173`

### 4. CSS Locale per Sviluppo
Modifica `public/local-custom.css` per testare CSS in tempo reale senza salvare sul backend.

### Proxy Vite
In sviluppo, Vite fa proxy automatico verso il backend per:
- `/mail` → `http://localhost:4000`
- `/config` → `http://localhost:4000`
- `/submissions` → `http://localhost:4000`
- `/health` → `http://localhost:4000`

---

## Workflow Sviluppo

### Struttura Form Multi-Step
1. **Confirmation** (`/report/confirmation`): Pagina intro con checkbox conferma
2. **General Data** (`/report/general-data`): Dati azienda e indirizzi
3. **Products** (`/report/products`): Aggiunta prodotti e difetti
4. **Summary** (`/report/summary`): Riepilogo con preview dettagli
5. **Success** (`/report/success`): Invio email e salvataggio

### Admin Configuration Editor
Accesso: `/admin/config-editor`

**Tabs disponibili**:
- **Acceptance Page**: Editor WYSIWYG per intro content
- **General Settings**: Configurazione generale e CSS custom
- **General Fields**: Editor campi general data
- **Product Config**: Configurazione prodotti, categorie, modelli
- **Symptom Sets**: Gestione symptom sets
- **Custom CSS**: Editor CSS per styling form

### State Management
- **Pinia Store**: `src/stores/productStore.js`
- **Persistence**: Form state salvato in `localStorage` con `sessionId`
- **Config**: Caricata da backend o fallback a `productData.json`

---

## Configurazione OAuth2 Gmail
Vedi `server/README.md` per dettagli su:
- Variabili `.env` (CLIENT_ID/SECRET/REDIRECT_URI/REFRESH_TOKEN, SMTP_USERNAME, OWNER_EMAIL, DRIVE_PARENT_FOLDER_ID)
- Flusso `/mail/auth` e callback `/mail/oauth2callback`
- Scope usati: `https://mail.google.com/` e `https://www.googleapis.com/auth/drive.file`

---

## Testing

```bash
# Frontend tests
npm run test

# Backend tests
cd server
npm run test
```

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
