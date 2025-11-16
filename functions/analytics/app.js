const express = require('express');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const logger = require('firebase-functions/logger');

// Initialize Google Analytics Data client
let analyticsClient = null;

try {
    // Usa le credenziali del service account mate-analytics-reader
    const credentials = require('../mate-analytics-service-account.json');

    analyticsClient = new BetaAnalyticsDataClient({
        credentials: {
            client_email: credentials.client_email,
            private_key: credentials.private_key,
        },
        projectId: credentials.project_id,
    });

    logger.info('✅ Google Analytics client initialized with mate-analytics-reader');
    logger.info(`📧 Service Account: ${credentials.client_email}`);
} catch (error) {
    logger.error('❌ Failed to initialize Google Analytics client:', error.message);
}

// Helper functions
const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
};

const formatGADate = (dateString) => {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
};

// Create Express app
const app = express();

// Middleware
app.use(express.json());

// Property ID - Hardcoded per ora (può essere configurato tramite parametri Cloud Function)
const GA_PROPERTY_ID = 'properties/496252339';

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        analytics: !!analyticsClient
    });
});

// Status endpoint
app.get('/api/analytics/status', (req, res) => {
    res.json({
        status: 'online',
        googleAnalytics: {
            configured: !!analyticsClient,
            propertyId: GA_PROPERTY_ID
        }
    });
});

// Get metrics
app.get('/api/analytics/metrics', async (req, res) => {
    try {
        const { dateRange = '30daysAgo' } = req.query;

        if (!analyticsClient) {
            return res.status(503).json({
                error: 'Google Analytics client not configured'
            });
        }

        const [response] = await analyticsClient.runReport({
            property: GA_PROPERTY_ID,
            dateRanges: [{ startDate: dateRange, endDate: 'today' }],
            metrics: [
                { name: 'totalUsers' },
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'screenPageViews' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
            ],
        });

        const metrics = response.rows?.[0]?.metricValues || [];

        res.json({
            totalUsers: parseInt(metrics[0]?.value || '0'),
            activeUsers: parseInt(metrics[1]?.value || '0'),
            newUsers: parseInt(metrics[2]?.value || '0'),
            sessions: parseInt(metrics[3]?.value || '0'),
            pageviews: parseInt(metrics[4]?.value || '0'),
            averageSessionDuration: formatDuration(parseFloat(metrics[5]?.value || '0')),
            bounceRate: parseFloat(metrics[6]?.value || '0'),
        });
    } catch (error) {
        logger.error('Error fetching GA metrics:', error);
        res.status(500).json({ error: 'Failed to fetch metrics', message: error.message });
    }
});

// Get top pages
app.get('/api/analytics/top-pages', async (req, res) => {
    try {
        const { dateRange = '30daysAgo' } = req.query;

        if (!analyticsClient) {
            return res.status(503).json({ error: 'Google Analytics client not configured' });
        }

        const [response] = await analyticsClient.runReport({
            property: GA_PROPERTY_ID,
            dateRanges: [{ startDate: dateRange, endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 10,
        });

        const result = response.rows?.map(row => ({
            page: row.dimensionValues?.[0]?.value || '',
            views: parseInt(row.metricValues?.[0]?.value || '0'),
            uniqueUsers: parseInt(row.metricValues?.[1]?.value || '0'),
        })) || [];

        res.json(result);
    } catch (error) {
        logger.error('Error fetching top pages:', error);
        res.status(500).json({ error: 'Failed to fetch top pages', message: error.message });
    }
});

// Get device types
app.get('/api/analytics/device-types', async (req, res) => {
    try {
        const { dateRange = '30daysAgo' } = req.query;

        if (!analyticsClient) {
            return res.status(503).json({ error: 'Google Analytics client not configured' });
        }

        const [response] = await analyticsClient.runReport({
            property: GA_PROPERTY_ID,
            dateRanges: [{ startDate: dateRange, endDate: 'today' }],
            dimensions: [{ name: 'deviceCategory' }],
            metrics: [{ name: 'totalUsers' }],
        });

        const total = response.rows?.reduce((sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 1;

        const result = response.rows?.map(row => {
            const users = parseInt(row.metricValues?.[0]?.value || '0');
            return {
                device: row.dimensionValues?.[0]?.value || '',
                users: users,
                percentage: Math.round((users / total) * 100),
            };
        }) || [];

        res.json(result);
    } catch (error) {
        logger.error('Error fetching device types:', error);
        res.status(500).json({ error: 'Failed to fetch device types', message: error.message });
    }
});

// Get locations
app.get('/api/analytics/locations', async (req, res) => {
    try {
        const { dateRange = '30daysAgo' } = req.query;

        if (!analyticsClient) {
            return res.status(503).json({ error: 'Google Analytics client not configured' });
        }

        const [response] = await analyticsClient.runReport({
            property: GA_PROPERTY_ID,
            dateRanges: [{ startDate: dateRange, endDate: 'today' }],
            dimensions: [{ name: 'country' }, { name: 'city' }],
            metrics: [{ name: 'totalUsers' }],
            orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
            limit: 10,
        });

        const result = response.rows?.map(row => ({
            country: row.dimensionValues?.[0]?.value || '',
            city: row.dimensionValues?.[1]?.value || undefined,
            users: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || [];

        res.json(result);
    } catch (error) {
        logger.error('Error fetching locations:', error);
        res.status(500).json({ error: 'Failed to fetch locations', message: error.message });
    }
});

// Get user growth
app.get('/api/analytics/user-growth', async (req, res) => {
    try {
        const { dateRange = '30daysAgo' } = req.query;

        if (!analyticsClient) {
            return res.status(503).json({ error: 'Google Analytics client not configured' });
        }

        const [response] = await analyticsClient.runReport({
            property: GA_PROPERTY_ID,
            dateRanges: [{ startDate: dateRange, endDate: 'today' }],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'totalUsers' }, { name: 'newUsers' }],
            orderBys: [{ dimension: { dimensionName: 'date' } }],
        });

        const result = response.rows?.map(row => ({
            date: formatGADate(row.dimensionValues?.[0]?.value || ''),
            users: parseInt(row.metricValues?.[0]?.value || '0'),
            newUsers: parseInt(row.metricValues?.[1]?.value || '0'),
        })) || [];

        res.json(result);
    } catch (error) {
        logger.error('Error fetching user growth:', error);
        res.status(500).json({ error: 'Failed to fetch user growth', message: error.message });
    }
});

// Get all data (combined endpoint)
app.get('/api/analytics/all', async (req, res) => {
    try {
        const { dateRange = '30daysAgo' } = req.query;

        if (!analyticsClient) {
            return res.status(503).json({ error: 'Google Analytics client not configured' });
        }

        // Execute all queries in parallel
        const [
            metricsResponse,
            topPagesResponse,
            deviceTypesResponse,
            locationsResponse,
            userGrowthResponse
        ] = await Promise.all([
            analyticsClient.runReport({
                property: GA_PROPERTY_ID,
                dateRanges: [{ startDate: dateRange, endDate: 'today' }],
                metrics: [
                    { name: 'totalUsers' },
                    { name: 'activeUsers' },
                    { name: 'newUsers' },
                    { name: 'sessions' },
                    { name: 'screenPageViews' },
                    { name: 'averageSessionDuration' },
                    { name: 'bounceRate' },
                ]
            }),
            analyticsClient.runReport({
                property: GA_PROPERTY_ID,
                dateRanges: [{ startDate: dateRange, endDate: 'today' }],
                dimensions: [{ name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
                orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
                limit: 10
            }),
            analyticsClient.runReport({
                property: GA_PROPERTY_ID,
                dateRanges: [{ startDate: dateRange, endDate: 'today' }],
                dimensions: [{ name: 'deviceCategory' }],
                metrics: [{ name: 'totalUsers' }]
            }),
            analyticsClient.runReport({
                property: GA_PROPERTY_ID,
                dateRanges: [{ startDate: dateRange, endDate: 'today' }],
                dimensions: [{ name: 'country' }, { name: 'city' }],
                metrics: [{ name: 'totalUsers' }],
                orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
                limit: 10
            }),
            analyticsClient.runReport({
                property: GA_PROPERTY_ID,
                dateRanges: [{ startDate: dateRange, endDate: 'today' }],
                dimensions: [{ name: 'date' }],
                metrics: [{ name: 'totalUsers' }, { name: 'newUsers' }],
                orderBys: [{ dimension: { dimensionName: 'date' } }]
            })
        ]);

        // Process all responses
        const metricsData = metricsResponse[0].rows?.[0]?.metricValues || [];
        const metrics = {
            totalUsers: parseInt(metricsData[0]?.value || '0'),
            activeUsers: parseInt(metricsData[1]?.value || '0'),
            newUsers: parseInt(metricsData[2]?.value || '0'),
            sessions: parseInt(metricsData[3]?.value || '0'),
            pageviews: parseInt(metricsData[4]?.value || '0'),
            averageSessionDuration: formatDuration(parseFloat(metricsData[5]?.value || '0')),
            bounceRate: parseFloat(metricsData[6]?.value || '0')
        };

        const topPages = topPagesResponse[0].rows?.map(row => ({
            page: row.dimensionValues?.[0]?.value || '',
            views: parseInt(row.metricValues?.[0]?.value || '0'),
            uniqueUsers: parseInt(row.metricValues?.[1]?.value || '0')
        })) || [];

        const deviceTotal = deviceTypesResponse[0].rows?.reduce((sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 1;
        const deviceTypes = deviceTypesResponse[0].rows?.map(row => {
            const users = parseInt(row.metricValues?.[0]?.value || '0');
            return {
                device: row.dimensionValues?.[0]?.value || '',
                users: users,
                percentage: Math.round((users / deviceTotal) * 100)
            };
        }) || [];

        const locations = locationsResponse[0].rows?.map(row => ({
            country: row.dimensionValues?.[0]?.value || '',
            city: row.dimensionValues?.[1]?.value || undefined,
            users: parseInt(row.metricValues?.[0]?.value || '0')
        })) || [];

        const userGrowth = userGrowthResponse[0].rows?.map(row => ({
            date: formatGADate(row.dimensionValues?.[0]?.value || ''),
            users: parseInt(row.metricValues?.[0]?.value || '0'),
            newUsers: parseInt(row.metricValues?.[1]?.value || '0')
        })) || [];

        res.json({
            metrics,
            topPages,
            deviceTypes,
            locations,
            userGrowth
        });
    } catch (error) {
        logger.error('Error fetching all analytics data:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data', message: error.message });
    }
});

module.exports = app;
