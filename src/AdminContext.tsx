import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

interface AdminContextType {
    user: User | null;
    isAdmin: boolean;
    loading: boolean;
    logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    // Verifica custom claim
                    const tokenResult = await firebaseUser.getIdTokenResult();
                    const adminClaim = tokenResult.claims.admin === true;

                    // Prova a verificare in Firestore
                    let firestoreAdmin = false;
                    try {
                        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                        const userData = userDoc.data();
                        firestoreAdmin = userData?.role === 'admin' || userData?.isAdmin === true;
                    } catch (firestoreError) {
                        console.warn('Could not check Firestore admin status:', firestoreError);
                        // Se non riusciamo a leggere da Firestore, facciamo affidamento sui custom claims
                        firestoreAdmin = false;
                    }

                    // Per ora permettiamo accesso se admin in Firestore O custom claims
                    // In produzione dovrebbe essere: adminClaim && firestoreAdmin
                    const isAdminUser = adminClaim || firestoreAdmin;

                    // Log per debug
                    console.log('Admin check:', {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        adminClaim,
                        firestoreAdmin,
                        isAdminUser
                    });

                    setUser(firebaseUser);
                    setIsAdmin(isAdminUser);

                    if (!isAdminUser && window.location.pathname !== '/verify' && window.location.pathname !== '/setup') {
                        console.warn('User is not admin - redirecting to verification');
                        // Per ora reindirizza alla pagina di verifica invece che alla main app
                        window.location.href = '/verify';
                    }
                } else {
                    setUser(null);
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setUser(firebaseUser); // Manteniamo l'utente se autenticato
                setIsAdmin(false); // Ma non concediamo privilegi admin
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        const auth = getAuth();
        await auth.signOut();
        setUser(null);
        setIsAdmin(false);
    };

    return (
        <AdminContext.Provider value={{ user, isAdmin, loading, logout }}>
            {children}
        </AdminContext.Provider>
    );
}
