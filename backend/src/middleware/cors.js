const cors = require('cors');
const logger = require('../utils/logger');
const { CORS } = require('../config/constants');

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
            return callback(null, true);
        }

        // Check if origin is allowed
        if (CORS.ORIGIN.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`⚠️ CORS blocked request from origin: ${origin}`);
            callback(null, false);
            // Use null, false instead of error to prevent crashing
            // callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Origin',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
    credentials: true,
    optionsSuccessStatus: 200,
    preflightContinue: false,
    maxAge: 86400, // 24 hours
};

// Log CORS errors
const corsMiddleware = (req, res, next) => {
    // Log preflight requests
    if (req.method === 'OPTIONS') {
        logger.debug(`🔀 CORS Preflight: ${req.headers.origin}`);
    }
    return cors(corsOptions)(req, res, next);
};

module.exports = corsMiddleware;
