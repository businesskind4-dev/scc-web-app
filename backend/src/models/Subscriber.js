const mongoose = require('mongoose');

/**
 * Subscriber Schema
 * Stores email newsletter subscribers with tracking and soft-delete support
 */
const SubscriberSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\S+@\S+\.\S+$/,
                'Please enter a valid email address',
            ],
            maxlength: [255, 'Email cannot exceed 255 characters'],
            index: true,
        },
        subscribedAt: {
            type: Date,
            default: Date.now,
            immutable: true,
        },
        source: {
            type: String,
            enum: ['SCC Website', 'Facebook', 'Manual', 'Event', 'Referral'],
            default: 'SCC Website',
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        ipAddress: {
            type: String,
            trim: true,
            maxlength: 45,
        },
        userAgent: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        unsubscribeReason: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        unsubscribedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ============================================================
// INDEXES (Performance)
// ============================================================
SubscriberSchema.index({ email: 1, isActive: 1 });
SubscriberSchema.index({ createdAt: -1 });
SubscriberSchema.index({ source: 1 });

// ============================================================
// VIRTUALS
// ============================================================
SubscriberSchema.virtual('subscriptionDays').get(function () {
    if (!this.subscribedAt) return 0;
    const diff = Date.now() - this.subscribedAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// ============================================================
// PRE-SAVE MIDDLEWARE
// ============================================================
SubscriberSchema.pre('save', function (next) {
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }
    next();
});

// ============================================================
// STATIC METHODS
// ============================================================

/**
 * Get count of active subscribers
 */
SubscriberSchema.statics.getActiveCount = async function () {
    return this.countDocuments({ isActive: true });
};

/**
 * Find subscriber by email (case-insensitive)
 */
SubscriberSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase().trim() });
};

/**
 * Get paginated list of active subscribers
 */
SubscriberSchema.statics.getPaginated = async function (page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
        this.find({ isActive: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('email subscribedAt source createdAt isActive'),
        this.countDocuments({ isActive: true }),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

/**
 * Reactivate a previously unsubscribed subscriber
 */
SubscriberSchema.statics.reactivate = async function (email) {
    return this.findOneAndUpdate(
        { email: email.toLowerCase().trim() },
        {
            isActive: true,
            unsubscribedAt: null,
            unsubscribeReason: null,
        },
        { new: true }
    );
};

// ============================================================
// INSTANCE METHODS
// ============================================================

/**
 * Soft delete (unsubscribe) the subscriber
 */
SubscriberSchema.methods.unsubscribe = async function (reason = null) {
    this.isActive = false;
    this.unsubscribedAt = new Date();
    if (reason) {
        this.unsubscribeReason = reason;
    }
    return this.save();
};

/**
 * Reactivate the subscriber
 */
SubscriberSchema.methods.reactivate = async function () {
    this.isActive = true;
    this.unsubscribedAt = null;
    this.unsubscribeReason = null;
    return this.save();
};

// ============================================================
// EXPORT
// ============================================================
module.exports = mongoose.model('Subscriber', SubscriberSchema);
