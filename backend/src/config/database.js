const mongoose = require('mongoose');

const connectDB = async () => {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is missing in .env');
        return;
    }

    const options = {
        connectTimeoutMS: 15000,
        socketTimeoutMS: 60000,
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 10000,
        retryWrites: true,
        retryReads: true,
    };

    try {
        const conn = await mongoose.connect(uri, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
        console.log(`   Connection State: ${mongoose.connection.readyState} (1=connected)`);
        return conn;
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log('🔄 Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB event: connected');
});

mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB event error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB disconnected');
});

const checkConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
        console.warn('⚠️ MongoDB not connected – rejecting request');
        return res.status(503).json({
            success: false,
            message: 'Database is temporarily unavailable. Please try again later.',
        });
    }
    next();
};

module.exports = { connectDB, checkConnection };