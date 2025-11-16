import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Eye,
    Ban,
    Trash2,
    RefreshCw,
    Search,
    Filter,
    Clock,
    MessageCircle,
    Shield,
    User,
    MoreVertical
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
    updateDoc,
    deleteDoc,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from '../AdminContext';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import AdminLayout from '../components/AdminLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../components/ui/use-toast';

// Interfaces
interface Report {
    id: string;
    reporterId: string;
    reportedUid: string;
    reason: string;
    messageText?: string;
    detectedWords?: string[];
    notes?: string;
    conversationId?: string;
    status: 'pending' | 'reviewed' | 'dismissed' | 'resolved';
    severity: 'low' | 'medium' | 'high' | 'critical';
    isAutoReport: boolean;
    createdAt: Timestamp;
    reviewedAt?: Timestamp;
    reviewedBy?: string;
    actionTaken?: string;
}

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    blocked?: boolean;
    profileImage?: string;
}

export default function Reports() {
    const { user: currentAdmin } = useAdmin();
    const { toast } = useToast();

    // State
    const [reports, setReports] = useState<Report[]>([]);
    const [filteredReports, setFilteredReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    // Dialog state
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [reviewDialog, setReviewDialog] = useState(false);
    const [actionNotes, setActionNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Load reports with real-time updates
    useEffect(() => {
        setLoading(true);

        const reportsQuery = query(
            collection(db, 'reports'),
            orderBy('createdAt', 'desc'),
            limit(200)
        );

        const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Report));

            setReports(reportsData);
            setFilteredReports(reportsData);
            setLoading(false);

            // Load user data for reporters and reported users
            loadUsersData(reportsData);
        });

        return unsubscribe;
    }, []);

    // Load user data
    const loadUsersData = async (reports: Report[]) => {
        const userIds = new Set<string>();

        reports.forEach(report => {
            userIds.add(report.reporterId);
            userIds.add(report.reportedUid);
            if (report.reviewedBy) userIds.add(report.reviewedBy);
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

    // Filter reports
    useEffect(() => {
        let filtered = reports;

        // Search filter
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(report => {
                const reporterName = getUserDisplayName(report.reporterId);
                const reportedName = getUserDisplayName(report.reportedUid);

                return (
                    report.id.toLowerCase().includes(searchLower) ||
                    reporterName.toLowerCase().includes(searchLower) ||
                    reportedName.toLowerCase().includes(searchLower) ||
                    report.reason.toLowerCase().includes(searchLower) ||
                    report.messageText?.toLowerCase().includes(searchLower) ||
                    report.notes?.toLowerCase().includes(searchLower)
                );
            });
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(report => report.status === statusFilter);
        }

        // Severity filter
        if (severityFilter !== 'all') {
            filtered = filtered.filter(report => report.severity === severityFilter);
        }

        // Type filter (auto vs manual)
        if (typeFilter === 'auto') {
            filtered = filtered.filter(report => report.isAutoReport);
        } else if (typeFilter === 'manual') {
            filtered = filtered.filter(report => !report.isAutoReport);
        }

        setFilteredReports(filtered);
    }, [reports, users, searchTerm, statusFilter, severityFilter, typeFilter]);

    // Get user display name
    const getUserDisplayName = (userId: string) => {
        const user = users[userId];
        if (!user) return userId;

        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || user.email || userId;
    };

    // Get severity badge color
    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'destructive';
            case 'high':
                return 'destructive';
            case 'medium':
                return 'default';
            case 'low':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    // Get status badge color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'default';
            case 'reviewed':
                return 'secondary';
            case 'resolved':
                return 'default';
            case 'dismissed':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    // Review report (approve/dismiss)
    const reviewReport = async (action: 'resolved' | 'dismissed') => {
        if (!selectedReport) return;

        setActionLoading(true);
        try {
            await updateDoc(doc(db, 'reports', selectedReport.id), {
                status: action,
                reviewedAt: new Date(),
                reviewedBy: currentAdmin?.uid,
                actionTaken: actionNotes || null
            });

            await logAdminAction(
                action === 'resolved' ? AdminActions.REPORT_RESOLVED : AdminActions.REPORT_DISMISSED,
                {
                    adminUid: currentAdmin?.uid,
                    targetId: selectedReport.id,
                    targetType: 'report',
                    reason: actionNotes
                }
            );

            setReports(prev => prev.map(report =>
                report.id === selectedReport.id
                    ? {
                        ...report,
                        status: action,
                        reviewedAt: Timestamp.now(),
                        reviewedBy: currentAdmin?.uid,
                        actionTaken: actionNotes
                    }
                    : report
            ));

            toast({
                title: action === 'resolved' ? "Segnalazione risolta" : "Segnalazione archiviata",
                description: `La segnalazione è stata ${action === 'resolved' ? 'risolta' : 'archiviata'} con successo`
            });

            setReviewDialog(false);
            setActionNotes('');
            setSelectedReport(null);
        } catch (error) {
            console.error('Error reviewing report:', error);
            toast({
                title: "Errore",
                description: "Errore nella gestione della segnalazione",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Block reported user
    const blockReportedUser = async (report: Report) => {
        if (!confirm(`Sei sicuro di voler bloccare l'utente ${getUserDisplayName(report.reportedUid)}?`)) return;

        setActionLoading(true);
        try {
            // Block user
            await updateDoc(doc(db, 'users', report.reportedUid), {
                blocked: true,
                blockedAt: new Date(),
                blockedReason: `Report ID: ${report.id} - ${report.reason}`
            });

            // Update report status
            await updateDoc(doc(db, 'reports', report.id), {
                status: 'resolved',
                reviewedAt: new Date(),
                reviewedBy: currentAdmin?.uid,
                actionTaken: 'User blocked'
            });

            // Log actions
            await logAdminAction(AdminActions.USER_BLOCKED, {
                adminUid: currentAdmin?.uid,
                targetUid: report.reportedUid,
                targetType: 'user',
                reason: `Report: ${report.reason}`
            });

            await logAdminAction(AdminActions.REPORT_RESOLVED, {
                adminUid: currentAdmin?.uid,
                targetId: report.id,
                targetType: 'report',
                reason: 'User blocked'
            });

            // Update local state
            setReports(prev => prev.map(r =>
                r.id === report.id
                    ? {
                        ...r,
                        status: 'resolved' as const,
                        reviewedAt: Timestamp.now(),
                        reviewedBy: currentAdmin?.uid,
                        actionTaken: 'User blocked'
                    }
                    : r
            ));

            toast({
                title: "Utente bloccato",
                description: "L'utente segnalato è stato bloccato con successo"
            });
        } catch (error) {
            console.error('Error blocking user:', error);
            toast({
                title: "Errore",
                description: "Errore nel bloccare l'utente",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Delete report
    const deleteReport = async (report: Report) => {
        if (!confirm('Sei sicuro di voler eliminare questa segnalazione?')) return;

        setActionLoading(true);
        try {
            await deleteDoc(doc(db, 'reports', report.id));

            await logAdminAction(AdminActions.REPORT_DISMISSED, {
                adminUid: currentAdmin?.uid,
                targetId: report.id,
                targetType: 'report',
                reason: 'Deleted by admin'
            });

            setReports(prev => prev.filter(r => r.id !== report.id));

            toast({
                title: "Segnalazione eliminata",
                description: "La segnalazione è stata eliminata con successo"
            });
        } catch (error) {
            console.error('Error deleting report:', error);
            toast({
                title: "Errore",
                description: "Errore nell'eliminare la segnalazione",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    // Format timestamp
    const formatTimestamp = (timestamp: Timestamp | Date | any) => {
        if (!timestamp) return 'N/A';

        try {
            // Se è un Timestamp di Firestore
            if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate().toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Se è già un oggetto Date
            if (timestamp instanceof Date) {
                return timestamp.toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Se è un numero (milliseconds)
            if (typeof timestamp === 'number') {
                return new Date(timestamp).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Se ha proprietà seconds (Firebase Timestamp serializzato)
            if (timestamp?.seconds) {
                return new Date(timestamp.seconds * 1000).toLocaleString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            return 'Data non valida';
        } catch (error) {
            console.error('Error formatting timestamp:', error, timestamp);
            return 'Errore formato data';
        }
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
                            Gestione Segnalazioni
                        </h1>
                        <p className="text-gray-600">
                            Verifica e gestisci le segnalazioni della moderazione chat
                        </p>
                    </div>

                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Aggiorna
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="w-8 h-8 text-orange-500" />
                                <div>
                                    <div className="text-2xl font-bold">{reports.length}</div>
                                    <div className="text-sm text-gray-600">Totali</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-8 h-8 text-yellow-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {reports.filter(r => r.status === 'pending').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Da Verificare</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {reports.filter(r => r.status === 'resolved').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Risolte</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <Shield className="w-8 h-8 text-red-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {reports.filter(r => r.severity === 'critical' || r.severity === 'high').length}
                                    </div>
                                    <div className="text-sm text-gray-600">Priorità Alta</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <MessageCircle className="w-8 h-8 text-blue-500" />
                                <div>
                                    <div className="text-2xl font-bold">
                                        {reports.filter(r => r.isAutoReport).length}
                                    </div>
                                    <div className="text-sm text-gray-600">Auto-Detect</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

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
                                placeholder="Cerca per ID, utente, motivo o contenuto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="flex gap-4">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutti gli stati</SelectItem>
                                    <SelectItem value="pending">Da verificare</SelectItem>
                                    <SelectItem value="reviewed">Verificate</SelectItem>
                                    <SelectItem value="resolved">Risolte</SelectItem>
                                    <SelectItem value="dismissed">Archiviate</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={severityFilter} onValueChange={setSeverityFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Gravità" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutte le priorità</SelectItem>
                                    <SelectItem value="critical">Critica</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="medium">Media</SelectItem>
                                    <SelectItem value="low">Bassa</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tutti i tipi</SelectItem>
                                    <SelectItem value="auto">Auto-rilevate</SelectItem>
                                    <SelectItem value="manual">Manuali</SelectItem>
                                </SelectContent>
                            </Select>

                            {(searchTerm || statusFilter !== 'all' || severityFilter !== 'all' || typeFilter !== 'all') && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setSeverityFilter('all');
                                        setTypeFilter('all');
                                    }}
                                >
                                    Pulisci Filtri
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Reports List */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Segnalazioni</CardTitle>
                            <Badge variant="secondary">{filteredReports.length}</Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            <div className="space-y-1 p-4">
                                {filteredReports.map((report) => (
                                    <Card key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0 space-y-3">
                                                {/* Header */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={getSeverityColor(report.severity)}>
                                                        {report.severity.toUpperCase()}
                                                    </Badge>
                                                    <Badge variant={getStatusColor(report.status)}>
                                                        {report.status === 'pending' && '⏳ Da verificare'}
                                                        {report.status === 'reviewed' && '👁️ Verificata'}
                                                        {report.status === 'resolved' && '✅ Risolta'}
                                                        {report.status === 'dismissed' && '🗂️ Archiviata'}
                                                    </Badge>
                                                    {report.isAutoReport && (
                                                        <Badge variant="outline">
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            Auto-rilevata
                                                        </Badge>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        ID: {report.id.slice(0, 8)}...
                                                    </span>
                                                </div>

                                                {/* Main Info */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <strong>Segnalante:</strong>{' '}
                                                        <span className="text-gray-700">
                                                            {getUserDisplayName(report.reporterId)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <strong>Segnalato:</strong>{' '}
                                                        <span className="text-red-600 font-medium">
                                                            {getUserDisplayName(report.reportedUid)}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <strong>Motivo:</strong>{' '}
                                                        <span className="text-gray-700">{report.reason}</span>
                                                    </div>
                                                </div>

                                                {/* Message Text (if auto-report) */}
                                                {report.messageText && (
                                                    <div className="bg-red-50 border border-red-200 p-3 rounded text-sm">
                                                        <div className="flex items-start gap-2">
                                                            <MessageCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                            <div className="flex-1">
                                                                <strong className="text-red-700">Messaggio:</strong>
                                                                <p className="text-gray-700 mt-1">{report.messageText}</p>
                                                                {report.detectedWords && report.detectedWords.length > 0 && (
                                                                    <div className="mt-2">
                                                                        <strong className="text-red-700">Parole rilevate:</strong>
                                                                        <div className="flex gap-1 mt-1 flex-wrap">
                                                                            {report.detectedWords.map((word, idx) => (
                                                                                <Badge key={idx} variant="destructive" className="text-xs">
                                                                                    {word}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Notes */}
                                                {report.notes && (
                                                    <div className="text-sm">
                                                        <strong>Note:</strong> {report.notes}
                                                    </div>
                                                )}

                                                {/* Review Info */}
                                                {report.reviewedBy && (
                                                    <div className="text-xs text-gray-500 flex items-center gap-4">
                                                        <span>
                                                            <strong>Verificata da:</strong> {getUserDisplayName(report.reviewedBy)}
                                                        </span>
                                                        {report.reviewedAt && (
                                                            <span>
                                                                <strong>Data:</strong> {formatTimestamp(report.reviewedAt)}
                                                            </span>
                                                        )}
                                                        {report.actionTaken && (
                                                            <span>
                                                                <strong>Azione:</strong> {report.actionTaken}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Timestamp */}
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    Segnalata: {formatTimestamp(report.createdAt)}
                                                </div>
                                            </div>

                                            {/* Actions Menu */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {report.status === 'pending' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedReport(report);
                                                                setReviewDialog(true);
                                                            }}>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Verifica
                                                            </DropdownMenuItem>

                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => blockReportedUser(report)}
                                                                disabled={actionLoading}
                                                            >
                                                                <Ban className="w-4 h-4 mr-2" />
                                                                Blocca Utente
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}

                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => deleteReport(report)}
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

                                {filteredReports.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                        <p className="text-lg mb-2">Nessuna segnalazione trovata</p>
                                        <p className="text-sm">Prova a modificare i filtri di ricerca</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            {/* Review Report Dialog */}
            <Dialog open={reviewDialog} onOpenChange={setReviewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Verifica Segnalazione</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {selectedReport && (
                            <>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <strong>Segnalante:</strong>
                                        <p className="text-gray-700">
                                            {getUserDisplayName(selectedReport.reporterId)}
                                        </p>
                                    </div>
                                    <div>
                                        <strong>Segnalato:</strong>
                                        <p className="text-red-600 font-medium">
                                            {getUserDisplayName(selectedReport.reportedUid)}
                                        </p>
                                    </div>
                                    <div className="col-span-2">
                                        <strong>Motivo:</strong>
                                        <p className="text-gray-700">{selectedReport.reason}</p>
                                    </div>
                                    {selectedReport.messageText && (
                                        <div className="col-span-2 bg-red-50 p-3 rounded">
                                            <strong>Messaggio:</strong>
                                            <p className="text-gray-700 mt-1">{selectedReport.messageText}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Note azione intrapresa</label>
                                    <Textarea
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder="Descrivi l'azione intrapresa o le note sulla revisione..."
                                        className="mt-1"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setReviewDialog(false);
                                            setActionNotes('');
                                            setSelectedReport(null);
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Annulla
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => reviewReport('dismissed')}
                                        disabled={actionLoading}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Archivia
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => reviewReport('resolved')}
                                        disabled={actionLoading}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Risolvi
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
