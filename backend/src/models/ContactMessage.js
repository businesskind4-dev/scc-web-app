const mongoose = require('mongoose');

const ContactMessageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [
                /^\S+@\S+\.\S+$/,
                'Please enter a valid email address',
            ],
            maxlength: [255, 'Email cannot exceed 255 characters'],
        },
        subject: {
            type: String,
            trim: true,
            maxlength: [200, 'Subject cannot exceed 200 characters'],
            default: 'No Subject',
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            minlength: [10, 'Message must be at least 10 characters'],
            maxlength: [5000, 'Message cannot exceed 5000 characters'],
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        ipAddress: {
            type: String,
            trim: true,
        },
        userAgent: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        repliedAt: {
            type: Date,
        },
        replyMessage: {
            type: String,
            trim: true,
            maxlength: 5000,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
ContactMessageSchema.index({ isRead: 1, createdAt: -1 });
ContactMessageSchema.index({ email: 1, createdAt: -1 });

// Virtual for message age
ContactMessageSchema.virtual('ageHours').get(function () {
    if (!this.createdAt) return 0;
    const diff = Date.now() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
});

// Pre-save middleware
ContactMessageSchema.pre('save', function (next) {
    // Sanitize inputs
    if (this.name) {
        this.name = this.name.trim();
    }
    if (this.email) {
        this.email = this.email.toLowerCase().trim();
    }
    if (this.subject) {
        this.subject = this.subject.trim();
    }
    if (this.message) {
        this.message = this.message.trim();
    }
    next();
});

// Static method to mark as read
ContactMessageSchema.statics.markAsRead = async function (id) {
    return this.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true, runValidators: true }
    );
};

// Static method to get unread count
ContactMessageSchema.statics.getUnreadCount = async function () {
    return this.countDocuments({ isRead: false });
};

module.exports = mongoose.model('ContactMessage', ContactMessageSchema);
