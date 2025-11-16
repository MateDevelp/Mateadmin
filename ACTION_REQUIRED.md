# ⚠️ AZIONE RICHIESTA - Configura Service Account

## 🎯 Ultimo Step per Abilitare Analytics Reali

Il backend è deployato e funzionante, ma **devi aggiungere il service account a Google Analytics** per permettere l'accesso ai dati.

---

## 🔑 Service Account da Configurare

**Email**: `mate-website-cd962@appspot.gserviceaccount.com`

Questo è il **Default App Engine service account** che Cloud Functions usa automaticamente.

---

## 📝 Istruzioni Step-by-Step

### 1. Vai su Google Analytics

Apri: https://analytics.google.com/

### 2. Seleziona la Property

Seleziona: **Mate Website** (`G-0ZJ99ZPT5N`)

### 3. Vai nelle Impostazioni

1. Clicca su **Admin** (icona ingranaggio in basso a sinistra)
2. Nella colonna **Property**, clicca su **Property Access Management**

### 4. Aggiungi il Service Account

1. Clicca sul pulsante **+** (Add users) in alto a destra
2. Nel campo email, incolla:
   ```
   mate-website-cd962@appspot.gserviceaccount.com
   ```
3. Seleziona il ruolo: **Viewer** ✅
4. **DESELEZIONA** "Notify new users by email" (è un service account, non una persona)
5. Clicca **Add**

### 5. Verifica

Dopo aver aggiunto, verifica con:

```bash
curl "https://analyticsapi-nnhs6pw32a-uc.a.run.app/api/analytics/metrics?dateRange=7daysAgo"
```

Dovresti vedere dati reali tipo:
```json
{
  "totalUsers": 1234,
  "activeUsers": 567,
  "newUsers": 89,
  ...
}
```

---

## ✅ Alternative (Opzionale)

Se preferisci usare un service account dedicato (come quello creato precedentemente):

### Opzione A: Usa Service Account Dedicato

Se hai già creato `mate-analytics-reader@mate-website-cd962.iam.gserviceaccount.com`:

1. Configura Cloud Function per usare questo account invece del default
2. Vai su Firebase Console → Functions → analyticsApi → Settings
3. Cambia "Service account" da default a `mate-analytics-reader`

### Opzione B: Usa il Default (Più Semplice)

Basta aggiungere `mate-website-cd962@appspot.gserviceaccount.com` a Google Analytics come spiegato sopra. ✅ **Consigliato**

---

## 🧪 Test Finale

Dopo aver configurato:

### 1. Test Backend
```bash
# Metrics
curl "https://analyticsapi-nnhs6pw32a-uc.a.run.app/api/analytics/metrics?dateRange=30daysAgo"

# All data
curl "https://analyticsapi-nnhs6pw32a-uc.a.run.app/api/analytics/all?dateRange=30daysAgo"
```

### 2. Test Frontend

1. Vai su: https://mate-dahboard-admin.web.app
2. Login con account admin
3. Naviga su **Analytics**
4. Verifica che vedi **dati reali** (non più mock)

---

## 📊 Cosa Vedere nel Frontend

Una volta configurato, nella pagina Analytics vedrai:

- **📈 Metriche Reali**: Utenti totali, attivi, nuovi, sessioni, pageviews
- **📱 Dispositivi**: Distribuzione mobile/desktop/tablet
- **🌍 Locations**: Top città e paesi
- **📄 Top Pages**: Pagine più visitate
- **📊 User Growth**: Grafico crescita utenti nel tempo

---

## 🆘 Troubleshooting

### Errore: "Permission Denied"
👉 Il service account non è stato aggiunto a Google Analytics o non ha il ruolo Viewer.

### Errore: "Property not found"
👉 Verifica che il Property ID sia corretto: `properties/496252339`

### Frontend mostra ancora dati mock
👉 
1. Verifica che backend ritorni dati reali con curl
2. Svuota cache browser (Ctrl+Shift+R)
3. Apri Developer Tools → Console → verifica errori
4. Controlla Network tab → verifica chiamate a `analyticsapi-nnhs6pw32a-uc.a.run.app`

---

## 📞 Supporto

Se hai problemi, controlla:

1. **Backend logs**:
   ```bash
   firebase functions:log --only analyticsApi
   ```

2. **Frontend console**: 
   - Apri DevTools (F12)
   - Guarda Console e Network tab

3. **Google Analytics Access**:
   - Vai su GA4 → Admin → Property Access Management
   - Verifica che il service account sia presente con ruolo Viewer

---

## ✨ Una Volta Completato

Avrai un pannello admin completo con:

- ✅ Analytics reali da Google Analytics 4
- ✅ Backend scalabile su Cloud Functions
- ✅ Frontend moderno su Firebase Hosting
- ✅ Sicurezza gestita da Firebase Auth
- ✅ Costi minimi (tutto nel piano gratuito)

---

**Aggiungi il service account e sei pronto! 🚀**

Service Account Email: `mate-website-cd962@appspot.gserviceaccount.com`
Ruolo richiesto: **Viewer**
Property: **Mate Website** (`G-0ZJ99ZPT5N`)
