import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building2 } from 'lucide-react';
import { Badge } from '../ui/badge';

interface HousePhotosProps {
    photos?: string[];
    title?: string;
}

export default function HousePhotos({ photos, title }: HousePhotosProps) {
    if (!photos || photos.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Foto della Casa
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                        <div className="text-center">
                            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Nessuna foto disponibile</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Foto della Casa
                    <Badge variant="outline" className="ml-auto">
                        {photos.length} {photos.length === 1 ? 'foto' : 'foto'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Main Photo */}
                <div className="mb-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={photos[0]}
                            alt={title || 'Foto principale'}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Thumbnail Grid */}
                {photos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                        {photos.slice(1).map((photo, index) => (
                            <div
                                key={index}
                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={photo}
                                    alt={`Foto ${index + 2}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
