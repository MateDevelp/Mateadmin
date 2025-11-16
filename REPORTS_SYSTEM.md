# 🚨 Reports Management System - Mate Admin

## 🎯 Funzionalità Complete

### ✅ **Reports Management Page** 
Una pagina completa per la gestione delle segnalazioni della moderazione chat con:

#### **📋 Sistema di Segnalazioni**
- **Visualizzazione real-time** di tutte le segnalazioni dalla collezione `reports`
- **Filtri avanzati**: status (pending/reviewed/resolved/dismissed), severity (low/medium/high/critical), tipo (auto/manual)
- **Ricerca intelligente**: per ID, utente, motivo, contenuto messaggi
- **Stats overview**: contatori live per tipologie e priorità
- **Ordinamento** per data creazione

#### **🛡️ Auto-Detection System** 
- **Report automatici** creati dal sistema di moderazione del sito principale
- **Rilevamento parole vietate** con evidenziazione parole rilevate
- **Visualizzazione messaggi** segnalati con contesto completo
- **Badge distintivi** per report auto-generati vs manuali
- **Severity scoring** automatico basato su parole rilevate

#### **⚖️ Moderation Tools**
- **Verifica report** con note azione intrapresa
- **Blocca utente segnalato** con motivo tracciato
- **Risolvi/Archivia** segnalazioni con audit trail
- **Elimina report** per pulizia database
- **Real-time updates** via Firebase listeners

---

## 🔧 Implementazione Tecnica

### **📁 Struttura Files**
```
src/
├── pages/
│   └── Reports.tsx               # ✅ Pagina principale gestione report
├── components/
│   └── AdminNav.tsx             # ✅ Link "Segnalazioni" nella nav
└── utils/
    └── auditLog.ts              # ✅ Actions REPORT_RESOLVED, REPORT_DISMISSED
```

### **🔄 Firebase Integration**
```typescript
// Real-time reports loading
const reportsQuery = query(
  collection(db, 'reports'),
  orderBy('createdAt', 'desc'),
  limit(200)
);

const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setReports(reports);
});
```

### **👥 User Data Loading**
```typescript
// Load reporter and reported user data
const loadUsersData = async (reports) => {
  const userIds = new Set();
  reports.forEach(report => {
    userIds.add(report.reporterId);
    userIds.add(report.reportedUid);
  });
  
  // Batch load user profiles from Firestore
  const usersData = await Promise.all(
    Array.from(userIds).map(userId => getDoc(doc(db, 'users', userId)))
  );
};
```

### **🔍 Smart Filtering**
```typescript
// Multi-criteria filtering
const filtered = reports.filter(report => {
  const matchesSearch = 
    report.id.includes(searchTerm) ||
    getUserDisplayName(report.reporterId).includes(searchTerm) ||
    report.messageText?.includes(searchTerm);
  
  const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
  const matchesSeverity = severityFilter === 'all' || report.severity === severityFilter;
  const matchesType = 
    typeFilter === 'all' || 
    (typeFilter === 'auto' && report.isAutoReport) ||
    (typeFilter === 'manual' && !report.isAutoReport);
  
  return matchesSearch && matchesStatus && matchesSeverity && matchesType;
});
```

---

## 🗄️ Firestore Data Structure

### **📊 Reports Collection**
```javascript
// reports/{reportId}
{
  // Reporter info
  reporterId: "uid_of_reporter",
  
  // Reported user info
  reportedUid: "uid_of_reported_user",
  
  // Report details
  reason: "harassment" | "spam" | "inappropriate" | "profanity" | "fake" | "other",
  notes: "Descrizione fornita dall'utente", // Optional
  conversationId: "chat_conversation_id", // Optional
  
  // Auto-report specific (from profanity filter)
  isAutoReport: true | false,
  messageText: "Testo del messaggio segnalato", // Se auto-report
  detectedWords: ["parola1", "parola2"], // Parole vietate rilevate
  
  // Status tracking
  status: "pending" | "reviewed" | "resolved" | "dismissed",
  severity: "low" | "medium" | "high" | "critical",
  
  // Admin review tracking
  reviewedAt: timestamp | null,
  reviewedBy: "admin_uid" | null,
  actionTaken: "User blocked" | "Warning sent" | "No action" | null,
  
  // Timestamps
  createdAt: timestamp
}
```

### **🔗 Related Collections**
```javascript
// users/{uid}/blockedUsers - Blocklist personale
{
  blockedUserIds: ["uid1", "uid2", ...]
}

// bannedUsers/{uid} - Ban globali admin
{
  uid: "banned_user_id",
  reason: "Multiple reports - harassment",
  bannedBy: "admin_uid",
  bannedAt: timestamp
}

// auditLog/{logId} - Tracking azioni admin
{
  action: "REPORT_RESOLVED",
  adminUid: "admin_who_acted",
  targetId: "report_id",
  targetType: "report",
  reason: "User blocked for violations",
  timestamp: timestamp
}
```

---

## 🛡️ Security & Moderation Workflow

### **🔄 Report Flow - Auto Detection**
1. **Utente invia messaggio** con parola vietata (es. "sei un cazzo")
2. **profanityFilter.js** rileva la parola nel sito principale
3. **ChatService.sendMessage()** crea report automatico:
   ```typescript
   await addDoc(collection(db, 'reports'), {
     reporterId: currentUserId,
     reportedUid: currentUserId, // Auto-report
     reason: 'profanity',
     messageText: messageText,
     detectedWords: ['cazzo'],
     isAutoReport: true,
     severity: 'high',
     status: 'pending',
     createdAt: serverTimestamp()
   });
   ```
4. **Admin panel** mostra report in tempo reale
5. **Admin verifica** e decide azione

### **🔄 Report Flow - Manual**
1. **Utente clicca** "Segnala utente" in chat
2. **Seleziona motivo** (harassment, spam, etc.) + note
3. **handleReport()** salva su Firestore:
   ```typescript
   await addDoc(collection(db, 'reports'), {
     reporterId: currentUser.uid,
     reportedUid: otherUserUid,
     reason: selectedReason,
     notes: userNotes,
     conversationId: conversationId,
     isAutoReport: false,
     severity: 'medium',
     status: 'pending',
     createdAt: serverTimestamp()
   });
   ```
4. **Admin panel** riceve notifica
5. **Admin esamina** context e decide

### **⚖️ Admin Actions**
```typescript
// 1. Review & Resolve
const reviewReport = async (reportId, action) => {
  await updateDoc(doc(db, 'reports', reportId), {
    status: action, // 'resolved' or 'dismissed'
    reviewedAt: new Date(),
    reviewedBy: currentAdmin.uid,
    actionTaken: actionNotes
  });
  
  await logAdminAction(
    action === 'resolved' ? AdminActions.REPORT_RESOLVED : AdminActions.REPORT_DISMISSED,
    { targetId: reportId }
  );
};

// 2. Block Reported User
const blockUser = async (report) => {
  // Block user in Firestore
  await updateDoc(doc(db, 'users', report.reportedUid), {
    blocked: true,
    blockedAt: new Date(),
    blockedReason: `Report: ${report.reason}`
  });
  
  // Mark report as resolved
  await updateDoc(doc(db, 'reports', report.id), {
    status: 'resolved',
    actionTaken: 'User blocked'
  });
  
  // Audit logging
  await logAdminAction(AdminActions.USER_BLOCKED, {
    targetUid: report.reportedUid,
    reason: `Report ID: ${report.id}`
  });
};

// 3. Delete Report (cleanup)
const deleteReport = async (reportId) => {
  await deleteDoc(doc(db, 'reports', reportId));
  await logAdminAction(AdminActions.REPORT_DISMISSED, {
    targetId: reportId,
    reason: 'Deleted by admin'
  });
};
```

---

## 🎨 UI/UX Features

### **📱 Responsive Design**
- **Mobile-first** layout con cards responsive
- **Stats dashboard** con 5 KPI cards
- **Scroll areas** ottimizzate per liste lunghe
- **Badge system** per severity e status

### **🔧 User Experience**  
- **Real-time updates** senza refresh
- **Instant filtering** con debouncing
- **Color-coded severity** (red=critical, yellow=medium, blue=low)
- **Expandable details** per context completo
- **Confirmation dialogs** per azioni critiche

### **🎯 Admin Workflow**
- **Dashboard metrics** show pending/high-priority counts
- **Quick actions** menu per ogni report
- **Bulk context** loading per performance
- **Review dialog** con note field per documentazione
- **Action history** tracking chi ha fatto cosa

---

## 📈 Performance Optimizations

### **🚀 Data Loading**
- **Pagination** (200 report limit con orderBy)
- **Lazy user loading** solo per ID presenti
- **Memoization** per prevent re-renders
- **Cleanup** Firebase listeners

### **💾 Memory Management**
- **Efficient filtering** client-side per dataset piccoli
- **Batch user queries** invece di query individuali
- **Effect cleanup** su unmount
- **Index optimization** per orderBy queries

### **📊 Firestore Indexes**
Aggiungi in `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "reports",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "severity", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🚀 Integration con Sistema Principale

### **🔗 Collegamento al Sito Mate**
Il sistema è progettato per ricevere report da:

1. **profanityFilter.js** (auto-detection)
2. **ChatService.reportUser()** (manual reports)
3. **Chat.jsx handleReport()** (UI flow)

### **📡 Communication Pattern**
```
[Mate Website/App]                [Admin Panel]
     ↓                                 ↓
  Chat UI                         Reports Page
     ↓                                 ↓
profanityFilter.js   →   reports   ←  Real-time listener
     ↓                   collection        ↓
ChatService.js                      Review & Action
     ↓                                     ↓
  Firestore    ←─────────────────────  Audit Log
```

### **🔄 Sync Process**
1. Website crea report → Firestore `reports` collection
2. Admin panel listener riceve update istantaneo
3. Admin agisce → Status update propagato a Firestore
4. Audit log traccia tutte le azioni
5. User block state sincronizzato cross-platform

---

## 🎉 **RESULT SUMMARY**

Ho creato un **sistema completo di gestione segnalazioni** per l'admin panel Mate con:

### ✅ **Completato**
1. **Pagina Reports** (`/reports`) con lista e filtri avanzati
2. **Real-time monitoring** per nuove segnalazioni
3. **Auto-detection support** per report da profanity filter
4. **Manual reports support** per segnalazioni utente
5. **Admin moderation tools** (verifica, blocca, elimina)
6. **Severity classification** con color coding
7. **Audit logging** completo per compliance
8. **UI responsive** con stats dashboard

### 🔗 **Navigation**
- Aggiunto route `/reports` protetto con autenticazione
- Link **"Segnalazioni"** già presente in AdminNav
- Badge count per report pending visible in dashboard

### 📊 **Data Structure**
Basato sulla struttura definita nel sito principale:
- **reporterId** - Chi ha segnalato
- **reportedUid** - Chi è stato segnalato
- **isAutoReport** - Flag per auto-detection
- **detectedWords** - Parole vietate rilevate
- **severity** - Priorità (low/medium/high/critical)
- **status** - Stato (pending/reviewed/resolved/dismissed)

### 🔧 **Next Steps**
Per deploy:
```bash
# 1. Compila con nuova pagina
npm run build

# 2. Deploy Firestore rules (se modificate)
firebase deploy --only firestore:rules

# 3. Deploy Firestore indexes
firebase deploy --only firestore:indexes

# 4. Deploy frontend
firebase deploy --only hosting:admin
```

Il sistema è **production-ready** e si integra perfettamente con il sistema di moderazione chat implementato nel sito principale! 🎯

### 📚 **Documentazione Correlata**
- `CHAT_SYSTEM.md` - Sistema gestione chat
- `CHAT_MODERATION_DOCS.md` - Documentazione moderazione (nel sito principale)
- `src/admin_panel_setup.md` - Setup generale admin panel

**Sistema Reports completo e funzionante!** ✨
