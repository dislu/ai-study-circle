const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize logging configuration
const { initializeLogging } = require('./src/config/loggingConfig');
const loggingConfig = initializeLogging();

// Import logging utilities and middleware
const logger = require('./src/utils/Logger');
const requestLogger = require('./src/middleware/requestLogger');
const { errorLogger, asyncErrorHandler } = require('./src/middleware/errorLogger');

// Import database connection
const databaseFactory = require('./config/database-factory');

// Import routes
const authRoutes = require('./routes/auth');
const socialAuthRoutes = require('./routes/socialAuth');
const uploadRoutes = require('./routes/upload');
const documentsRoutes = require('./routes/documents');
const summaryRoutes = require('./routes/summary');
const examRoutes = require('./routes/exam');
const chatRoutes = require('./routes/chat');
const statusRoutes = require('./routes/status');
const exportRoutes = require('./routes/export');
const analyticsRoutes = require('./routes/analytics');
const templateRoutes = require('./routes/templates');

// Import translation routes and middleware
const { router: translationRoutes, translationMiddleware } = require('./routes/translation');

// Import logging routes
const logRoutes = require('./src/routes/logs');

// Import alert routes
const alertRoutes = require('./routes/alerts');

// Import and initialize authentication service
const AuthService = require('./services/AuthService');
const WebSocketService = require('./services/WebSocketService');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();
const PORT = process.env.PORT || 3001;

// Log server startup
logger.info('🚀 Starting AI Study Circle Backend Server', {
  context: 'server',
  action: 'startup',
  port: PORT,
  environment: process.env.NODE_ENV || 'development',
  version: process.env.npm_package_version || '1.0.0',
  timestamp: new Date().toISOString()
});

// Security middleware
app.use(helmet());
app.use(compression());

// Request logging middleware (before other middleware)
app.use(requestLogger);

// Rate limiting with logging
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    // Log rate limiting event
    const AuthLogger = require('./src/services/AuthLogger');
    AuthLogger.logRateLimit(req.ip, req.originalUrl, 100, 15 * 60 * 1000, {
      userAgent: req.get('User-Agent'),
      requestId: req.requestId
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration for social authentication
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_study_circle',
    touchAfter: 24 * 3600 // lazy session update
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Connect to database with logging
databaseFactory.connect()
  .then(() => {
    logger.info('✅ Database connected successfully', {
      context: 'database',
      action: 'connection_established',
      mongodb_uri: process.env.MONGODB_URI ? '[CONFIGURED]' : '[NOT_CONFIGURED]'
    });
  })
  .catch(err => {
    logger.error('❌ Database connection failed', {
      context: 'database',
      action: 'connection_failed',
      error: {
        message: err.message,
        code: err.code,
        stack: err.stack
      }
    });
    process.exit(1);
  });

// Apply translation middleware to AI agent routes
const translationWrapper = translationMiddleware.wrapResponseWithTranslation();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/social', socialAuthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentsRoutes);

// AI agent routes with automatic translation support
app.use('/api/summary', 
  translationMiddleware.translateContent(), 
  translationWrapper, 
  summaryRoutes
);
app.use('/api/exam', 
  translationMiddleware.translateContent(), 
  translationWrapper, 
  examRoutes
);
app.use('/api/chat', 
  translationMiddleware.translateContent(), 
  translationWrapper, 
  chatRoutes
);

// Other routes without translation (no content processing)
app.use('/api/status', statusRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/templates', templateRoutes);

// Translation service routes
app.use('/api/translation', translationRoutes);

// Logging service routes
app.use('/api/logs', logRoutes);

// Alert webhook routes
app.use('/api/alerts', alertRoutes);

// Health check endpoint with logging
app.get('/api/health', asyncErrorHandler(async (req, res) => {
  const healthData = {
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };

  logger.info('Health check requested', {
    context: 'api',
    action: 'health_check',
    requestId: req.requestId,
    ip: req.ip,
    uptime: healthData.uptime
  });

  res.json(healthData);
}));

// 404 handler with logging
app.use('*', (req, res) => {
  logger.warn('Route not found', {
    context: 'api',
    action: 'route_not_found',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId
  });
  
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error logging middleware (must be after routes)
app.use(errorLogger);

// Final error handler
app.use((err, req, res, next) => {
  // Log has already been handled by errorLogger middleware
  const statusCode = err.status || err.statusCode || 500;
  
  res.status(statusCode).json({ 
    error: statusCode >= 500 ? 'Internal server error' : err.message || 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    requestId: req.requestId
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully', {
    context: 'server',
    action: 'shutdown',
    signal: 'SIGTERM'
  });
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully', {
    context: 'server',
    action: 'shutdown',
    signal: 'SIGINT'
  });
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info('🚀 AI Study Circle Backend Server Started', {
    context: 'server',
    action: 'server_started',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    pid: process.pid,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
  
  // Initialize WebSocket server
  WebSocketService.initialize(server);
  
  console.log(`🚀 AI Study Circle Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Logs endpoint: http://localhost:${PORT}/api/logs`);
  console.log(`🔌 WebSocket server: ws://localhost:${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  logger.error('Server error occurred', {
    context: 'server',
    action: 'server_error',
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack
    }
  });
});