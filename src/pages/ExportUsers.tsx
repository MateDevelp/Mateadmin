import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    ArrowLeft,
    Download,
    Filter,
    Users,
    Calendar,
    FileJson,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    blocked?: boolean;
    UserVerificated?: boolean;
    createdAt?: any;
    city?: string;
    dateOfBirth?: string;
    occupation?: string;
    phoneNumber?: string;
}

export default function ExportUsers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtri
    const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
    const [filterBlocked, setFilterBlocked] = useState<'all' | 'blocked' | 'active'>('all');
    const [filterCity, setFilterCity] = useState('');
    const [filterOccupation, setFilterOccupation] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [users, filterVerified, filterBlocked, filterCity, filterOccupation, startDate, endDate]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(usersQuery);
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...users];

        // Verifica filter
        if (filterVerified === 'verified') {
            filtered = filtered.filter(u => u.UserVerificated === true);
        } else if (filterVerified === 'unverified') {
            filtered = filtered.filter(u => !u.UserVerificated);
        }

        // Blocked filter
        if (filterBlocked === 'blocked') {
            filtered = filtered.filter(u => u.blocked === true);
        } else if (filterBlocked === 'active') {
            filtered = filtered.filter(u => !u.blocked);
        }

        // City filter
        if (filterCity) {
            filtered = filtered.filter(u =>
                u.city?.toLowerCase().includes(filterCity.toLowerCase())
            );
        }

        // Occupation filter
        if (filterOccupation) {
            filtered = filtered.filter(u =>
                u.occupation?.toLowerCase().includes(filterOccupation.toLowerCase())
            );
        }

        // Date filters
        if (startDate || endDate) {
            filtered = filtered.filter(u => {
                if (!u.createdAt) return false;
                const userDate = new Date(u.createdAt.seconds * 1000);

                if (startDate && userDate < new Date(startDate)) return false;
                if (endDate && userDate > new Date(endDate)) return false;

                return true;
            });
        }

        setFilteredUsers(filtered);
    };

    const exportToCSV = () => {
        const headers = [
            'ID',
            'Email',
            'Nome',
            'Cognome',
            'Città',
            'Occupazione',
            'Telefono',
            'Data Nascita',
            'Verificato',
            'Bloccato',
            'Data Registrazione'
        ];

        const rows = filteredUsers.map(user => [
            user.id,
            user.email,
            user.firstName || '',
            user.lastName || '',
            user.city || '',
            user.occupation || '',
            user.phoneNumber || '',
            user.dateOfBirth || '',
            user.UserVerificated ? 'Sì' : 'No',
            user.blocked ? 'Sì' : 'No',
            user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('it-IT') : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        downloadFile(csvContent, 'utenti_export.csv', 'text/csv');
    };

    const exportToJSON = () => {
        const data = filteredUsers.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            city: user.city,
            occupation: user.occupation,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            verified: user.UserVerificated,
            blocked: user.blocked,
            createdAt: user.createdAt ? new Date(user.createdAt.seconds * 1000).toISOString() : null
        }));

        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, 'utenti_export.json', 'application/json');
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const resetFilters = () => {
        setFilterVerified('all');
        setFilterBlocked('all');
        setFilterCity('');
        setFilterOccupation('');
        setStartDate('');
        setEndDate('');
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/export')}
                            className="mb-2"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Torna alle opzioni di export
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-8 h-8" />
                            Esportazione Utenti
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {filteredUsers.length} utenti corrispondono ai filtri selezionati
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={exportToCSV}
                            disabled={filteredUsers.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Esporta CSV
                        </Button>
                        <Button
                            onClick={exportToJSON}
                            disabled={filteredUsers.length === 0}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <FileJson className="w-4 h-4 mr-2" />
                            Esporta JSON
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filtri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Verified Filter */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Stato Verifica</label>
                                <select
                                    value={filterVerified}
                                    onChange={(e) => setFilterVerified(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tutti</option>
                                    <option value="verified">Solo verificati</option>
                                    <option value="unverified">Non verificati</option>
                                </select>
                            </div>

                            {/* Blocked Filter */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Stato Account</label>
                                <select
                                    value={filterBlocked}
                                    onChange={(e) => setFilterBlocked(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tutti</option>
                                    <option value="active">Solo attivi</option>
                                    <option value="blocked">Solo bloccati</option>
                                </select>
                            </div>

                            {/* City Filter */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Città</label>
                                <Input
                                    placeholder="Filtra per città..."
                                    value={filterCity}
                                    onChange={(e) => setFilterCity(e.target.value)}
                                />
                            </div>

                            {/* Occupation Filter */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Occupazione</label>
                                <Input
                                    placeholder="Filtra per occupazione..."
                                    value={filterOccupation}
                                    onChange={(e) => setFilterOccupation(e.target.value)}
                                />
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Data inizio (registrazione)</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Data fine (registrazione)</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button variant="outline" onClick={resetFilters}>
                            Resetta filtri
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Anteprima Dati ({filteredUsers.length} utenti)</span>
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nessun utente corrisponde ai filtri selezionati
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b">
                                        <tr className="text-left">
                                            <th className="pb-2 font-medium">Email</th>
                                            <th className="pb-2 font-medium">Nome</th>
                                            <th className="pb-2 font-medium">Città</th>
                                            <th className="pb-2 font-medium">Stato</th>
                                            <th className="pb-2 font-medium">Registrato</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.slice(0, 10).map(user => (
                                            <tr key={user.id} className="border-b">
                                                <td className="py-3">{user.email}</td>
                                                <td className="py-3">
                                                    {user.firstName} {user.lastName}
                                                </td>
                                                <td className="py-3">{user.city || '-'}</td>
                                                <td className="py-3">
                                                    <div className="flex gap-1">
                                                        {user.UserVerificated && (
                                                            <Badge className="bg-green-100 text-green-800 text-xs">
                                                                Verificato
                                                            </Badge>
                                                        )}
                                                        {user.blocked && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Bloccato
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {user.createdAt
                                                        ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('it-IT')
                                                        : '-'
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length > 10 && (
                                    <p className="text-sm text-gray-500 mt-4">
                                        ...e altri {filteredUsers.length - 10} utenti
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
