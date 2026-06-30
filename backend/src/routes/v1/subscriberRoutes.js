const express = require('express');
const router = express.Router();
const {
    addSubscriber,
    getAllSubscribers,
    getSubscriberCount,
    unsubscribe,
    exportSubscribers,
} = require('../../controllers/subscriberController');
const { strictLimiter } = require('../../middleware/rateLimiter');

// Public routes
router.post('/subscribe', strictLimiter, addSubscriber);
router.delete('/subscribe/:email', unsubscribe);

// Admin routes (add authentication later)
router.get('/subscribers', getAllSubscribers);
router.get('/subscribers/count', getSubscriberCount);
router.get('/subscribers/export', exportSubscribers);

module.exports = router;
