const express = require('express');
const logger = require('../utils/Logger');
const { authenticateToken } = require('../../middleware/auth');
const { asyncErrorHandler } = require('../middleware/errorLogger');

const router = express.Router();

/**
 * Frontend Log Collection Endpoint
 * Receives logs from frontend clients and processes them
 */
router.post('/client-logs', authenticateToken, asyncErrorHandler(async (req, res) => {
  try {
    const { logs } = req.body;
    
    if (!logs || !Array.isArray(logs)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid logs format. Expected array of log entries.'
      });
    }

    // Process each log entry
    const processedLogs = [];
    
    for (const logEntry of logs) {
      try {
        // Validate log entry
        if (!isValidLogEntry(logEntry)) {
          logger.warn('Invalid frontend log entry received', {
            context: 'logging',
            action: 'invalid_log_entry',
            userId: req.user?.id,
            logEntry: logger.filterSensitiveData(logEntry),
            requestId: req.requestId
          });
          continue;
        }

        // Enrich log entry with server-side information
        const enrichedLog = enrichLogEntry(logEntry, req);
        
        // Log based on level and context
        logFrontendEntry(enrichedLog);
        
        processedLogs.push({
          timestamp: logEntry.timestamp,
          level: logEntry.level,
          status: 'processed'
        });

      } catch (entryError) {
        logger.error('Error processing frontend log entry', {
          context: 'logging',
          action: 'log_processing_error',
          error: {
            message: entryError.message,
            stack: entryError.stack
          },
          logEntry: logger.filterSensitiveData(logEntry),
          userId: req.user?.id,
          requestId: req.requestId
        });
        
        processedLogs.push({
          timestamp: logEntry.timestamp,
          level: logEntry.level,
          status: 'error',
          error: entryError.message
        });
      }
    }

    // Log batch processing summary
    logger.info('Frontend logs batch processed', {
      context: 'logging',
      action: 'batch_processed',
      userId: req.user?.id,
      totalLogs: logs.length,
      processedLogs: processedLogs.filter(log => log.status === 'processed').length,
      errorLogs: processedLogs.filter(log => log.status === 'error').length,
      requestId: req.requestId
    });

    res.json({
      success: true,
      message: 'Logs processed successfully',
      processed: processedLogs.length,
      results: processedLogs
    });

  } catch (error) {
    logger.error('Frontend log collection endpoint error', {
      context: 'logging',
      action: 'endpoint_error',
      error: {
        message: error.message,
        stack: error.stack
      },
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error processing logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * Log Statistics Endpoint
 * Provides logging statistics and health information
 */
router.get('/stats', authenticateToken, asyncErrorHandler(async (req, res) => {
  try {
    const stats = await getLoggingStats(req.user?.id);
    
    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Logging stats endpoint error', {
      context: 'logging',
      action: 'stats_error',
      error: {
        message: error.message,
        stack: error.stack
      },
      userId: req.user?.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Error retrieving logging stats'
    });
  }
}));

/**
 * Validate log entry structure and content
 */
function isValidLogEntry(logEntry) {
  if (!logEntry || typeof logEntry !== 'object') {
    return false;
  }

  // Required fields
  const requiredFields = ['timestamp', 'level', 'message'];
  for (const field of requiredFields) {
    if (!logEntry[field]) {
      return false;
    }
  }

  // Valid log levels
  const validLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLevels.includes(logEntry.level)) {
    return false;
  }

  // Timestamp validation
  const timestamp = new Date(logEntry.timestamp);
  if (isNaN(timestamp.getTime())) {
    return false;
  }

  // Message length validation
  if (typeof logEntry.message !== 'string' || logEntry.message.length > 1000) {
    return false;
  }

  return true;
}

/**
 * Enrich frontend log entry with server-side information
 */
function enrichLogEntry(logEntry, req) {
  const now = new Date().toISOString();
  
  return {
    ...logEntry,
    // Server-side enrichment
    serverTimestamp: now,
    userId: req.user?.id,
    serverSessionId: req.sessionID,
    serverRequestId: req.requestId,
    serverIP: req.ip || req.connection.remoteAddress,
    
    // Processing metadata
    source: 'frontend',
    processedBy: 'log-collection-service',
    
    // Filter sensitive data
    ...logger.filterSensitiveData(logEntry.context || {}),
    
    // Add geo information if available
    geoInfo: extractGeoInfo(req),
    
    // Device/browser information
    deviceInfo: extractDeviceInfo(req)
  };
}

/**
 * Log frontend entry using appropriate logger method
 */
function logFrontendEntry(enrichedLog) {
  const logMessage = `Frontend: ${enrichedLog.message}`;
  const logContext = {
    ...enrichedLog,
    context: 'frontend'
  };

  // Route to appropriate logger based on context/action
  if (enrichedLog.action === 'user_interaction') {
    logger.info(logMessage, logContext);
  } else if (enrichedLog.action === 'page_view') {
    logger.info(logMessage, logContext);
  } else if (enrichedLog.action === 'api_call') {
    if (enrichedLog.status >= 400) {
      logger.error(logMessage, logContext);
    } else {
      logger.info(logMessage, logContext);
    }
  } else if (enrichedLog.action === 'error_boundary' || enrichedLog.action === 'unhandled_error') {
    logger.error(logMessage, logContext);
  } else if (enrichedLog.action === 'performance') {
    logger.logPerformance(enrichedLog.metric || 'frontend_metric', enrichedLog.value || 0, logContext);
  } else {
    // Default logging based on level
    logger[enrichedLog.level](logMessage, logContext);
  }
}

/**
 * Extract geographical information from request
 */
function extractGeoInfo(req) {
  const geoHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip'
  ];

  let clientIP = req.ip;
  for (const header of geoHeaders) {
    const headerValue = req.get(header);
    if (headerValue) {
      clientIP = headerValue.split(',')[0].trim();
      break;
    }
  }

  return {
    ip: clientIP,
    country: req.get('cf-ipcountry') || null,
    timezone: req.get('cf-timezone') || null
  };
}

/**
 * Extract device and browser information from request
 */
function extractDeviceInfo(req) {
  const userAgent = req.get('User-Agent') || '';
  
  return {
    userAgent,
    acceptLanguage: req.get('Accept-Language') || null,
    acceptEncoding: req.get('Accept-Encoding') || null,
    dnt: req.get('DNT') || null, // Do Not Track
    viewport: req.get('X-Viewport') || null,
    screenResolution: req.get('X-Screen-Resolution') || null
  };
}

/**
 * Get logging statistics for monitoring
 */
async function getLoggingStats(userId) {
  // This would typically query a database or log aggregation service
  // For now, return mock stats
  return {
    timestamp: new Date().toISOString(),
    userId,
    stats: {
      logsProcessedToday: 1250,
      errorRate: 0.02,
      averageProcessingTime: 45,
      topErrorTypes: [
        { type: 'api_call_failed', count: 15 },
        { type: 'validation_error', count: 8 },
        { type: 'network_error', count: 6 }
      ],
      performanceMetrics: {
        avgPageLoadTime: 1.2,
        avgApiResponseTime: 0.8,
        frontendErrorRate: 0.01
      }
    },
    health: {
      status: 'healthy',
      diskUsage: 65,
      logRotationStatus: 'active',
      lastRotation: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  };
}

module.exports = router;