/**
 * User Data Helpers
 * Utility functions per parsare e formattare i dati degli utenti
 */

// Parse birthCity da stringa JSON o oggetto
export const parseBirthCity = (birthCity?: string | any): any => {
    if (!birthCity) return null;
    if (typeof birthCity === 'object') return birthCity;
    try {
        return JSON.parse(birthCity);
    } catch {
        return null;
    }
};

// Formatta la città di nascita
export const formatBirthCity = (birthCity?: string | any): string => {
    const parsed = parseBirthCity(birthCity);
    if (!parsed) return 'Non specificata';
    return parsed.fullName || parsed.name || 'Non specificata';
};

// Formatta la destinazione
export const formatDestinationCity = (destinationCity?: any): string => {
    if (!destinationCity) return 'Non specificata';
    return destinationCity.fullName || destinationCity.name || 'Non specificata';
};

// Ottieni età da birthDate
export const getAge = (birthDate?: string): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// Formatta la data in italiano
export const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

// Formatta timestamp Firestore
export const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return 'N/A';
};

// Ottieni numero totale di immagini (avatar + gallery)
export const getTotalImages = (user: any): number => {
    let count = 0;
    if (user.avatar || user.photoURL) count++;
    if (user.gallery?.length) count += user.gallery.length;
    return count;
};

// Verifica se l'utente ha completato il profilo
export const isProfileComplete = (user: any): boolean => {
    return !!(
        user.firstName &&
        user.lastName &&
        user.email &&
        user.birthDate &&
        user.destinationCity &&
        user.onboardingCompleted
    );
};

// Calcola percentuale completamento profilo
export const getProfileCompletionPercentage = (user: any): number => {
    const fields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'birthDate',
        'birthCity',
        'destinationCity',
        'bio',
        'jobTitle',
        'education',
        'avatar',
        'gallery'
    ];

    const completed = fields.filter(field => {
        const value = user[field];
        if (Array.isArray(value)) return value.length > 0;
        return !!value;
    }).length;

    return Math.round((completed / fields.length) * 100);
};

// Formatta il nome completo
export const getFullName = (user: any): string => {
    if (!user) return 'Utente sconosciuto';
    const first = user.firstName || '';
    const last = user.lastName || '';
    return `${first} ${last}`.trim() || 'Nome non disponibile';
};

// Formatta le preferenze (0-100 scale)
export const formatPreference = (value: number): string => {
    if (value === 0) return 'Non specificato';
    if (value < 33) return 'Basso';
    if (value < 67) return 'Medio';
    return 'Alto';
};

// Ottieni colore badge per preferenza
export const getPreferenceColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100 text-gray-800';
    if (value < 33) return 'bg-blue-100 text-blue-800';
    if (value < 67) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
};

// Formatta il genere
export const formatGender = (gender?: string): string => {
    if (!gender) return 'Non specificato';
    const genderMap: Record<string, string> = {
        'Maschio': '👨 Maschio',
        'Femmina': '👩 Femmina',
        'Altro': '🌈 Altro'
    };
    return genderMap[gender] || gender;
};

// Formatta la preferenza di genere coinquilino
export const formatRoommateGenderPreference = (pref?: string): string => {
    if (!pref) return 'Nessuna preferenza';
    const prefMap: Record<string, string> = {
        'uomo': '👨 Uomo',
        'donna': '👩 Donna',
        'indifferente': '🤝 Indifferente'
    };
    return prefMap[pref.toLowerCase()] || pref;
};

// Verifica se l'utente è admin
export const isUserAdmin = (user: any): boolean => {
    return user.role === 'admin' || user.isAdmin === true;
};

// Verifica se l'utente è verificato
export const isUserVerified = (user: any): boolean => {
    return user.UserVerificated === true || user.verified === true;
};

// Verifica se l'utente è bloccato
export const isUserBlocked = (user: any): boolean => {
    return user.blocked === true;
};

// Ottieni status badge dell'utente
export const getUserStatusBadges = (user: any) => {
    const badges = [];

    if (isUserAdmin(user)) {
        badges.push({ label: 'Admin', color: 'bg-purple-100 text-purple-800' });
    }

    if (isUserVerified(user)) {
        badges.push({ label: 'Verificato', color: 'bg-green-100 text-green-800' });
    }

    if (isUserBlocked(user)) {
        badges.push({ label: 'Bloccato', color: 'bg-red-100 text-red-800' });
    }

    if (user.profilePaused) {
        badges.push({ label: 'Profilo in pausa', color: 'bg-yellow-100 text-yellow-800' });
    }

    if (user.hasHouse) {
        badges.push({ label: 'Ha casa', color: 'bg-blue-100 text-blue-800' });
    }

    return badges;
};
