import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db, storage } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Verification({ compact }) {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [docFile, setDocFile] = useState(null);
    const [selfieFile, setSelfieFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [verificationExists, setVerificationExists] = useState(false);

    // --- UI: preview locali (non toccano la logica di upload) ---
    const docPreview = useMemo(() => (docFile && docFile.type && docFile.type.startsWith('image/')) ? URL.createObjectURL(docFile) : null, [docFile]);
    const selfiePreview = useMemo(() => (selfieFile && selfieFile.type && selfieFile.type.startsWith('image/')) ? URL.createObjectURL(selfieFile) : null, [selfieFile]);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const userSnap = await getDoc(doc(db, 'users', user.authUser.uid));
                if (!userSnap.exists()) {
                    setMessage('Profilo utente non trovato');
                    return;
                }
                const data = userSnap.data();
                setProfile(data);

                if (data.UserVerificated === true) {
                    setMessage('Profilo già verificato ✅');
                } else {
                    const verSnap = await getDoc(doc(db, 'verifications', user.authUser.uid));
                    if (verSnap.exists()) {
                        setVerificationExists(true);
                        setMessage('Richiesta inviata. In attesa di revisione.');
                    }
                }
            } catch (e) {
                setMessage('Permessi insufficienti oppure login scaduto');
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!profile || profile.UserVerificated || verificationExists) return;
        if (!docFile || !selfieFile) { setMessage('Carica documento e selfie'); return; }
        try {
            setSubmitting(true); setMessage('Caricamento file…');
            const docExt = (docFile.name.split('.').pop() || 'pdf').toLowerCase();
            const selfieExt = (selfieFile.name.split('.').pop() || 'jpg').toLowerCase();
            const docRef = ref(storage, `verifications/${user.authUser.uid}/document.${docExt}`);
            const selfieRef = ref(storage, `verifications/${user.authUser.uid}/selfie.${selfieExt}`);

            await uploadBytes(docRef, docFile);
            await uploadBytes(selfieRef, selfieFile);

            const docURL = await getDownloadURL(docRef);
            const selfieURL = await getDownloadURL(selfieRef);

            await setDoc(doc(db, 'verifications', user.authUser.uid), {
                uid: user.authUser.uid,
                createdAt: new Date().toISOString(),
                documentURL: docURL,
                selfieURL,
                status: 'pending',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                city: profile.city || profile.origin || '',
            });

            setVerificationExists(true);
            setMessage('Richiesta inviata ✅');
        } catch (e) {
            setMessage('Errore: ' + (e.code || 'upload'));
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) return null;
    if (loading) return (
        <div className="min-h-[50vh] grid place-items-center">
            <div className="inline-flex items-center gap-3 rounded-xl border border-white/70 bg-white px-4 py-3 shadow-sm text-slate-600">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4472FF]" />
                Caricamento…
            </div>
        </div>
    );

    const status = profile?.UserVerificated
        ? { label: 'Verificato', color: 'bg-white text-emerald-600 border border-emerald-300', icon: '✓' }
        : verificationExists
            ? { label: 'In attesa di verifica', color: 'bg-white text-amber-600 border border-amber-300', icon: '...' }
            : { label: 'Non verificato', color: 'bg-white text-slate-600 border border-slate-300', icon: '✗' };

    return (
        <div className={`rounded-2xl border shadow-sm p-4 ${compact ? 'text-sm' : 'text-base'} ${status.color}`}>
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{status.icon}</span>
                <span className="font-medium">{status.label}</span>
            </div>
            {message && <p className="mt-2 text-slate-500">{message}</p>}

            {/* Form */}
            {!profile?.UserVerificated && !verificationExists && (
                <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-2">
                    {/* Documento */}
                    <div className="rounded-2xl border border-white/70 bg-white shadow-sm p-6">
                        <label className="block text-sm font-semibold mb-3">Documento d’identità</label>

                        <label
                            className="group relative grid place-items-center aspect-[5/3] cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition"
                        >
                            {docPreview ? (
                                <img src={docPreview} alt="Anteprima documento" className="h-full w-full object-contain p-3" />
                            ) : (
                                <div className="text-center px-6">
                                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-white grid place-items-center shadow-sm">
                                        <span className="text-lg">📄</span>
                                    </div>
                                    <div className="text-sm font-medium">Trascina qui o clicca per caricare</div>
                                    <div className="mt-1 text-xs text-slate-500">.jpg, .png o .pdf — fronte leggibile</div>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* Selfie */}
                    <div className="rounded-2xl border border-white/70 bg-white shadow-sm p-6">
                        <label className="block text-sm font-semibold mb-3">Selfie</label>

                        <label
                            className="group relative grid place-items-center aspect-[5/3] cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition"
                        >
                            {selfiePreview ? (
                                <img src={selfiePreview} alt="Anteprima selfie" className="h-full w-full object-contain p-3" />
                            ) : (
                                <div className="text-center px-6">
                                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-white grid place-items-center shadow-sm">
                                        <span className="text-lg">🤳</span>
                                    </div>
                                    <div className="text-sm font-medium">Trascina qui o clicca per caricare</div>
                                    <div className="mt-1 text-xs text-slate-500">Inquadra il volto, buona luce, senza occhiali scuri</div>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* Tips + Privacy */}
                    <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/70 bg-white shadow-sm p-6">
                            <div className="text-sm font-semibold mb-2">Requisiti rapidi</div>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li>• Documento integro e leggibile (niente riflessi o tagli).</li>
                                <li>• Selfie frontale, senza cappelli/occhiali scuri.</li>
                                <li>• Accettiamo <b>.jpg</b>, <b>.png</b> o <b>.pdf</b>.</li>
                            </ul>
                        </div>
                        <div className="rounded-2xl border border-white/70 bg-white shadow-sm p-6">
                            <div className="text-sm font-semibold mb-2">Privacy</div>
                            <p className="text-sm text-slate-600">
                                Usiamo i file esclusivamente per confermare la tua identità. I dati sono protetti e non vengono condivisi con terzi.
                            </p>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="lg:col-span-2 flex items-center justify-end">
                        <button
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#4472FF] px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-[#2E5DFF] disabled:opacity-60"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                                    Invio…
                                </>
                            ) : (
                                'Invia verifica'
                            )}
                        </button>
                    </div>
                </form>
            )}

            {/* Stato finale */}
            {profile?.UserVerificated && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-sm">
                    Il tuo profilo è già verificato. Grazie! ✅
                </div>
            )}
            {verificationExists && !profile?.UserVerificated && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
                    Abbiamo ricevuto la richiesta. Ti avviseremo appena sarà revisionata. ⏳
                </div>
            )}
        </div>
    );
}
