import React, { useState, useEffect } from 'react';
import {
    Search,
    MessageCircle,
    Users,
    Clock,
    Send,
    Eye,
    AlertTriangle,
    Filter,
    Calendar,
    MoreVertical,
    Ban,
    Trash2,
    RefreshCw
} from 'lucide-react';
import {
    collection,
    query,
    orderBy,
    limit,
    where,
    onSnapshot,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    Timestamp,
    startAfter
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from '../AdminContext';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import AdminLayout from '../components/AdminLayout';
import { ChatViewer } from '../components/dashboard/ChatViewer';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';

// Interfaces
interface Message {
    id: string;
    text: string;
    from: string;
    createdAt: Timestamp;
    type?: string;
    attachments?: string[];
}

interface Conversation {
    id: string;
    type: 'direct' | 'group';
    participants: string[];
    lastMessage?: {
        text: string;
        from: string;
        createdAt: Timestamp;
    };
    lastReadBy?: Record<string, Timestamp>;
    createdAt: Timestamp;
    updatedAt: Timestamp;

    // Group specific
    groupId?: string;
    groupName?: string;
    isSubGroup?: boolean;
    externalUser?: string;

    // Admin moderation
    blocked?: boolean;
    blockedAt?: Timestamp;
    blockedReason?: string;
    reportCount?: number;
}

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
}

export default function Chats() {
    const { user: currentAdmin } = useAdmin();
    const { toast } = useToast();

    // State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Moderation
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [moderationDialog, setModerationDialog] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Load conversations
    useEffect(() => {
        setLoading(true);

        const conversationsQuery = query(
            collection(db, 'conversations'),
            orderBy('updatedAt', 'desc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
            const conversationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Conversation));

            setConversations(conversationsData);
            setFilteredConversations(conversationsData);
            setLoading(false);

            // Load user data for participants
            loadUsersData(conversationsData);
        });

        return unsubscribe;
    }, []);

    // Load user data
    const loadUsersData = async (conversations: Conversation[]) => {
        const userIds = new Set<string>();

        conversations.forEach(conv => {
            conv.participants.forEach(id => userIds.add(id));
            if (conv.lastMessage?.from) userIds.add(conv.lastMessage.from);
            if (conv.externalUser) userIds.add(conv.externalUser);
        });

        const usersData: Record<string, User> = {};

        await Promise.all(
            Array.from(userIds).map(async (userId) => {
                try {
                    const userDoc = await getDoc(doc(db, 'users', userId));
                    if (userDoc.exists()) {
                        usersData[userId] = {
                            id: userId,
                            ...userDoc.data()
                        } as User;
                    }
                } catch (error) {
                    console.error('Error loading user:', userId, error);
                }
            })
        );

        setUsers(usersData);
    };

    // Filter conversations
    useEffect(() => {
        let filtered = conversations;

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(conv => {
                const participantNames = conv.participants
                    .map(id => users[id])
                    .filter(Boolean)
                    .map(user => `${user.firstName || ''} ${user.lastName || ''}`.trim())
                    .join(' ');

                return (
                    conv.id.toLowerCase().includes(searchLower) ||
                    conv.groupName?.toLowerCase().includes(searchLower) ||
                    participantNames.toLowerCase().includes(searchLower) ||
                    conv.lastMessage?.text.toLowerCase().includes(searchLower)
                );
            });
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(conv => conv.type === typeFilter);
        }

        // Status filter
        if (statusFilter === 'blocked') {
            filtered = filtered.filter(conv => conv.blocked);
        } else if (statusFilter === 'active') {
            filtered = filtered.filter(conv => !conv.blocked);
        } else if (statusFilter === 'reported') {
            filtered = filtered.filter(conv => (conv.reportCount || 0) > 0);
        }

        setFilteredConversations(filtered);
    }, [conversations, users, searchTerm, typeFilter, statusFilter]);

    // Block conversation
    const blockConversation = async () => {
        if (!selectedConversation || !blockReason.trim()) return;

        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'conversations', selectedConversation.id), {
                blocked: true,
                blockedAt: new Date(),
                blockedReason: blockReason
            });

            await logAdminAction(AdminActions.CONVERSATION_BLOCKED, {
                adminUid: currentAdmin?.uid,
                targetId: selectedConversation.id,
                targetType: 'conversation',
                reason: blockReason
            });

            setConversations(prev => prev.map(conv =>
                conv.id === selectedConversation.id
                    ? { ...conv, blocked: true, blockedReason: blockReason }
                    : conv
            ));

            toast({
                title: "Conversazione bloccata",
                description: "La conversazione è stata bloccata con successo"
            });

            setModerationDialog(false);
            setBlockReason('');
        } catch (error) {
            console.error('Error blocking conversation:', error);
            toast({
                title: "Errore",
                description: "Errore nel bloccare la conversazione",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Unblock conversation
    const unblockConversation = async (conversation: Conversation) => {
        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'conversations', conversation.id), {
                blocked: false,
                blockedAt: null,
                blockedReason: null
            });

            await logAdminAction(AdminActions.CONVERSATION_UNBLOCKED, {
                adminUid: currentAdmin?.uid,
                targetId: conversation.id,
                targetType: 'conversation'
            });

            setConversations(prev => prev.map(conv =>
                conv.id === conversation.id
                    ? { ...conv, blocked: false, blockedReason: undefined }
                    : conv
            ));

            toast({
                title: "Conversazione sbloccata",
                description: "La conversazione è stata sbloccata con successo"
            });
        } catch (error) {
            console.error('Error unblocking conversation:', error);
            toast({
                title: "Errore",
                description: "Errore nello sbloccare la conversazione",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Delete conversation
    const deleteConversation = async (conversation: Conversation) => {
        if (!confirm('Sei sicuro di voler eliminare questa conversazione? Questa azione non può essere annullata.')) return;

        setActionLoading(true);
        try {
            await deleteDoc(doc(db, 'conversations', conversation.id));

            await logAdminAction(AdminActions.CONVERSATION_DELETED, {
                adminUid: currentAdmin?.uid,
                targetId: conversation.id,
                targetType: 'conversation'
            });

            setConversations(prev => prev.filter(conv => conv.id !== conversation.id));

            toast({
                title: "Conversazione eliminata",
                description: "La conversazione è stata eliminata con successo"
            });
        } catch (error) {
            console.error('Error deleting conversation:', error);
            toast({
                title: "Errore",
                description: "Errore nell'eliminare la conversazione",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: Timestamp) => {
        return timestamp.toDate().toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get user display name
    const getUserDisplayName = (userId: string) => {
        const user = users[userId];
        if (!user) return userId;

        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || user.email || userId;
    };

    // Get conversation display name
    const getConversationDisplayName = (conversation: Conversation) => {
        if (conversation.groupName) {
            return conversation.groupName;
        }

        const participantNames = conversation.participants
            .map(getUserDisplayName)
            .join(', ');

        return participantNames || `Conversazione ${conversation.id.slice(0, 8)}`;
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Gestione Chat
                        </h1>
                        <p className="text-gray-600">
                            Monitora e gestisci le conversazioni della piattaforma Mate
                        </p>
                    </div>

                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aggiorna
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-8 h-8 text-blue-500" />
                                <div>
                                    <div className="text-2xl font-bold">{conversations.length}</div>
                                    <div className="text-sm text-gray-600">Conversazioni</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-green-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {conversations.filter(c => c.type === 'direct').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Chat Dirette</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Users className="w-8 h-8 text-purple-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {conversations.filter(c => c.type === 'group').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Chat Gruppo</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Ban className="w-8 h-8 text-red-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {conversations.filter(c => c.blocked).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Bloccate</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="conversations">Lista Conversazioni</TabsTrigger>
                        <TabsTrigger value="viewer">Chat Viewer</TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-4">
                        {/* Filters */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="w-5 h-5" />
                                    Filtri e Ricerca
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Cerca per ID, nome, partecipanti o contenuto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tutti i tipi</SelectItem>
                                            <SelectItem value="direct">Chat Dirette</SelectItem>
                                            <SelectItem value="group">Chat Gruppo</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tutti gli stati</SelectItem>
                                            <SelectItem value="active">Attive</SelectItem>
                                            <SelectItem value="blocked">Bloccate</SelectItem>
                                            <SelectItem value="reported">Segnalate</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setTypeFilter('all');
                                                setStatusFilter('all');
                                            }}
                                        >
                                            Pulisci Filtri
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Conversations List */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>Conversazioni</CardTitle>
                                    <Badge variant="secondary">{filteredConversations.length}</Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="p-0">
                                <ScrollArea className="h-[600px]">
                                    <div className="space-y-1 p-4">
                                        {filteredConversations.map((conversation) => (
                                            <Card key={conversation.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="flex items-center gap-1">
                                                                {conversation.type === 'direct' ? (
                                                                    <MessageCircle className="w-4 h-4 text-blue-500" />
                                                                ) : (
                                                                    <Users className="w-4 h-4 text-purple-500" />
                                                                )}
                                                                <span className="font-medium text-sm truncate">
                                                                    {getConversationDisplayName(conversation)}
                                                                </span>
                                                            </div>

                                                            <div className="flex gap-1">
                                                                {conversation.blocked && (
                                                                    <Badge variant="destructive" className="text-xs">Bloccata</Badge>
                                                                )}
                                                                {(conversation.reportCount || 0) > 0 && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {conversation.reportCount} segnalazioni
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="text-xs text-gray-500 space-y-1">
                                                            <div>ID: {conversation.id}</div>
                                                            <div className="flex items-center gap-4">
                                                                <span>Partecipanti: {conversation.participants.length}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {formatTimestamp(conversation.updatedAt)}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {conversation.lastMessage && (
                                                            <div className="text-sm text-gray-600 mt-2 truncate">
                                                                <strong>{getUserDisplayName(conversation.lastMessage.from)}:</strong>{' '}
                                                                {conversation.lastMessage.text}
                                                            </div>
                                                        )}

                                                        {conversation.blockedReason && (
                                                            <div className="text-sm text-red-600 mt-2">
                                                                <strong>Motivo blocco:</strong> {conversation.blockedReason}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {conversation.blocked ? (
                                                                <DropdownMenuItem
                                                                    onClick={() => unblockConversation(conversation)}
                                                                    disabled={actionLoading}
                                                                >
                                                                    <MessageCircle className="w-4 h-4 mr-2" />
                                                                    Sblocca
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem onClick={() => {
                                                                    setSelectedConversation(conversation);
                                                                    setModerationDialog(true);
                                                                }}>
                                                                    <Ban className="w-4 h-4 mr-2" />
                                                                    Blocca
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => deleteConversation(conversation)}
                                                                disabled={actionLoading}
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-2" />
                                                                Elimina
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </Card>
                                        ))}

                                        {filteredConversations.length === 0 && (
                                            <div className="text-center py-12 text-gray-500">
                                                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                                <p className="text-lg mb-2">Nessuna conversazione trovata</p>
                                                <p className="text-sm">Prova a modificare i filtri di ricerca</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="viewer">
                        <ChatViewer />
                    </TabsContent>
                </Tabs>
            </div>

            {/* Block Conversation Dialog */}
            <Dialog open={moderationDialog} onOpenChange={setModerationDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Blocca Conversazione</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">
                                Conversazione: {selectedConversation && getConversationDisplayName(selectedConversation)}
                            </label>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Motivo del blocco</label>
                            <Textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="Inserisci il motivo del blocco (es: contenuti inappropriati, spam, violazione termini di servizio)..."
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setModerationDialog(false);
                                    setBlockReason('');
                                    setSelectedConversation(null);
                                }}
                                disabled={actionLoading}
                            >
                                Annulla
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={blockConversation}
                                disabled={!blockReason.trim() || actionLoading}
                            >
                                {actionLoading ? 'Bloccando...' : 'Blocca Conversazione'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
