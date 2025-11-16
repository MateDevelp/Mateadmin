import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, Bed } from 'lucide-react';

interface HouseRoomsProps {
    rooms: any;
}

export default function HouseRooms({ rooms }: HouseRoomsProps) {
    if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Stanze e Posti Letto</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-center py-4">Nessuna stanza configurata</p>
                </CardContent>
            </Card>
        );
    }

    const getBedTypeLabel = (type: string): string => {
        const types: Record<string, string> = {
            'Letto singolo': '🛏️ Singolo',
            'Letto matrimoniale': '🛏️🛏️ Matrimoniale',
            'Letto a castello': '🪜 A castello'
        };
        return types[type] || type || 'Letto';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Stanze e Posti Letto
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {rooms.map((room: any, roomIndex: number) => (
                        <div key={roomIndex} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-gray-900">
                                    {room.name || `Camera ${roomIndex + 1}`}
                                </h4>
                                <Badge variant="outline">
                                    {room.beds?.length || 0} {room.beds?.length === 1 ? 'letto' : 'letti'}
                                </Badge>
                            </div>

                            {room.beds && Array.isArray(room.beds) && room.beds.length > 0 ? (
                                <div className="space-y-2">
                                    {room.beds.map((bed: any, bedIndex: number) => (
                                        <div
                                            key={bedIndex}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Bed className="w-4 h-4 text-gray-600" />
                                                <div>
                                                    <p className="font-medium text-sm">
                                                        {getBedTypeLabel(bed.type)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Capacità: {bed.capacity || 1} {bed.capacity === 1 ? 'persona' : 'persone'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                {bed.pricePerPerson && (
                                                    <p className="font-semibold text-blue-600">
                                                        €{bed.pricePerPerson}/mese
                                                    </p>
                                                )}
                                                {bed.assignedTo ? (
                                                    <Badge className="bg-green-100 text-green-800 mt-1">
                                                        Occupato: {bed.assignedTo.name || 'Inquilino'}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-300 mt-1">
                                                        Disponibile
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">Nessun letto configurato</p>
                            )}

                            {room.notes && (
                                <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                                    📝 {room.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
