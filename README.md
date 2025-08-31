# Defekt Report – Frontend (Vue) + Backend (NestJS)

Questo progetto include:
- Frontend SPA in Vue 3 + Vite (cartella root)
- Backend API in NestJS (cartella `server/`)
- Database Postgres (via Docker Compose)
- ORM Prisma per schema/migrazioni
- Invio email HTML con Nodemailer (SMTP Google Workspace)

## Requisiti
- Docker + Docker Compose (per Postgres)
- Node.js 18+ e npm (consigliato installare Node via nvm)
- Un account Google Workspace o SMTP compatibile per l’invio email (App Password consigliata)

---

## Avvio del Database (Postgres)
Dalla root del progetto:

```
docker-compose up -d
```

Questo avvia un Postgres locale esposto su `localhost:5432` con credenziali predefinite nel file `docker-compose.yml`.

---

## Backend (NestJS)
Il backend espone:
- Health: `GET http://localhost:4000/health`
- Config: `GET http://localhost:4000/config/latest`, `POST http://localhost:4000/config`
- Mail: `POST http://localhost:4000/mail/send`

### Setup
```
cd server
npm install
```

Crea un file `.env` in `server/` (puoi prendere esempio da `.env.example`):
```
DATABASE_URL=postgresql://nest:nest@localhost:5432/nest_db?schema=public
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=tls
SMTP_USERNAME=your-email@your-domain.com
SMTP_PASSWORD=your-google-app-password
FROM_EMAIL=your-email@your-domain.com
FROM_NAME=Defekt Report System
PORT=4000
```

Note SMTP (Google Workspace):
- Abilita 2FA sull’account
- Genera una App Password per “Mail”
- Usa quell’App Password in `SMTP_PASSWORD`

### Prisma (client + migrazioni)
```
# Genera client
npx prisma generate

# Esegui migrazione iniziale
npx prisma migrate dev --name init
```

### Avvio API Nest
```
npm run start:dev
```
API disponibili su `http://localhost:4000`.

---

## Frontend (Vue)
Dalla root del progetto:
```
npm install
npm run dev
```
Il frontend è su `http://localhost:5173`.

### Integrazioni principali
- Il frontend salva la configurazione dal Product Config Editor su `POST http://localhost:4000/config`.
- Lo store prova a caricare la configurazione da `GET http://localhost:4000/config/latest`; se non disponibile, fa fallback al file `src/assets/productData.json`.
- A fine flusso (Success), vengono generati 2 file HTML e scaricati; inoltre il frontend chiama `POST http://localhost:4000/mail/send` per inviare i due HTML via email (fornitore e cliente). Gli indirizzi email possono essere configurati in `src/assets/productData.json` (`emailConfig.supplierRecipient`, `emailConfig.testingRecipient`).

---

## Gestione Sessione & Persistenza
- Alla conferma iniziale si genera una sessione (ID) salvata in `sessionStorage`.
- Una guardia di navigazione impedisce di accedere agli step senza sessione valida; su reload, la sessione viene riletta da `sessionStorage`.
- I dati compilati vengono salvati su `localStorage` finché la sessione è attiva (persiste su reload). A invio completato (Success) la sessione e i dati vengono puliti.

---

## Rimozione PHP
- Il precedente endpoint `public/api/saveConfig.php` è stato rimosso.
- Tutte le operazioni lato server passano ora per il backend NestJS.

---

## Troubleshooting
- `docker-compose` non parte: avvia Docker Desktop, poi `docker-compose up -d`.
- `npm` o `node` non trovati: installa Node (consigliato `nvm install --lts && nvm use --lts`).
- Prisma errori connessione: verifica `DATABASE_URL` in `.env` e che il container Postgres sia attivo (`docker ps`).
- Email non inviate: verifica credenziali SMTP, firewall, e i log del backend.

---

## Struttura Backend (`server/`)
- `src/modules/prisma`: integrazione Prisma
- `src/modules/config-data`: salvataggio/lettura configurazioni
- `src/modules/mail`: invio email via Nodemailer
- `prisma/schema.prisma`: schema DB (Session, Config, EmailLog)

Se vuoi estendere: possiamo versionare configurazioni, audit trail, log degli invii email su `EmailLog`, e endpoint autenticati.

---

## Config normalizzato (DB) e import

Ora il backend può assemblare il JSON di configurazione direttamente dal database (schema normalizzato). Il frontend continua a leggere `GET http://localhost:4000/config/latest` senza modifiche.

### Migrazione schema normalizzato
Esegui la migrazione per creare le nuove tabelle:

```
cd server
npx prisma migrate dev --name config_normalized
```

### Import configurazione dall’editor
L’editor ora salva direttamente su DB usando l’endpoint:

```
POST http://localhost:4000/config/import
```

Il payload è lo stesso JSON compatibile (categorie, categoryModels, modelFieldConfigs, symptomSets, ecc.). Dopo l’import, `GET /config/latest` restituirà il JSON assemblato dal DB.

### Esplorare/modificare il DB con Prisma Studio
```
cd server
npx prisma studio
```
Apri `http://localhost:5555` per navigare tabelle: Category, Model, InputField, ModelField, ValueMapping/MappingEntry, SymptomSet/Symptom, Condition, EmailConfig, Submission, EmailLog.

### Note email
- Configura `EmailConfig` nel DB (tabella dedicata) o usa `emailConfig` nel JSON come fallback.
- `testingRecipient` può essere usato per dev: se presente, i report vengono inviati lì.

### Flusso riassunto
1) Avvia Postgres e backend.
2) Migra lo schema normalizzato (`config_normalized`).
3) Dall’editor: “Save to Server” invia il JSON a `POST /config/import`.
4) Runtime: lo store carica da `GET /config/latest` (assemblato da DB o fallback allo snapshot).
5) Submit: salvataggio `Submission` su DB e invio email (se configurati i destinatari).

---

## Esempio payload `POST /config/import`
Esempio ridotto e valido (estratto):

```
{
  "categories": ["Active Speaker", "Processor"],
  "categoryModels": {
    "Active Speaker": ["DVS_115_SW_iSP"],
    "Processor": ["Genius_24"]
  },
  "symptomSets": {
    "power_1": { "label": "Power", "symptoms": ["Can't power up", "Keep restarting"] },
    "audio_1": { "label": "Audio", "symptoms": ["No audio", "Distorted audio"] }
  },
  "modelFieldConfigs": {
    "DVS_115_SW_iSP": [
      { "id": "symptomArea", "label": "Symptom Area", "type": "select", "isSymptomArea": true, "order": 0, "section": "symptomInfo", "options": ["power_1", "audio_1"] },
      { "id": "symptomFound", "label": "Symptom Found", "type": "select", "order": 1, "section": "symptomInfo", "dependsOn": "symptomArea",
        "valueMapping": {
          "power_1": { "type": "symptomSet", "key": "power_1" },
          "audio_1": { "type": "symptomSet", "key": "audio_1" }
        }
      }
    ]
  },
  "emailConfig": { "supplierRecipient": "supplier@example.com", "testingRecipient": "test@example.com" }
}
```

Note:
- `symptomSets` supporta sia `symptoms` che `options` come lista.
- `valueMapping`: per statiche usa `{ "type": "static", "options": ["A", "B"] }` (oppure `value` stringa con righe). Per symptom set usa `{ "type": "symptomSet", "key": "power_1" }`.
- `section` può essere vuoto o uno dei valori definiti (es. `symptomInfo`).

---

## FAQ / Troubleshooting

- Email “Missing recipients” o 400 su `/mail/send`
  - Imposta `emailConfig.testingRecipient` in config (comodo in dev) o compila l’email cliente in `General Data`.
  - Verifica variabili SMTP in `server/.env`.

- 500 su `/submissions`
  - Accade se `generalData` non è serializzabile: è già gestito con deep‑clone; riporta il log se persiste.

- Migrazioni Prisma falliscono (P1012, relazioni ambigue)
  - Esegui `npx prisma format` e riprova, assicurati di avere l’ultima versione del codice schema.

- DB vuoto su `/config/latest`
  - Se il DB non è popolato, l’API fa fallback allo snapshot `Config.content`. Esegui import con `POST /config/import`.

- CORS/API non raggiungibile
  - Backend deve essere su `http://localhost:4000`. Il server Nest abilita CORS `origin: true`.

- Docker Postgres non parte
  - Avvia Docker Desktop, poi `docker-compose up -d`. Verifica con `docker ps`.

- Esplorazione DB
  - `cd server && npx prisma studio` → GUI su `http://localhost:5555`.
