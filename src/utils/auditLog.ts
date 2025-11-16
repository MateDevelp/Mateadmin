import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface AdminAction {
    action: string;
    adminUid?: string;
    adminEmail?: string;
    targetUid?: string;
    targetType?: 'user' | 'house' | 'report' | 'verification' | 'conversation';
    targetId?: string;
    reason?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
}

/**
 * Registra un'azione amministrativa nel sistema di audit
 */
export async function logAdminAction(action: string, details: Partial<AdminAction> = {}) {
    try {
        await addDoc(collection(db, 'auditLog'), {
            action,
            adminUid: details.adminUid || null,
            adminEmail: details.adminEmail || null,
            targetUid: details.targetUid || null,
            targetType: details.targetType || null,
            targetId: details.targetId || null,
            reason: details.reason || null,
            metadata: details.metadata || {},
            timestamp: serverTimestamp(),
            ipAddress: details.ipAddress || null
        });

        console.log(`Admin action logged: ${action}`, details);
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

// Azioni predefinite per consistenza
export const AdminActions = {
    USER_BLOCKED: 'USER_BLOCKED',
    USER_UNBLOCKED: 'USER_UNBLOCKED',
    USER_VERIFIED: 'USER_VERIFIED',
    USER_DELETED: 'USER_DELETED',
    HOUSE_APPROVED: 'HOUSE_APPROVED',
    HOUSE_REJECTED: 'HOUSE_REJECTED',
    HOUSE_DELETED: 'HOUSE_DELETED',
    HOUSE_VERIFIED: 'HOUSE_VERIFIED',
    HOUSE_UNVERIFIED: 'HOUSE_UNVERIFIED',
    HOUSE_ACTIVATED: 'HOUSE_ACTIVATED',
    HOUSE_DEACTIVATED: 'HOUSE_DEACTIVATED',
    REPORT_RESOLVED: 'REPORT_RESOLVED',
    REPORT_DISMISSED: 'REPORT_DISMISSED',
    VERIFICATION_APPROVED: 'VERIFICATION_APPROVED',
    VERIFICATION_REJECTED: 'VERIFICATION_REJECTED',
    CONVERSATION_BLOCKED: 'CONVERSATION_BLOCKED',
    CONVERSATION_UNBLOCKED: 'CONVERSATION_UNBLOCKED',
    CONVERSATION_DELETED: 'CONVERSATION_DELETED',
    ADMIN_LOGIN: 'ADMIN_LOGIN',
    ADMIN_LOGOUT: 'ADMIN_LOGOUT',
} as const;
