# 🚀 Guida Deploy GitHub + Firebase Hosting

## Setup Completo per Deploy Automatico

### ✅ Già Configurato
- ✅ Git repository inizializzato
- ✅ `.gitignore` aggiornato (protegge le credenziali)
- ✅ GitHub Actions workflow configurato
- ✅ Firebase Hosting pronto

---

## 📝 Passi da Seguire

### 1️⃣ **Crea Repository su GitHub**

1. Vai su [github.com](https://github.com) e fai login
2. Clicca su **"New"** o **"+"** > **"New repository"**
3. Nome repository: `mate-admin` (o quello che preferisci)
4. Visibilità: **Private** (consigliato per admin panel)
5. **NON** aggiungere README, .gitignore o license (li abbiamo già)
6. Clicca **"Create repository"**

### 2️⃣ **Collega il Repository Locale a GitHub**

Copia i comandi che GitHub ti mostra dopo la creazione, oppure usa questi:

```bash
cd /Users/mattiasiri/Developer/mate-admin

# Aggiungi tutti i file
git add .

# Primo commit
git commit -m "Initial commit: Mate Admin Panel with modular architecture"

# Collega a GitHub (sostituisci con il TUO username)
git remote add origin https://github.com/TUO-USERNAME/mate-admin.git

# Rinomina branch a main
git branch -M main

# Push su GitHub
git push -u origin main
```

### 3️⃣ **Configura GitHub Secrets (IMPORTANTE!)**

Su GitHub, vai nel tuo repository:

**Settings** > **Secrets and variables** > **Actions** > **New repository secret**

Aggiungi questi secrets:

#### Secret 1: `FIREBASE_SERVICE_ACCOUNT_MATE_ADMIN_DASHBOARD`
```bash
# Nel terminale, ottieni la service account:
firebase login  # se non sei loggato
firebase init hosting  # seleziona il tuo progetto

# Oppure crea una nuova service account:
# 1. Vai su Firebase Console > Project Settings > Service accounts
# 2. Click "Generate new private key"
# 3. Copia TUTTO il contenuto del file JSON
# 4. Incollalo come valore del secret su GitHub
```

Il valore sarà un JSON simile a:
```json
{
  "type": "service_account",
  "project_id": "mate-admin-dashboard",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### 4️⃣ **Verifica Firebase Config nel Codice**

Il file `src/firebase.ts` dovrebbe avere la configurazione corretta:

```typescript
// Se usi variabili d'ambiente (opzionale per public config):
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "tua-api-key",
  authDomain: "mate-admin-dashboard.firebaseapp.com",
  projectId: "mate-admin-dashboard",
  // ...
};
```

**NOTA:** Le Firebase config keys (apiKey, projectId, ecc.) sono **pubbliche** e possono stare nel codice. Le service account invece **NO**, devono essere solo nei GitHub Secrets!

---

## 🎯 Workflow di Lavoro

### Sviluppo Locale
```bash
# Lavori sul tuo Mac
npm run dev  # http://localhost:8080

# Fai modifiche ai file
# Testa tutto localmente
```

### Deploy su GitHub + Firebase
```bash
# Quando sei pronto per il deploy:
git add .
git commit -m "Descrizione delle modifiche"
git push

# GitHub Actions farà automaticamente:
# 1. npm install
# 2. npm run build
# 3. firebase deploy --only hosting
```

### Verifica Deploy
1. Vai su GitHub > Actions
2. Vedrai il workflow "Deploy to Firebase Hosting on merge" in esecuzione
3. Quando è verde ✅, l'app è live!
4. URL: `https://mate-admin-dashboard.web.app`

---

## 📂 Struttura File Importanti

```
mate-admin/
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml     ✅ Deploy su push a main
│       └── firebase-hosting-pull-request.yml  ✅ Preview su PR
├── .gitignore                              ✅ Protegge credenziali
├── firebase.json                           ✅ Config hosting
├── package.json
├── vite.config.ts
└── src/
    ├── firebase.ts                         ✅ Firebase config
    └── ...
```

---

## 🔒 Sicurezza

### ✅ File ESCLUSI da Git (nel .gitignore):
- `node_modules/`
- `.env` e variabili d'ambiente
- `*service-account*.json` (credenziali)
- `backend/credentials/`
- `functions/mate-analytics-service-account.json`

### ⚠️ File INCLUSI (sicuri):
- Codice sorgente (`src/`)
- `firebase.json`
- `package.json`
- Firebase config (apiKey, projectId) - sono pubblici!

---

## 🛠️ Comandi Utili

```bash
# Deploy manuale (opzionale)
npm run build
firebase deploy --only hosting

# Test build locale
npm run build
npm run preview  # Testa la build

# Rollback a versione precedente
firebase hosting:rollback

# Vedi versioni deployate
firebase hosting:versions

# Preview deploy (prima di production)
firebase hosting:channel:deploy preview
```

---

## 🔄 Workflow Completo Esempio

```bash
# 1. Modifiche locali
code .  # Apri VS Code
# ... fai modifiche ...
npm run dev  # Testa su localhost:8080

# 2. Commit
git status  # Vedi cosa è cambiato
git add .
git commit -m "feat: Added modular components for user/house details"

# 3. Push su GitHub
git push

# 4. GitHub Actions fa tutto il resto!
# - Build automatico
# - Deploy su Firebase Hosting
# - Notifica su GitHub (✅ o ❌)

# 5. Verifica
# Vai su https://mate-admin-dashboard.web.app
```

---

## 🎨 Branch Strategy (Opzionale ma Consigliato)

```bash
# Sviluppo su branch separato
git checkout -b feature/nuova-funzionalita

# Lavora e testa
git add .
git commit -m "work in progress"
git push -u origin feature/nuova-funzionalita

# Crea Pull Request su GitHub
# Test automatico con preview URL

# Quando pronto, merge su main
# Deploy automatico in produzione!
```

---

## 🆘 Troubleshooting

### Errore: "FIREBASE_SERVICE_ACCOUNT not found"
- Vai su GitHub > Settings > Secrets
- Aggiungi il secret con il nome **esatto**: `FIREBASE_SERVICE_ACCOUNT_MATE_ADMIN_DASHBOARD`

### Build fallisce su GitHub Actions
- Controlla il log su GitHub Actions
- Verifica che `package.json` sia commitato
- Verifica che `vite.config.ts` sia commitato

### Deploy ok ma app non funziona
- Controlla Firebase Console > Authentication (deve essere abilitato)
- Controlla Firestore rules
- Verifica che le API keys siano corrette in `src/firebase.ts`

### Vuoi backend (Node.js + Analytics)?
Il backend **NON** va su Firebase Hosting (solo frontend).
Opzioni per il backend:
1. **Firebase Functions** (consigliato) - pay-as-you-go
2. **Cloud Run** - container Docker
3. **Render/Railway** - hosting Node.js gratuito
4. **Vercel/Netlify** - serverless functions

---

## ✅ Checklist Pre-Deploy

- [ ] `.gitignore` protegge le credenziali
- [ ] Repository creato su GitHub
- [ ] Service account aggiunta ai GitHub Secrets
- [ ] `firebase.json` configurato correttamente
- [ ] Primo commit fatto
- [ ] Push su GitHub completato
- [ ] GitHub Actions workflow eseguito con successo
- [ ] App accessibile all'URL Firebase Hosting

---

## 📱 URL Finali

- **Production**: `https://mate-admin-dashboard.web.app`
- **Alternative**: `https://mate-admin-dashboard.firebaseapp.com`
- **Custom domain** (opzionale): Configura in Firebase Console > Hosting

---

**Pronto per il deploy! 🚀**
