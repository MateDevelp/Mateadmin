import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
    ArrowLeft,
    Building,
    Calendar,
    CheckCircle,
    XCircle,
    User,
    MapPin,
    Euro,
    Bed,
    Bath,
    Ruler,
    Wifi,
    PawPrint,
    Cigarette
} from 'lucide-react';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import { useAdmin } from '../AdminContext';
import HousePhotos from '../components/detail/HousePhotos';
import HouseRooms from '../components/detail/HouseRooms';
import HouseAmenities from '../components/detail/HouseAmenities';
import AddressCard from '../components/detail/AddressCard';
import {
    formatHouseType,
    formatSize,
    formatFloor,
    formatExpenses,
    getHouseStatusBadges,
    formatPriceRange,
    getRoomsCount,
    getTotalBedsCount,
    formatAddress,
    formatRoomsString // <--- aggiunto
} from '../utils/houseHelpers';

interface HouseDetail {
    id: string;
    title: string;
    description?: string;
    address?: any;
    type?: string;
    houseType?: string;
    size?: string | number;
    floor?: string | number;
    bathroom?: string | number;
    rent?: string | number;
    expenses?: string | number;
    rooms?: any;
    ownerId?: string;
    owners?: string[];
    verified?: boolean;
    active?: boolean;
    createdAt?: any;
    updatedAt?: any;
    photos?: string[];
    amenities?: any;
    notes?: string;
    generalNotes?: string;
    authorizedToPublish?: boolean;
}

interface OwnerInfo {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

export default function HouseDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentAdmin } = useAdmin();
    const [house, setHouse] = useState<HouseDetail | null>(null);
    const [owner, setOwner] = useState<OwnerInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadHouseDetail();
        }
    }, [id]);

    const loadHouseDetail = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const houseDoc = await getDoc(doc(db, 'houses', id));
            if (houseDoc.exists()) {
                const houseData = {
                    id: houseDoc.id,
                    ...houseDoc.data()
                } as HouseDetail;
                setHouse(houseData);

                // Load owner info
                if (houseData.ownerId) {
                    const ownerDoc = await getDoc(doc(db, 'users', houseData.ownerId));
                    if (ownerDoc.exists()) {
                        setOwner({
                            id: ownerDoc.id,
                            ...ownerDoc.data()
                        } as OwnerInfo);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading house:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVerification = async () => {
        if (!house) return;

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

            setHouse({ ...house, verified: newVerified });
        } catch (error) {
            console.error('Error toggling verification:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleActive = async () => {
        if (!house) return;

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

            setHouse({ ...house, active: newActive });
        } catch (error) {
            console.error('Error toggling active status:', error);
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
                        <p className="text-gray-600">Caricamento casa...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!house) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Casa non trovata</p>
                    <Button onClick={() => navigate('/houses')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Torna alle case
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/houses')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Torna alle case
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={toggleVerification}
                            disabled={actionLoading}
                        >
                            {house.verified ? (
                                <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rimuovi verifica
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verifica casa
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={toggleActive}
                            disabled={actionLoading}
                            className={house.active !== false ? 'border-red-500 text-red-700' : 'border-green-500 text-green-700'}
                        >
                            {house.active !== false ? 'Disattiva' : 'Attiva'}
                        </Button>
                    </div>
                </div>

                {/* Images Gallery */}
                <HousePhotos photos={house.photos} title={house.title} />

                {/* Address Card */}
                <AddressCard address={house.address} />

                {/* Main Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-2xl mb-2">{house.title}</CardTitle>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    <span>{formatAddress(house.address)}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {getHouseStatusBadges(house).map((badge, idx) => (
                                    <Badge
                                        key={idx}
                                        className={badge.variant === 'success' ? 'bg-green-100 text-green-800' :
                                            badge.variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800'}
                                    >
                                        {badge.label}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Description */}
                        {house.description && (
                            <div>
                                <h3 className="font-semibold mb-2">Descrizione</h3>
                                <p className="text-gray-700 whitespace-pre-line">{house.description}</p>
                            </div>
                        )}

                        {/* House Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
                            {house.houseType && (
                                <div>
                                    <p className="text-sm text-gray-600">Tipo</p>
                                    <p className="font-medium">{formatHouseType(house.houseType)}</p>
                                </div>
                            )}
                            {house.size && (
                                <div>
                                    <p className="text-sm text-gray-600">Superficie</p>
                                    <p className="font-medium">{formatSize(house.size)}</p>
                                </div>
                            )}
                            {house.floor !== undefined && (
                                <div>
                                    <p className="text-sm text-gray-600">Piano</p>
                                    <p className="font-medium">{formatFloor(house.floor)}</p>
                                </div>
                            )}
                            {house.bathroom && (
                                <div>
                                    <p className="text-sm text-gray-600">Bagni</p>
                                    <p className="font-medium">{house.bathroom}</p>
                                </div>
                            )}
                            {house.expenses !== undefined && (
                                <div>
                                    <p className="text-sm text-gray-600">Spese</p>
                                    <p className="font-medium">{formatExpenses(house.expenses)}</p>
                                </div>
                            )}
                        </div>

                        {/* Price Range */}
                        {house.rooms && house.rooms.length > 0 && (
                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-600">Fascia di prezzo</p>
                                <p className="font-semibold text-lg text-blue-600">{formatPriceRange(house.rooms)}</p>
                            </div>
                        )}

                        {/* Rooms */}
                        {house.rooms && (
                            <div className="border-t pt-4">
                                <p className="text-sm text-gray-600">Stanze</p>
                                <p className="font-medium">{formatRoomsString(house.rooms)}</p>
                            </div>
                        )}

                        {/* Created Date */}
                        {house.createdAt && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 border-t pt-4">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    Creata il {new Date(house.createdAt.seconds * 1000).toLocaleDateString('it-IT')}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rooms & Beds */}
                <HouseRooms rooms={house.rooms} />

                {/* Amenities */}
                <HouseAmenities amenities={house.amenities} />

                {/* Owner Info */}
                {owner && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Proprietario
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div
                                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                onClick={() => navigate(`/users/${owner.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {owner.firstName} {owner.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600">{owner.email}</p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost">
                                    Visualizza profilo →
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
