require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import custom middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const coordinateRoutes = require('./routes/coordinate-routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration - allow React Native app to connect from various platforms
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Allow all localhost and common React Native origins
    const allowedOrigins = [
      /^http:\/\/localhost:\d+$/,           // Any localhost port
      /^http:\/\/127\.0\.0\.1:\d+$/,        // 127.0.0.1 with any port
      /^http:\/\/10\.0\.2\.2:\d+$/,         // Android emulator
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/,  // Local network IPs
      /^exp:\/\/.*$/,                       // Expo development
      /^capacitor:\/\/.*$/,                 // Capacitor apps
      /^ionic:\/\/.*$/,                     // Ionic apps
    ];
    
    const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked origin: ${origin}`);
      callback(null, true); // Still allow in development - be more restrictive in production
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Logging middleware
app.use(morgan('combined'));
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads/exports
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'NFL Field Mapper Backend'
  });
});

// API routes
app.use('/api/coordinates', coordinateRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NFL Field Mapper Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      coordinates: '/api/coordinates'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 NFL Field Mapper Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏈 API endpoints: http://localhost:${PORT}/api/coordinates`);
});

module.exports = app; 