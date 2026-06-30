const crypto = require('crypto');

// Generate a secure random token
const generateToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

// Generate a secure JWT secret
const generateJWTSecret = () => {
    return crypto.randomBytes(64).toString('hex');
};

// Mask sensitive data for logging
const maskSensitive = (data) => {
    if (typeof data !== 'object' || data === null) return data;
    
    const masked = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apiKey'];
    
    sensitiveFields.forEach((field) => {
        if (masked[field]) {
            masked[field] = '***REDACTED***';
        }
    });
    
    return masked;
};

// Safe JSON parse with error handling
const safeJsonParse = (json) => {
    try {
        return JSON.parse(json);
    } catch {
        return null;
    }
};

// Check if running in production
const isProduction = () => {
    return process.env.NODE_ENV === 'production';
};

// Check if running in development
const isDevelopment = () => {
    return process.env.NODE_ENV === 'development';
};

module.exports = {
    generateToken,
    generateJWTSecret,
    maskSensitive,
    safeJsonParse,
    isProduction,
    isDevelopment,
};
