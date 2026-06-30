const Subscriber = require('../models/Subscriber');
const logger = require('../utils/logger');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { emailRule } = require('../utils/validator');
const { validationResult } = require('express-validator');

// ============================================================
// SUBSCRIBE
// ============================================================

/**
 * @desc    Subscribe to newsletter
 * @route   POST /api/v1/subscribe
 * @access  Public
 */
exports.addSubscriber = [
    emailRule(),
    asyncHandler(async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new APIError('Validation failed', 400, errors.array());
        }

        const { email, source } = req.body;

        // Check if already subscribed
        const existing = await Subscriber.findByEmail(email);

        if (existing) {
            // If active → conflict
            if (existing.isActive) {
                throw new APIError('This email is already subscribed.', 409);
            }

            // If inactive → reactivate
            await existing.reactivate();
            logger.info(`🔄 Subscriber reactivated: ${email}`);

            return res.status(200).json({
                success: true,
                message: 'Welcome back! You have been resubscribed.',
                data: {
                    email: existing.email,
                    subscribedAt: existing.subscribedAt,
                },
            });
        }

        // Create new subscriber
        const subscriber = new Subscriber({
            email,
            source: source || 'SCC Website',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
        });

        await subscriber.save();

        logger.info(`✅ New subscriber: ${email} from ${subscriber.source}`);

        res.status(201).json({
            success: true,
            message: 'Thank you! You have been subscribed successfully.',
            data: {
                email: subscriber.email,
                subscribedAt: subscriber.subscribedAt,
            },
        });
    }),
];

// ============================================================
// UNSUBSCRIBE
// ============================================================

/**
 * @desc    Unsubscribe from newsletter
 * @route   DELETE /api/v1/subscribe/:email
 * @access  Public
 */
exports.unsubscribe = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const { reason } = req.body;

    const subscriber = await Subscriber.findByEmail(email);
    if (!subscriber) {
        throw new APIError('Email not found in our system.', 404);
    }

    if (!subscriber.isActive) {
        throw new APIError('This email is already unsubscribed.', 409);
    }

    await subscriber.unsubscribe(reason || 'Not specified');

    logger.info(`🔕 Subscriber unsubscribed: ${email}`);

    res.status(200).json({
        success: true,
        message: 'You have been unsubscribed successfully.',
    });
});

// ============================================================
// GET ALL SUBSCRIBERS (Admin)
// ============================================================

/**
 * @desc    Get all active subscribers with pagination
 * @route   GET /api/v1/subscribers
 * @access  Private (Admin)
 */
exports.getAllSubscribers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await Subscriber.getPaginated(page, limit);

    res.status(200).json({
        success: true,
        ...result,
    });
});

// ============================================================
// SUBSCRIBER COUNT
// ============================================================

/**
 * @desc    Get subscriber counts
 * @route   GET /api/v1/subscribers/count
 * @access  Private (Admin)
 */
exports.getSubscriberCount = asyncHandler(async (req, res) => {
    const [active, total] = await Promise.all([
        Subscriber.countDocuments({ isActive: true }),
        Subscriber.countDocuments(),
    ]);

    res.status(200).json({
        success: true,
        data: {
            active,
            total,
            inactive: total - active,
        },
    });
});

// ============================================================
// EXPORT SUBSCRIBERS (CSV)
// ============================================================

/**
 * @desc    Export all active subscribers as CSV
 * @route   GET /api/v1/subscribers/export
 * @access  Private (Admin)
 */
exports.exportSubscribers = asyncHandler(async (req, res) => {
    const subscribers = await Subscriber.find({ isActive: true })
        .select('email subscribedAt source createdAt')
        .sort({ createdAt: -1 });

    if (subscribers.length === 0) {
        throw new APIError('No subscribers to export.', 404);
    }

    // Build CSV
    const header = 'Email,Subscribed At,Source,Created At\n';
    const rows = subscribers.map((s) =>
        `${s.email},${s.subscribedAt.toISOString()},${s.source},${s.createdAt.toISOString()}`
    );
    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=subscribers-${new Date().toISOString().split('T')[0]}.csv`
    );
    res.status(200).send(csv);
});
