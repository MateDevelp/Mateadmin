import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getActiveAmenities, getAmenityIcon } from '../../utils/houseHelpers';

interface HouseAmenitiesProps {
    amenities: any;
}

export default function HouseAmenities({ amenities }: HouseAmenitiesProps) {
    const activeAmenities = getActiveAmenities(amenities);

    if (activeAmenities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Servizi e Caratteristiche</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">Nessun servizio specificato</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Servizi e Caratteristiche</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(amenities).map(([key, value]) => {
                        const icon = getAmenityIcon(key);
                        const labels: Record<string, string> = {
                            wifi: 'Wi-Fi',
                            washingMachine: 'Lavatrice',
                            dishwasher: 'Lavastoviglie',
                            airConditioning: 'Aria condizionata',
                            heating: 'Riscaldamento',
                            parking: 'Parcheggio',
                            elevator: 'Ascensore',
                            balcony: 'Balcone',
                            garden: 'Giardino',
                            furnished: 'Arredato',
                            pets: 'Animali ammessi',
                            utilities: 'Utenze incluse'
                        };
                        const label = labels[key] || key;

                        return (
                            <Badge
                                key={key}
                                variant={value ? 'default' : 'outline'}
                                className={value
                                    ? 'bg-green-100 text-green-800 justify-start'
                                    : 'bg-gray-50 text-gray-400 justify-start'
                                }
                            >
                                <span className="mr-2">{icon}</span>
                                {label}
                            </Badge>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
