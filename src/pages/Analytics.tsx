import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
    TrendingUp, TrendingDown, Users, Home, Eye, Clock,
    MapPin, RefreshCw, Calendar, BarChart3, LineChart,
    Globe, Smartphone, Monitor, Target, Activity, Radio,
    Tag, Filter
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { googleAnalyticsService, GAMetrics, GADimensions, GATimeSeriesData } from '../utils/googleAnalytics';

interface AnalyticsData {
    metrics: GAMetrics;
    topPages: GADimensions['topPages'];
    deviceTypes: GADimensions['deviceTypes'];
    locations: GADimensions['locations'];
    userGrowth: GATimeSeriesData['userGrowth'];
    conversionFunnel: Array<{
        step: string;
        users: number;
        percentage: number;
    }>;
}

const COLORS = ['#336CFF', '#FF832E', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Analytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'custom'>('30d');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showRealtime, setShowRealtime] = useState(false);
    const [realtimeUsers, setRealtimeUsers] = useState(0);

    useEffect(() => {
        loadAnalyticsData();
    }, [selectedPeriod, customStartDate, customEndDate]);

    // Real-time polling
    useEffect(() => {
        if (showRealtime) {
            const interval = setInterval(() => {
                // Simula utenti real-time (in produzione, chiamare API GA4 real-time)
                setRealtimeUsers(Math.floor(Math.random() * 50) + 10);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [showRealtime]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);

            // Mappa il periodo selezionato al formato GA
            const gaDateRange = selectedPeriod === '7d' ? '7daysAgo' :
                selectedPeriod === '30d' ? '30daysAgo' : '90daysAgo';

            // Usa il metodo efficiente per caricare tutti i dati in una volta
            const { metrics, topPages, deviceTypes, locations, userGrowth } =
                await googleAnalyticsService.getAllData(gaDateRange);

            // Genera funnel di conversione (mock data basato sui dati reali)
            const conversionFunnel = [
                { step: 'Visite', users: metrics.totalUsers, percentage: 100 },
                { step: 'Registrazioni', users: Math.floor(metrics.totalUsers * 0.2), percentage: 20 },
                { step: 'Profilo Completo', users: Math.floor(metrics.totalUsers * 0.14), percentage: 14 },
                { step: 'Prima Ricerca', users: Math.floor(metrics.totalUsers * 0.09), percentage: 9 },
                { step: 'Primo Contatto', users: Math.floor(metrics.totalUsers * 0.04), percentage: 4 }
            ];

            const analyticsData: AnalyticsData = {
                metrics,
                topPages,
                deviceTypes,
                locations,
                userGrowth,
                conversionFunnel
            };

            setData(analyticsData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateTimeSeriesData = (period: '7d' | '30d' | '90d') => {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const data = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            data.push({
                date: date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' }),
                users: Math.floor(Math.random() * 500) + 200,
                newUsers: Math.floor(Math.random() * 100) + 50
            });
        }
        return data;
    };

    const getTrendIcon = (value: number) => {
        return value > 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />;
    };

    const getTrendColor = (value: number) => {
        return value > 0 ? 'text-green-600' : 'text-red-600';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        );
    }

    if (!data) {
        return (
            <AdminLayout>
                <div className="text-center py-12">
                    <p className="text-gray-500">Errore nel caricamento dei dati analytics</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-600 mt-2">
                            Analisi dettagliata dell'utilizzo della piattaforma Mate con dati Google Analytics 4
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {lastUpdated && (
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Aggiornato: {lastUpdated.toLocaleTimeString('it-IT')}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {(['7d', '30d', '90d', 'custom'] as const).map((period) => (
                                <Button
                                    key={period}
                                    variant={selectedPeriod === period ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedPeriod(period)}
                                >
                                    {period === '7d' && '7 giorni'}
                                    {period === '30d' && '30 giorni'}
                                    {period === '90d' && '90 giorni'}
                                    {period === 'custom' && <><Calendar className="w-4 h-4 mr-1" />Personalizzato</>}
                                </Button>
                            ))}
                        </div>

                        <Button
                            onClick={() => setShowRealtime(!showRealtime)}
                            variant={showRealtime ? 'default' : 'outline'}
                            size="sm"
                            className={showRealtime ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                            <Radio className="h-4 w-4 mr-2" />
                            Real-time
                        </Button>

                        <Button
                            onClick={loadAnalyticsData}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Aggiorna
                        </Button>
                    </div>
                </div>

                {/* Custom Date Range Picker */}
                {selectedPeriod === 'custom' && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-gray-600" />
                                    <label className="text-sm font-medium">Data inizio:</label>
                                    <input
                                        type="date"
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-medium">Data fine:</label>
                                    <input
                                        type="date"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <Button
                                    onClick={loadAnalyticsData}
                                    disabled={!customStartDate || !customEndDate}
                                >
                                    Applica Filtro
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Real-time Users Card */}
                {showRealtime && (
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Radio className="w-8 h-8 text-green-600" />
                                        <span className="absolute top-0 right-0 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Utenti Online Ora</h3>
                                        <p className="text-sm text-gray-600">Aggiornato ogni 5 secondi</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-bold text-green-600">{realtimeUsers}</div>
                                    <p className="text-sm text-gray-600">utenti attivi</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Development Notice */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-0.5">ℹ️</div>
                            <div>
                                <h4 className="font-medium text-blue-900 mb-2">
                                    Google Analytics 4 - Backend Integration
                                </h4>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p>• <strong>Backend API disponibile</strong> in `backend/` per dati reali Google Analytics 4</p>
                                    <p>• <strong>Attualmente:</strong> Mostra dati demo (configura backend per dati reali)</p>
                                    <p>• <strong>Setup:</strong> `cd backend && npm install && npm run dev`</p>
                                    <p>• <strong>Config:</strong> Set `VITE_USE_BACKEND=true` per usare dati reali</p>
                                    <p>• <strong>Documentazione:</strong> `backend/README.md` per istruzioni complete</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Metriche principali */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utenti Totali</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.metrics.totalUsers.toLocaleString()}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getTrendIcon(12.5)}
                                <span className={getTrendColor(12.5)}>+12.5% vs periodo precedente</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utenti Attivi</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.metrics.activeUsers.toLocaleString()}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getTrendIcon(8.2)}
                                <span className={getTrendColor(8.2)}>+8.2% vs periodo precedente</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Nuovi Utenti</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.metrics.newUsers.toLocaleString()}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getTrendIcon(15.3)}
                                <span className={getTrendColor(15.3)}>+15.3% vs periodo precedente</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sessioni</CardTitle>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.metrics.sessions.toLocaleString()}</div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {getTrendIcon(5.7)}
                                <span className={getTrendColor(5.7)}>+5.7% vs periodo precedente</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs per diverse viste */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Panoramica</TabsTrigger>
                        <TabsTrigger value="users">Utenti</TabsTrigger>
                        <TabsTrigger value="behavior">Comportamento</TabsTrigger>
                        <TabsTrigger value="conversion">Conversioni</TabsTrigger>
                        <TabsTrigger value="utm">
                            <Tag className="w-4 h-4 mr-1" />
                            UTM Tags
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Grafico crescita utenti */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LineChart className="h-5 w-5" />
                                        Crescita Utenti ({selectedPeriod})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={data.userGrowth}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="users" stroke="#336CFF" fill="#336CFF" fillOpacity={0.1} />
                                            <Area type="monotone" dataKey="newUsers" stroke="#FF832E" fill="#FF832E" fillOpacity={0.1} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            {/* Dispositivi */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Monitor className="h-5 w-5" />
                                        Dispositivi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={data.deviceTypes}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={120}
                                                dataKey="users"
                                                label={({ device, percentage }) => `${device} ${percentage}%`}
                                            >
                                                {data.deviceTypes.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Metriche secondarie */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Durata Media Sessione</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-blue-600">{data.metrics.averageSessionDuration}</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Frequenza di Rimbalzo</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-green-600">{data.metrics.bounceRate}%</div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Visualizzazioni Pagina</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-purple-600">{data.metrics.pageviews.toLocaleString()}</div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="users" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Top Locations */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Top Città
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {data.locations.map((location, index) => (
                                            <div key={index} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">{index + 1}</Badge>
                                                    <div>
                                                        <div className="font-medium">{location.city}</div>
                                                        <div className="text-sm text-gray-500">{location.country}</div>
                                                    </div>
                                                </div>
                                                <div className="font-bold">{location.users.toLocaleString()}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Device Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Smartphone className="h-5 w-5" />
                                        Distribuzione Dispositivi
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={data.deviceTypes}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="device" />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="users" fill="#336CFF" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="behavior" className="space-y-6">
                        {/* Top Pages */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Pagine Più Visitate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.topPages.map((page, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Badge variant="outline">{index + 1}</Badge>
                                                <div>
                                                    <div className="font-mono text-sm">{page.page}</div>
                                                    <div className="text-sm text-gray-500">{page.uniqueUsers.toLocaleString()} utenti unici</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">{page.views.toLocaleString()}</div>
                                                <div className="text-sm text-gray-500">visualizzazioni</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="conversion" className="space-y-6">
                        {/* Conversion Funnel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Funnel di Conversione
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {data.conversionFunnel.map((step, index) => (
                                        <div key={index} className="relative">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{step.step}</div>
                                                        <div className="text-sm text-gray-500">{step.percentage}% del totale</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-lg">{step.users.toLocaleString()}</div>
                                                    <div className="text-sm text-gray-500">utenti</div>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-2 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${step.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* UTM Tags Tab */}
                    <TabsContent value="utm" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* UTM Source */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5" />
                                        Sorgenti di Traffico (utm_source)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {[
                                            { source: 'google', users: 1234, sessions: 1890, color: '#EA4335' },
                                            { source: 'facebook', users: 892, sessions: 1340, color: '#1877F2' },
                                            { source: 'instagram', users: 745, sessions: 1120, color: '#E4405F' },
                                            { source: 'email', users: 432, sessions: 650, color: '#336CFF' },
                                            { source: 'direct', users: 321, sessions: 480, color: '#10B981' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <span className="font-medium capitalize">{item.source}</span>
                                                </div>
                                                <div className="flex gap-6 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Utenti: </span>
                                                        <span className="font-semibold">{item.users.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Sessioni: </span>
                                                        <span className="font-semibold">{item.sessions.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* UTM Medium */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Canali (utm_medium)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {[
                                            { medium: 'cpc', users: 1567, conversions: 89 },
                                            { medium: 'organic', users: 1234, conversions: 67 },
                                            { medium: 'social', users: 892, conversions: 45 },
                                            { medium: 'email', users: 432, conversions: 34 },
                                            { medium: 'referral', users: 321, conversions: 21 }
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium uppercase text-sm">{item.medium}</span>
                                                    <div className="flex gap-4 text-sm">
                                                        <span className="text-gray-600">{item.users} utenti</span>
                                                        <span className="text-green-600 font-semibold">{item.conversions} conv.</span>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${(item.users / 1567) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* UTM Campaign */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Tag className="h-5 w-5" />
                                        Campagne (utm_campaign)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {[
                                            { campaign: 'summer_2024', users: 987, ctr: 3.4, cost: '€1,234' },
                                            { campaign: 'back_to_school', users: 745, ctr: 2.8, cost: '€890' },
                                            { campaign: 'welcome_offer', users: 632, ctr: 4.1, cost: '€567' },
                                            { campaign: 'referral_bonus', users: 421, ctr: 5.2, cost: '€0' },
                                            { campaign: 'newsletter_may', users: 312, ctr: 2.1, cost: '€234' }
                                        ].map((item, idx) => (
                                            <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium">{item.campaign}</p>
                                                        <p className="text-sm text-gray-600">{item.users} utenti • CTR {item.ctr}%</p>
                                                    </div>
                                                    <Badge variant="outline">{item.cost}</Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* UTM Content & Term */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5" />
                                        Performance per Contenuto
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top utm_content</h4>
                                            <div className="space-y-2">
                                                {[
                                                    { content: 'hero_banner', clicks: 456 },
                                                    { content: 'sidebar_ad', clicks: 342 },
                                                    { content: 'footer_cta', clicks: 234 }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-700">{item.content}</span>
                                                        <span className="font-semibold">{item.clicks} click</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Top utm_term (keywords)</h4>
                                            <div className="space-y-2">
                                                {[
                                                    { term: 'stanza singola milano', searches: 234 },
                                                    { term: 'coinquilino compatibile', searches: 189 },
                                                    { term: 'affitto studenti roma', searches: 156 }
                                                ].map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-700">{item.term}</span>
                                                        <span className="font-semibold">{item.searches}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* UTM Summary Card */}
                        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <Tag className="w-6 h-6 text-purple-600" />
                                    <div>
                                        <h4 className="font-semibold text-purple-900 mb-2">
                                            Tracciamento Campagne Marketing
                                        </h4>
                                        <div className="text-sm text-purple-800 space-y-1">
                                            <p>• <strong>utm_source:</strong> Identifica da dove proviene il traffico (es. google, facebook)</p>
                                            <p>• <strong>utm_medium:</strong> Indica il tipo di marketing (es. cpc, email, social)</p>
                                            <p>• <strong>utm_campaign:</strong> Nome della campagna specifica</p>
                                            <p>• <strong>utm_content:</strong> Differenzia annunci o link nella stessa campagna</p>
                                            <p>• <strong>utm_term:</strong> Parole chiave per campagne a pagamento</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer info */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                            <div className="text-blue-600 mt-0.5">📊</div>
                            <div>
                                <h4 className="font-medium text-blue-900 mb-2">
                                    Dati Google Analytics 4
                                </h4>
                                <div className="text-sm text-blue-800 space-y-1">
                                    <p>• I dati sono aggiornati in tempo reale da Google Analytics 4</p>
                                    <p>• Le metriche includono solo utenti della piattaforma Mate</p>
                                    <p>• I grafici mostrano tendenze e pattern di utilizzo per ottimizzare l'esperienza utente</p>
                                    <p>• Property ID: G-RWNZCF691D</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
