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
    User,
    Mail,
    Calendar,
    Shield,
    Ban,
    CheckCircle,
    XCircle,
    Home,
    MapPin,
    Phone,
    Briefcase,
    Building
} from 'lucide-react';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import { useAdmin } from '../AdminContext';
import UserGallery from '../components/detail/UserGallery';
import UserTraits from '../components/detail/UserTraits';
import UserPreferences from '../components/detail/UserPreferences';
import {
    formatTimestamp,
    getAge,
    formatBirthCity,
    formatDestinationCity,
    getProfileCompletionPercentage,
    getUserStatusBadges,
    formatGender
} from '../utils/userHelpers';
import { formatAddress } from '../utils/houseHelpers';

interface UserDetail {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    blocked?: boolean;
    UserVerificated?: boolean;
    role?: string;
    isAdmin?: boolean;
    createdAt?: any;
    dateOfBirth?: any;
    phoneNumber?: string;
    bio?: string;
    occupation?: string;
    city?: string;
    profileImageUrl?: string;
    photos?: string[];
    gender?: string;
    birthCity?: any;
    destinationCity?: any;
    traits?: any;
    preferences?: any;
    about?: string;
}

interface House {
    id: string;
    title: string;
    city?: string;
    address?: any;
}

export default function UserDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentAdmin } = useAdmin();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [userHouses, setUserHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            loadUserDetail();
            loadUserHouses();
        }
    }, [id]);

    const loadUserDetail = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const userDoc = await getDoc(doc(db, 'users', id));
            if (userDoc.exists()) {
                setUser({
                    id: userDoc.id,
                    ...userDoc.data()
                } as UserDetail);
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUserHouses = async () => {
        if (!id) return;

        try {
            // Case dove è owner
            const housesQuery = query(
                collection(db, 'houses'),
                where('ownerId', '==', id)
            );
            const snapshot = await getDocs(housesQuery);
            const houses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as House[];
            setUserHouses(houses);
        } catch (error) {
            console.error('Error loading user houses:', error);
        }
    };

    const toggleBlock = async () => {
        if (!user) return;

        setActionLoading(true);
        try {
            const newBlocked = !user.blocked;
            await updateDoc(doc(db, 'users', user.id), {
                blocked: newBlocked,
                blockReason: newBlocked ? 'Bloccato da admin' : null,
                blockedAt: newBlocked ? new Date() : null
            });

            await logAdminAction(
                newBlocked ? AdminActions.USER_BLOCKED : AdminActions.USER_UNBLOCKED,
                {
                    adminUid: currentAdmin?.uid,
                    targetUid: user.id,
                    targetType: 'user',
                    reason: newBlocked ? 'Bloccato da admin' : 'Sbloccato da admin'
                }
            );

            setUser({ ...user, blocked: newBlocked });
        } catch (error) {
            console.error('Error toggling block:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleVerification = async () => {
        if (!user) return;

        setActionLoading(true);
        try {
            const newVerified = !user.UserVerificated;
            await updateDoc(doc(db, 'users', user.id), {
                UserVerificated: newVerified,
                verifiedAt: newVerified ? new Date() : null
            });

            await logAdminAction(AdminActions.USER_VERIFIED, {
                adminUid: currentAdmin?.uid,
                targetUid: user.id,
                targetType: 'user'
            });

            setUser({ ...user, UserVerificated: newVerified });
        } catch (error) {
            console.error('Error toggling verification:', error);
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
                        <p className="text-gray-600">Caricamento utente...</p>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    if (!user) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">Utente non trovato</p>
                    <Button onClick={() => navigate('/users')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Torna agli utenti
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
                        onClick={() => navigate('/users')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Torna agli utenti
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={toggleVerification}
                            disabled={actionLoading}
                        >
                            {user.UserVerificated ? (
                                <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Rimuovi verifica
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verifica utente
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={toggleBlock}
                            disabled={actionLoading}
                            className={user.blocked ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}
                        >
                            {user.blocked ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Sblocca
                                </>
                            ) : (
                                <>
                                    <Ban className="w-4 h-4 mr-2" />
                                    Blocca
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* User Gallery */}
                <UserGallery
                    avatar={user.profileImageUrl}
                    photoURL={user.profileImageUrl}
                    gallery={user.photos}
                />

                {/* User Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {user.profileImageUrl ? (
                                    <img
                                        src={user.profileImageUrl}
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User className="w-8 h-8 text-blue-600" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {user.firstName} {user.lastName}
                                    </h2>
                                    <p className="text-sm text-gray-600 font-normal">{user.email}</p>
                                </div>
                            </div>
                            {/* Profile Completion */}
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Profilo completato</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {getProfileCompletionPercentage(user)}%
                                </p>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Status Badges */}
                        <div className="flex flex-wrap gap-2">
                            {getUserStatusBadges(user).map((badge, idx) => (
                                <Badge
                                    key={idx}
                                    className={
                                        badge.variant === 'destructive' ? 'bg-red-100 text-red-800' :
                                            badge.variant === 'success' ? 'bg-green-100 text-green-800' :
                                                badge.variant === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                    }
                                >
                                    {badge.label}
                                </Badge>
                            ))}
                        </div>

                        {/* User Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            {user.email && (
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{user.email}</p>
                                    </div>
                                </div>
                            )}

                            {user.phoneNumber && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Telefono</p>
                                        <p className="font-medium">{user.phoneNumber}</p>
                                    </div>
                                </div>
                            )}

                            {user.dateOfBirth && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Data di nascita</p>
                                        <p className="font-medium">
                                            {formatTimestamp(user.dateOfBirth)}
                                            {user.dateOfBirth && ` (${getAge(user.dateOfBirth)} anni)`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {user.gender && (
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Genere</p>
                                        <p className="font-medium">{formatGender(user.gender)}</p>
                                    </div>
                                </div>
                            )}

                            {user.birthCity && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Città di nascita</p>
                                        <p className="font-medium">{formatBirthCity(user.birthCity)}</p>
                                    </div>
                                </div>
                            )}

                            {user.destinationCity && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Città di destinazione</p>
                                        <p className="font-medium">{formatDestinationCity(user.destinationCity)}</p>
                                    </div>
                                </div>
                            )}

                            {user.occupation && (
                                <div className="flex items-start gap-3">
                                    <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Occupazione</p>
                                        <p className="font-medium">{user.occupation}</p>
                                    </div>
                                </div>
                            )}

                            {user.createdAt && (
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600">Registrato il</p>
                                        <p className="font-medium">{formatTimestamp(user.createdAt)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* About / Bio */}
                        {(user.about || user.bio) && (
                            <div className="border-t pt-4">
                                <h3 className="text-sm text-gray-600 mb-2 font-semibold">Biografia</h3>
                                <p className="text-gray-900 whitespace-pre-line">{user.about || user.bio}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* User Traits */}
                <UserTraits traits={user.traits} />

                {/* User Preferences */}
                <UserPreferences
                    preferencesSelf={user.preferences?.self}
                    preferencesDesired={user.preferences?.desired}
                />

                {/* User's Houses */}
                {userHouses.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Home className="w-5 h-5" />
                                Case dell'utente ({userHouses.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {userHouses.map(house => (
                                    <div
                                        key={house.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                                        onClick={() => navigate(`/houses/${house.id}`)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Home className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="font-medium">{house.title}</p>
                                                {house.address && (
                                                    <p className="text-sm text-gray-600">
                                                        {formatAddress(house.address)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            Visualizza →
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
