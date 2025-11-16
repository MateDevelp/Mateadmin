// Browser-compatible Google Analytics service
// Uses backend API for real Google Analytics 4 data

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';
const API_KEY = import.meta.env.VITE_API_KEY;

export interface GAMetrics {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    sessions: number;
    pageviews: number;
    averageSessionDuration: string;
    bounceRate: number;
}

export interface GADimensions {
    topPages: Array<{
        page: string;
        views: number;
        uniqueUsers: number;
    }>;
    deviceTypes: Array<{
        device: string;
        users: number;
        percentage: number;
    }>;
    locations: Array<{
        country: string;
        city?: string;
        users: number;
    }>;
}

export interface GATimeSeriesData {
    userGrowth: Array<{
        date: string;
        users: number;
        newUsers: number;
    }>;
}

class GoogleAnalyticsService {
    private propertyId: string;
    private isBrowserEnvironment: boolean;
    private useBackend: boolean;

    constructor() {
        this.propertyId = import.meta.env.VITE_GA_PROPERTY_ID || 'properties/YOUR_PROPERTY_ID';
        this.isBrowserEnvironment = typeof window !== 'undefined';
        this.useBackend = import.meta.env.VITE_USE_BACKEND === 'true';

        if (this.useBackend) {
            console.log('🔄 Using backend API for Google Analytics data');
            console.log('📡 Backend URL:', API_BASE_URL);
        } else {
            console.log('⚠️  Using mock data - set VITE_USE_BACKEND=true to use real data');
        }
    }

    private async fetchFromBackend(endpoint: string, dateRange: string) {
        const url = `${API_BASE_URL}/analytics/${endpoint}?dateRange=${dateRange}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };

        if (API_KEY) {
            headers['X-API-Key'] = API_KEY;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Backend API error: ${errorData.error || response.statusText}`);
        }

        return response.json();
    } async getMetrics(dateRange: 'today' | '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo'): Promise<GAMetrics> {
        if (this.useBackend) {
            try {
                console.log(`🔄 Fetching GA metrics for ${dateRange} from backend`);
                return await this.fetchFromBackend('metrics', dateRange);
            } catch (error) {
                console.error('Backend API error, falling back to mock data:', error);
                return this.getMockMetrics();
            }
        }

        console.log(`📊 Using mock GA metrics for ${dateRange}`);
        return this.getMockMetrics();
    }

    async getTopPages(dateRange: 'today' | '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo'): Promise<GADimensions['topPages']> {
        if (this.useBackend) {
            try {
                return await this.fetchFromBackend('top-pages', dateRange);
            } catch (error) {
                console.error('Backend API error, falling back to mock data:', error);
                return this.getMockTopPages();
            }
        }

        return this.getMockTopPages();
    }

    async getDeviceTypes(dateRange: 'today' | '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo'): Promise<GADimensions['deviceTypes']> {
        if (this.useBackend) {
            try {
                return await this.fetchFromBackend('device-types', dateRange);
            } catch (error) {
                console.error('Backend API error, falling back to mock data:', error);
                return this.getMockDeviceTypes();
            }
        }

        return this.getMockDeviceTypes();
    }

    async getLocations(dateRange: 'today' | '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo'): Promise<GADimensions['locations']> {
        if (this.useBackend) {
            try {
                return await this.fetchFromBackend('locations', dateRange);
            } catch (error) {
                console.error('Backend API error, falling back to mock data:', error);
                return this.getMockLocations();
            }
        }

        return this.getMockLocations();
    }

    async getUserGrowth(dateRange: 'today' | '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo'): Promise<GATimeSeriesData['userGrowth']> {
        if (this.useBackend) {
            try {
                return await this.fetchFromBackend('user-growth', dateRange);
            } catch (error) {
                console.error('Backend API error, falling back to mock data:', error);
                return this.getMockUserGrowth(dateRange);
            }
        }

        return this.getMockUserGrowth(dateRange);
    }

    // Metodo per caricare tutti i dati in una volta (più efficiente)
    async getAllData(dateRange: 'today' | '7daysAgo' | '30daysAgo' | '90daysAgo' = '30daysAgo'): Promise<{
        metrics: GAMetrics;
        topPages: GADimensions['topPages'];
        deviceTypes: GADimensions['deviceTypes'];
        locations: GADimensions['locations'];
        userGrowth: GATimeSeriesData['userGrowth'];
    }> {
        if (this.useBackend) {
            try {
                console.log(`🔄 Fetching all GA data for ${dateRange} from backend`);
                const data = await this.fetchFromBackend('all', dateRange);
                return {
                    metrics: data.metrics,
                    topPages: data.topPages,
                    deviceTypes: data.deviceTypes,
                    locations: data.locations,
                    userGrowth: data.userGrowth
                };
            } catch (error) {
                console.error('Backend API error, falling back to mock data:', error);
            }
        }

        // Fallback: usa chiamate individuali (mock data)
        console.log(`📊 Using mock data for ${dateRange}`);
        const [metrics, topPages, deviceTypes, locations, userGrowth] = await Promise.all([
            this.getMockMetrics(),
            this.getMockTopPages(),
            this.getMockDeviceTypes(),
            this.getMockLocations(),
            this.getMockUserGrowth(dateRange)
        ]);

        return { metrics, topPages, deviceTypes, locations, userGrowth };
    }

    // Utility methods
    private formatDuration(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}m ${remainingSeconds}s`;
    }

    private formatDate(dateString: string): string {
        // GA returns dates in format YYYYMMDD
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
    }

    // Mock data methods for development/fallback
    private getMockMetrics(): GAMetrics {
        return {
            totalUsers: 15420 + Math.floor(Math.random() * 1000),
            activeUsers: 3421 + Math.floor(Math.random() * 500),
            newUsers: 1205 + Math.floor(Math.random() * 200),
            sessions: 22341 + Math.floor(Math.random() * 2000),
            pageviews: 89234 + Math.floor(Math.random() * 5000),
            averageSessionDuration: '4m 32s',
            bounceRate: 42.3,
        };
    }

    private getMockTopPages(): GADimensions['topPages'] {
        return [
            { page: '/', views: 12453, uniqueUsers: 8234 },
            { page: '/search', views: 8901, uniqueUsers: 6123 },
            { page: '/profile', views: 5678, uniqueUsers: 4012 },
            { page: '/houses', views: 4321, uniqueUsers: 3456 },
            { page: '/messages', views: 3210, uniqueUsers: 2876 },
        ];
    }

    private getMockDeviceTypes(): GADimensions['deviceTypes'] {
        return [
            { device: 'mobile', users: 9252, percentage: 60 },
            { device: 'desktop', users: 4626, percentage: 30 },
            { device: 'tablet', users: 1542, percentage: 10 },
        ];
    }

    private getMockLocations(): GADimensions['locations'] {
        return [
            { country: 'Italy', city: 'Milano', users: 4521 },
            { country: 'Italy', city: 'Roma', users: 3876 },
            { country: 'Italy', city: 'Torino', users: 2134 },
            { country: 'Italy', city: 'Firenze', users: 1876 },
            { country: 'Italy', city: 'Bologna', users: 1543 },
        ];
    }

    private getMockUserGrowth(dateRange: string): GATimeSeriesData['userGrowth'] {
        const days = dateRange === '7daysAgo' ? 7 : dateRange === '30daysAgo' ? 30 : 90;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
                users: Math.floor(Math.random() * 500) + 200,
                newUsers: Math.floor(Math.random() * 100) + 50,
            });
        }
        return data;
    }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
export default GoogleAnalyticsService;
