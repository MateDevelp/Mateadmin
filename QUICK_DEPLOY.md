# 🚀 Quick Deploy - Mate Admin Panel

## Deploy Completo (Frontend + Backend)

```bash
# 1. Build frontend
npm run build

# 2. Deploy tutto
firebase deploy
```

---

## Deploy Solo Frontend

```bash
npm run build
firebase deploy --only hosting:admin
```

**URL**: https://mate-dahboard-admin.web.app

---

## Deploy Solo Backend (Analytics API)

```bash
firebase deploy --only functions:analyticsApi
```

**URL**: Verrà mostrato nel log di deploy (es: `https://analyticsapi-nnhs6pw32a-uc.a.run.app`)

**Importante**: Se l'URL cambia, aggiorna `.env.production` e rideploya il frontend!

---

## Test Rapido Post-Deploy

### Backend
```bash
# Health check
curl https://analyticsapi-nnhs6pw32a-uc.a.run.app/health

# Test Analytics
curl "https://analyticsapi-nnhs6pw32a-uc.a.run.app/api/analytics/status"
```

### Frontend
Vai su: https://mate-dahboard-admin.web.app/analytics

---

## Logs

### Cloud Function Logs
```bash
firebase functions:log --only analyticsApi
```

### Frontend Logs
Vai su Firebase Console: https://console.firebase.google.com/project/mate-website-cd962/hosting

---

## Configurazione Locale vs Produzione

### Locale (Development)
`.env`:
```bash
VITE_USE_BACKEND=true
VITE_BACKEND_API_URL=http://localhost:3001/api
VITE_GA_MEASUREMENT_ID=G-0ZJ99ZPT5N
```

### Produzione
`.env.production`:
```bash
VITE_USE_BACKEND=true
VITE_BACKEND_API_URL=https://analyticsapi-nnhs6pw32a-uc.a.run.app
VITE_GA_MEASUREMENT_ID=G-0ZJ99ZPT5N
```

---

## Rollback

### Frontend
```bash
firebase hosting:clone mate-dahboard-admin:PREVIOUS_VERSION mate-dahboard-admin:live
```

### Backend
Vai su Firebase Console → Functions → analyticsApi → Revisions → Rollback to previous

---

## Note Importanti

- ✅ Service Account deve avere accesso a Google Analytics (ruolo Viewer)
- ✅ Property ID hardcoded in `functions/analytics/app.js`: `properties/496252339`
- ✅ Cloud Function usa Application Default Credentials (service account Firebase)
- ✅ Frontend usa variabili da `.env.production` durante build di produzione

---

## Checklist Pre-Deploy

- [ ] Hai fatto le modifiche necessarie al codice
- [ ] Hai testato in locale (`npm run dev` + backend `npm run dev`)
- [ ] Hai buildato il frontend (`npm run build`)
- [ ] Hai verificato che `.env.production` sia aggiornato con URL Cloud Function corretto
- [ ] Hai committato le modifiche su Git (opzionale ma consigliato)

---

## Comandi Utili

```bash
# Vedi configurazione Firebase
firebase use

# Cambia progetto
firebase use mate-website-cd962

# Lista hosting sites
firebase hosting:sites:list

# Lista functions
firebase functions:list

# Vedi configurazione functions (deprecato)
firebase functions:config:get
```
