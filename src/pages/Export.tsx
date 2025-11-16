import React from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Users, Building, Database, Download } from 'lucide-react';

export default function Export() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-8 h-8" />
                        Esportazione Massiva Dati
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Seleziona il tipo di dati da esportare e applica filtri avanzati
                    </p>
                </div>

                {/* Export Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Users Export */}
                    <Link to="/export/users">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-blue-500">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Users className="w-12 h-12 text-blue-600" />
                                    <Download className="w-6 h-6 text-gray-400" />
                                </div>
                                <CardTitle className="text-xl mt-4">Esporta Utenti</CardTitle>
                                <CardDescription>
                                    Esporta dati utenti con filtri avanzati: stato verifica,
                                    data registrazione, città, occupazione, e altro
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        Filtra per data registrazione
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        Stato verifica e blocco
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        Città, occupazione, età
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        Export CSV o JSON
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Houses Export */}
                    <Link to="/export/houses">
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-green-500">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <Building className="w-12 h-12 text-green-600" />
                                    <Download className="w-6 h-6 text-gray-400" />
                                </div>
                                <CardTitle className="text-xl mt-4">Esporta Case</CardTitle>
                                <CardDescription>
                                    Esporta dati case con filtri: prezzo, città, numero stanze,
                                    stato verifica, data pubblicazione
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        Filtra per range di prezzo
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        Città e numero stanze
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        Stato verifica e attivo
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        Export CSV o JSON
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Info Card */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-lg">💡</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-1">
                                    Come funziona l'esportazione
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• Seleziona il tipo di dati da esportare (Utenti o Case)</li>
                                    <li>• Applica filtri personalizzati per raffinare i risultati</li>
                                    <li>• Visualizza l'anteprima dei dati filtrati</li>
                                    <li>• Scegli il formato di esportazione (CSV o JSON)</li>
                                    <li>• Scarica il file generato</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
