const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/constants');

// Create a standard rate limiter
const standardLimiter = rateLimit({
    windowMs: RATE_LIMIT.WINDOW_MS,
    max: RATE_LIMIT.MAX_REQUESTS,
    message: {
        success: false,
        message: `Too many requests. Please try again after ${RATE_LIMIT.WINDOW_MS / 60000} minutes.`,
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // Use IP address and optionally user ID if authenticated
        return req.ip || req.connection.remoteAddress;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please slow down and try again later.',
            retryAfter: Math.ceil(RATE_LIMIT.WINDOW_MS / 60000),
        });
    },
});

// Strict limiter for sensitive routes (subscribe, contact)
const strictLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: RATE_LIMIT.STRICT_MAX,
    message: {
        success: false,
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please wait 15 minutes before trying again.',
            retryAfter: 15,
        });
    },
});

// API-wide global limiter (applied to all routes)
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
        success: false,
        message: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
});

// Skip rate limiter for health checks
const skipHealthCheck = (req) => {
    return req.path === '/health' || req.path === '/api/health';
};

module.exports = {
    standardLimiter,
    strictLimiter,
    globalLimiter,
    skipHealthCheck,
};
