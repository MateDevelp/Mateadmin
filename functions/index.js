/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

/**
 * Cloud Function to set admin role for a user
 * This function sets both the custom claim and Firestore record
 */
exports.setAdminRole = onCall(async (data, context) => {
    try {
        // Check if the caller is authenticated
        if (!context.auth) {
            throw new Error('Must be authenticated to call this function');
        }

        // For now, allow any authenticated user to call this function
        // In production, you should check if the caller is already an admin
        const { uid, email } = data;

        if (!uid) {
            throw new Error('uid is required');
        }

        // Set custom claim
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        // Update Firestore record
        await admin.firestore().collection('users').doc(uid).update({
            role: 'admin',
            isAdmin: true,
            adminSetAt: admin.firestore.FieldValue.serverTimestamp(),
            adminSetBy: context.auth.uid
        });

        logger.info(`Admin role set for user ${uid} by ${context.auth.uid}`);

        return {
            success: true,
            message: `Admin role granted to ${email || uid}`
        };

    } catch (error) {
        logger.error('Error setting admin role:', error);
        throw new Error(`Failed to set admin role: ${error.message}`);
    }
});

/**
 * Cloud Function to remove admin role from a user
 */
exports.removeAdminRole = onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new Error('Must be authenticated to call this function');
        }

        // Check if the caller is an admin
        const callerRecord = await admin.firestore()
            .collection('users')
            .doc(context.auth.uid)
            .get();

        if (!callerRecord.exists || callerRecord.data().role !== 'admin') {
            throw new Error('Only admins can remove admin roles');
        }

        const { uid } = data;

        if (!uid) {
            throw new Error('uid is required');
        }

        // Remove custom claim
        await admin.auth().setCustomUserClaims(uid, { admin: false });

        // Update Firestore record
        await admin.firestore().collection('users').doc(uid).update({
            role: 'user',
            isAdmin: false,
            adminRemovedAt: admin.firestore.FieldValue.serverTimestamp(),
            adminRemovedBy: context.auth.uid
        });

        logger.info(`Admin role removed for user ${uid} by ${context.auth.uid}`);

        return {
            success: true,
            message: `Admin role removed from ${uid}`
        };

    } catch (error) {
        logger.error('Error removing admin role:', error);
        throw new Error(`Failed to remove admin role: ${error.message}`);
    }
});

/**
 * HTTP version of setAdminRole for CORS compatibility
 */
exports.setAdminRoleHttp = onRequest((req, res) => {
    return cors(req, res, async () => {
        try {
            // Only allow POST requests
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }

            // For development, we'll skip auth check
            // In production, you should validate the Authorization header
            const { uid, email } = req.body;

            if (!uid) {
                return res.status(400).json({ error: 'uid is required' });
            }

            // Set custom claim
            await admin.auth().setCustomUserClaims(uid, { admin: true });

            // Update Firestore record
            await admin.firestore().collection('users').doc(uid).set({
                role: 'admin',
                isAdmin: true,
                adminSetAt: admin.firestore.FieldValue.serverTimestamp(),
                email: email
            }, { merge: true });

            logger.info(`Admin role set for user ${uid} via HTTP`);

            return res.json({
                success: true,
                message: `Admin role granted to ${email || uid}`
            });

        } catch (error) {
            logger.error('Error setting admin role via HTTP:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });
});

/**
 * Analytics API - Proxy per Google Analytics Data API
 * Questa Cloud Function espone un'API per accedere ai dati di Google Analytics 4
 */
exports.analyticsApi = onRequest({
    timeoutSeconds: 300,
    memory: '512MB'
}, (req, res) => {
    return cors(req, res, async () => {
        try {
            // Import Express app from backend
            const analyticsApp = require('./analytics/app');
            analyticsApp(req, res);
        } catch (error) {
            logger.error('Error in analytics API:', error);
            return res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    });
});