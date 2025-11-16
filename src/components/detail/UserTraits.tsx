import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Sparkles } from 'lucide-react';

interface UserTraitsProps {
    traits?: number[];
    traitsDesired?: number[];
}

// Mapping dei trait ID ai loro dettagli (da espandere)
const getTraitInfo = (id: number): { label: string; icon: string; category: string } => {
    const traitMap: Record<number, { label: string; icon: string; category: string }> = {
        1: { label: 'Sportivo', icon: '⚽', category: 'interests' },
        3: { label: 'Creativo', icon: '🎨', category: 'interests' },
        4: { label: 'Spontaneo', icon: '✨', category: 'lifestyle' },
        5: { label: 'Organizzato', icon: '📋', category: 'lifestyle' },
        6: { label: 'Sociale', icon: '👥', category: 'lifestyle' },
        8: { label: 'Avventuroso', icon: '🗺️', category: 'interests' },
        16: { label: 'Lettore', icon: '📚', category: 'interests' },
        17: { label: 'Musicista', icon: '🎵', category: 'interests' },
        23: { label: 'Tecnologico', icon: '💻', category: 'interests' },
        24: { label: 'Cuoco', icon: '👨‍🍳', category: 'interests' },
        30: { label: 'Viaggiatore', icon: '✈️', category: 'interests' },
        51: { label: 'Palestra', icon: '💪', category: 'interests' },
        62: { label: 'Arti marziali', icon: '🥋', category: 'interests' },
        78: { label: 'Cinema', icon: '🎬', category: 'interests' },
        95: { label: 'Stand-up comedy', icon: '🎭', category: 'interests' },
        176: { label: 'Determinato', icon: '🎯', category: 'values' }
    };
    
    return traitMap[id] || { label: `Trait #${id}`, icon: '⭐', category: 'other' };
};

export default function UserTraits({ traits, traitsDesired }: UserTraitsProps) {
    const hasTraits = traits && traits.length > 0;
    const hasDesired = traitsDesired && traitsDesired.length > 0;

    if (!hasTraits && !hasDesired) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Interessi e Caratteristiche
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">Nessun trait configurato</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Interessi e Caratteristiche
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* User's Traits */}
                {hasTraits && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            🙋‍♂️ I Miei Interessi ({traits.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {traits.map((traitId) => {
                                const trait = getTraitInfo(traitId);
                                return (
                                    <Badge
                                        key={traitId}
                                        variant="default"
                                        className="bg-blue-100 text-blue-800 px-3 py-1"
                                    >
                                        <span className="mr-1">{trait.icon}</span>
                                        {trait.label}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Desired Traits */}
                {hasDesired && (
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            🔍 Cosa Cerco nel Coinquilino ({traitsDesired.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {traitsDesired.map((traitId) => {
                                const trait = getTraitInfo(traitId);
                                return (
                                    <Badge
                                        key={traitId}
                                        variant="outline"
                                        className="border-green-300 text-green-700 px-3 py-1"
                                    >
                                        <span className="mr-1">{trait.icon}</span>
                                        {trait.label}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
