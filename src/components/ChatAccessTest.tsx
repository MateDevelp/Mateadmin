import React, { useEffect, useState } from 'react';
import { collection, query, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAdmin } from '../AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { AlertCircle, CheckCircle, MessageCircle, RefreshCw } from 'lucide-react';

export default function ChatAccessTest() {
    const { user, isAdmin } = useAdmin();
    const [testResults, setTestResults] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        const results: any = {};

        // Test 1: Check user document access
        try {
            const userDocRef = collection(db, 'users');
            const userQuery = query(userDocRef, limit(1));
            const userSnap = await getDocs(userQuery);
            results.userAccess = { success: true, count: userSnap.size };
        } catch (error: any) {
            results.userAccess = { success: false, error: error.message };
        }

        // Test 2: Check conversations collection access
        try {
            const conversationsRef = collection(db, 'conversations');
            const convQuery = query(conversationsRef, limit(5));
            const convSnap = await getDocs(convQuery);
            results.conversationsAccess = { success: true, count: convSnap.size };
        } catch (error: any) {
            results.conversationsAccess = { success: false, error: error.message };
        }

        // Test 3: Check audit log access
        try {
            const auditLogRef = collection(db, 'auditLog');
            const auditQuery = query(auditLogRef, limit(1));
            const auditSnap = await getDocs(auditLogRef);
            results.auditLogAccess = { success: true, count: auditSnap.size };
        } catch (error: any) {
            results.auditLogAccess = { success: false, error: error.message };
        }

        // Test 4: Real-time listener test
        try {
            const conversationsRef = collection(db, 'conversations');
            const convQuery = query(conversationsRef, limit(1));

            const unsubscribe = onSnapshot(convQuery,
                (snapshot) => {
                    results.realtimeAccess = { success: true, count: snapshot.size };
                    unsubscribe();
                    setTestResults({ ...results });
                    setLoading(false);
                },
                (error) => {
                    results.realtimeAccess = { success: false, error: error.message };
                    setTestResults({ ...results });
                    setLoading(false);
                }
            );

            // Set timeout fallback
            setTimeout(() => {
                if (loading) {
                    results.realtimeAccess = { success: false, error: 'Timeout' };
                    setTestResults({ ...results });
                    setLoading(false);
                }
            }, 5000);

            return; // Don't set loading false here, wait for the listener
        } catch (error: any) {
            results.realtimeAccess = { success: false, error: error.message };
        }

        setTestResults(results);
        setLoading(false);
    };

    useEffect(() => {
        if (user && isAdmin) {
            runTests();
        }
    }, [user, isAdmin]);

    if (!user) {
        return (
            <Card className="border-red-200">
                <CardContent className="p-6">
                    <p className="text-center text-red-600">User not authenticated</p>
                </CardContent>
            </Card>
        );
    }

    if (!isAdmin) {
        return (
            <Card className="border-yellow-200">
                <CardContent className="p-6">
                    <p className="text-center text-yellow-600">User is not admin</p>
                </CardContent>
            </Card>
        );
    }

    const renderTestResult = (test: string, result: any) => {
        if (!result) return <Badge variant="outline">Not tested</Badge>;

        return (
            <div className="flex items-center gap-2">
                {result.success ? (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success ({result.count} items)
                    </Badge>
                ) : (
                    <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Failed: {result.error}
                    </Badge>
                )}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Chat Access Test
                    <Button variant="outline" size="sm" onClick={runTests} disabled={loading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Test Access
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-medium mb-2">Authentication Status</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>UID: {user.uid}</div>
                        <div>Email: {user.email}</div>
                        <div>Admin: {isAdmin ? '✅' : '❌'}</div>
                        <div>Email Verified: {user.emailVerified ? '✅' : '❌'}</div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Access Tests</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Users Collection:</span>
                            {renderTestResult('userAccess', testResults.userAccess)}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Conversations Collection:</span>
                            {renderTestResult('conversationsAccess', testResults.conversationsAccess)}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Audit Log Collection:</span>
                            {renderTestResult('auditLogAccess', testResults.auditLogAccess)}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Real-time Listener:</span>
                            {renderTestResult('realtimeAccess', testResults.realtimeAccess)}
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="flex items-center justify-center py-4">
                        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                        <span className="text-gray-600">Running access tests...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
