# 🛡️ Mate Admin Panel

Pannello di amministrazione per la piattaforma Mate - Sistema completo di gestione con Analytics reali e Backend su Cloud Functions.

## 🚀 Deploy URLs

- **Frontend**: https://mate-dahboard-admin.web.app
- **Backend API**: https://analyticsapi-nnhs6pw32a-uc.a.run.app
- **Status**: ✅ **DEPLOYATO E FUNZIONANTE**

## 📚 Documentazione Deploy

- **📖 [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guida completa deploy step-by-step
- **⚡ [QUICK_DEPLOY.md](QUICK_DEPLOY.md)** - Comandi rapidi per deploy futuro
- **📊 [GOOGLE_ANALYTICS_SETUP.md](GOOGLE_ANALYTICS_SETUP.md)** - Setup Google Analytics 4
- **✅ [DEPLOY_STATUS.md](DEPLOY_STATUS.md)** - Stato attuale deployment
- **⚠️ [ACTION_REQUIRED.md](ACTION_REQUIRED.md)** - **Azione richiesta per abilitare Analytics**

---

## ⚠️ ULTIMO STEP: Configura Service Account

Il backend è deployato ma **devi aggiungere il service account a Google Analytics**:

1. Vai su https://analytics.google.com/
2. Seleziona Property **Mate Website** (`G-0ZJ99ZPT5N`)
3. **Admin** → **Property Access Management** → **Add users**
4. Aggiungi email: `mate-website-cd962@appspot.gserviceaccount.com`
5. Ruolo: **Viewer**

**Vedi [ACTION_REQUIRED.md](ACTION_REQUIRED.md) per istruzioni dettagliate**

---

## 🚀 Features Implementate

### ✅ Backend Analytics API (Cloud Function)
- **7 endpoint** per Google Analytics Data API
- Deploy automatico su Firebase Cloud Functions
- CORS configurato per frontend
- Timeout 300s per query complesse
- Health check e status monitoring

### ✅ Frontend Admin Panel
- Dashboard con metriche Firestore
- **Analytics** con dati GA4 reali
- **Verifiche** con OCR Tesseract.js
- **Chat Management** completo
- **Gestione Utenti** con audit log
- Responsive design mobile-first

### ✅ Deployment Completo
- Frontend su Firebase Hosting
- Backend su Cloud Functions (2nd Gen)
- Multi-site configuration
- Environment variables per dev/prod

---

## 📋 Quick Commands

### Deploy Completo
```bash
npm run build
firebase deploy
```

### Deploy Separato
```bash
# Solo frontend
firebase deploy --only hosting:admin

# Solo backend
firebase deploy --only functions:analyticsApi
```

### Test Backend
```bash
curl https://analyticsapi-nnhs6pw32a-uc.a.run.app/health
```

---

## 💰 Costi

Tutto nel piano gratuito Firebase/Google Cloud! 🎉

---

**Ultimo Deploy**: 15 Novembre 2025  
**Progetto**: mate-website-cd962
