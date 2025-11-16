import React, { useState } from 'react';
import { useAdmin } from '../AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Crown, RefreshCw } from 'lucide-react';

export default function CustomClaimsSetup() {
    const { user } = useAdmin();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const setAdminClaims = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Use HTTP endpoint instead of callable function to avoid CORS issues
            const response = await fetch('https://us-central1-mate-website-cd962.cloudfunctions.net/setAdminRoleHttp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setResult(data);

            // Force token refresh after 2 seconds
            setTimeout(async () => {
                try {
                    await user.getIdToken(true);
                    window.location.reload(); // Reload to update admin context
                } catch (refreshError) {
                    console.error('Error refreshing token:', refreshError);
                }
            }, 2000);

        } catch (error: any) {
            console.error('Error setting admin role:', error);
            setError(error.message || 'Failed to set admin role');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Card className="border-red-200">
                <CardContent className="p-6">
                    <p className="text-center text-red-600">User not authenticated</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5" />
                    Custom Claims Setup
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-medium mb-2">Current User</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                        <div><strong>UID:</strong> {user.uid}</div>
                        <div><strong>Email:</strong> {user.email}</div>
                        <div className="flex items-center gap-2">
                            <strong>Current Admin Claim:</strong>
                            {(user as any).admin ? (
                                <Badge variant="default" className="bg-green-500">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Yes
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    No
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">Set Admin Custom Claims</h4>
                    <p className="text-sm text-gray-600 mb-3">
                        This will call the Cloud Function to set admin=true in your custom claims.
                        This is required for full access to admin collections.
                    </p>

                    <Button
                        onClick={setAdminClaims}
                        disabled={loading || (user as any).admin}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Setting Admin Claims...
                            </>
                        ) : (user as any).admin ? (
                            <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Admin Claims Already Set
                            </>
                        ) : (
                            <>
                                <Crown className="w-4 h-4 mr-2" />
                                Set Admin Custom Claims
                            </>
                        )}
                    </Button>
                </div>

                {result && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-600">Success!</span>
                        </div>
                        <p className="text-green-700 text-sm">{result.message}</p>
                        <p className="text-green-600 text-xs mt-1">
                            Refreshing token and reloading page in 2 seconds...
                        </p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-red-600">Error</span>
                        </div>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    <strong>Note:</strong> After setting custom claims, the token will be refreshed
                    and the page will reload to apply the new permissions.
                </div>
            </CardContent>
        </Card>
    );
}
