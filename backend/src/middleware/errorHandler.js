const logger = require('../utils/logger');
const { maskSensitive, isProduction } = require('../utils/security');

// Custom error class for API errors
class APIError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An internal server error occurred.';
    let errors = err.errors || null;

    // Log the error
    const errorLog = {
        message: err.message,
        stack: err.stack,
        statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
    };

    if (statusCode >= 500) {
        logger.error(`❌ Server Error: ${JSON.stringify(maskSensitive(errorLog))}`);
    } else {
        logger.warn(`⚠️ Client Error: ${JSON.stringify(maskSensitive(errorLog))}`);
    }

    // Mongoose duplicate key error (code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const value = err.keyValue[field];
        statusCode = 409;
        message = `Duplicate entry: ${field} "${value}" already exists.`;
        errors = [{ field, message: `"${value}" is already taken.` }];
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed.';
        errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));
    }

    // Mongoose CastError (invalid ID)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = `Invalid ID format: "${err.value}" is not a valid ObjectId.`;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token. Please log in again.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token expired. Please log in again.';
    }

    // Send response
    const response = {
        success: false,
        message,
        statusCode,
        path: req.path,
        timestamp: new Date().toISOString(),
    };

    // Include validation errors if present
    if (errors) {
        response.errors = errors;
    }

    // Include stack trace in development only
    if (!isProduction() && err.stack) {
        response.stack = err.stack.split('\n').slice(0, 5).join('\n');
    }

    res.status(statusCode).json(response);
};

// 404 Not Found handler
const notFoundHandler = (req, res) => {
    logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'Resource not found.',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
};

// Async wrapper for controllers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            logger.error(`❌ Async Error in ${fn.name}: ${error.message}`);
            next(error);
        });
    };
};

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    APIError,
};
