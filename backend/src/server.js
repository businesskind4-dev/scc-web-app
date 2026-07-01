require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const helmet = require('helmet');
const compression = require('compression');

const { connectDB } = require('./config/database');
const { requestLogger } = require('./middleware/requestLogger');
const { globalLimiter, skipHealthCheck } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const corsMiddleware = require('./middleware/cors');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================================
// SECURITY MIDDLEWARE (UPDATED CSP)
// ============================================================
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],   // allows onclick handlers
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
            imgSrc: ["'self'", 'data:', 'vercel.com'],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression({
    threshold: 1024,
    level: 6,
    brotli: true,
}));

app.use(corsMiddleware);

// ============================================================
// REQUEST LOGGING
// ============================================================
app.use(requestLogger);

// ============================================================
// BODY PARSERS
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// RATE LIMITING (skip health checks)
// ============================================================
app.use((req, res, next) => {
    if (skipHealthCheck(req)) {
        return next();
    }
    return globalLimiter(req, res, next);
});

// ============================================================
// ✅ SERVE STATIC FRONTEND FILES
// ============================================================
app.use(express.static(path.join(__dirname, '../../frontend')));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({
        status: 'OK',
        message: 'Supply Chain Circle API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mongodb: dbStatus,
        environment: process.env.NODE_ENV || 'development',
    });
});

// ============================================================
// ✅ API ROUTES
// ============================================================
try {
    app.use('/api', require('./routes'));
    logger.info('✅ API routes loaded');
} catch (err) {
    logger.warn('⚠️ No API routes found');
}

// ============================================================
// FALLBACK ROUTE
// ============================================================
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return notFoundHandler(req, res);
    }
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================
// CONNECT TO MONGODB
// ============================================================
connectDB();

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    logger.info(`🚀 Supply Chain Circle Server running on http://localhost:${PORT}`);
    logger.info(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`📁 Serving frontend from: ${path.join(__dirname, '../../frontend')}`);
    logger.info(`🔄 Press Ctrl+C to stop`);
});

// ============================================================
// GRACEFUL SHUTDOWN
// ============================================================
const gracefulShutdown = async () => {
    logger.info('🔄 Received shutdown signal. Closing gracefully...');
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            logger.info('✅ MongoDB connection closed.');
        }
        process.exit(0);
    } catch (err) {
        logger.error(`❌ Error during shutdown: ${err.message}`);
        process.exit(1);
    }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
    logger.error(`❌ Unhandled Rejection: ${err.message}`);
    logger.error(err.stack);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

process.on('uncaughtException', (err) => {
    logger.error(`❌ Uncaught Exception: ${err.message}`);
    logger.error(err.stack);
    process.exit(1);
});

module.exports = app;
