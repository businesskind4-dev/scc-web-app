const jwt = require('jsonwebtoken');

/**
 * Admin authentication middleware – verifies JWT token
 */
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized – missing token',
        });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded; // Attach admin info to request
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized – invalid or expired token',
        });
    }
};

module.exports = { authenticateAdmin };
