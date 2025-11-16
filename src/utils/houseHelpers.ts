/**
 * House Data Helpers
 * Utility functions per parsare e formattare i dati delle case
 */

// Formatta l'indirizzo completo
export const formatAddress = (address: any): string => {
    if (!address) return 'Indirizzo non disponibile';
    
    if (typeof address === 'string') return address;
    
    return address.fullAddress || 
           address.shortAddress || 
           `${address.street || ''} ${address.houseNumber || ''}`.trim() ||
           'Indirizzo non disponibile';
};

// Ottieni la città dall'indirizzo
export const getCityFromAddress = (address: any): string => {
    if (!address) return '';
    if (typeof address === 'string') return '';
    return address.city || '';
};

// Ottieni coordinate geografiche
export const getCoordinates = (address: any): { lat: number; lng: number } | null => {
    if (!address || typeof address === 'string') return null;
    if (address.latitude && address.longitude) {
        return { lat: address.latitude, lng: address.longitude };
    }
    return null;
};

// Formatta le coordinate per Google Maps
export const getGoogleMapsLink = (address: any): string | null => {
    const coords = getCoordinates(address);
    if (!coords) return null;
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
};

// Conta il numero totale di stanze
export const getRoomsCount = (rooms: any): number => {
    if (!rooms) return 0;
    if (typeof rooms === 'number') return rooms;
    if (Array.isArray(rooms)) return rooms.length;
    return 0;
};

// Conta il numero totale di letti
export const getTotalBedsCount = (rooms: any): number => {
    if (!rooms || typeof rooms === 'number') return 0;
    if (!Array.isArray(rooms)) return 0;
    
    return rooms.reduce((total, room) => {
        if (room.beds && Array.isArray(room.beds)) {
            return total + room.beds.reduce((sum: number, bed: any) => sum + (bed.capacity || 1), 0);
        }
        return total;
    }, 0);
};

// Ottieni posti letto disponibili
export const getAvailableBedsCount = (rooms: any): number => {
    if (!rooms || !Array.isArray(rooms)) return 0;
    
    return rooms.reduce((total, room) => {
        if (room.beds && Array.isArray(room.beds)) {
            const available = room.beds.filter((bed: any) => !bed.assignedTo).length;
            return total + available;
        }
        return total;
    }, 0);
};

// Calcola prezzo minimo
export const getMinPrice = (rooms: any): number | null => {
    if (!rooms || !Array.isArray(rooms)) return null;
    
    const prices: number[] = [];
    rooms.forEach(room => {
        if (room.beds && Array.isArray(room.beds)) {
            room.beds.forEach((bed: any) => {
                if (bed.pricePerPerson) {
                    const price = parseFloat(bed.pricePerPerson);
                    if (!isNaN(price)) prices.push(price);
                }
            });
        }
    });
    
    return prices.length > 0 ? Math.min(...prices) : null;
};

// Calcola prezzo massimo
export const getMaxPrice = (rooms: any): number | null => {
    if (!rooms || !Array.isArray(rooms)) return null;
    
    const prices: number[] = [];
    rooms.forEach(room => {
        if (room.beds && Array.isArray(room.beds)) {
            room.beds.forEach((bed: any) => {
                if (bed.pricePerPerson) {
                    const price = parseFloat(bed.pricePerPerson);
                    if (!isNaN(price)) prices.push(price);
                }
            });
        }
    });
    
    return prices.length > 0 ? Math.max(...prices) : null;
};

// Formatta il range di prezzo
export const formatPriceRange = (rooms: any): string => {
    const min = getMinPrice(rooms);
    const max = getMaxPrice(rooms);
    
    if (!min && !max) return 'Prezzo non disponibile';
    if (min === max) return `€${min}/mese`;
    return `€${min} - €${max}/mese`;
};

// Conta amenities attive
export const getActiveAmenitiesCount = (amenities: any): number => {
    if (!amenities) return 0;
    return Object.values(amenities).filter(v => v === true).length;
};

// Ottieni lista amenities attive
export const getActiveAmenities = (amenities: any): string[] => {
    if (!amenities) return [];
    
    const amenityLabels: Record<string, string> = {
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
    
    return Object.entries(amenities)
        .filter(([_, value]) => value === true)
        .map(([key]) => amenityLabels[key] || key);
};

// Ottieni icona per amenity
export const getAmenityIcon = (amenity: string): string => {
    const icons: Record<string, string> = {
        wifi: '📶',
        washingMachine: '🧺',
        dishwasher: '🍽️',
        airConditioning: '❄️',
        heating: '🔥',
        parking: '🚗',
        elevator: '🛗',
        balcony: '🏡',
        garden: '🌳',
        furnished: '🛋️',
        pets: '🐾',
        utilities: '💡'
    };
    return icons[amenity] || '✓';
};

// Formatta il tipo di casa
export const formatHouseType = (type?: string): string => {
    if (!type) return 'Non specificato';
    const types: Record<string, string> = {
        'Appartamento': '🏢 Appartamento',
        'Casa': '🏠 Casa',
        'Villa': '🏡 Villa',
        'Loft': '🏭 Loft',
        'Monolocale': '🚪 Monolocale'
    };
    return types[type] || type;
};

// Verifica se la casa è verificata
export const isHouseVerified = (house: any): boolean => {
    return house.verified === true;
};

// Verifica se la casa è attiva
export const isHouseActive = (house: any): boolean => {
    return house.active !== false;
};

// Ottieni status badges della casa
export const getHouseStatusBadges = (house: any) => {
    const badges = [];
    
    if (isHouseVerified(house)) {
        badges.push({ label: 'Verificata', color: 'bg-green-100 text-green-800' });
    } else {
        badges.push({ label: 'Non verificata', color: 'bg-yellow-100 text-yellow-800' });
    }
    
    if (isHouseActive(house)) {
        badges.push({ label: 'Attiva', color: 'bg-blue-100 text-blue-800' });
    } else {
        badges.push({ label: 'Non attiva', color: 'bg-gray-100 text-gray-800' });
    }
    
    const availableBeds = getAvailableBedsCount(house.rooms);
    if (availableBeds > 0) {
        badges.push({ label: `${availableBeds} posti liberi`, color: 'bg-purple-100 text-purple-800' });
    } else {
        badges.push({ label: 'Completa', color: 'bg-red-100 text-red-800' });
    }
    
    return badges;
};

// Formatta la dimensione
export const formatSize = (size?: string | number): string => {
    if (!size) return 'Non specificata';
    return `${size} m²`;
};

// Formatta il piano
export const formatFloor = (floor?: string | number): string => {
    if (!floor && floor !== 0) return 'Non specificato';
    if (floor === 0 || floor === '0') return 'Piano terra';
    return `${floor}° piano`;
};

// Formatta le spese
export const formatExpenses = (expenses?: string | number): string => {
    if (!expenses) return 'Non specificate';
    return `€${expenses}/mese`;
};

// Conta il numero di foto
export const getPhotosCount = (photos: any): number => {
    if (!photos || !Array.isArray(photos)) return 0;
    return photos.length;
};

// Verifica se ha l'autorizzazione a pubblicare
export const hasPublishAuthorization = (house: any): boolean => {
    return house.authorizedToPublish === true;
};
