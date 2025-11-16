import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    Building,
    Search,
    MapPin,
    Euro,
    Users,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    Calendar,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import { useAdmin } from '../AdminContext';

interface House {
    id: string;
    title: string;
    address?: string | {
        street?: string;
        city?: string;
        fullAddress?: string;
        shortAddress?: string;
        houseNumber?: string;
    };
    city?: string;
    price?: number;
    rooms?: number | Array<{ name: string; beds: number }>;
    ownerId?: string;
    owners?: string[];
    verified?: boolean;
    active?: boolean;
    createdAt?: any;
    images?: string[];
    description?: string;
}

export default function Houses() {
    const navigate = useNavigate();
    const { user: currentAdmin } = useAdmin();
    const [houses, setHouses] = useState<House[]>([]);
    const [filteredHouses, setFilteredHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
    const [houseToDelete, setHouseToDelete] = useState<House | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Helper per ottenere l'indirizzo come stringa
    const getAddressString = (address: House['address']): string => {
        if (!address) return '';
        if (typeof address === 'string') return address;
        // Se è un oggetto, scegli il campo più completo disponibile
        if (typeof address === 'object') {
            return (
                address.fullAddress ||
                address.shortAddress ||
                [address.street, address.houseNumber, address.city].filter(Boolean).join(' ') ||
                address.street ||
                address.city ||
                ''
            );
        }
        return '';
    };

    // Helper per ottenere il numero di stanze o una stringa descrittiva
    const getRoomsString = (rooms: House['rooms']): string => {
        if (!rooms) return '';
        if (typeof rooms === 'number') return `${rooms} stanze`;
        if (Array.isArray(rooms)) {
            // Es: "3 stanze (Camera: 2 letti, Studio: 1 letto)"
            const details = rooms.map(r => {
                if (typeof r === 'object' && r.name && r.beds !== undefined) {
                    return `${r.name}: ${r.beds} letti`;
                }
                return '';
            }).filter(Boolean).join(', ');
            return `${rooms.length} stanze${details ? ' (' + details + ')' : ''}`;
        }
        return '';
    };

    useEffect(() => {
        loadHouses();
    }, []);

    useEffect(() => {
        filterHouses();
    }, [houses, searchTerm, filterVerified, filterActive]);

    const loadHouses = async () => {
        setLoading(true);
        try {
            const housesQuery = query(
                collection(db, 'houses'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );
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

    const filterHouses = () => {
        let filtered = [...houses];

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(house => {
                const title = house.title?.toLowerCase() || '';
                const address = getAddressString(house.address).toLowerCase();
                const city = house.city?.toLowerCase() || '';
                return title.includes(searchLower) ||
                    address.includes(searchLower) ||
                    city.includes(searchLower);
            });
        }

        // Verified filter
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

        setFilteredHouses(filtered);
    };

    const toggleVerification = async (house: House) => {
        setActionLoading(true);
        try {
            const newVerified = !house.verified;
            await updateDoc(doc(db, 'houses', house.id), {
                verified: newVerified,
                verifiedAt: new Date()
            });

            await logAdminAction(
                newVerified ? AdminActions.HOUSE_VERIFIED : AdminActions.HOUSE_UNVERIFIED,
                {
                    adminUid: currentAdmin?.uid,
                    targetId: house.id,
                    targetType: 'house',
                    metadata: { title: house.title }
                }
            );

            setHouses(prev => prev.map(h =>
                h.id === house.id ? { ...h, verified: newVerified } : h
            ));
        } catch (error) {
            console.error('Error toggling verification:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleActive = async (house: House) => {
        setActionLoading(true);
        try {
            const newActive = !house.active;
            await updateDoc(doc(db, 'houses', house.id), {
                active: newActive
            });

            await logAdminAction(
                newActive ? AdminActions.HOUSE_ACTIVATED : AdminActions.HOUSE_DEACTIVATED,
                {
                    adminUid: currentAdmin?.uid,
                    targetId: house.id,
                    targetType: 'house',
                    metadata: { title: house.title }
                }
            );

            setHouses(prev => prev.map(h =>
                h.id === house.id ? { ...h, active: newActive } : h
            ));
        } catch (error) {
            console.error('Error toggling active status:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const deleteHouse = async () => {
        if (!houseToDelete) return;

        setActionLoading(true);
        try {
            await deleteDoc(doc(db, 'houses', houseToDelete.id));

            await logAdminAction(AdminActions.HOUSE_DELETED, {
                adminUid: currentAdmin?.uid,
                targetId: houseToDelete.id,
                targetType: 'house',
                metadata: { title: houseToDelete.title }
            });

            setHouses(prev => prev.filter(h => h.id !== houseToDelete.id));
            setHouseToDelete(null);
        } catch (error) {
            console.error('Error deleting house:', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Caricamento case...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Building className="w-8 h-8" />
                            Gestione Case
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {houses.length} case totali • {filteredHouses.length} visualizzate
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Cerca per titolo, indirizzo, città..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            {/* Verified Filter */}
                            <select
                                value={filterVerified}
                                onChange={(e) => setFilterVerified(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tutte le verifiche</option>
                                <option value="verified">Solo verificate</option>
                                <option value="unverified">Non verificate</option>
                            </select>

                            {/* Active Filter */}
                            <select
                                value={filterActive}
                                onChange={(e) => setFilterActive(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tutti gli stati</option>
                                <option value="active">Solo attive</option>
                                <option value="inactive">Non attive</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Houses List */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredHouses.map(house => (
                        <Card key={house.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    {/* House Image */}
                                    <div className="w-full lg:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                        {house.images && house.images.length > 0 ? (
                                            <img
                                                src={house.images[0]}
                                                alt={house.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Building className="w-12 h-12 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* House Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-semibold text-gray-900">
                                                    {house.title || 'Titolo non disponibile'}
                                                </h3>
                                                <div className="flex items-center gap-2 text-gray-600 mt-1">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-sm">
                                                        {getAddressString(house.address) || 'Indirizzo non disponibile'}
                                                        {house.city && `, ${house.city}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {house.verified ? (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Verificata
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                                                        <XCircle className="w-3 h-3 mr-1" />
                                                        Non verificata
                                                    </Badge>
                                                )}
                                                {house.active !== false ? (
                                                    <Badge className="bg-blue-100 text-blue-800">
                                                        Attiva
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-600">
                                                        Non attiva
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                            {house.price && (
                                                <div className="flex items-center gap-1">
                                                    <Euro className="w-4 h-4" />
                                                    <span className="font-medium">{house.price}€/mese</span>
                                                </div>
                                            )}
                                            {house.rooms && (
                                                <div className="flex items-center gap-1">
                                                    <Users className="w-4 h-4" />
                                                    <span>{getRoomsString(house.rooms)}</span>
                                                </div>
                                            )}
                                            {house.createdAt && (
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {new Date(house.createdAt.seconds * 1000).toLocaleDateString('it-IT')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {house.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {house.description}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/houses/${house.id}`)}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                Visualizza profilo
                                                <ArrowRight className="w-4 h-4 ml-1" />
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleVerification(house)}
                                                disabled={actionLoading}
                                            >
                                                {house.verified ? (
                                                    <>
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Rimuovi verifica
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Verifica
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleActive(house)}
                                                disabled={actionLoading}
                                            >
                                                {house.active !== false ? 'Disattiva' : 'Attiva'}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setHouseToDelete(house)}
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                disabled={actionLoading}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Elimina
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredHouses.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">Nessuna casa trovata</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!houseToDelete} onOpenChange={() => setHouseToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sei sicuro di voler eliminare la casa "{houseToDelete?.title}"?
                            Questa azione non può essere annullata.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteHouse}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? 'Eliminazione...' : 'Elimina'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
