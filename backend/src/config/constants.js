const logger = require('../utils/logger');

// Validate required environment variables
const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'FRONTEND_URL',
];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
    logger.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    logger.error('   Please check your .env file and restart the server');
    process.exit(1);
}

// Validate JWT secret length
if (process.env.JWT_SECRET.length < 32) {
    logger.warn('⚠️ JWT_SECRET is too short. Use at least 64 characters for production.');
}

module.exports = {
    APP: {
        NAME: 'Supply Chain Circle',
        VERSION: '1.0.0',
        ENVIRONMENT: process.env.NODE_ENV || 'development',
        IS_PRODUCTION: process.env.NODE_ENV === 'production',
        IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
    },

    SERVER: {
        PORT: parseInt(process.env.PORT) || 5000,
        API_URL: process.env.API_URL || `http://localhost:${parseInt(process.env.PORT) || 5000}`,
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5000',
    },

    DATABASE: {
        URI: process.env.MONGODB_URI,
        POOL_SIZE: parseInt(process.env.DB_POOL_SIZE) || 10,
        CONNECT_TIMEOUT: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
        SOCKET_TIMEOUT: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
    },

    SECURITY: {
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
        BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    },

    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        STRICT_MAX: parseInt(process.env.RATE_LIMIT_STRICT_MAX) || 5,
    },

    CONTACT: {
        PHONE: '+267 71 916 192',
        WHATSAPP: 'https://wa.me/qr/D2YIHY46XL4UO1',
        EMAIL: 'katlokind@gmail.com',
        FACEBOOK: 'https://www.facebook.com/profile.php?id=61589321477563',
    },

    API: {
        PREFIX: '/api/v1',
    },

    CORS: {
        ORIGIN: process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',') 
            : ['http://localhost:5000', 'http://localhost:3000'],
    },
};
