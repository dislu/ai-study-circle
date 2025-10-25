const logger = require('../utils/Logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Request logging middleware
 * Captures all HTTP requests with detailed information
 */
const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.requestId);
  
  // Capture start time for performance measurement
  const startTime = Date.now();
  
  // Extract client IP
  const clientIp = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null);

  // Log request start
  logger.info('Request Started', {
    context: 'api',
    action: 'request_start',
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: clientIp,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    requestId: req.requestId,
    userId: req.user?.id,
    sessionId: req.sessionID,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    headers: filterHeaders(req.headers),
    body: shouldLogBody(req) ? logger.filterSensitiveData(req.body) : undefined
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  const originalJson = res.json;
  
  // Capture response data
  let responseBody = null;
  res.json = function(data) {
    responseBody = data;
    return originalJson.call(this, data);
  };

  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log request completion
    logger.logRequest(req, res, responseTime);
    
    // Additional detailed logging
    logger.info('Request Completed', {
      context: 'api',
      action: 'request_end',
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime,
      requestId: req.requestId,
      userId: req.user?.id,
      responseSize: res.get('Content-Length'),
      responseBody: shouldLogResponseBody(res) ? 
        logger.filterSensitiveData(responseBody) : undefined
    });
    
    // Performance warning for slow requests
    if (responseTime > 1000) {
      logger.logPerformance('slow_request', responseTime, {
        method: req.method,
        url: req.originalUrl,
        requestId: req.requestId,
        userId: req.user?.id
      });
    }
    
    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

/**
 * Filter headers to remove sensitive information
 */
const filterHeaders = (headers) => {
  const filtered = { ...headers };
  const sensitiveHeaders = [
    'authorization', 'cookie', 'x-api-key', 'x-auth-token',
    'x-access-token', 'x-refresh-token', 'set-cookie'
  ];
  
  sensitiveHeaders.forEach(header => {
    if (filtered[header]) {
      filtered[header] = '[FILTERED]';
    }
  });
  
  return filtered;
};

/**
 * Determine if request body should be logged
 */
const shouldLogBody = (req) => {
  // Don't log body for GET requests
  if (req.method === 'GET') return false;
  
  // Don't log file uploads
  if (req.is('multipart/form-data')) return false;
  
  // Don't log large bodies
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 10000) return false; // 10KB limit
  
  // Log for development, be selective in production
  return process.env.NODE_ENV === 'development' || 
         ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
};

/**
 * Determine if response body should be logged
 */
const shouldLogResponseBody = (res) => {
  // Only log error responses and in development
  return (res.statusCode >= 400) || 
         (process.env.NODE_ENV === 'development' && res.statusCode < 300);
};

module.exports = requestLogger;