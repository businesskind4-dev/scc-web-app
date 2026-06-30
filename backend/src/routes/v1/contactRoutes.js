const express = require('express');
const router = express.Router();
const {
    sendContactMessage,
    getAllContactMessages,
    getContactMessage,
    markAsRead,
    getUnreadCount,
} = require('../../controllers/contactController');
const { strictLimiter } = require('../../middleware/rateLimiter');

// Public route
router.post('/contact', strictLimiter, sendContactMessage);

// Admin routes (add authentication later)
router.get('/contacts', getAllContactMessages);
router.get('/contacts/unread/count', getUnreadCount);
router.get('/contact/:id', getContactMessage);
router.put('/contact/:id/read', markAsRead);

module.exports = router;
