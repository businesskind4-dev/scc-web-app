const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Asset name is required'],
            trim: true,
            maxlength: [100, 'Asset name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-z0-9-]+$/,
                'Slug can only contain lowercase letters, numbers, and hyphens',
            ],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        url: {
            type: String,
            trim: true,
            match: [
                /^https?:\/\/.+/,
                'Please enter a valid URL starting with http:// or https://',
            ],
        },
        imageUrl: {
            type: String,
            trim: true,
            match: [
                /^https?:\/\/.+/,
                'Please enter a valid image URL starting with http:// or https://',
            ],
        },
        status: {
            type: String,
            enum: ['live', 'coming-soon', 'in-development', 'archived'],
            default: 'coming-soon',
        },
        features: [{
            type: String,
            trim: true,
            maxlength: [200, 'Feature cannot exceed 200 characters'],
        }],
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        category: {
            type: String,
            enum: ['research', 'framework', 'laboratory', 'tool', 'training'],
            default: 'tool',
        },
        version: {
            type: String,
            trim: true,
            default: '1.0.0',
        },
        releaseDate: {
            type: Date,
        },
        documentationUrl: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes
AssetSchema.index({ slug: 1, isActive: 1 });
AssetSchema.index({ category: 1, isActive: 1 });
AssetSchema.index({ order: 1 });

// Virtual for display URL
AssetSchema.virtual('displayUrl').get(function () {
    if (!this.url) return null;
    try {
        const url = new URL(this.url);
        return url.hostname.replace('www.', '');
    } catch {
        return this.url;
    }
});

// Pre-save middleware
AssetSchema.pre('save', function (next) {
    // Generate slug from name if not provided
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Static method to get live assets
AssetSchema.statics.getLiveAssets = async function (category = null) {
    const filter = { isActive: true, status: 'live' };
    if (category) {
        filter.category = category;
    }
    return this.find(filter).sort({ order: 1 });
};

// Static method to get asset by slug
AssetSchema.statics.findBySlug = function (slug) {
    return this.findOne({ slug, isActive: true });
};

module.exports = mongoose.model('Asset', AssetSchema);
