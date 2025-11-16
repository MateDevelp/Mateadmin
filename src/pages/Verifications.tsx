import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { useAdmin } from '../AdminContext';
import { logAdminAction, AdminActions } from '../utils/auditLog';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, XCircle, Clock, FileText, User, Eye, Copy, RefreshCw, AlertTriangle } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface Verification {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    city?: string;
    status: 'pending' | 'approved' | 'rejected';
    documentType?: string;
    documentURL?: string;
    documentFrontURL?: string;
    documentBackURL?: string;
    selfieURL?: string;
    createdAt?: any;
    submittedAt?: any;
    reviewedAt?: any;
    reviewedBy?: string;
}

interface OCRResult {
    nameOk: boolean;
    lastOk: boolean;
    dateOk: boolean;
    score: number;
    ocrDate: string | null;
}

export default function Verifications() {
    const { user: currentAdmin } = useAdmin();
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);

    // OCR State
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
    const [ocrError, setOcrError] = useState('');

    useEffect(() => {
        loadVerifications();
    }, []);

    // OCR Effect
    useEffect(() => {
        if (!selectedVerification) return;
        runOCR();
    }, [selectedVerification]);

    // OCR Helper Functions
    const normalize = (str: string = '') => {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z\d\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const parseDateFromOCR = (text: string): string | null => {
        const re = /(\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b|\b\d{4}[\/.\-]\d{1,2}[\/.\-]\d{1,2}\b)/g;
        const match = text.match(re)?.[0];
        if (!match) return null;

        let d: number, m: number, y: number;
        if (/^\d{4}/.test(match)) {
            const [yy, mm, dd] = match.split(/[-/.]/).map(Number);
            y = yy; m = mm; d = dd;
        } else {
            const [dd, mm, yy] = match.split(/[-/.]/).map(Number);
            d = dd; m = mm; y = yy < 100 ? 2000 + yy : yy;
        }

        const pad = (n: number) => String(n).padStart(2, '0');
        return `${y}-${pad(m)}-${pad(d)}`;
    };

    const compareFields = (ocrText: string, verification: Verification): OCRResult => {
        const nText = normalize(ocrText);
        const nameOk = verification.firstName ? nText.includes(normalize(verification.firstName)) : false;
        const lastOk = verification.lastName ? nText.includes(normalize(verification.lastName)) : false;
        const ocrDate = parseDateFromOCR(ocrText);
        const userBirthDate = verification.birthDate ? verification.birthDate.slice(0, 10) : null;
        const dateOk = userBirthDate ? ocrDate === userBirthDate : false;
        const score = (nameOk ? 1 : 0) + (lastOk ? 1 : 0) + (dateOk ? 1 : 0);

        return { nameOk, lastOk, dateOk, score, ocrDate };
    };

    const runOCR = async () => {
        if (!selectedVerification) return;

        try {
            setOcrLoading(true);
            setOcrError('');
            setOcrText('');
            setOcrResult(null);

            // Preferisce il fronte del documento
            const documentUrl = selectedVerification.documentFrontURL ||
                selectedVerification.documentURL ||
                selectedVerification.documentBackURL;

            if (!documentUrl) {
                setOcrError('Nessuna immagine documento disponibile');
                return;
            }

            const result = await Tesseract.recognize(documentUrl, 'ita+eng', {
                logger: () => { } // Disabilita logging console
            });

            const extractedText = result.data?.text || '';
            setOcrText(extractedText);

            const comparison = compareFields(extractedText, selectedVerification);
            setOcrResult(comparison);

        } catch (error) {
            console.error('OCR Error:', error);
            setOcrError('Errore durante l\'analisi OCR del documento');
        } finally {
            setOcrLoading(false);
        }
    };

    const loadVerifications = async () => {
        try {
            setLoading(true);
            const verificationsSnap = await getDocs(collection(db, 'verifications'));

            const verificationsList: Verification[] = [];
            verificationsSnap.forEach((doc) => {
                verificationsList.push({ id: doc.id, ...doc.data() } as Verification);
            });

            // Ordina per data di creazione (più recenti prima)
            verificationsList.sort((a, b) => {
                const aDate = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                const bDate = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                return bDate.getTime() - aDate.getTime();
            });

            setVerifications(verificationsList);
        } catch (error) {
            console.error('Error loading verifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveVerification = async (verification: Verification) => {
        if (!window.confirm('Sei sicuro di voler approvare questa verifica?')) return;

        setActionLoading(true);
        try {
            // Aggiorna l'utente
            await updateDoc(doc(db, 'users', verification.id), {
                UserVerificated: true,
                verifiedAt: new Date(),
                verifiedBy: currentAdmin?.uid,
                verificationMethod: 'document_review'
            });

            // Rimuovi la richiesta di verifica
            await deleteDoc(doc(db, 'verifications', verification.id));

            // Cleanup storage files
            await cleanupVerificationFiles(verification.id);

            // Log dell'azione
            await logAdminAction(AdminActions.VERIFICATION_APPROVED, {
                adminUid: currentAdmin?.uid,
                adminEmail: currentAdmin?.email,
                targetUid: verification.id,
                targetType: 'verification',
                targetId: verification.id,
                metadata: {
                    userName: `${verification.firstName} ${verification.lastName}`,
                    ocrScore: ocrResult?.score || 0
                }
            });

            // Aggiorna l'interfaccia
            setVerifications(prev => prev.filter(v => v.id !== verification.id));
            setSelectedVerification(null);

        } catch (error) {
            console.error('Error approving verification:', error);
            alert('Errore durante l\'approvazione. Riprova.');
        } finally {
            setActionLoading(false);
        }
    };

    const rejectVerification = async (verification: Verification) => {
        if (!window.confirm('Sei sicuro di voler rifiutare questa verifica?')) return;

        setActionLoading(true);
        try {
            // Rimuovi la richiesta di verifica
            await deleteDoc(doc(db, 'verifications', verification.id));

            // Cleanup storage files
            await cleanupVerificationFiles(verification.id);

            // Log dell'azione
            await logAdminAction(AdminActions.VERIFICATION_REJECTED, {
                adminUid: currentAdmin?.uid,
                adminEmail: currentAdmin?.email,
                targetUid: verification.id,
                targetType: 'verification',
                targetId: verification.id,
                metadata: {
                    userName: `${verification.firstName} ${verification.lastName}`,
                    ocrScore: ocrResult?.score || 0
                }
            });

            setVerifications(prev => prev.filter(v => v.id !== verification.id));
            setSelectedVerification(null);

        } catch (error) {
            console.error('Error rejecting verification:', error);
            alert('Errore durante il rifiuto. Riprova.');
        } finally {
            setActionLoading(false);
        }
    };

    const cleanupVerificationFiles = async (verificationId: string) => {
        const basePath = `verifications/${verificationId}`;
        const filePaths = [
            'document_front.jpg', 'document_front.png',
            'document_back.jpg', 'document_back.png',
            'selfie.jpg', 'selfie.png'
        ];

        await Promise.all(filePaths.map(async (filePath) => {
            try {
                await deleteObject(ref(storage, `${basePath}/${filePath}`));
            } catch (error) {
                // File potrebbe non esistere - ignora l'errore
                console.log(`File ${filePath} not found - skipping`);
            }
        }));
    };

    const copyOcrText = async () => {
        if (ocrText) {
            try {
                await navigator.clipboard.writeText(ocrText);
                // Potremmo aggiungere un toast qui
            } catch (error) {
                console.error('Failed to copy OCR text:', error);
            }
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '—';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOcrBadge = (result: OCRResult) => {
        if (result.score === 3) {
            return <Badge className="bg-green-100 text-green-800">✓ Tutti i campi coincidono</Badge>;
        } else if (result.score >= 1) {
            return <Badge className="bg-yellow-100 text-yellow-800">⚠ Alcuni campi non coincidono</Badge>;
        } else {
            return <Badge className="bg-red-100 text-red-800">✗ Nessuna corrispondenza</Badge>;
        }
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

    const pendingVerifications = verifications.filter(v => v.status !== 'approved' && v.status !== 'rejected');

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Verifiche Identità</h1>
                        <p className="text-gray-600 mt-2">
                            Gestisci le richieste di verifica dell'identità con controllo OCR automatico
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className="bg-amber-100 text-amber-800">
                            <Clock className="h-3 w-3 mr-1" />
                            {pendingVerifications.length} richieste
                        </Badge>
                        <Button
                            onClick={loadVerifications}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Aggiorna
                        </Button>
                    </div>
                </div>

                {pendingVerifications.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center">
                                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Nessuna verifica in attesa
                                </h3>
                                <p className="text-gray-500">
                                    Tutte le richieste di verifica sono state elaborate
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {pendingVerifications.map((verification) => (
                            <Card key={verification.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {verification.firstName && verification.lastName
                                                    ? `${verification.firstName} ${verification.lastName}`
                                                    : 'Utente'
                                                }
                                            </CardTitle>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {verification.city || '—'}
                                            </p>
                                        </div>
                                        <Badge className="bg-orange-100 text-orange-800">
                                            {verification.status || 'pending'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4 pt-4">
                                    <div className="text-xs text-gray-500">
                                        📅 {formatDate(verification.createdAt)}
                                    </div>

                                    {/* Anteprima immagini */}
                                    <div className="flex gap-2">
                                        {(verification.documentFrontURL || verification.documentURL) && (
                                            <img
                                                src={verification.documentFrontURL || verification.documentURL}
                                                alt="documento"
                                                className="h-16 w-24 object-cover rounded-md border"
                                            />
                                        )}
                                        {verification.selfieURL && (
                                            <img
                                                src={verification.selfieURL}
                                                alt="selfie"
                                                className="h-16 w-16 object-cover rounded-md border"
                                            />
                                        )}
                                    </div>

                                    <Button
                                        onClick={() => setSelectedVerification(verification)}
                                        className="w-full"
                                        size="sm"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Analizza e Verifica
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Modal di verifica con OCR */}
                <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        {selectedVerification && (
                            <>
                                <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg -mt-6 -mx-6 mb-6">
                                    <DialogTitle className="text-xl">
                                        Richiesta di Verifica - {selectedVerification.firstName} {selectedVerification.lastName}
                                    </DialogTitle>
                                    <p className="text-blue-100 text-sm">ID: {selectedVerification.id}</p>
                                </DialogHeader>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Informazioni personali */}
                                    <div className="space-y-4">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Informazioni Personali</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div>
                                                    <div className="text-sm text-gray-600">Nome</div>
                                                    <div className="font-medium">{selectedVerification.firstName || '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Cognome</div>
                                                    <div className="font-medium">{selectedVerification.lastName || '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Data di nascita</div>
                                                    <div className="font-medium">{selectedVerification.birthDate?.slice(0, 10) || '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Città</div>
                                                    <div className="font-medium">{selectedVerification.city || '—'}</div>
                                                </div>
                                                <div>
                                                    <div className="text-sm text-gray-600">Data invio</div>
                                                    <div className="text-sm">{formatDate(selectedVerification.createdAt)}</div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Risultati OCR */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <FileText className="h-5 w-5" />
                                                    Analisi OCR
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                {ocrLoading && (
                                                    <div className="flex items-center gap-2 text-blue-600">
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                        Lettura documento in corso...
                                                    </div>
                                                )}

                                                {ocrError && (
                                                    <Alert>
                                                        <AlertTriangle className="h-4 w-4" />
                                                        <AlertDescription>{ocrError}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {ocrResult && (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm">Nome</span>
                                                            <Badge className={ocrResult.nameOk ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                                {ocrResult.nameOk ? "✓ Trovato" : "? Da verificare"}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm">Cognome</span>
                                                            <Badge className={ocrResult.lastOk ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                                {ocrResult.lastOk ? "✓ Trovato" : "? Da verificare"}
                                                            </Badge>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm">Data di nascita</span>
                                                            <Badge className={ocrResult.dateOk ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                                                {ocrResult.dateOk ? "✓ OK" : "? Mismatch"}
                                                            </Badge>
                                                        </div>

                                                        {ocrResult.ocrDate && (
                                                            <div className="text-xs text-gray-500">
                                                                Data OCR: {ocrResult.ocrDate}
                                                            </div>
                                                        )}

                                                        <div className="pt-2">
                                                            {getOcrBadge(ocrResult)}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        onClick={runOCR}
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={ocrLoading}
                                                    >
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                        Rianalizza
                                                    </Button>

                                                    {ocrText && (
                                                        <Button
                                                            onClick={copyOcrText}
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Copy className="h-3 w-3 mr-1" />
                                                            Copia testo
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Documenti */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                                <FileText className="h-5 w-5" />
                                                Documento d'identità
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(selectedVerification.documentFrontURL || selectedVerification.documentURL) && (
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-2">Fronte documento</div>
                                                        <img
                                                            src={selectedVerification.documentFrontURL || selectedVerification.documentURL}
                                                            alt="fronte documento"
                                                            className="w-full rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                                                            onClick={() => window.open(selectedVerification.documentFrontURL || selectedVerification.documentURL, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                                {selectedVerification.documentBackURL && (
                                                    <div>
                                                        <div className="text-sm text-gray-600 mb-2">Retro documento</div>
                                                        <img
                                                            src={selectedVerification.documentBackURL}
                                                            alt="retro documento"
                                                            className="w-full rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                                                            onClick={() => window.open(selectedVerification.documentBackURL, '_blank')}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Selfie
                                            </h3>
                                            {selectedVerification.selfieURL ? (
                                                <img
                                                    src={selectedVerification.selfieURL}
                                                    alt="selfie"
                                                    className="max-w-sm rounded-lg border cursor-pointer hover:shadow-lg transition-shadow"
                                                    onClick={() => window.open(selectedVerification.selfieURL, '_blank')}
                                                />
                                            ) : (
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                                                    Nessun selfie caricato
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer con azioni */}
                                <div className="flex items-center justify-between pt-6 border-t">
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        L'OCR è indicativo. Verifica sempre manualmente prima di approvare.
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => rejectVerification(selectedVerification)}
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                            disabled={actionLoading}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Rifiuta
                                        </Button>

                                        <Button
                                            onClick={() => approveVerification(selectedVerification)}
                                            className="bg-green-600 hover:bg-green-700"
                                            disabled={actionLoading}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            {actionLoading ? 'Approvazione...' : 'Approva Verifica'}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Info card */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-0.5">ℹ️</div>
                            <div>
                                <h4 className="font-medium text-blue-900 mb-2">
                                    Sistema di Verifica con OCR
                                </h4>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p>• L'OCR analizza automaticamente i documenti per confrontare nome, cognome e data di nascita</p>
                                    <p>• Le verifiche approvate impostano automaticamente il flag UserVerificated</p>
                                    <p>• I file vengono eliminati automaticamente dopo approvazione/rifiuto</p>
                                    <p>• Tutte le azioni vengono registrate nell'audit log con punteggio OCR</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
