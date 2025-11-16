# 🛡️ Mate Admin Panel - Setup & Architecture Guide

## 📋 Overview

**Questo documento contiene tutte le informazioni necessarie per creare il pannello amministrativo di Mate su un sottodominio separato.**

---

## 🌐 Subdomain Configuration

### Domain Structure
- **Main App**: `mateapp.it` (applicazione utenti)
- **Admin Panel**: `admin.mateapp.it` (pannello amministrativo)

### Firebase Hosting Setup
```bash
# firebase.json - Multi-site hosting
{
  "hosting": [
    {
      "site": "mate-website",
      "public": "dist",
      "target": "main",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    },
    {
      "site": "mate-admin",
      "public": "admin-dist",
      "target": "admin",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
  ]
}
```

### Deploy Commands
```bash
# Deploy main app
firebase deploy --only hosting:main

# Deploy admin panel
firebase deploy --only hosting:admin

# Deploy both
firebase deploy --only hosting
```

---

## 🏗️ Project Structure

### Recommended Directory Layout
```
mate-admin/
├── public/
│   ├── index.html
│   └── logo-admin.png
├── src/
│   ├── components/
│   │   ├── AdminNav.jsx
│   │   ├── UserCard.jsx
│   │   ├── HouseCard.jsx
│   │   ├── ReportCard.jsx
│   │   └── StatsDashboard.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Houses.jsx
│   │   ├── Reports.jsx
│   │   ├── Verifications.jsx
│   │   └── Analytics.jsx
│   ├── hooks/
│   │   ├── useAdminAuth.js
│   │   └── usePaginatedData.js
│   ├── utils/
│   │   ├── adminFirebase.js
│   │   └── permissions.js
│   ├── App.jsx
│   ├── main.jsx
│   └── AdminContext.jsx
├── .env.local
├── package.json
├── vite.config.js
├── tailwind.config.js
└── firebase.json
```

---

## 🔐 Authentication & Authorization

### Firebase Custom Claims
```javascript
// Cloud Function per impostare admin claim
exports.setAdminRole = functions.https.onCall(async (data, context) => {
  // Solo super-admin possono chiamare questa funzione
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }
  
  const { uid } = data;
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  
  // Aggiorna anche in Firestore
  await admin.firestore().collection('users').doc(uid).update({
    role: 'admin',
    isAdmin: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { success: true, message: `Admin role granted to ${uid}` };
});
```

### AdminContext (src/AdminContext.jsx)
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const AdminContext = createContext();

export const useAdmin = () => useContext(AdminContext);

export function AdminProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Verifica custom claim
        const tokenResult = await firebaseUser.getIdTokenResult();
        const adminClaim = tokenResult.claims.admin === true;
        
        // Verifica anche in Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        const firestoreAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
        
        const isAdminUser = adminClaim && firestoreAdmin;
        
        setUser(firebaseUser);
        setIsAdmin(isAdminUser);
        
        if (!isAdminUser) {
          console.warn('User is not admin - redirecting to main app');
          window.location.href = 'https://mateapp.it';
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AdminContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AdminContext.Provider>
  );
}
```

### Protected Routes
```jsx
// src/components/AdminRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../AdminContext';

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAdmin();
  
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}
```

---

## 📊 Key Features & Pages

### 1. Dashboard (Overview)
**Route**: `/dashboard`

**Metrics**:
- Total users (with growth %)
- Active users (last 7 days)
- Total houses
- Pending verifications
- Active reports
- Today's signups
- Matching success rate

**Components**:
```jsx
// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalHouses: 0,
    pendingVerifications: 0,
    activeReports: 0
  });

  useEffect(() => {
    async function loadStats() {
      // Total users
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;

      // Active users (last 7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const activeSnap = await getDocs(
        query(collection(db, 'users'), where('lastAccessAt', '>=', sevenDaysAgo))
      );
      const activeUsers = activeSnap.size;

      // Total houses
      const housesSnap = await getDocs(collection(db, 'houses'));
      const totalHouses = housesSnap.size;

      // Pending verifications
      const verificationsSnap = await getDocs(
        query(collection(db, 'verifications'), where('status', '==', 'pending'))
      );
      const pendingVerifications = verificationsSnap.size;

      // Active reports
      const reportsSnap = await getDocs(
        query(collection(db, 'reports'), where('status', '==', 'pending'))
      );
      const activeReports = reportsSnap.size;

      setStats({
        totalUsers,
        activeUsers,
        totalHouses,
        pendingVerifications,
        activeReports
      });
    }

    loadStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Admin</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Utenti Totali" value={stats.totalUsers} icon="👥" />
        <StatCard title="Utenti Attivi (7gg)" value={stats.activeUsers} icon="✅" />
        <StatCard title="Case Totali" value={stats.totalHouses} icon="🏠" />
        <StatCard title="Verifiche Pending" value={stats.pendingVerifications} icon="⏳" />
        <StatCard title="Segnalazioni Attive" value={stats.activeReports} icon="⚠️" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-card p-6 border border-line">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold text-brand">{value}</span>
      </div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
    </div>
  );
}
```

---

### 2. User Management
**Route**: `/users`

**Features**:
- Search users (by name, email, uid)
- Filter by status (active, paused, blocked)
- View user details (profile, activity, reports)
- Actions:
  - ✅ Verify user manually
  - ⏸️ Pause/unpause profile
  - 🚫 Block/unblock user
  - 📧 Send notification email
  - 🗑️ Delete user (with confirmation)

**Firestore Queries**:
```javascript
// Lista utenti con paginazione
const usersQuery = query(
  collection(db, 'users'),
  orderBy('createdAt', 'desc'),
  limit(20)
);

// Filtra utenti bloccati
const blockedQuery = query(
  collection(db, 'users'),
  where('blocked', '==', true)
);

// Cerca per email
const searchQuery = query(
  collection(db, 'users'),
  where('email', '==', searchTerm.toLowerCase())
);
```

**User Actions**:
```javascript
// Blocca utente
async function blockUser(uid, reason) {
  await updateDoc(doc(db, 'users', uid), {
    blocked: true,
    blockReason: reason,
    blockedAt: serverTimestamp(),
    blockedBy: adminUid
  });
  
  // Log azione in auditLog
  await addDoc(collection(db, 'auditLog'), {
    action: 'USER_BLOCKED',
    targetUid: uid,
    adminUid,
    reason,
    timestamp: serverTimestamp()
  });
}

// Verifica manuale utente
async function manuallyVerifyUser(uid) {
  await updateDoc(doc(db, 'users', uid), {
    UserVerificated: true,
    verifiedAt: serverTimestamp(),
    verifiedBy: adminUid,
    verificationMethod: 'manual_admin'
  });
}
```

---

### 3. House Verification
**Route**: `/houses`

**Features**:
- Lista case pending approval
- Visualizza foto, indirizzo, dettagli
- Actions:
  - ✅ Approve house
  - ❌ Reject house (with reason)
  - 📧 Request additional info
  - 🗑️ Delete fraudulent listing

**Firestore Schema**:
```javascript
// houses/{houseId}
{
  ownerId: "uid",
  title: "Appartamento di Mattia a Milano",
  address: { city: "Milano", ... },
  type: "Appartamento",
  verified: false,          // ← Admin approva questa
  verifiedAt: null,
  verifiedBy: null,
  rejectedReason: null,
  status: "pending",        // pending | approved | rejected
  createdAt: timestamp,
  photos: [...],
  rooms: [...]
}
```

**Approval Logic**:
```javascript
async function approveHouse(houseId) {
  await updateDoc(doc(db, 'houses', houseId), {
    verified: true,
    verifiedAt: serverTimestamp(),
    verifiedBy: adminUid,
    status: 'approved'
  });
  
  // Notifica owner
  await sendNotificationToOwner(houseId, 'HOUSE_APPROVED');
}

async function rejectHouse(houseId, reason) {
  await updateDoc(doc(db, 'houses', houseId), {
    verified: false,
    status: 'rejected',
    rejectedReason: reason,
    rejectedAt: serverTimestamp(),
    rejectedBy: adminUid
  });
  
  await sendNotificationToOwner(houseId, 'HOUSE_REJECTED', reason);
}
```

---

### 4. Reports Management
**Route**: `/reports`

**Features**:
- Lista segnalazioni (abuse, fake, spam)
- Dettagli: reporter, reported user, reason, screenshots
- Actions:
  - ✅ Mark as resolved
  - 🚫 Take action (block user, delete content)
  - ❌ Dismiss as invalid
  - 📧 Send warning to reported user

**Firestore Schema**:
```javascript
// reports/{reportId}
{
  reporterUid: "uid_reporter",
  reportedUid: "uid_reported",
  reportedType: "user" | "house" | "message",
  reportedId: "target_id",
  reason: "fake_profile" | "harassment" | "spam" | "inappropriate",
  description: "Descrizione dettagliata...",
  screenshots: [...],
  status: "pending" | "resolved" | "dismissed",
  createdAt: timestamp,
  resolvedAt: null,
  resolvedBy: null,
  actionTaken: null
}
```

**Report Actions**:
```javascript
async function resolveReport(reportId, action) {
  const reportRef = doc(db, 'reports', reportId);
  
  await updateDoc(reportRef, {
    status: 'resolved',
    resolvedAt: serverTimestamp(),
    resolvedBy: adminUid,
    actionTaken: action  // 'blocked_user' | 'deleted_content' | 'warning_sent'
  });
  
  // Se azione = blocco utente
  if (action === 'blocked_user') {
    const report = await getDoc(reportRef);
    await blockUser(report.data().reportedUid, 'Multiple reports');
  }
}
```

---

### 5. Verifications Queue
**Route**: `/verifications`

**Features**:
- Lista richieste di verifica identità
- Visualizza documento + selfie
- Compare facial recognition score
- Actions:
  - ✅ Approve verification
  - ❌ Reject (request new docs)

**Firestore Schema**:
```javascript
// verifications/{uid}
{
  uid: "user_id",
  documentType: "passport" | "id_card" | "driver_license",
  documentPhoto: "gs://...",
  selfiePhoto: "gs://...",
  facialMatchScore: 0.87,        // 0-1 da TensorFlow.js
  status: "pending" | "approved" | "rejected",
  submittedAt: timestamp,
  reviewedAt: null,
  reviewedBy: null,
  rejectionReason: null
}
```

**Verification UI**:
```jsx
// src/pages/Verifications.jsx
function VerificationCard({ verification }) {
  const [documentUrl, setDocumentUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState('');

  useEffect(() => {
    // Carica immagini da Storage
    async function loadImages() {
      const docRef = ref(storage, verification.documentPhoto);
      const selfieRef = ref(storage, verification.selfiePhoto);
      
      const docUrl = await getDownloadURL(docRef);
      const selfieUrl = await getDownloadURL(selfieRef);
      
      setDocumentUrl(docUrl);
      setSelfieUrl(selfieUrl);
    }
    loadImages();
  }, [verification]);

  return (
    <div className="bg-white rounded-xl shadow-card p-6 border border-line">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Documento</p>
          <img src={documentUrl} alt="Documento" className="rounded-lg" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Selfie</p>
          <img src={selfieUrl} alt="Selfie" className="rounded-lg" />
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">Match facciale:</span>
        <span className={`font-bold ${verification.facialMatchScore > 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
          {(verification.facialMatchScore * 100).toFixed(0)}%
        </span>
      </div>
      
      <div className="flex gap-3">
        <button onClick={() => approveVerification(verification.uid)} className="btn-primary">
          ✅ Approva
        </button>
        <button onClick={() => rejectVerification(verification.uid)} className="btn-secondary">
          ❌ Rifiuta
        </button>
      </div>
    </div>
  );
}
```

---

### 6. Analytics Dashboard
**Route**: `/analytics`

**Metrics**:
- User growth chart (daily/weekly/monthly)
- Active users trend
- Matching success rate
- House listings trend
- Conversion funnel:
  - Signups → Onboarding complete → First match → First chat
- Geographic distribution (users by city)
- Retention rate (7-day, 30-day)

**Data Aggregation**:
```javascript
// Cloud Function per aggregare dati giornalieri
exports.aggregateDailyStats = functions.pubsub
  .schedule('0 2 * * *') // 2 AM ogni giorno
  .timeZone('Europe/Rome')
  .onRun(async (context) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const startOfDay = yesterday.getTime();
    const endOfDay = yesterday.getTime() + 24 * 60 * 60 * 1000;
    
    // Nuovi utenti
    const newUsersSnap = await admin.firestore()
      .collection('users')
      .where('createdAt', '>=', startOfDay)
      .where('createdAt', '<', endOfDay)
      .get();
    
    // Utenti attivi
    const activeUsersSnap = await admin.firestore()
      .collection('users')
      .where('lastAccessAt', '>=', startOfDay)
      .where('lastAccessAt', '<', endOfDay)
      .get();
    
    // Salva in collection analytics
    await admin.firestore().collection('analytics').doc(`daily_${yesterday.toISOString().split('T')[0]}`).set({
      date: admin.firestore.Timestamp.fromDate(yesterday),
      newUsers: newUsersSnap.size,
      activeUsers: activeUsersSnap.size,
      // ... altri metriche
    });
  });
```

---

## 🎨 Design System (Same as Main App)

### Colors
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: '#336CFF',
        'brand-600': '#2B57F2',
        'brand-100': '#E8F0FF',
        'brand-sky': '#7FBBF5',
        accent: '#FF832E',
        'accent-600': '#F66E15',
        'accent-100': '#FFF2E8',
        ink: '#07081A',
        bg: '#FFFFFF',
        muted: '#F5F7FB',
        line: '#E6EAF2'
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Montserrat', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 24px rgba(7,8,26,.06)',
        float: '0 8px 32px rgba(7,8,26,.10)'
      }
    }
  }
}
```

### Component Patterns
```jsx
// Primary Button
<button className="bg-brand hover:bg-brand-600 text-white font-semibold 
                   px-6 py-3 rounded-xl shadow-card hover:shadow-float
                   transition-all duration-200">
  Approva
</button>

// Card
<div className="bg-bg rounded-2xl shadow-card p-6 border border-line">
  {/* Content */}
</div>

// Input
<input className="w-full px-4 py-2.5 border-2 border-line rounded-xl
                  bg-white text-ink placeholder:text-gray-400
                  focus:border-brand focus:ring-2 focus:ring-brand/30" />
```

---

## 🔧 Development Setup

### 1. Create New Vite Project
```bash
npm create vite@latest mate-admin -- --template react
cd mate-admin
npm install
```

### 2. Install Dependencies
```bash
# Core
npm install react-router-dom firebase

# UI & Design
npm install tailwindcss postcss autoprefixer
npm install framer-motion lucide-react

# Charts & Analytics
npm install recharts date-fns

# Utils
npm install clsx
```

### 3. Initialize Tailwind
```bash
npx tailwindcss init -p
```

### 4. Configure Firebase
```javascript
// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

### 5. Environment Variables (.env.local)
```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=mate-website-cd962.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mate-website-cd962
VITE_FIREBASE_STORAGE_BUCKET=mate-website-cd962.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 🚀 Deployment Workflow

### 1. Build Admin Panel
```bash
npm run build
# Output: dist/
```

### 2. Configure Firebase Hosting
```bash
firebase target:apply hosting admin mate-admin
```

### 3. Deploy
```bash
firebase deploy --only hosting:admin
```

### 4. Configure DNS
Nel tuo provider DNS (es. Cloudflare):
```
Type: CNAME
Name: admin
Content: mate-admin.web.app
Proxy: Yes (orange cloud)
```

---

## 🔒 Security Rules

### Firestore Rules (Admin Access)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper: check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Admin-only collections
    match /auditLog/{logId} {
      allow read, write: if isAdmin();
    }
    
    match /analytics/{docId} {
      allow read: if isAdmin();
      allow write: if false; // Solo Cloud Functions
    }
    
    // Reports: tutti possono creare, solo admin leggono/modificano
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read, update, delete: if isAdmin();
    }
    
    // Verifications: user crea, solo admin legge/approva
    match /verifications/{uid} {
      allow create: if request.auth.uid == uid;
      allow read, update: if isAdmin();
    }
    
    // Users: admin può modificare campi sensibili
    match /users/{uid} {
      allow read: if request.auth != null;
      allow update: if request.auth.uid == uid || isAdmin();
      
      // Solo admin può cambiare role/blocked
      allow update: if isAdmin() && 
        request.resource.data.diff(resource.data).affectedKeys()
          .hasOnly(['role', 'blocked', 'blockReason', 'UserVerificated']);
    }
  }
}
```

---

## 📱 Navigation Structure

### Admin Navigation
```jsx
// src/components/AdminNav.jsx
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Building, AlertCircle, CheckCircle, BarChart } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/users', icon: Users, label: 'Utenti' },
  { path: '/houses', icon: Building, label: 'Case' },
  { path: '/reports', icon: AlertCircle, label: 'Segnalazioni' },
  { path: '/verifications', icon: CheckCircle, label: 'Verifiche' },
  { path: '/analytics', icon: BarChart, label: 'Analytics' }
];

export default function AdminNav() {
  const location = useLocation();
  
  return (
    <nav className="bg-bg border-b border-line">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="font-display text-xl font-bold text-brand">Mate Admin</span>
          </div>
          
          <div className="flex gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-brand text-white' 
                    : 'text-gray-600 hover:bg-muted'}`}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            ))}
          </div>
          
          <button onClick={logout} className="text-sm text-gray-600 hover:text-brand">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
```

---

## 📊 Audit Log System

### Track Admin Actions
```javascript
// src/utils/auditLog.js
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function logAdminAction(action, details) {
  await addDoc(collection(db, 'auditLog'), {
    action,           // 'USER_BLOCKED' | 'HOUSE_APPROVED' | 'REPORT_RESOLVED'
    adminUid: auth.currentUser.uid,
    adminEmail: auth.currentUser.email,
    targetUid: details.targetUid || null,
    targetType: details.targetType || null,  // 'user' | 'house' | 'report'
    targetId: details.targetId || null,
    reason: details.reason || null,
    metadata: details.metadata || {},
    timestamp: serverTimestamp(),
    ipAddress: details.ipAddress || null  // Optional: log from Cloud Function
  });
}

// Usage
await logAdminAction('USER_BLOCKED', {
  targetUid: 'user123',
  targetType: 'user',
  reason: 'Multiple abuse reports'
});
```

---

## 🧪 Testing Checklist

### Before Production
- [ ] Admin claim verificato correttamente
- [ ] Non-admin vengono redirezionati a main app
- [ ] Tutte le operazioni CRUD funzionano
- [ ] Firestore rules impediscono accesso non-admin
- [ ] Audit log traccia tutte le azioni
- [ ] Email notifications funzionano
- [ ] Immagini da Storage si caricano
- [ ] Pagination funziona su grandi dataset
- [ ] UI responsive su mobile
- [ ] Performance: lazy loading, code splitting
- [ ] Error boundaries su tutte le pagine

---

## 🚨 Common Issues & Solutions

### Issue: "Permission Denied" su Firestore
**Causa**: Custom claim `admin` non impostato correttamente
**Fix**:
```javascript
// Esegui Cloud Function
const setAdmin = httpsCallable(functions, 'setAdminRole');
await setAdmin({ uid: 'target_uid' });

// Verifica
const user = auth.currentUser;
const token = await user.getIdTokenResult(true); // force refresh
console.log(token.claims.admin); // deve essere true
```

### Issue: Redirect Loop tra main app e admin panel
**Causa**: Cookie/token condivisi tra sottodomini
**Fix**: Configurare auth domain separato per admin
```javascript
// src/firebase.js (admin panel)
const firebaseConfig = {
  authDomain: 'mate-admin.firebaseapp.com',  // domain separato
  // ...
};
```

### Issue: CORS errore su Cloud Functions
**Fix**: Configura CORS in Cloud Function
```javascript
const cors = require('cors')({ origin: true });

exports.myFunction = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // ... your code
  });
});
```

---

## 📚 Resources & Links

### Documentation
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Multi-site Hosting](https://firebase.google.com/docs/hosting/multisites)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

### Main App Repositories
- **Main Repo**: `/Users/mattiasiri/Developer/mate-website`
- **Design System**: `DESIGN_SYSTEM.md`
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

## 🎯 Quick Start Commands

```bash
# 1. Clone structure da main app
cp -r mate-website/src/components mate-admin/src/
cp mate-website/tailwind.config.js mate-admin/
cp mate-website/.env.local mate-admin/

# 2. Install dependencies
cd mate-admin && npm install

# 3. Run dev server
npm run dev

# 4. Build for production
npm run build

# 5. Deploy to Firebase
firebase deploy --only hosting:admin
```

---

## ✅ First Steps Checklist

Quando inizi il progetto, segui questo ordine:

1. [ ] Crea progetto Vite + installa dipendenze
2. [ ] Configura Tailwind con design tokens da main app
3. [ ] Setup Firebase (auth, firestore, storage)
4. [ ] Crea AdminContext per gestione autenticazione
5. [ ] Implementa AdminRoute per proteggere pagine
6. [ ] Crea layout base con AdminNav
7. [ ] Implementa Dashboard con metriche base
8. [ ] Aggiungi Users management page
9. [ ] Aggiungi House verification page
10. [ ] Implementa Reports management
11. [ ] Setup Cloud Functions per admin claims
12. [ ] Testa security rules
13. [ ] Deploy su Firebase Hosting
14. [ ] Configura DNS per admin.mateapp.it

---

## 📞 Support

Per domande o problemi durante lo sviluppo, fai riferimento a:
- Documentazione main app: `mate-website/docs/`
- Design system: `mate-website/DESIGN_SYSTEM.md`
- Copilot instructions: `mate-website/.github/copilot-instructions.md`

**Buon coding! 🚀**
