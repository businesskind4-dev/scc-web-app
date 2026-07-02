const cors = require('cors');

// Read allowed origins from environment variable, with fallback
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5000,https://scc-web-app.vercel.app,https://scc-web-app.up.railway.app')
  .split(',')
  .map(origin => origin.trim());

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200,
};

module.exports = cors(corsOptions);