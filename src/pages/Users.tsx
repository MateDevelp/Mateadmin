import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from '../AdminContext';
import { useNavigate } from 'react-router-dom';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
    Search,
    UserCheck,
    UserX,
    Trash2,
    Mail,
    MoreHorizontal,
    Shield,
    AlertTriangle,
    Eye,
    ArrowRight
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
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

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    createdAt?: any;
    lastAccessAt?: any;
    blocked?: boolean;
    UserVerificated?: boolean;
    role?: string;
    isAdmin?: boolean;
}

export default function Users() {
    const { user: currentAdmin } = useAdmin();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        // Filtra utenti in base alla ricerca
        if (!searchTerm) {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => {
                const email = user.email?.toLowerCase() || '';
                const firstName = user.firstName?.toLowerCase() || '';
                const lastName = user.lastName?.toLowerCase() || '';
                const fullName = `${firstName} ${lastName}`.trim();
                const searchLower = searchTerm.toLowerCase();

                return email.includes(searchLower) ||
                    firstName.includes(searchLower) ||
                    lastName.includes(searchLower) ||
                    fullName.includes(searchLower);
            });
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc'),
                limit(100) // Limitiamo a 100 utenti per performance
            );

            const usersSnap = await getDocs(usersQuery);
            const usersList: User[] = [];

            usersSnap.forEach((doc) => {
                usersList.push({ id: doc.id, ...doc.data() } as User);
            });

            setUsers(usersList);
            setFilteredUsers(usersList);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const blockUser = async (user: User) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                blocked: true,
                blockReason: 'Blocked by admin',
                blockedAt: new Date(),
                blockedBy: currentAdmin?.uid
            });

            // Log dell'azione
            await logAdminAction(AdminActions.USER_BLOCKED, {
                adminUid: currentAdmin?.uid,
                adminEmail: currentAdmin?.email,
                targetUid: user.id,
                targetType: 'user',
                reason: 'Blocked by admin'
            });

            // Aggiorna l'interfaccia
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, blocked: true } : u
            ));
        } catch (error) {
            console.error('Error blocking user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const unblockUser = async (user: User) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                blocked: false,
                blockReason: null,
                unblockedAt: new Date(),
                unblockedBy: currentAdmin?.uid
            });

            await logAdminAction(AdminActions.USER_UNBLOCKED, {
                adminUid: currentAdmin?.uid,
                adminEmail: currentAdmin?.email,
                targetUid: user.id,
                targetType: 'user'
            });

            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, blocked: false } : u
            ));
        } catch (error) {
            console.error('Error unblocking user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const verifyUser = async (user: User) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                UserVerificated: true,
                verifiedAt: new Date(),
                verifiedBy: currentAdmin?.uid,
                verificationMethod: 'manual_admin'
            });

            await logAdminAction(AdminActions.USER_VERIFIED, {
                adminUid: currentAdmin?.uid,
                adminEmail: currentAdmin?.email,
                targetUid: user.id,
                targetType: 'user'
            });

            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, UserVerificated: true } : u
            ));
        } catch (error) {
            console.error('Error verifying user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const deleteUser = async () => {
        if (!selectedUser) return;

        setActionLoading(true);
        try {
            await deleteDoc(doc(db, 'users', selectedUser.id));

            await logAdminAction(AdminActions.USER_DELETED, {
                adminUid: currentAdmin?.uid,
                adminEmail: currentAdmin?.email,
                targetUid: selectedUser.id,
                targetType: 'user',
                metadata: {
                    deletedEmail: selectedUser.email,
                    deletedName: `${selectedUser.firstName} ${selectedUser.lastName}`
                }
            });

            setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
            setShowDeleteDialog(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const getUserStatusBadge = (user: User) => {
        if (user.blocked) {
            return <Badge variant="destructive" className="text-xs">Bloccato</Badge>;
        }
        if (user.UserVerificated) {
            return <Badge className="text-xs bg-green-100 text-green-800">Verificato</Badge>;
        }
        return <Badge variant="secondary" className="text-xs">Non Verificato</Badge>;
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('it-IT');
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Gestione Utenti</h1>
                        <p className="text-gray-600 mt-2">
                            Gestisci utenti, verifiche e permessi sulla piattaforma
                        </p>
                    </div>
                    <div className="text-sm text-gray-500">
                        {filteredUsers.length} / {users.length} utenti
                    </div>
                </div>

                {/* Barra di ricerca */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Cerca per email o nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Lista utenti */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Utenti Registrati
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 font-semibold">
                                                {(() => {
                                                    const firstName = user.firstName?.trim();
                                                    const email = user.email?.trim();

                                                    if (firstName && firstName.length > 0) {
                                                        return firstName[0].toUpperCase();
                                                    } else if (email && email.length > 0) {
                                                        return email[0].toUpperCase();
                                                    } else {
                                                        return '?';
                                                    }
                                                })()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {(() => {
                                                    const firstName = user.firstName?.trim();
                                                    const lastName = user.lastName?.trim();
                                                    const email = user.email?.trim() || 'Email non disponibile';

                                                    if (firstName && lastName) {
                                                        return `${firstName} ${lastName}`;
                                                    } else if (firstName) {
                                                        return firstName;
                                                    } else {
                                                        return email;
                                                    }
                                                })()}
                                            </div>
                                            <div className="text-sm text-gray-500">{user.email || 'Email non disponibile'}</div>
                                            <div className="text-xs text-gray-400">
                                                Registrato: {formatDate(user.createdAt)}
                                                {user.role === 'admin' && (
                                                    <span className="ml-2 text-blue-600 font-semibold">• ADMIN</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {getUserStatusBadge(user)}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" disabled={actionLoading}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => navigate(`/users/${user.id}`)}>
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Visualizza profilo
                                                </DropdownMenuItem>

                                                {!user.UserVerificated && (
                                                    <DropdownMenuItem onClick={() => verifyUser(user)}>
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        Verifica Utente
                                                    </DropdownMenuItem>
                                                )}

                                                {user.blocked ? (
                                                    <DropdownMenuItem onClick={() => unblockUser(user)}>
                                                        <UserCheck className="h-4 w-4 mr-2" />
                                                        Sblocca
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => blockUser(user)}>
                                                        <UserX className="h-4 w-4 mr-2" />
                                                        Blocca
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem onClick={() => window.open(`mailto:${user.email}`)}>
                                                    <Mail className="h-4 w-4 mr-2" />
                                                    Invia Email
                                                </DropdownMenuItem>

                                                {/* Non permettere di eliminare se stessi */}
                                                {user.id !== currentAdmin?.uid && (
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowDeleteDialog(true);
                                                        }}
                                                        className="text-red-600"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Elimina Utente
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            {filteredUsers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    {searchTerm ? 'Nessun utente trovato' : 'Nessun utente registrato'}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog conferma eliminazione */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Eliminare Utente?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Sei sicuro di voler eliminare l'utente <strong>{selectedUser?.email}</strong>?
                            Questa azione è irreversibile e cancellerà tutti i dati associati.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteUser}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? "Eliminazione..." : "Elimina"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AdminLayout>
    );
}
