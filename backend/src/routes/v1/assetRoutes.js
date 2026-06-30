const express = require('express');
const router = express.Router();
const {
    getAllAssets,
    getAssetBySlug,
    createAsset,
    updateAsset,
    deleteAsset,
    getCategories,
} = require('../../controllers/assetController');

// Public routes
router.get('/assets', getAllAssets);
router.get('/assets/categories', getCategories);
router.get('/assets/:slug', getAssetBySlug);

// Admin routes (add authentication later)
router.post('/assets', createAsset);
router.put('/assets/:id', updateAsset);
router.delete('/assets/:id', deleteAsset);

module.exports = router;