# 📊 Configurazione Google Analytics 4 - Mate Admin

Questa guida ti aiuterà a configurare le **Analytics reali** per la dashboard admin.

## 🎯 Obiettivo

Connettere il pannello admin al **Google Analytics 4** del sito principale Mate (`G-0ZJ99ZPT5N`) per visualizzare dati reali su utenti, sessioni, dispositivi, ecc.

---

## 📋 Step 1: Trova il Property ID

1. Vai su [Google Analytics](https://analytics.google.com/)
2. Seleziona la property **Mate Website** (`G-0ZJ99ZPT5N`)
3. Vai su **Admin** (ingranaggio in basso a sinistra)
4. Clicca su **Property Settings**
5. Troverai il **Property ID** in formato numerico (es: `123456789`)
6. Copia questo numero

---

## 🔑 Step 2: Crea Service Account su Google Cloud

### 2.1 Accedi a Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto **mate-website-cd962** (oppure crea se non esiste)

### 2.2 Abilita Google Analytics Data API

1. Nel menu laterale, vai su **APIs & Services** > **Library**
2. Cerca **"Google Analytics Data API"**
3. Clicca e premi **Enable**

### 2.3 Crea Service Account

1. Nel menu laterale, vai su **IAM & Admin** > **Service Accounts**
2. Clicca **+ CREATE SERVICE ACCOUNT**
3. Compila:
   - **Service account name**: `mate-analytics-reader`
   - **Description**: `Service account for Mate Admin Analytics integration`
4. Clicca **CREATE AND CONTINUE**
5. **Grant this service account access to project** (opzionale - puoi skippare)
6. Clicca **DONE**

### 2.4 Crea e Scarica la Chiave JSON

1. Nella lista dei Service Accounts, clicca sul service account appena creato
2. Vai sul tab **KEYS**
3. Clicca **ADD KEY** > **Create new key**
4. Seleziona **JSON**
5. Clicca **CREATE**
6. Il file JSON verrà scaricato automaticamente

### 2.5 Salva il file JSON

1. Rinomina il file scaricato in: `mate-analytics-service-account.json`
2. Spostalo nella cartella:
   ```
   /Users/mattiasiri/Developer/mate-admin/backend/credentials/
   ```
3. **IMPORTANTE**: Questo file contiene credenziali sensibili, non condividerlo!

---

## 👥 Step 3: Aggiungi Service Account a Google Analytics

### 3.1 Trova l'email del Service Account

Nel file JSON appena scaricato, cerca il campo `client_email`, sarà qualcosa come:
```
mate-analytics-reader@mate-website-cd962.iam.gserviceaccount.com
```

### 3.2 Aggiungi Accesso in Google Analytics

1. Vai su [Google Analytics](https://analytics.google.com/)
2. Seleziona la property **Mate Website** (`G-0ZJ99ZPT5N`)
3. Vai su **Admin** (ingranaggio in basso a sinistra)
4. Nella colonna **Property**, clicca su **Property Access Management**
5. Clicca sul pulsante **+** (Add users) in alto a destra
6. Incolla l'email del service account (es: `mate-analytics-reader@...iam.gserviceaccount.com`)
7. Seleziona il ruolo: **Viewer**
8. **DESELEZIONA** "Notify new users by email"
9. Clicca **Add**

---

## ⚙️ Step 4: Configura il Backend

### 4.1 Aggiorna il file .env

Apri il file `/Users/mattiasiri/Developer/mate-admin/backend/.env` e aggiorna:

```bash
# Sostituisci YOUR_NUMERIC_PROPERTY_ID_HERE con il numero che hai trovato nello Step 1
GA_PROPERTY_ID=properties/123456789

# Verifica che questo path punti al file JSON corretto
GOOGLE_APPLICATION_CREDENTIALS=./credentials/mate-analytics-service-account.json

# Aggiungi il dominio deployato se necessario
ALLOWED_ORIGINS=http://localhost:8082,https://mate-dahboard-admin.web.app
```

### 4.2 Verifica Struttura Directory

```
backend/
├── credentials/
│   ├── mate-analytics-service-account.json  ← Il tuo file JSON
│   └── README.md
├── .env  ← Configurato con Property ID
├── server.js
└── package.json
```

---

## 🚀 Step 5: Avvia il Backend

### 5.1 Installa Dipendenze

```bash
cd backend
npm install
```

### 5.2 Avvia il Server

```bash
npm run dev
```

Dovresti vedere:
```
✓ Server running on port 3001
✓ Google Analytics client initialized
✓ Property ID: properties/123456789
```

### 5.3 Testa il Backend

Apri un nuovo terminale e testa:

```bash
# Test health check
curl http://localhost:3001/health

# Test status
curl http://localhost:3001/api/analytics/status

# Test metriche reali
curl "http://localhost:3001/api/analytics/metrics?dateRange=30daysAgo"
```

---

## 🖥️ Step 6: Configura il Frontend

Il file `.env` del frontend è già configurato:

```bash
VITE_USE_BACKEND=true
VITE_BACKEND_URL=http://localhost:3001
VITE_GA_MEASUREMENT_ID=G-0ZJ99ZPT5N
```

### 6.1 Riavvia il Frontend

Se il server di sviluppo è già attivo, riavvialo per caricare le nuove variabili:

```bash
# Ctrl+C per fermare, poi:
npm run dev
```

---

## ✅ Step 7: Verifica tutto Funzioni

1. **Backend attivo**: `http://localhost:3001/health` ritorna `OK`
2. **Analytics configurate**: `http://localhost:3001/api/analytics/status` mostra configurazione corretta
3. **Frontend connesso**: Dashboard mostra dati reali invece di dati demo
4. **Metriche visibili**: Vedi numeri reali su utenti, sessioni, pageviews, ecc.

---

## 🐛 Troubleshooting

### Errore: "Property not found"
- ✅ Verifica che il Property ID sia corretto (formato: `properties/123456789`)
- ✅ Controlla che il service account sia stato aggiunto a Google Analytics con ruolo Viewer

### Errore: "GOOGLE_APPLICATION_CREDENTIALS not found"
- ✅ Verifica che il file JSON sia nella cartella `backend/credentials/`
- ✅ Controlla che il path in `.env` sia corretto

### Errore: "CORS"
- ✅ Aggiungi il tuo dominio in `ALLOWED_ORIGINS` nel file `.env` del backend

### Dati non aggiornati
- ✅ I dati di Google Analytics possono avere un ritardo di 24-48 ore
- ✅ Usa `dateRange=today` per dati più recenti (meno accurati)

---

## 📊 Metriche Disponibili

Una volta configurato, avrai accesso a:

- **📈 Total Users**: Utenti totali nel periodo
- **👥 Active Users**: Utenti attivi
- **🆕 New Users**: Nuovi utenti
- **🔄 Sessions**: Sessioni totali
- **📄 Pageviews**: Visualizzazioni pagina
- **⏱️ Avg Session Duration**: Durata media sessione
- **📉 Bounce Rate**: Tasso di rimbalzo
- **📱 Device Types**: Desktop, Mobile, Tablet
- **🌍 Locations**: Paesi e città
- **📊 User Growth**: Crescita nel tempo
- **🔝 Top Pages**: Pagine più visitate

---

## 🎉 Completato!

Ora il tuo pannello admin mostra **dati reali** di Google Analytics! 🚀

Per domande o problemi, controlla i log del backend:
```bash
cd backend
npm run dev
```
