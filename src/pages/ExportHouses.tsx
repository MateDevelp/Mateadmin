import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    ArrowLeft,
    Building,
    Filter,
    FileJson,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';

interface House {
    id: string;
    title: string;
    address?: string;
    city?: string;
    price?: number;
    rooms?: number;
    bathrooms?: number;
    size?: number;
    verified?: boolean;
    active?: boolean;
    createdAt?: any;
    ownerId?: string;
}

export default function ExportHouses() {
    const navigate = useNavigate();
    const [houses, setHouses] = useState<House[]>([]);
    const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(false);

    // Filtri
    const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [filterCity, setFilterCity] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [minRooms, setMinRooms] = useState('');
    const [maxRooms, setMaxRooms] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        loadHouses();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [houses, filterVerified, filterActive, filterCity, minPrice, maxPrice, minRooms, maxRooms, startDate, endDate]);

    const loadHouses = async () => {
        setLoading(true);
        try {
            const housesQuery = query(collection(db, 'houses'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(housesQuery);
            const housesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as House[];
            setHouses(housesData);
        } catch (error) {
            console.error('Error loading houses:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...houses];

        // Verifica filter
        if (filterVerified === 'verified') {
            filtered = filtered.filter(h => h.verified === true);
        } else if (filterVerified === 'unverified') {
            filtered = filtered.filter(h => !h.verified);
        }

        // Active filter
        if (filterActive === 'active') {
            filtered = filtered.filter(h => h.active !== false);
        } else if (filterActive === 'inactive') {
            filtered = filtered.filter(h => h.active === false);
        }

        // City filter
        if (filterCity) {
            filtered = filtered.filter(h =>
                h.city?.toLowerCase().includes(filterCity.toLowerCase())
            );
        }

        // Price filter
        if (minPrice) {
            filtered = filtered.filter(h => h.price && h.price >= parseInt(minPrice));
        }
        if (maxPrice) {
            filtered = filtered.filter(h => h.price && h.price <= parseInt(maxPrice));
        }

        // Rooms filter
        if (minRooms) {
            filtered = filtered.filter(h => h.rooms && h.rooms >= parseInt(minRooms));
        }
        if (maxRooms) {
            filtered = filtered.filter(h => h.rooms && h.rooms <= parseInt(maxRooms));
        }

        // Date filters
        if (startDate || endDate) {
            filtered = filtered.filter(h => {
                if (!h.createdAt) return false;
                const houseDate = new Date(h.createdAt.seconds * 1000);

                if (startDate && houseDate < new Date(startDate)) return false;
                if (endDate && houseDate > new Date(endDate)) return false;

                return true;
            });
        }

        setFilteredHouses(filtered);
    };

    const exportToCSV = () => {
        const headers = [
            'ID',
            'Titolo',
            'Indirizzo',
            'Città',
            'Prezzo',
            'Stanze',
            'Bagni',
            'Superficie (m²)',
            'Verificata',
            'Attiva',
            'Data Pubblicazione'
        ];

        const rows = filteredHouses.map(house => [
            house.id,
            house.title || '',
            house.address || '',
            house.city || '',
            house.price || '',
            house.rooms || '',
            house.bathrooms || '',
            house.size || '',
            house.verified ? 'Sì' : 'No',
            house.active !== false ? 'Sì' : 'No',
            house.createdAt ? new Date(house.createdAt.seconds * 1000).toLocaleDateString('it-IT') : ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        downloadFile(csvContent, 'case_export.csv', 'text/csv');
    };

    const exportToJSON = () => {
        const data = filteredHouses.map(house => ({
            id: house.id,
            title: house.title,
            address: house.address,
            city: house.city,
            price: house.price,
            rooms: house.rooms,
            bathrooms: house.bathrooms,
            size: house.size,
            verified: house.verified,
            active: house.active,
            ownerId: house.ownerId,
            createdAt: house.createdAt ? new Date(house.createdAt.seconds * 1000).toISOString() : null
        }));

        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, 'case_export.json', 'application/json');
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
        setFilterActive('all');
        setFilterCity('');
        setMinPrice('');
        setMaxPrice('');
        setMinRooms('');
        setMaxRooms('');
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
                            <Building className="w-8 h-8" />
                            Esportazione Case
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {filteredHouses.length} case corrispondono ai filtri selezionati
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={exportToCSV}
                            disabled={filteredHouses.length === 0}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Esporta CSV
                        </Button>
                        <Button
                            onClick={exportToJSON}
                            disabled={filteredHouses.length === 0}
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
                                    <option value="all">Tutte</option>
                                    <option value="verified">Solo verificate</option>
                                    <option value="unverified">Non verificate</option>
                                </select>
                            </div>

                            {/* Active Filter */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Stato Casa</label>
                                <select
                                    value={filterActive}
                                    onChange={(e) => setFilterActive(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">Tutte</option>
                                    <option value="active">Solo attive</option>
                                    <option value="inactive">Non attive</option>
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

                            {/* Min Price */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Prezzo minimo (€)</label>
                                <Input
                                    type="number"
                                    placeholder="es. 300"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                />
                            </div>

                            {/* Max Price */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Prezzo massimo (€)</label>
                                <Input
                                    type="number"
                                    placeholder="es. 1000"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                />
                            </div>

                            {/* Min Rooms */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Stanze minime</label>
                                <Input
                                    type="number"
                                    placeholder="es. 1"
                                    value={minRooms}
                                    onChange={(e) => setMinRooms(e.target.value)}
                                />
                            </div>

                            {/* Max Rooms */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Stanze massime</label>
                                <Input
                                    type="number"
                                    placeholder="es. 5"
                                    value={maxRooms}
                                    onChange={(e) => setMaxRooms(e.target.value)}
                                />
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Data inizio (pubblicazione)</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="text-sm font-medium mb-2 block">Data fine (pubblicazione)</label>
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
                            <span>Anteprima Dati ({filteredHouses.length} case)</span>
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredHouses.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nessuna casa corrisponde ai filtri selezionati
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b">
                                        <tr className="text-left">
                                            <th className="pb-2 font-medium">Titolo</th>
                                            <th className="pb-2 font-medium">Città</th>
                                            <th className="pb-2 font-medium">Prezzo</th>
                                            <th className="pb-2 font-medium">Stanze</th>
                                            <th className="pb-2 font-medium">Stato</th>
                                            <th className="pb-2 font-medium">Pubblicata</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHouses.slice(0, 10).map(house => (
                                            <tr key={house.id} className="border-b">
                                                <td className="py-3">{house.title}</td>
                                                <td className="py-3">{house.city || '-'}</td>
                                                <td className="py-3">
                                                    {house.price ? `€${house.price}/mese` : '-'}
                                                </td>
                                                <td className="py-3">{house.rooms || '-'}</td>
                                                <td className="py-3">
                                                    <div className="flex gap-1">
                                                        {house.verified && (
                                                            <Badge className="bg-green-100 text-green-800 text-xs">
                                                                Verificata
                                                            </Badge>
                                                        )}
                                                        {house.active !== false ? (
                                                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                                Attiva
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs">
                                                                Non attiva
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3">
                                                    {house.createdAt
                                                        ? new Date(house.createdAt.seconds * 1000).toLocaleDateString('it-IT')
                                                        : '-'
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredHouses.length > 10 && (
                                    <p className="text-sm text-gray-500 mt-4">
                                        ...e altre {filteredHouses.length - 10} case
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
