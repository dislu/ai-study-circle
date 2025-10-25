const logger = require('../utils/Logger');

/**
 * Error logging middleware
 * Captures and logs all application errors with detailed context
 */
const errorLogger = (error, req, res, next) => {
  // Determine error severity and type
  const errorInfo = analyzeError(error, req);
  
  // Prepare comprehensive error context
  const errorContext = {
    context: 'error',
    action: 'error_occurred',
    requestId: req.requestId,
    userId: req.user?.id,
    sessionId: req.sessionID,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status || error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      errno: error.errno,
      syscall: error.syscall,
      path: error.path
    },
    errorType: errorInfo.type,
    severity: errorInfo.severity,
    category: errorInfo.category,
    isOperational: error.isOperational || false,
    requestBody: req.body ? logger.filterSensitiveData(req.body) : undefined,
    requestParams: req.params,
    requestQuery: req.query
  };

  // Add additional context based on error type
  if (error.validation) {
    errorContext.validationErrors = error.validation;
  }

  if (error.code === 11000) {
    errorContext.duplicateKey = extractDuplicateKeyInfo(error);
  }

  // Log error based on severity
  switch (errorInfo.severity) {
    case 'critical':
      logger.error('🚨 Critical System Error', errorContext);
      // Could trigger immediate alerts here
      break;
    case 'high':
      logger.error('🔥 High Priority Error', errorContext);
      break;
    case 'medium':
      logger.warn('⚠️ Medium Priority Error', errorContext);
      break;
    case 'low':
      logger.info('ℹ️ Low Priority Error', errorContext);
      break;
    default:
      logger.error('❓ Unknown Error', errorContext);
  }

  // Log security-related errors separately
  if (errorInfo.category === 'security') {
    logger.logSecurity('security_error', req.ip, {
      error: error.message,
      requestId: req.requestId,
      userId: req.user?.id,
      url: req.originalUrl,
      severity: errorInfo.severity
    });
  }

  // Log authentication errors
  if (errorInfo.category === 'auth') {
    logger.logAuth('auth_error', req.user?.id, {
      error: error.message,
      requestId: req.requestId,
      ip: req.ip,
      url: req.originalUrl,
      severity: errorInfo.severity
    });
  }

  // Log database errors
  if (errorInfo.category === 'database') {
    logger.error('Database Error', {
      context: 'database',
      action: 'db_error',
      error: {
        name: error.name,
        message: error.message,
        code: error.code
      },
      requestId: req.requestId,
      collection: error.collection,
      operation: error.operation
    });
  }

  next(error);
};

/**
 * Analyze error to determine severity, type, and category
 */
const analyzeError = (error, req) => {
  let severity = 'medium';
  let type = 'programming';
  let category = 'general';

  // Critical system errors
  if (isCriticalError(error)) {
    severity = 'critical';
    category = 'system';
  }
  // Database errors
  else if (isDatabaseError(error)) {
    severity = error.name === 'MongoNetworkError' ? 'critical' : 'high';
    category = 'database';
  }
  // Security errors
  else if (isSecurityError(error)) {
    severity = 'high';
    category = 'security';
  }
  // Authentication errors
  else if (isAuthError(error)) {
    severity = 'medium';
    category = 'auth';
  }
  // Validation errors
  else if (isValidationError(error)) {
    severity = 'low';
    type = 'operational';
    category = 'validation';
  }
  // Client errors (4xx)
  else if (error.status >= 400 && error.status < 500) {
    severity = 'low';
    type = 'operational';
    category = 'client';
  }
  // Server errors (5xx)
  else if (error.status >= 500) {
    severity = 'high';
    category = 'server';
  }

  return { severity, type, category };
};

/**
 * Check if error is critical system error
 */
const isCriticalError = (error) => {
  const criticalPatterns = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEOUT',
    'FATAL',
    'OutOfMemoryError',
    'SYSTEM_ERROR'
  ];

  return criticalPatterns.some(pattern => 
    error.message?.includes(pattern) || 
    error.code === pattern ||
    error.name?.includes(pattern)
  );
};

/**
 * Check if error is database-related
 */
const isDatabaseError = (error) => {
  const dbErrorNames = [
    'MongoError',
    'MongoNetworkError',
    'MongoParseError',
    'MongoWriteConcernError',
    'MongoBulkWriteError',
    'ValidationError',
    'CastError',
    'DocumentNotFoundError'
  ];

  return dbErrorNames.includes(error.name) || 
         error.message?.includes('MongoDB') ||
         error.code === 11000; // Duplicate key error
};

/**
 * Check if error is security-related
 */
const isSecurityError = (error) => {
  const securityPatterns = [
    'Unauthorized',
    'Forbidden',
    'Invalid token',
    'JWT',
    'CSRF',
    'XSS',
    'SQL injection',
    'Rate limit',
    'Brute force'
  ];

  return securityPatterns.some(pattern => 
    error.message?.includes(pattern) ||
    error.name?.includes(pattern)
  ) || error.status === 401 || error.status === 403;
};

/**
 * Check if error is authentication-related
 */
const isAuthError = (error) => {
  const authPatterns = [
    'Authentication',
    'Login',
    'Password',
    'Token expired',
    'Invalid credentials',
    'UnauthorizedError'
  ];

  return authPatterns.some(pattern => 
    error.message?.includes(pattern) ||
    error.name?.includes(pattern)
  );
};

/**
 * Check if error is validation-related
 */
const isValidationError = (error) => {
  return error.name === 'ValidationError' ||
         error.name === 'CastError' ||
         error.message?.includes('validation') ||
         error.message?.includes('required') ||
         error.message?.includes('invalid');
};

/**
 * Extract duplicate key information from MongoDB duplicate key error
 */
const extractDuplicateKeyInfo = (error) => {
  try {
    const keyPattern = error.keyPattern || {};
    const keyValue = error.keyValue || {};
    
    return {
      duplicatedFields: Object.keys(keyPattern),
      duplicatedValues: keyValue,
      collection: error.collection || 'unknown'
    };
  } catch (e) {
    return { info: 'Could not extract duplicate key info' };
  }
};

/**
 * Async error handler for catching errors in async route handlers
 */
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorLogger,
  asyncErrorHandler
};