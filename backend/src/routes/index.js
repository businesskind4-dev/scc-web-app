const express = require('express');
const router = express.Router();

const { checkConnection } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Import controllers
const subscriberController = require('../controllers/subscriberController');
const contactController = require('../controllers/contactController');
const assetController = require('../controllers/assetController');

// ============================================================
// Apply DB check to all /v1 routes
// ============================================================
router.use('/v1', checkConnection);

// ============================================================
// Public Routes
// ============================================================
router.post('/v1/subscribe', subscriberController.addSubscriber);
router.delete('/v1/subscribe/:email', subscriberController.unsubscribe);
router.post('/v1/contact', contactController.sendContactMessage);
router.get('/v1/assets', assetController.getAllAssets);
router.get('/v1/assets/:slug', assetController.getAssetBySlug);
router.get('/v1/assets/categories', assetController.getCategories);

// ============================================================
// Admin Login (public)
// ============================================================
router.post('/v1/admin/login', adminController.adminLogin);

// ============================================================
// Admin Routes (Protected by JWT)
// ============================================================
router.get('/v1/subscribers', authenticateAdmin, subscriberController.getAllSubscribers);
router.get('/v1/subscribers/count', authenticateAdmin, subscriberController.getSubscriberCount);
router.get('/v1/subscribers/export', authenticateAdmin, subscriberController.exportSubscribers);

router.get('/v1/contacts', authenticateAdmin, contactController.getAllContactMessages);
router.get('/v1/contacts/unread/count', authenticateAdmin, contactController.getUnreadCount);
router.get('/v1/contact/:id', authenticateAdmin, contactController.getContactMessage);
router.put('/v1/contact/:id/read', authenticateAdmin, contactController.markAsRead);
router.delete('/v1/contact/:id', authenticateAdmin, contactController.deleteContactMessage);

// Admin asset management
router.post('/v1/assets', authenticateAdmin, assetController.createAsset);
router.put('/v1/assets/:id', authenticateAdmin, assetController.updateAsset);
router.delete('/v1/assets/:id', authenticateAdmin, assetController.deleteAsset);

// ============================================================
// Health Check
// ============================================================
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Supply Chain Circle API is running',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});

// ============================================================
// API Root Info
// ============================================================
router.get('/', (req, res) => {
    res.status(200).json({
        name: 'Supply Chain Circle API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            subscribe: '/api/v1/subscribe (POST)',
            contact: '/api/v1/contact (POST)',
            assets: '/api/v1/assets (GET)',
            adminLogin: '/api/v1/admin/login (POST)',
            admin: '/api/v1/subscribers (GET, Auth)',
        },
    });
});

module.exports = router;
