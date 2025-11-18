# Architecture Documentation - Defekt Report System

## Overview

Defekt Report è un sistema multi-step form per la gestione di report di difetti (defekts) di prodotti. Il sistema è composto da:
- **Frontend**: Vue 3 SPA con Vite, Pinia per state management
- **Backend**: NestJS API con Prisma ORM e PostgreSQL
- **Features**: WYSIWYG editor, custom CSS, validazione seriali, upload file, invio email HTML

## Struttura Progetto

```
outline_defekt_report/
├── src/                    # Frontend Vue 3
│   ├── components/         # Componenti Vue riutilizzabili
│   ├── views/             # Viste/pagine principali
│   ├── stores/            # Pinia stores (productStore.js)
│   ├── router/            # Vue Router configuration
│   ├── utils/             # Utility functions
│   └── assets/            # Assets statici (CSS, JSON)
├── server/                 # Backend NestJS
│   ├── src/
│   │   ├── modules/       # Moduli NestJS (config-data, mail, submissions)
│   │   └── main.ts        # Entry point
│   └── prisma/            # Schema e migrazioni database
├── public/                 # File pubblici (serviti direttamente)
│   └── local-custom.css    # CSS locale per sviluppo
└── nginx/                  # Configurazione Nginx per produzione
```

## Flusso Applicazione

### 1. Inizializzazione
- **Entry Point**: `src/main.js` → `src/App.vue`
- **Router**: `src/router/index.js` definisce le route
- **Store**: `src/stores/productStore.js` viene inizializzato
- **Configurazione**: Il store carica `productMapping` dal backend o fallback a `productData.json`

### 2. Multi-Step Form Flow

#### Step 1: Confirmation (`/report/confirmation`)
- **Componente**: `ConfirmationStep.vue`
- **Funzione**: Mostra intro content (titolo, sottotitolo, bullet points) con checkbox di conferma
- **Store State**: `formState.isConfirmed`
- **Navigation**: Solo "Next" (abilitato dopo conferma)

#### Step 2: General Data (`/report/general-data`)
- **Componente**: `GeneralDataStep.vue`
- **Funzione**: Raccolta dati azienda (companyData, freightForwarderData, companyAddress, otherReturnAddress)
- **Store State**: `formState.generalData`
- **Validazione**: Campi obbligatori devono essere compilati
- **Navigation**: "Back" e "Next"

#### Step 3: Products (`/report/products`)
- **Componente**: `ProductsStep.vue`
- **Funzione**: Aggiunta/modifica prodotti e relativi difetti (defekts)
- **Store State**: `formState.savedProducts[]`
- **Sub-flow**:
  1. Apri modal → Inserisci Basic Info (category, model, serialNumber)
  2. Valida Basic Info → Continua a Defekt Form
  3. Compila Defekt Form (DynamicProductForm) → Aggiungi Defekt
  4. Visualizza Report Summary (lista defekts aggiunti)
  5. Salva Prodotto → Chiudi modal
- **Validazione**: 
  - Basic Info: category, model, serialNumber obbligatori
  - Serial validation: se abilitata, valida formato seriale
  - Defekt: almeno un campo deve essere compilato, campi obbligatori richiesti
- **Navigation**: "Back" e "Next" (abilitato se almeno un prodotto salvato)

#### Step 4: Summary (`/report/summary`)
- **Componente**: `SummaryStep.vue`
- **Funzione**: Riepilogo dati inseriti, visualizzazione prodotti con preview difetti
- **Features**:
  - Mostra generalData in card
  - Lista prodotti con icona "eye" per dettagli
  - Modal dettagli prodotto: mostra Basic Info + Defekts con preview immagini/video
- **Navigation**: "Back" e "Submit"

#### Step 5: Success (`/report/success`)
- **Componente**: `SuccessStep.vue`
- **Funzione**: 
  1. Genera HTML report
  2. Invia email HTML via backend (`/mail/send`)
  3. Salva submission nel database
  4. Mostra messaggio successo
- **Store State**: Reset form state dopo submit

### 3. Admin Configuration Editor (`/admin/config-editor`)

**Componente**: `ConfigEditorView.vue`

**Tabs disponibili**:
1. **Acceptance Page**: Editor WYSIWYG per intro content (titolo, sottotitolo, checkbox label, button label, bullet points)
2. **General Settings**: Configurazione generale (introEditorConfig, customCss, etc.)
3. **General Fields**: Editor campi general data
4. **Product Config**: Configurazione prodotti, categorie, modelli, symptom sets
5. **Symptom Sets**: Gestione symptom sets
6. **Custom CSS**: Editor CSS personalizzato per styling form

**Salvataggio**: Tutte le configurazioni vengono salvate via `/config/import` (POST)

## State Management (Pinia Store)

### `productStore.js` - Store Principale

**State**:
- `productMapping`: Configurazione prodotti (categorie, modelli, campi, symptom sets)
- `isLoading`: Flag caricamento
- `error`: Errori
- `formState`: Stato form multi-step
  - `isConfirmed`: Conferma step 1
  - `sessionId`: ID sessione corrente
  - `generalData`: Dati generali (companyData, etc.)
  - `savedProducts[]`: Array prodotti salvati

**Getters**:
- `categories`: Lista categorie
- `categoryModels`: Modelli per categoria
- `modelSymptomAreas`: Aree sintomi per modello
- `symptomsByArea`: Sintomi per area
- `categoryConfigs`: Config per categoria
- `formConfig`: Config form
- `currentStep`: Step corrente (1-5)
- `totalSteps`: Totale step (5)
- `progress`: Progress percentuale

**Actions**:
- `loadConfiguration()`: Carica config da backend o fallback
- `setConfirmation(value)`: Imposta conferma
- `startNewSession()`: Inizia nuova sessione
- `resetFormState()`: Reset completo form
- `deleteProduct(index)`: Elimina prodotto

**Persistence**:
- `formState` viene salvato in `localStorage` quando `sessionId` è attivo
- `productMapping` viene caricato all'avvio da backend o JSON

## Componenti Principali

### Form Components

**`ConfirmationStep.vue`**
- Mostra intro content da `productMapping.introContent`
- Checkbox conferma → `store.setConfirmation()`
- Button "Start" → naviga a step 2

**`GeneralDataStep.vue`**
- Input fields per generalData
- Validazione campi obbligatori
- Supporto "otherReturnAddress" opzionale

**`ProductsStep.vue`**
- Modal per aggiunta/modifica prodotti
- `DynamicProductForm.vue` per form difetti dinamico
- Validazione seriale (se abilitata)
- Gestione defekts con preview immagini/video

**`SummaryStep.vue`**
- Riepilogo dati
- Modal dettagli prodotto con preview media
- Helper `getFieldPreviews()` per gestire preview immagini/video

**`SuccessStep.vue`**
- Genera HTML report
- Invia email via `/mail/send`
- Salva submission via `/submissions`

### Editor Components

**`WysiwygEditor.vue`**: Editor Tiptap base
**`WysiwygOrTextEditor.vue`**: Editor con toggle WYSIWYG/HTML Raw/Split
**`CustomCssEditor.vue`**: Editor CSS custom
**`CustomCssInjector.vue`**: Inietta CSS custom nel DOM (usa `local-custom.css` in dev)

### Utility Components

**`DynamicProductForm.vue`**: Form dinamico per defekts basato su config
- Carica campi visibili per categoria/modello
- Gestisce upload file con preview
- Validazione MIME types e dimensioni

**`InputField.vue`**: Input field riutilizzabile
**`Button.vue`**: Button riutilizzabile
**`StepHeader.vue`**: Header step con logo e titolo

## Routing

**Routes principali**:
- `/`: HomeView (redirect a form)
- `/report/confirmation`: Step 1
- `/report/general-data`: Step 2
- `/report/products`: Step 3
- `/report/summary`: Step 4
- `/report/success`: Step 5
- `/admin/config-editor`: Editor configurazione

**Navigation Guards**:
- Controlla `sessionId` per accesso a step 2-5
- Redirect a confirmation se sessione non attiva

## Backend API

### Endpoints

**`/config/latest`** (GET): Ottiene ultima configurazione
**`/config/import`** (POST): Salva configurazione
**`/mail/send`** (POST): Invia email HTML
**`/submissions`** (POST): Salva submission
**`/health`** (GET): Health check

### Database Schema (Prisma)

**`Config`**: Configurazioni salvate
**`Submission`**: Submissions salvate
**`Log`**: Log operazioni

## Data Flow

### Configurazione
1. Admin modifica config in `/admin/config-editor`
2. Salva → POST `/config/import`
3. Backend salva in DB
4. Frontend ricarica config → `store.loadConfiguration()`

### Form Submission
1. Utente compila form (step 1-4)
2. Dati salvati in `store.formState` → localStorage
3. Step 5: Genera HTML → Invia email → Salva submission
4. Reset form state

### Product/Defekt Data Structure

```javascript
savedProduct = {
  basicInfo: {
    category: { value: "Category", label: "...", type: "select", ... },
    model: { value: "Model", ... },
    serialNumber: { value: "SN123", ... }
  },
  defekts: [
    {
      symptomInfo: {
        symptomArea: { value: "...", preview: null, ... },
        symptomFound: { value: "...", ... }
      },
      // ... altre sezioni
    }
  ]
}
```

## Custom CSS System

**Sviluppo**:
- File `public/local-custom.css` viene caricato automaticamente in dev
- Ha priorità sul CSS del backend

**Produzione**:
- CSS viene salvato in `productMapping.customCss`
- Iniettato via `CustomCssInjector.vue`

## Validazioni

**Serial Validation**:
- Configurabile in `productMapping.validationConfig.serial`
- Valida formato: `WWDYYC` (Week, Day, Year, Counter)
- Cipher map per decodifica lettere → numeri

**Defekt Validation**:
- Campi obbligatori devono essere compilati
- Almeno un campo deve avere valore (previene defekts vuoti)

## File Upload

**Configurazione**: `productMapping.attachmentsConfig`
- `maxFiles`: Numero massimo file
- `maxFileSizeMb`: Dimensione max singolo file
- `maxTotalSizeMb`: Dimensione totale max
- `allowedMimeTypes`: Tipi MIME consentiti

**Preview**:
- Immagini: data URL o object URL
- Video: object URL
- Gestito in `DynamicProductForm.vue` e `SummaryStep.vue`

## Utilities

**`fileUtils.js`**: Utility per file (fileToBase64, etc.)
**`formConfigUtils.js`**: Utility per configurazione form
**`htmlGenerator.js`**: Genera HTML report
**`storageUtils.js`**: Gestione localStorage

## Environment

**Sviluppo**:
- Vite dev server su `localhost:5173`
- Proxy a backend `localhost:4000`
- CSS locale da `public/local-custom.css`

**Produzione**:
- Build Vite → `dist/`
- Nginx serve frontend e fa proxy a backend
- CSS da backend config

## Note Importanti

1. **Session Management**: Form state persiste in localStorage con `sessionId`
2. **Reactivity**: Vue 3 Composition API con `ref`, `computed`, `watch`
3. **Deep Cloning**: Usato `JSON.parse(JSON.stringify())` per evitare problemi con Proxy Vue
4. **File Objects**: File objects vengono convertiti in base64 per preview e salvataggio
5. **WYSIWYG**: Tiptap editor con StarterKit, supporta HTML raw editing

