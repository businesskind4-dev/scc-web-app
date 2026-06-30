const jwt = require('jsonwebtoken');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * @desc    Admin login – returns JWT token
 * @route   POST /api/v1/admin/login
 * @access  Public
 */
exports.adminLogin = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
        throw new APIError('Password is required', 400);
    }

    const trimmedPassword = password.trim();
    const adminPassword = (process.env.ADMIN_PASSWORD || 'SCCAdmin123').trim();

    logger.info(`🔑 Login attempt - received: "${trimmedPassword}", stored: "${adminPassword}"`);

    if (trimmedPassword !== adminPassword) {
        throw new APIError('Invalid password', 401);
    }

    // Generate JWT token
    const token = jwt.sign(
        { role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { token },
    });
});
