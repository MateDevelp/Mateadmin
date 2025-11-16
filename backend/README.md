# 🛡️ Mate Admin Backend

Backend API Node.js per il pannello di amministrazione Mate con integrazione Google Analytics 4.

## 🚀 Quick Start

```bash
# Installa dipendenze
npm install

# Configura environment variables
cp .env.example .env
# Modifica .env con le tue configurazioni

# Avvia in sviluppo
npm run dev

# Avvia in produzione
npm start
```

## 📋 Requisiti

- **Node.js** >= 18.0.0
- **Google Cloud Project** con Analytics Data API abilitata
- **Service Account** con accesso alla Google Analytics property
- **Property ID** Google Analytics 4

## ⚙️ Configurazione

### 1. Google Analytics Setup

1. **Crea Service Account**:
```bash
# Google Cloud Console > IAM > Service Accounts
# 1. Create Service Account
# 2. Download JSON key file
# 3. Save as ./credentials/mate-analytics-service-account.json
```

2. **Abilita API**:
```bash
# Google Cloud Console > APIs & Services > Library
# Cerca e abilita: "Google Analytics Data API"
```

3. **Configura accesso Analytics**:
```bash
# Google Analytics > Admin > Property Access Management
# Add Users > service-account-email@project.iam.gserviceaccount.com
# Role: Viewer
```

### 2. Environment Variables

Copia `.env.example` in `.env` e configura:

```bash
# Server
PORT=3001
NODE_ENV=development

# Google Analytics
GA_PROPERTY_ID=properties/123456789
GOOGLE_APPLICATION_CREDENTIALS=./credentials/mate-analytics-service-account.json

# Security
API_KEY=your-secure-api-key
ALLOWED_ORIGINS=http://localhost:8081,https://admin.mateapp.it

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Trova Property ID

```bash
# Google Analytics > Admin > Property Settings
# Property ID è visibile nell'header: "G-XXXXXXXXXX"
# Usa formato: properties/123456789 (il numero dopo properties/)
```

## 📡 API Endpoints

### Base URL
```
http://localhost:3001
```

### Health Check
```
GET /health
```

### Analytics Endpoints

#### Metriche principali
```
GET /api/analytics/metrics?dateRange=30daysAgo
```

#### Pagine più visitate
```
GET /api/analytics/top-pages?dateRange=30daysAgo
```

#### Tipi di dispositivo
```
GET /api/analytics/device-types?dateRange=30daysAgo
```

#### Locazioni geografiche
```
GET /api/analytics/locations?dateRange=30daysAgo
```

#### Crescita utenti nel tempo
```
GET /api/analytics/user-growth?dateRange=30daysAgo
```

#### Tutti i dati (endpoint combinato)
```
GET /api/analytics/all?dateRange=30daysAgo
```

#### Stato servizio
```
GET /api/analytics/status
```

### Parametri Query

- `dateRange`: `today` | `7daysAgo` | `30daysAgo` | `90daysAgo` (default: `30daysAgo`)

### Headers Richiesti

```
Content-Type: application/json
X-API-Key: your-api-key (se configurato)
```

## 🔒 Sicurezza

### Rate Limiting
- **Window**: 15 minuti
- **Max requests**: 100 per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

### CORS
```javascript
// Configurato per domini specificati in ALLOWED_ORIGINS
allowedOrigins: [
  'http://localhost:8081',  // Frontend dev
  'https://admin.mateapp.it' // Produzione
]
```

### API Key (Opzionale)
```bash
# Configura API_KEY in .env
# Invia come header: X-API-Key: your-api-key
```

## 📊 Response Format

### Metriche
```json
{
  "totalUsers": 15420,
  "activeUsers": 3421,
  "newUsers": 1205,
  "sessions": 22341,
  "pageviews": 89234,
  "averageSessionDuration": "4m 32s",
  "bounceRate": 42.3
}
```

### Top Pages
```json
[
  {
    "page": "/",
    "views": 12453,
    "uniqueUsers": 8234
  }
]
```

### Device Types
```json
[
  {
    "device": "mobile",
    "users": 9252,
    "percentage": 60
  }
]
```

### Locations
```json
[
  {
    "country": "Italy",
    "city": "Milano",
    "users": 4521
  }
]
```

### User Growth
```json
[
  {
    "date": "15 nov",
    "users": 450,
    "newUsers": 75
  }
]
```

## 🚨 Error Handling

### Error Response Format
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Status Codes
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized (invalid API key)
- `404`: Endpoint not found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error
- `503`: Service Unavailable (GA not configured)

## 📝 Logging

```bash
# Development
npm run dev

# Production with PM2
npm install pm2 -g
pm2 start ecosystem.config.js
pm2 logs mate-admin-backend
```

## 🔧 Development

### Struttura File
```
backend/
├── server.js              # Entry point
├── routes/
│   └── analytics.js        # Analytics routes
├── credentials/            # Service account keys (gitignored)
├── .env.example           # Environment template
├── package.json
└── README.md
```

### Testing Endpoints

```bash
# Test health
curl http://localhost:3001/health

# Test analytics status
curl http://localhost:3001/api/analytics/status

# Test metrics
curl "http://localhost:3001/api/analytics/metrics?dateRange=30daysAgo"

# Con API key
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3001/api/analytics/all?dateRange=7daysAgo"
```

## 🚀 Deployment

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables Produzione
```bash
# Render/Vercel/Railway
GA_PROPERTY_ID=properties/123456789
GA_CREDENTIALS_JSON={"type":"service_account",...}
ALLOWED_ORIGINS=https://admin.mateapp.it
NODE_ENV=production
```

## 🔍 Troubleshooting

### Google Analytics Non Configurato
```json
{
  "error": "Google Analytics client not configured",
  "message": "Please configure GOOGLE_APPLICATION_CREDENTIALS or GA_CREDENTIALS_JSON"
}
```

**Soluzione**: Verifica configurazione service account e property ID.

### Property Non Trovata
```json
{
  "error": "Failed to fetch analytics metrics",
  "message": "Property not found or no access"
}
```

**Soluzione**: Verifica Property ID e permessi service account.

### Rate Limit Exceeded
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

**Soluzione**: Attendi il tempo specificato in `retryAfter` (secondi).

## 📞 Support

Per problemi di configurazione o supporto tecnico:
1. Verifica configurazione Google Analytics
2. Controlla logs del server: `npm run dev`
3. Testa endpoint `/api/analytics/status`

## 🎯 Next Steps

- [ ] Implementare caching Redis
- [ ] Aggiungere autenticazione JWT
- [ ] Metrics custom per Mate-specific events
- [ ] Export data in PDF/Excel
- [ ] Real-time notifications
- [ ] Database logging per audit
