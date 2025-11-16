# 🚀 Guida Deploy - Frontend & Backend Analytics

Questa guida spiega come fare il deploy completo del pannello admin (frontend) e del backend Analytics API su Firebase.

---

## 📋 Prerequisiti

1. **Firebase CLI installato** e autenticato:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Progetto Firebase configurato**: `mate-website-cd962`

3. **Service Account configurato** con accesso a Google Analytics (vedi `GOOGLE_ANALYTICS_SETUP.md`)

---

## 🎯 Parte 1: Deploy Frontend (Admin Panel)

### Step 1: Build del Frontend

Dalla root del progetto:

```bash
npm run build
```

Questo crea la cartella `dist/` con i file ottimizzati per la produzione.

### Step 2: Verifica configurazione Firebase Hosting

Il file `firebase.json` è già configurato con il target `admin`:

```json
{
  "hosting": [
    {
      "target": "admin",
      "public": "dist",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [
        {
          "source": "**",
          "destination": "/index.html"
        }
      ]
    }
  ]
}
```

### Step 3: Deploy su Firebase Hosting

```bash
firebase deploy --only hosting:admin
```

✅ **Output atteso**: 
```
✔  Deploy complete!
Project Console: https://console.firebase.google.com/project/mate-website-cd962/overview
Hosting URL: https://mate-dahboard-admin.web.app
```

---

## 🔧 Parte 2: Deploy Backend (Analytics API su Cloud Functions)

### Step 1: Configura Service Account per Cloud Functions

Le Cloud Functions useranno automaticamente il **Default Service Account** del progetto Firebase.

**Importante**: Assicurati che questo service account abbia:
1. ✅ Accesso a Google Analytics Data API (abilitato su Google Cloud Console)
2. ✅ Ruolo "Viewer" su Google Analytics Property `G-0ZJ99ZPT5N`

#### Trova l'email del Default Service Account:

Vai su [Google Cloud Console > IAM](https://console.cloud.google.com/iam-admin/iam?project=mate-website-cd962) e cerca:

```
mate-website-cd962@appspot.gserviceaccount.com
```

#### Aggiungi questo account a Google Analytics:

1. Vai su [Google Analytics](https://analytics.google.com/)
2. Seleziona la property **Mate Website** (`G-0ZJ99ZPT5N`)
3. **Admin** → **Property Access Management**
4. Aggiungi l'email del service account con ruolo **Viewer**

### Step 2: Configura le variabili d'ambiente

Imposta la variabile d'ambiente per il Property ID:

```bash
firebase functions:config:set ga.property_id="properties/496252339"
```

Verifica:

```bash
firebase functions:config:get
```

### Step 3: Installa le dipendenze delle Cloud Functions

```bash
cd functions
npm install
cd ..
```

### Step 4: Deploy delle Cloud Functions

Deploy di tutte le functions (admin + analytics):

```bash
firebase deploy --only functions
```

Oppure deploy solo della function analytics:

```bash
firebase deploy --only functions:analyticsApi
```

✅ **Output atteso**:
```
✔  functions[analyticsApi(us-central1)] Successful create operation.
Function URL: https://us-central1-mate-website-cd962.cloudfunctions.net/analyticsApi
```

---

## 🌐 Parte 3: Aggiorna Frontend per usare Cloud Function

### Step 1: Crea file `.env.production`

Nella root del progetto, crea `.env.production`:

```bash
# Backend API su Cloud Functions
VITE_USE_BACKEND=true
VITE_BACKEND_API_URL=https://analyticsapi-nnhs6pw32a-uc.a.run.app

# Google Analytics Measurement ID
VITE_GA_MEASUREMENT_ID=G-0ZJ99ZPT5N
```

**Nota**: L'URL della Cloud Function potrebbe cambiare ad ogni deploy. Verifica l'URL finale nel log di deploy.

### Step 2: Rebuild e Redeploy Frontend

```bash
npm run build
firebase deploy --only hosting:admin
```

---

## ✅ Parte 4: Verifica che tutto funzioni

### Test Backend (Cloud Function)

```bash
# Health check
curl https://analyticsapi-nnhs6pw32a-uc.a.run.app/health

# Status Analytics
curl https://analyticsapi-nnhs6pw32a-uc.a.run.app/api/analytics/status

# Dati reali
curl "https://analyticsapi-nnhs6pw32a-uc.a.run.app/api/analytics/all?dateRange=30daysAgo"
```

### Test Frontend

1. Vai su: https://mate-dahboard-admin.web.app
2. Naviga alla pagina **Analytics**
3. Verifica che i dati siano **reali** (non più mock)

---

## 🔄 Workflow Deploy Completo

Una volta configurato tutto, per deployare entrambi:

```bash
# 1. Build frontend
npm run build

# 2. Deploy tutto (hosting + functions)
firebase deploy
```

Oppure separatamente:

```bash
# Solo frontend
firebase deploy --only hosting:admin

# Solo backend
firebase deploy --only functions:analyticsApi
```

---

## 🐛 Troubleshooting

### Errore: "Permission denied" su Analytics API

**Soluzione**: Verifica che il service account `mate-website-cd962@appspot.gserviceaccount.com` sia stato aggiunto a Google Analytics con ruolo Viewer.

### Errore: "Function timeout"

**Soluzione**: Le query a Google Analytics possono richiedere tempo. Il timeout è configurato a 300 secondi (5 minuti) in `functions/index.js`.

### Errore: "CORS blocked"

**Soluzione**: La Cloud Function usa `cors({ origin: true })` per accettare tutte le origini. In produzione, puoi limitare gli origins modificando `functions/index.js`.

### Frontend mostra ancora dati mock

**Soluzione**: 
1. Verifica che `.env.production` esista e contenga `VITE_USE_BACKEND=true`
2. Rebuilda il frontend: `npm run build`
3. Rideploya: `firebase deploy --only hosting:admin`
4. Svuota la cache del browser (Ctrl+Shift+R)

---

## 💰 Costi Stimati

### Firebase Hosting
- **Gratuito** fino a 10GB storage + 360MB/giorno transfer
- Il pannello admin è molto leggero (~2-3MB)

### Cloud Functions
- **Invocazioni**: Prime 2M/mese gratis
- **Compute**: Primi 400K GB-seconds gratis
- L'analytics API fa ~5-10 chiamate per caricamento pagina
- Stima: **Gratuito** per ~1000 visite/giorno al pannello admin

### Google Analytics Data API
- **100,000 richieste/giorno gratis**
- Ogni caricamento pagina = 1-5 richieste
- Stima: **Gratuito** per uso tipico

---

## 🎉 Completato!

Ora hai:
- ✅ Frontend deployato su Firebase Hosting
- ✅ Backend Analytics API come Cloud Function
- ✅ Dati reali di Google Analytics 4
- ✅ Sistema scalabile e serverless

Per monitorare:
- Frontend: https://mate-dahboard-admin.web.app
- Cloud Functions: https://console.firebase.google.com/project/mate-website-cd962/functions
- Logs: `firebase functions:log --only analyticsApi`
