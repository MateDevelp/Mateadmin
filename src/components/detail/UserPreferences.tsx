import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { User } from 'lucide-react';
import { formatPreference, getPreferenceColor } from '../../utils/userHelpers';

interface UserPreferencesProps {
    preferencesSelf?: {
        cleanliness?: number;
        expenses?: number;
        lifestyle?: number;
        presence?: number;
        sociability?: number;
    };
    preferencesDesired?: {
        cleanliness?: number;
        expenses?: number;
        lifestyle?: number;
        presence?: number;
        sociability?: number;
    };
}

export default function UserPreferences({ preferencesSelf, preferencesDesired }: UserPreferencesProps) {
    const preferenceLabels: Record<string, { label: string; icon: string }> = {
        cleanliness: { label: 'Pulizia', icon: '🧹' },
        expenses: { label: 'Spese', icon: '💰' },
        lifestyle: { label: 'Stile di vita', icon: '🌟' },
        presence: { label: 'Presenza in casa', icon: '🏠' },
        sociability: { label: 'Socialità', icon: '🤝' }
    };

    const hasSelf = preferencesSelf && Object.values(preferencesSelf).some(v => v && v > 0);
    const hasDesired = preferencesDesired && Object.values(preferencesDesired).some(v => v && v > 0);

    if (!hasSelf && !hasDesired) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Preferenze Convivenza
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">Nessuna preferenza configurata</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Preferenze Convivenza
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Self Preferences */}
                {hasSelf && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            🙋‍♂️ Come Mi Descrivo
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(preferencesSelf || {}).map(([key, value]) => {
                                if (!value || value === 0) return null;
                                const pref = preferenceLabels[key];
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">
                                            {pref.icon} {pref.label}
                                        </span>
                                        <Badge className={getPreferenceColor(value)}>
                                            {formatPreference(value)}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Desired Preferences */}
                {hasDesired && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            🔍 Cosa Cerco nel Coinquilino
                        </h4>
                        <div className="space-y-2">
                            {Object.entries(preferencesDesired || {}).map(([key, value]) => {
                                if (!value || value === 0) return null;
                                const pref = preferenceLabels[key];
                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">
                                            {pref.icon} {pref.label}
                                        </span>
                                        <Badge className={getPreferenceColor(value)}>
                                            {formatPreference(value)}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
