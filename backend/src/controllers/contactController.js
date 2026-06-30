const ContactMessage = require('../models/ContactMessage');
const logger = require('../utils/logger');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { nameRule, emailRule, subjectRule, messageRule } = require('../utils/validator');
const { validationResult } = require('express-validator');
const { sendContactNotification } = require('../utils/email');

// ============================================================
// SEND CONTACT MESSAGE
// ============================================================

/**
 * @desc    Submit contact form
 * @route   POST /api/v1/contact
 * @access  Public
 */
exports.sendContactMessage = [
    nameRule(),
    emailRule(),
    subjectRule(),
    messageRule(),
    asyncHandler(async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new APIError('Validation failed', 400, errors.array());
        }

        const { name, email, subject, message } = req.body;

        // ============================================================
        // SPAM DETECTION
        // ============================================================
        const spamKeywords = ['viagra', 'casino', 'porn', 'xxx', 'pharmacy', 'loan', 'bitcoin', 'crypto', 'sex', 'dating'];
        const messageLower = message.toLowerCase();
        const isSpam = spamKeywords.some((keyword) => messageLower.includes(keyword));

        if (isSpam) {
            logger.warn(`⚠️ Potential spam blocked from ${email} (IP: ${req.ip})`);
            // Return success to avoid tipping off spammers
            return res.status(200).json({
                success: true,
                message: 'Thank you! Your message has been sent.',
            });
        }

        // ============================================================
        // RATE LIMIT CHECK (Additional safety)
        // ============================================================
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentCount = await ContactMessage.countDocuments({
            ipAddress: req.ip || req.connection.remoteAddress,
            createdAt: { $gte: fiveMinutesAgo },
        });

        if (recentCount >= 3) {
            logger.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`);
            throw new APIError(
                'Too many messages sent from this IP. Please wait 5 minutes.',
                429
            );
        }

        // ============================================================
        // SAVE MESSAGE
        // ============================================================
        const newMessage = new ContactMessage({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            subject: subject ? subject.trim() : 'No Subject',
            message: message.trim(),
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'] || 'Unknown',
        });

        await newMessage.save();

        logger.info(`📩 New contact message from ${name} (${email})`);

        // ============================================================
        // SEND EMAIL NOTIFICATION
        // ============================================================
        try {
            await sendContactNotification(name, email, subject, message);
            logger.info(`📧 Email notification sent for message from ${email}`);
        } catch (emailErr) {
            // Don't fail the request if email fails
            logger.error(`❌ Failed to send email: ${emailErr.message}`);
        }

        // ============================================================
        // RESPONSE
        // ============================================================
        res.status(201).json({
            success: true,
            message: 'Thank you! Your message has been sent. We will get back to you soon.',
            data: {
                id: newMessage._id,
                name: newMessage.name,
                email: newMessage.email,
                createdAt: newMessage.createdAt,
            },
        });
    }),
];

// ============================================================
// GET ALL MESSAGES (Admin)
// ============================================================

/**
 * @desc    Get all contact messages with pagination and filtering
 * @route   GET /api/v1/contacts
 * @access  Private (Admin)
 */
exports.getAllContactMessages = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;

    const filter = {};
    if (isRead !== undefined) {
        filter.isRead = isRead;
    }

    const skip = (page - 1) * limit;
    const [messages, total] = await Promise.all([
        ContactMessage.find(filter)
            .sort({ isRead: 1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('name email subject message isRead createdAt ipAddress'),
        ContactMessage.countDocuments(filter),
    ]);

    res.status(200).json({
        success: true,
        data: messages,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    });
});

// ============================================================
// GET SINGLE MESSAGE (Admin)
// ============================================================

/**
 * @desc    Get single contact message and mark as read
 * @route   GET /api/v1/contact/:id
 * @access  Private (Admin)
 */
exports.getContactMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await ContactMessage.findById(id);
    if (!message) {
        throw new APIError('Message not found.', 404);
    }

    // Auto-mark as read when viewed
    if (!message.isRead) {
        message.isRead = true;
        await message.save();
        logger.info(`📖 Contact message ${id} marked as read`);
    }

    res.status(200).json({
        success: true,
        data: message,
    });
});

// ============================================================
// MARK AS READ (Admin)
// ============================================================

/**
 * @desc    Mark contact message as read
 * @route   PUT /api/v1/contact/:id/read
 * @access  Private (Admin)
 */
exports.markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true, runValidators: true }
    );

    if (!message) {
        throw new APIError('Message not found.', 404);
    }

    logger.info(`📖 Contact message ${id} marked as read`);

    res.status(200).json({
        success: true,
        data: message,
    });
});

// ============================================================
// GET UNREAD COUNT (Admin)
// ============================================================

/**
 * @desc    Get count of unread messages
 * @route   GET /api/v1/contacts/unread/count
 * @access  Private (Admin)
 */
exports.getUnreadCount = asyncHandler(async (req, res) => {
    const count = await ContactMessage.countDocuments({ isRead: false });

    res.status(200).json({
        success: true,
        data: {
            unread: count,
        },
    });
});

// ============================================================
// DELETE MESSAGE (Admin)
// ============================================================

/**
 * @desc    Delete a contact message (hard delete)
 * @route   DELETE /api/v1/contact/:id
 * @access  Private (Admin)
 */
exports.deleteContactMessage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) {
        throw new APIError('Message not found.', 404);
    }

    logger.info(`🗑️ Contact message ${id} deleted`);

    res.status(200).json({
        success: true,
        message: 'Message deleted successfully.',
    });
});
