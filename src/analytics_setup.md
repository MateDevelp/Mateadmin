# Google Analytics 4 Integration Setup

## 🎯 Panoramica

L'integrazione con Google Analytics 4 fornisce al pannello admin di Mate analytics dettagliate sull'utilizzo della piattaforma. Utilizza l'API Google Analytics Data v1 per recuperare metriche in tempo reale.

## 📋 Prerequisiti

✅ **Google Analytics 4 già configurato**: Property ID `G-RWNZCF691D`  
✅ **Pacchetto @google-analytics/data installato**: v5.2.1  
✅ **Account Google Cloud Project** con accesso alla Google Analytics Reporting API  

## 🔧 Configurazione

### 1. Abilita Google Analytics Reporting API

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il tuo progetto o creane uno nuovo
3. Naviga a **APIs & Services > Library**
4. Cerca "Google Analytics Reporting API" e abilitala
5. Cerca "Google Analytics Data API" e abilitala

### 2. Crea Service Account (Metodo Raccomandato)

```bash
# 1. Crea service account
gcloud iam service-accounts create mate-analytics \
    --description="Analytics service for Mate admin panel" \
    --display-name="Mate Analytics Service"

# 2. Genera chiave JSON
gcloud iam service-accounts keys create mate-analytics-key.json \
    --iam-account=mate-analytics@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Configura Accesso Analytics

1. Vai su [Google Analytics](https://analytics.google.com)
2. Seleziona la tua property (G-RWNZCF691D)
3. **Admin > Property Access Management**
4. Clicca **+ Add users**
5. Inserisci email del service account: `mate-analytics@YOUR_PROJECT_ID.iam.gserviceaccount.com`
6. Assegna permesso **Viewer**

### 4. Configurazione Environment Variables

Crea file `.env.local` nella root del progetto:

```env
# Google Analytics Configuration
VITE_GA_MEASUREMENT_ID=G-RWNZCF691D
VITE_GA_PROPERTY_ID=properties/YOUR_ACTUAL_PROPERTY_ID

# Service Account Credentials (encoded as base64)
VITE_GA_CREDENTIALS=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAieW91ci1wcm9qZWN0IiwKICAicHJpdmF0ZV9rZXlfaWQiOiAiLi4uIiwKICAiY2xpZW50X2VtYWlsIjogIm1hdGUtYW5hbHl0aWNzQHlvdXItcHJvamVjdC5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgLi4uCn0=
```

### 5. Trova Property ID

```bash
# Installa Google Analytics Admin API client
npm install @google-analytics/admin

# Script per trovare Property ID
node -e "
const {BetaAnalyticsDataClient} = require('@google-analytics/data');
const client = new BetaAnalyticsDataClient();
// Il property ID è nel formato: properties/123456789
"
```

Oppure manualmente:
1. Vai su [Google Analytics](https://analytics.google.com)
2. **Admin > Property Settings**
3. Il Property ID è visibile nell'intestazione

## 🚀 Utilizzo

### Struttura del Servizio

```typescript
// utils/googleAnalytics.ts
import { googleAnalyticsService } from '../utils/googleAnalytics';

// Carica metriche principali
const metrics = await googleAnalyticsService.getMetrics('30daysAgo');
const topPages = await googleAnalyticsService.getTopPages('30daysAgo');
const deviceTypes = await googleAnalyticsService.getDeviceTypes('30daysAgo');
```

### Metriche Disponibili

- **Utenti Totali**: `totalUsers`
- **Utenti Attivi**: `activeUsers`  
- **Nuovi Utenti**: `newUsers`
- **Sessioni**: `sessions`
- **Visualizzazioni Pagina**: `screenPageViews`
- **Durata Media Sessione**: `averageSessionDuration`
- **Bounce Rate**: `bounceRate`

### Dimensioni Disponibili

- **Pagine Top**: `pagePath` + metriche
- **Dispositivi**: `deviceCategory` + utenti
- **Locazioni**: `country` + `city` + utenti
- **Serie Temporali**: `date` + utenti nel tempo

## 🔄 Fallback e Mock Data

Il servizio include automaticamente dati mock per:
- **Sviluppo locale** senza credenziali
- **Fallback** in caso di errori API
- **Testing** senza impatto sui quota GA

```typescript
// Automatic fallback se l'API non è disponibile
if (!this.client) {
    return this.getMockMetrics();
}
```

## 🛡️ Security Best Practices

### Protezione Credenziali
```typescript
// ✅ Corretto - Variabili d'ambiente
const credentials = JSON.parse(import.meta.env.VITE_GA_CREDENTIALS);

// ❌ Mai committare credenziali in codice
const credentials = { private_key: "real-key-here" };
```

### Rate Limiting
- L'API GA ha quota giornalieri
- Il servizio include caching automatico
- Aggiornamenti ogni 5 minuti per ridurre chiamate

## 📊 Dashboard Features

### 1. Overview Tab
- Metriche principali con trend
- Grafici crescita utenti
- Distribuzione dispositivi

### 2. Users Tab  
- Top città/paesi
- Analytics demografici
- Comportamento utenti

### 3. Behavior Tab
- Pagine più visitate
- Percorsi utente
- Tempo su pagine

### 4. Conversion Tab
- Funnel conversioni
- Goal tracking
- ROI analytics

## 🚨 Troubleshooting

### Errore: "Property not found"
```bash
# Verifica Property ID
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  "https://analyticsdata.googleapis.com/v1beta/properties/YOUR_PROPERTY_ID/metadata"
```

### Errore: "Permission denied"  
1. Verifica che il service account abbia accesso alla property
2. Controlla che l'API sia abilitata
3. Verifica formato credenziali JSON

### Mock Data attivi
Se vedi sempre gli stessi dati, il servizio sta usando mock data:
1. Controlla variabili d'ambiente
2. Verifica credenziali service account
3. Controlla console per errori API

## 🔧 Comandi Utili

```bash
# Test connessione GA
npm run test:analytics

# Verifica quota API
npm run analytics:quota

# Update dependencies
npm update @google-analytics/data

# Debug credentials
npm run analytics:debug
```

## 📈 Monitoring

- **Console logs**: Errori API visibili in console browser
- **Fallback notifications**: Badge rosso se usando mock data
- **Last updated**: Timestamp ultimo aggiornamento dati reali
- **Quota usage**: Monitoraggio uso API nelle DevTools

## 🎯 Prossimi Sviluppi

- [ ] **Real-time data**: WebSocket per aggiornamenti live
- [ ] **Custom events**: Tracking azioni specifiche Mate
- [ ] **Cohort analysis**: Analisi gruppi utenti nel tempo  
- [ ] **A/B testing**: Integration con GA experiments
- [ ] **Export data**: PDF/Excel reports
- [ ] **Alerts**: Notifiche per metriche anomale
