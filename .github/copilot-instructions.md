# Mate Admin Panel - AI Coding Instructions

## 🛡️ Project Overview

This is a Firebase-powered admin panel for the Mate platform (a house-sharing app), built with **Vite + React + TypeScript + Shadcn UI**. The admin panel manages users, house verifications, reports, and system analytics.

## 🏗️ Architecture Patterns

### Authentication Flow
- **Dual verification system**: Custom Firebase claims (`admin: true`) + Firestore role check (`role: 'admin'` or `isAdmin: true`)
- **AdminContext** (`src/AdminContext.tsx`): Centralizes auth state and admin verification
- **ProtectedRoute** pattern: Wraps all admin pages, redirects non-admins to `/verify`
- **Development mode**: Currently accepts Firestore admin role only (production should require both)

### State Management
- **AdminContext** for global admin state
- **TanStack Query** for data fetching (configured in `App.tsx`)
- **Local state** with hooks for page-specific data

### Component Structure
```
AdminLayout -> AdminNav + main content wrapper
Pages wrap content with AdminLayout
UI components from shadcn/ui (see components/ui/)
```

### Data Layer
- **Firebase Firestore** collections: `users`, `houses`, `verifications`, `reports`, `auditLog`
- **Pagination**: 100 item limit on user lists
- **Audit logging**: All admin actions tracked in `auditLog` collection using `utils/auditLog.ts`

## 🔑 Key Conventions

### File Organization
- **Pages** in `src/pages/` (Dashboard, Users, Verifications)
- **Reusable components** in `src/components/dashboard/`
- **Utils** in `src/utils/` (auditLog.ts for action tracking)
- **Firebase config** split: `lib/firebase.ts` (init) + `firebase.ts` (exports)

### TypeScript Patterns
```typescript
// User interface (used across pages)
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  blocked?: boolean;
  UserVerificated?: boolean; // Note: Legacy naming
  role?: string;
}

// Admin actions (predefined constants)
import { AdminActions } from '../utils/auditLog';
```

### UI Patterns
- **shadcn/ui components** with consistent theming
- **AdminLayout** wrapper for all authenticated pages
- **Loading states**: Spinner with AdminLayout wrapper
- **Error handling**: Try-catch with console logging
- **Confirmation dialogs** for destructive actions (see Users page delete flow)

### Firestore Queries
```typescript
// Standard user loading pattern
const usersQuery = query(
  collection(db, 'users'),
  orderBy('createdAt', 'desc'),
  limit(100)
);

// Search pattern (client-side filtering preferred for small datasets)
const filtered = users.filter(user => {
  const searchLower = searchTerm.toLowerCase();
  return email.includes(searchLower) || fullName.includes(searchLower);
});
```

## 🚨 Critical Integration Points

### Firebase Security
- **Security rules**: Admin verification via Firestore role field
- **Custom claims setup**: Requires Cloud Function deployment (see `admin_panel_setup.md` for implementation)
- **Audit logging**: Every admin action MUST call `logAdminAction()`

### Admin Actions Pattern
```typescript
// Standard admin action implementation
import { logAdminAction, AdminActions } from '../utils/auditLog';

const blockUser = async (user: User) => {
  setActionLoading(true);
  try {
    await updateDoc(doc(db, 'users', user.id), {
      blocked: true,
      blockReason: 'Blocked by admin',
      blockedAt: new Date()
    });

    // REQUIRED: Log the action
    await logAdminAction(AdminActions.USER_BLOCKED, {
      adminUid: currentAdmin?.uid,
      targetUid: user.id,
      targetType: 'user',
      reason: 'Blocked by admin'
    });

    // Update UI state
    setUsers(prev => prev.map(u => 
      u.id === user.id ? { ...u, blocked: true } : u
    ));
  } catch (error) {
    console.error('Error blocking user:', error);
  } finally {
    setActionLoading(false);
  }
};
```

## 🛠️ Development Workflow

### Adding New Admin Pages
1. Create page component in `src/pages/`
2. Wrap with `AdminLayout`
3. Add route in `App.tsx` with `ProtectedRoute`
4. Add navigation item to `AdminNav.tsx`
5. Implement audit logging for any admin actions

### UI Development
- Use shadcn components from `components/ui/`
- Follow mobile-first responsive patterns
- Implement loading/error states consistently
- Use Lucide icons for consistency

### Firebase Integration
- Import from `src/firebase.ts` (not `lib/firebase.ts`)
- Use `collection(db, 'collectionName')` pattern
- Handle empty collections gracefully (see Dashboard stats loading)
- Always include error handling for Firestore operations

## 📊 Current Implementation Status

**✅ Complete**: Authentication, Dashboard metrics, User management, Verifications queue, Layout/Navigation
**🔄 In Progress**: Custom claims setup, Houses management, Reports system  
**⏳ Planned**: Real-time updates, Analytics charts, Email notifications

## 🚧 Known Issues & Workarounds

- **Custom claims**: Currently disabled for development (line 38 in `AdminContext.tsx`)
- **Mock data**: Dashboard uses fallback values when collections are empty
- **Email notifications**: Placeholder implementation in user actions
- **Image storage**: Verification documents ready for Firebase Storage integration

Refer to `src/admin_panel_setup.md` for comprehensive setup documentation and troubleshooting guides.
