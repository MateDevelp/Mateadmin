import React from 'react';
import AdminSetup from '../components/AdminSetup';
import AuthDebugPanel from '../components/AuthDebugPanel';
import ChatAccessTest from '../components/ChatAccessTest';
import CustomClaimsSetup from '../components/CustomClaimsSetup';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function AdminSetupPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">🛡️ Mate Admin Panel</h1>
                    <h2 className="text-xl text-gray-600">Setup & Debug</h2>
                    <p className="text-gray-500 mt-2">
                        Configura il tuo utente come amministratore per accedere al pannello di controllo
                    </p>
                </div>

                {/* Setup Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Setup Admin User</h3>
                        <AdminSetup />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Debug Authentication</h3>
                        <AuthDebugPanel />
                    </div>
                </div>

                {/* Custom Claims Setup */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">👑 Custom Claims Setup</h3>
                    <CustomClaimsSetup />
                </div>

                {/* Chat Access Test */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">💬 Chat Access Test</h3>
                    <ChatAccessTest />
                </div>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>📖 Istruzioni Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">1. Primo Setup</h4>
                            <p className="text-gray-600 text-sm">
                                Inserisci le credenziali di un utente esistente nel sistema Firebase Auth.
                                Il tool configurerà automaticamente il ruolo admin nel database Firestore.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">2. Risoluzione Permission Denied</h4>
                            <p className="text-gray-600 text-sm">
                                Se ricevi errori "permission-denied", significa che l'utente non ha i permessi admin.
                                Usa il tool di setup per configurare correttamente i permessi.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium text-gray-900 mb-2">3. Verifica Setup</h4>
                            <p className="text-gray-600 text-sm">
                                Dopo il setup, il debug panel mostrerà lo stato dell'autenticazione e confermerà
                                se l'utente ha accesso come admin.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                            <p className="text-blue-700 text-sm">
                                <strong>💡 Suggerimento:</strong> Dopo il setup, torna alla homepage
                                <a href="/dashboard" className="underline ml-1">(/dashboard)</a> per accedere al pannello admin.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
