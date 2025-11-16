import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAdmin } from '../AdminContext';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function AuthDebugPanel() {
    const { user, isAdmin } = useAdmin();
    const [userDocData, setUserDocData] = useState<any>(null);
    const [customClaims, setCustomClaims] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkUserData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Check Firestore user document
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            setUserDocData(userDoc.exists() ? userDoc.data() : null);

            // Check custom claims
            const token = await user.getIdTokenResult();
            setCustomClaims(token.claims);
        } catch (error) {
            console.error('Error checking user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            checkUserData();
        }
    }, [user]);

    if (!user) {
        return (
            <Card className="mb-6 border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-5 h-5" />
                        Authentication Debug - Not Logged In
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600">User is not authenticated</p>
                </CardContent>
            </Card>
        );
    }

    const hasFirestoreAccess = userDocData && (userDocData.role === 'admin' || userDocData.isAdmin);
    const hasCustomClaims = customClaims?.admin === true;

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Authentication Debug Panel
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={checkUserData}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Firebase Auth */}
                <div>
                    <h3 className="font-medium mb-2">Firebase Authentication</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>UID:</strong> {user.uid}
                        </div>
                        <div>
                            <strong>Email:</strong> {user.email}
                        </div>
                        <div>
                            <strong>Email Verified:</strong> {user.emailVerified ? '✅' : '❌'}
                        </div>
                        <div>
                            <strong>Admin Context:</strong> {isAdmin ? '✅' : '❌'}
                        </div>
                    </div>
                </div>

                {/* Custom Claims */}
                <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                        Custom Claims
                        {hasCustomClaims ? (
                            <Badge variant="default">✅ Valid</Badge>
                        ) : (
                            <Badge variant="destructive">❌ Missing</Badge>
                        )}
                    </h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                        <pre>{JSON.stringify(customClaims, null, 2)}</pre>
                    </div>
                </div>

                {/* Firestore User Document */}
                <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                        Firestore User Document
                        {hasFirestoreAccess ? (
                            <Badge variant="default">✅ Valid</Badge>
                        ) : (
                            <Badge variant="destructive">❌ No Admin Role</Badge>
                        )}
                    </h3>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                        {userDocData ? (
                            <pre>{JSON.stringify(userDocData, null, 2)}</pre>
                        ) : (
                            <p className="text-red-600">User document not found in Firestore</p>
                        )}
                    </div>
                </div>

                {/* Diagnosis */}
                <div>
                    <h3 className="font-medium mb-2">Diagnosis</h3>
                    <div className="space-y-2">
                        {!hasCustomClaims && !hasFirestoreAccess && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded">
                                <p className="text-red-600">
                                    <strong>❌ Permission Denied Issue:</strong> User has neither custom claims nor Firestore admin role.
                                    You need to either:
                                </p>
                                <ul className="mt-2 text-red-600 text-sm list-disc pl-5">
                                    <li>Set custom claim: admin: true via Cloud Functions</li>
                                    <li>Or set Firestore document: users/{'{uid}'}/role = 'admin'</li>
                                </ul>
                            </div>
                        )}

                        {hasFirestoreAccess && !hasCustomClaims && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                                <p className="text-yellow-600">
                                    <strong>⚠️ Partial Access:</strong> User has Firestore admin role but no custom claims.
                                    This should work for most operations.
                                </p>
                            </div>
                        )}

                        {(hasCustomClaims || hasFirestoreAccess) && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded">
                                <p className="text-green-600">
                                    <strong>✅ Access Granted:</strong> User has proper admin permissions.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
