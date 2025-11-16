import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import AuthDebugPanel from '../components/AuthDebugPanel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalHouses: number;
    pendingVerifications: number;
    activeReports: number;
    todaySignups: number;
}

function StatCard({ title, value, icon, trend }: {
    title: string;
    value: number;
    icon: string;
    trend?: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                    {title}
                </CardTitle>
                <span className="text-2xl">{icon}</span>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
                {trend && (
                    <p className="text-xs text-muted-foreground mt-1">{trend}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        activeUsers: 0,
        totalHouses: 0,
        pendingVerifications: 0,
        activeReports: 0,
        todaySignups: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadStats() {
            try {
                console.log('Loading dashboard stats...');

                // Inizializziamo con valori di test per ora
                // In produzione queste query funzioneranno con i dati reali

                const mockStats: Stats = {
                    totalUsers: 0, // Sarà caricato da Firestore
                    activeUsers: 0,
                    totalHouses: 0,
                    pendingVerifications: 0,
                    activeReports: 0,
                    todaySignups: 0
                };

                try {
                    // Total users
                    const usersSnap = await getDocs(collection(db, 'users'));
                    mockStats.totalUsers = usersSnap.size;
                    console.log('Total users:', mockStats.totalUsers);
                } catch (err) {
                    console.log('Users collection not found or empty');
                }

                try {
                    // Active users (last 7 days)
                    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                    const activeSnap = await getDocs(
                        query(
                            collection(db, 'users'),
                            where('lastAccessAt', '>=', sevenDaysAgo)
                        )
                    );
                    mockStats.activeUsers = activeSnap.size;
                } catch (err) {
                    console.log('Active users query failed, using mock data');
                }

                try {
                    // Total houses
                    const housesSnap = await getDocs(collection(db, 'houses'));
                    mockStats.totalHouses = housesSnap.size;
                } catch (err) {
                    console.log('Houses collection not found or empty');
                }

                try {
                    // Pending verifications
                    const verificationsSnap = await getDocs(
                        query(
                            collection(db, 'verifications'),
                            where('status', '==', 'pending')
                        )
                    );
                    mockStats.pendingVerifications = verificationsSnap.size;
                } catch (err) {
                    console.log('Verifications collection not found or empty');
                }

                try {
                    // Active reports
                    const reportsSnap = await getDocs(
                        query(
                            collection(db, 'reports'),
                            where('status', '==', 'pending')
                        )
                    );
                    mockStats.activeReports = reportsSnap.size;
                } catch (err) {
                    console.log('Reports collection not found or empty');
                }

                try {
                    // Today's signups
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);

                    const todaySignupsSnap = await getDocs(
                        query(
                            collection(db, 'users'),
                            where('createdAt', '>=', todayStart.getTime())
                        )
                    );
                    mockStats.todaySignups = todaySignupsSnap.size;
                } catch (err) {
                    console.log('Today signups query failed, using mock data');
                }

                setStats(mockStats);
            } catch (err) {
                console.error('Error loading stats:', err);
                setError('Errore nel caricamento delle statistiche');
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                    <p className="mt-2 text-gray-600">
                        Panoramica delle metriche principali della piattaforma Mate
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard
                        title="Utenti Totali"
                        value={stats.totalUsers}
                        icon="👥"
                        trend={`${stats.todaySignups} nuovi oggi`}
                    />
                    <StatCard
                        title="Utenti Attivi (7gg)"
                        value={stats.activeUsers}
                        icon="✅"
                    />
                    <StatCard
                        title="Case Totali"
                        value={stats.totalHouses}
                        icon="🏠"
                    />
                    <StatCard
                        title="Verifiche Pending"
                        value={stats.pendingVerifications}
                        icon="⏳"
                    />
                    <StatCard
                        title="Segnalazioni Attive"
                        value={stats.activeReports}
                        icon="⚠️"
                    />
                    <StatCard
                        title="Registrazioni Oggi"
                        value={stats.todaySignups}
                        icon="📈"
                    />
                </div>

                {/* Sezione di benvenuto */}
                <Card>
                    <CardHeader>
                        <CardTitle>🚀 Benvenuto nel Pannello Admin di Mate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className="text-gray-600">
                                Questo è il pannello di amministrazione per gestire la piattaforma Mate.
                                Da qui puoi monitorare gli utenti, approvare le case, gestire le segnalazioni e molto altro.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-900">Azioni Rapide</h3>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Gestisci utenti e verifiche</li>
                                        <li>• Approva nuove proprietà</li>
                                        <li>• Risolvi segnalazioni</li>
                                        <li>• Monitora le metriche</li>
                                    </ul>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="font-semibold text-gray-900">Stato Sistema</h3>
                                    <div className="flex items-center gap-2 text-sm">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-600">Tutti i servizi operativi</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Debug Auth Panel - Rimuovere in produzione */}
                <AuthDebugPanel />
            </div>
        </AdminLayout>
    );
}
