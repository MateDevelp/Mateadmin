import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, User, Key } from 'lucide-react';

export default function AdminSetup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const setupAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return;

        setLoading(true);
        setMessage('');
        setSuccess(false);

        try {
            // 1. Login with provided credentials
            setMessage('Autenticazione in corso...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Check existing document
            setMessage('Verifica documento utente...');
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            let existingData: any = {};
            if (userDoc.exists()) {
                existingData = userDoc.data();
                setMessage('Documento utente trovato, aggiornamento...');
            } else {
                setMessage('Creazione nuovo documento utente...');
            }

            // 3. Set admin role
            await setDoc(userDocRef, {
                ...existingData,
                email: user.email,
                role: 'admin',
                isAdmin: true,
                firstName: existingData.firstName || 'Admin',
                lastName: existingData.lastName || 'User',
                createdAt: existingData.createdAt || new Date(),
                updatedAt: new Date(),
                setupAt: new Date()
            }, { merge: true });

            // 4. Verify setup
            const updatedDoc = await getDoc(userDocRef);
            const finalData = updatedDoc.data();

            setSuccess(true);
            setMessage(`✅ Admin configurato con successo!\n\nUID: ${user.uid}\nEmail: ${user.email}\nRole: ${finalData?.role}\nAdmin: ${finalData?.isAdmin}\n\nPuoi ora accedere al pannello admin.`);

            // Clear form
            setEmail('');
            setPassword('');

        } catch (error: any) {
            setSuccess(false);
            console.error('Setup admin error:', error);

            if (error.code === 'auth/user-not-found') {
                setMessage('❌ Utente non trovato. Verifica l\'email.');
            } else if (error.code === 'auth/wrong-password') {
                setMessage('❌ Password non corretta.');
            } else if (error.code === 'auth/invalid-email') {
                setMessage('❌ Email non valida.');
            } else if (error.code === 'auth/too-many-requests') {
                setMessage('❌ Troppi tentativi falliti. Riprova più tardi.');
            } else if (error.code === 'permission-denied') {
                setMessage('❌ Permessi insufficienti per modificare il documento utente. Controlla le regole Firestore.');
            } else {
                setMessage(`❌ Errore: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Setup Admin User
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={setupAdmin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Admin
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@mateapp.it"
                                required
                                disabled={loading}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !email || !password}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Configurazione...
                            </>
                        ) : (
                            'Configura Admin'
                        )}
                    </Button>
                </form>

                {message && (
                    <Alert className={`mt-4 ${success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        {success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription className={`whitespace-pre-line ${success ? 'text-green-700' : 'text-red-700'}`}>
                            {message}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    <p className="text-blue-700">
                        <strong>💡 Nota:</strong> Questo tool configura il ruolo admin nel documento Firestore dell'utente.
                        Assicurati che l'utente esista già nel sistema Firebase Auth.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
