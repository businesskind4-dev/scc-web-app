const Asset = require('../models/Asset');
const logger = require('../utils/logger');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { body, param, validationResult } = require('express-validator');

// @desc    Get all assets
// @route   GET /api/v1/assets
// @access  Public
exports.getAllAssets = asyncHandler(async (req, res) => {
    const { category, status } = req.query;
    
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (status) filter.status = status;

    const assets = await Asset.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .select('name slug description url imageUrl status features category version releaseDate');

    res.status(200).json({
        success: true,
        count: assets.length,
        data: assets,
    });
});

// @desc    Get single asset by slug
// @route   GET /api/v1/assets/:slug
// @access  Public
exports.getAssetBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    
    const asset = await Asset.findBySlug(slug);
    if (!asset) {
        throw new APIError('Asset not found.', 404);
    }

    res.status(200).json({
        success: true,
        data: asset,
    });
});

// @desc    Create new asset (Admin only)
// @route   POST /api/v1/assets
// @access  Private (Admin)
exports.createAsset = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new APIError('Validation failed', 400, errors.array());
        }

        // Check if slug already exists
        const existingAsset = await Asset.findOne({ slug: req.body.slug });
        if (existingAsset) {
            throw new APIError('Asset with this slug already exists.', 409);
        }

        const asset = await Asset.create(req.body);
        logger.info(`✅ New asset created: ${asset.name} (${asset.slug})`);

        res.status(201).json({
            success: true,
            data: asset,
        });
    }),
];

// @desc    Update asset (Admin only)
// @route   PUT /api/v1/assets/:id
// @access  Private (Admin)
exports.updateAsset = [
    param('id').isMongoId().withMessage('Invalid asset ID'),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new APIError('Validation failed', 400, errors.array());
        }

        const { id } = req.params;
        
        const asset = await Asset.findById(id);
        if (!asset) {
            throw new APIError('Asset not found.', 404);
        }

        // Prevent slug duplication
        if (req.body.slug && req.body.slug !== asset.slug) {
            const existingAsset = await Asset.findOne({ slug: req.body.slug });
            if (existingAsset) {
                throw new APIError('Asset with this slug already exists.', 409);
            }
        }

        const updatedAsset = await Asset.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        logger.info(`🔄 Asset updated: ${updatedAsset.name} (${updatedAsset.slug})`);

        res.status(200).json({
            success: true,
            data: updatedAsset,
        });
    }),
];

// @desc    Delete asset (Admin only)
// @route   DELETE /api/v1/assets/:id
// @access  Private (Admin)
exports.deleteAsset = [
    param('id').isMongoId().withMessage('Invalid asset ID'),
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new APIError('Validation failed', 400, errors.array());
        }

        const { id } = req.params;
        
        const asset = await Asset.findById(id);
        if (!asset) {
            throw new APIError('Asset not found.', 404);
        }

        // Soft delete
        asset.isActive = false;
        await asset.save();

        logger.info(`🗑️ Asset deleted (soft): ${asset.name} (${asset.slug})`);

        res.status(200).json({
            success: true,
            message: 'Asset deleted successfully.',
        });
    }),
];

// @desc    Get asset categories
// @route   GET /api/v1/assets/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
    const categories = await Asset.distinct('category', { isActive: true });
    
    res.status(200).json({
        success: true,
        data: categories,
    });
});
