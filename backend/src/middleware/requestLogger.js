const logger = require('../utils/logger');

/**
 * Custom HTTP request logger using Winston
 * Logs method, URL, status code, and response time
 * No external dependencies (morgan not required)
 */
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Capture the response finish event to log duration
    res.on('finish', () => {
        const duration = Date.now() - start;
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

        // Log based on status code
        if (res.statusCode >= 500) {
            logger.error(message);
        } else if (res.statusCode >= 400) {
            logger.warn(message);
        } else {
            logger.http(message);
        }
    });

    next();
};

module.exports = { requestLogger };
