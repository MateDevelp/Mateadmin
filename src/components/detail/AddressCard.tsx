import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { formatAddress, getGoogleMapsLink, getCityFromAddress } from '../../utils/houseHelpers';

interface AddressCardProps {
    address: any;
}

export default function AddressCard({ address }: AddressCardProps) {
    const formattedAddress = formatAddress(address);
    const city = getCityFromAddress(address);
    const mapsLink = getGoogleMapsLink(address);

    if (!address || formattedAddress === 'Indirizzo non disponibile') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Indirizzo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">Indirizzo non disponibile</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Indirizzo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-lg font-semibold text-gray-900">{formattedAddress}</p>
                    {city && <p className="text-gray-600 mt-1">{city}</p>}
                </div>

                {typeof address === 'object' && (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        {address.street && (
                            <div>
                                <p className="text-gray-500">Via</p>
                                <p className="font-medium">{address.street} {address.houseNumber}</p>
                            </div>
                        )}
                        {address.city && (
                            <div>
                                <p className="text-gray-500">Città</p>
                                <p className="font-medium">{address.city}</p>
                            </div>
                        )}
                        {address.postalCode && (
                            <div>
                                <p className="text-gray-500">CAP</p>
                                <p className="font-medium">{address.postalCode}</p>
                            </div>
                        )}
                        {address.province && (
                            <div>
                                <p className="text-gray-500">Provincia</p>
                                <p className="font-medium">{address.province}</p>
                            </div>
                        )}
                        {address.region && (
                            <div>
                                <p className="text-gray-500">Regione</p>
                                <p className="font-medium">{address.region}</p>
                            </div>
                        )}
                        {address.country && (
                            <div>
                                <p className="text-gray-500">Nazione</p>
                                <p className="font-medium">{address.country}</p>
                            </div>
                        )}
                    </div>
                )}

                {address.latitude && address.longitude && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <span>📍 Coordinate:</span>
                        <code className="font-mono">{address.latitude.toFixed(6)}, {address.longitude.toFixed(6)}</code>
                    </div>
                )}

                {mapsLink && (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(mapsLink, '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apri in Google Maps
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
