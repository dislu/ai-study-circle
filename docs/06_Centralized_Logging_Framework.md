# AI Study Circle - Centralized Logging Framework

**Document 6: Comprehensive Logging, Monitoring, and Observability**

---

## Table of Contents

1. [Logging Architecture Overview](#logging-architecture-overview)
2. [Backend Logging Implementation](#backend-logging-implementation)
3. [Frontend Logging Implementation](#frontend-logging-implementation)
4. [ELK Stack Integration](#elk-stack-integration)
5. [Log Analysis and Monitoring](#log-analysis-and-monitoring)
6. [Performance Metrics](#performance-metrics)
7. [Alerting and Notifications](#alerting-and-notifications)

---

## Logging Architecture Overview

### 1. **Logging Strategy**

The AI Study Circle logging framework provides:

- **Structured Logging**: JSON-formatted logs for easy parsing and analysis
- **Centralized Collection**: All logs aggregated in a single location
- **Multi-Level Logging**: Debug, Info, Warn, Error, Fatal levels
- **Context Enrichment**: Request IDs, user IDs, session information
- **Real-time Monitoring**: Live log streaming and analysis
- **Long-term Storage**: Log retention and archiving policies
- **Security Compliance**: Sensitive data filtering and audit trails

### 2. **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                   Logging Architecture                      │
└─────────────────────────────────────────────────────────────┘

Application Layer:
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Frontend    │    │    Backend    │    │   Database    │
│   (React)     │    │  (Node.js)    │    │  (MongoDB)    │
│               │    │               │    │               │
│  Browser      │    │  Winston      │    │  Ops Manager  │
│  Console      │    │  Logger       │    │  Logs         │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
Collection Layer:            │
┌─────────────────────────────▼─────────────────────────────┐
│                    Filebeat                               │
│              (Log Shipper Agent)                         │
└─────────────────────────────┬─────────────────────────────┘
                              │
Processing Layer:             │
┌─────────────────────────────▼─────────────────────────────┐
│                   Logstash                               │
│         (Log Processing & Transformation)                │
└─────────────────────────────┬─────────────────────────────┘
                              │
Storage & Search Layer:       │
┌─────────────────────────────▼─────────────────────────────┐
│                 Elasticsearch                           │
│           (Search & Analytics Engine)                   │
└─────────────────────────────┬─────────────────────────────┘
                              │
Visualization Layer:          │
┌─────────────────────────────▼─────────────────────────────┐
│                    Kibana                               │
│         (Dashboard & Visualization)                     │
└─────────────────────────────────────────────────────────┘

Alerting Layer:
┌─────────────────────────────────────────────────────────┐
│              ElastAlert / Watcher                      │
│           (Monitoring & Notifications)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Logging Implementation

### 1. **Winston Logger Configuration**

#### Logger Setup (`src/utils/Logger.js`)
```javascript
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label']
  }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = ` ${JSON.stringify(meta)}`;
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'ai-study-circle-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    hostname: require('os').hostname(),
    pid: process.pid
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Application-specific log files
    new winston.transports.File({
      filename: path.join(logDir, 'auth.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'auth' ? info : false;
        })()
      )
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'api.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'api' ? info : false;
        })()
      )
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'ai.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'ai' ? info : false;
        })()
      )
    })
  ],

  // Exception handling
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Rejection handling
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Exit on handled exceptions
  exitOnError: false
});

// Add console transport for development
if (process.env.NODE_ENV === 'development') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Add ElasticSearch transport for production
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  const { ElasticsearchTransport } = require('winston-elasticsearch');
  
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      }
    },
    index: 'ai-study-circle-logs',
    indexTemplate: {
      name: 'ai-study-circle-logs',
      body: {
        index_patterns: ['ai-study-circle-logs-*'],
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            '@timestamp': { type: 'date' },
            level: { type: 'keyword' },
            message: { type: 'text' },
            service: { type: 'keyword' },
            environment: { type: 'keyword' },
            userId: { type: 'keyword' },
            requestId: { type: 'keyword' },
            sessionId: { type: 'keyword' },
            ip: { type: 'ip' },
            userAgent: { type: 'text' },
            method: { type: 'keyword' },
            url: { type: 'keyword' },
            statusCode: { type: 'integer' },
            responseTime: { type: 'integer' },
            context: { type: 'keyword' },
            action: { type: 'keyword' },
            error: {
              properties: {
                name: { type: 'keyword' },
                message: { type: 'text' },
                stack: { type: 'text' }
              }
            }
          }
        }
      }
    }
  }));
}

// Helper methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    context: 'api',
    action: 'request',
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    sessionId: req.sessionID,
    requestId: req.requestId
  };

  if (res.statusCode >= 400) {
    logger.error('HTTP Request Failed', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
};

logger.logAuth = (action, userId, metadata = {}) => {
  logger.info('Authentication Event', {
    context: 'auth',
    action,
    userId,
    ...metadata
  });
};

logger.logAI = (action, userId, metadata = {}) => {
  logger.info('AI Processing Event', {
    context: 'ai',
    action,
    userId,
    ...metadata
  });
};

logger.logTranslation = (action, sourceLanguage, targetLanguage, metadata = {}) => {
  logger.info('Translation Event', {
    context: 'translation',
    action,
    sourceLanguage,
    targetLanguage,
    ...metadata
  });
};

logger.logSecurity = (action, ip, metadata = {}) => {
  logger.warn('Security Event', {
    context: 'security',
    action,
    ip,
    ...metadata
  });
};

logger.logPerformance = (action, duration, metadata = {}) => {
  const level = duration > 5000 ? 'warn' : 'info';
  logger.log(level, 'Performance Event', {
    context: 'performance',
    action,
    duration,
    ...metadata
  });
};

module.exports = logger;
```

### 2. **Request Logging Middleware**

#### Request Logger (`src/middleware/requestLogger.js`)
```javascript
const logger = require('../utils/Logger');
const { v4: uuidv4 } = require('uuid');

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.requestId);
  
  // Capture start time
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request Started', {
    context: 'api',
    action: 'request_start',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    requestId: req.requestId,
    userId: req.user?.id,
    sessionId: req.sessionID,
    body: req.method === 'POST' || req.method === 'PUT' ? 
      filterSensitiveData(req.body) : undefined
  });

  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log request completion
    logger.logRequest(req, res, responseTime);
    
    // Call original end method
    originalEnd.apply(this, args);
  };

  next();
};

// Filter sensitive data from logs
const filterSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const filtered = { ...data };
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'authorization',
    'cookie', 'session', 'ssn', 'creditCard', 'cvv'
  ];
  
  sensitiveFields.forEach(field => {
    if (filtered[field]) {
      filtered[field] = '[FILTERED]';
    }
  });
  
  return filtered;
};

module.exports = requestLogger;
```

### 3. **Error Logging Middleware**

#### Error Logger (`src/middleware/errorLogger.js`)
```javascript
const logger = require('../utils/Logger');

const errorLogger = (error, req, res, next) => {
  // Determine error severity
  const severity = determineErrorSeverity(error, req);
  
  // Prepare error context
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
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.status || error.statusCode,
      stack: error.stack
    }
  };

  // Add additional context based on error type
  if (error.isOperational) {
    errorContext.errorType = 'operational';
  } else {
    errorContext.errorType = 'programming';
  }

  // Log error based on severity
  switch (severity) {
    case 'critical':
      logger.error('Critical Error', errorContext);
      break;
    case 'high':
      logger.error('High Priority Error', errorContext);
      break;
    case 'medium':
      logger.warn('Medium Priority Error', errorContext);
      break;
    case 'low':
      logger.info('Low Priority Error', errorContext);
      break;
    default:
      logger.error('Unknown Error', errorContext);
  }

  next(error);
};

const determineErrorSeverity = (error, req) => {
  // Critical errors
  if (error.name === 'MongoError' || 
      error.code === 'ECONNREFUSED' ||
      error.message.includes('FATAL')) {
    return 'critical';
  }

  // High priority errors
  if (error.status >= 500 ||
      error.name === 'ValidationError' ||
      error.name === 'CastError') {
    return 'high';
  }

  // Medium priority errors
  if (error.status >= 400 ||
      error.name === 'UnauthorizedError') {
    return 'medium';
  }

  // Low priority errors
  return 'low';
};

module.exports = errorLogger;
```

### 4. **Service-Specific Loggers**

#### Authentication Logger (`src/services/AuthLogger.js`)
```javascript
const logger = require('../utils/Logger');

class AuthLogger {
  static logLoginAttempt(provider, email, ip, success = true, error = null) {
    const logData = {
      context: 'auth',
      action: 'login_attempt',
      provider,
      email,
      ip,
      success,
      timestamp: new Date().toISOString()
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code
      };
    }

    if (success) {
      logger.info('Successful Login', logData);
    } else {
      logger.warn('Failed Login Attempt', logData);
    }
  }

  static logLogout(userId, sessionId, ip) {
    logger.info('User Logout', {
      context: 'auth',
      action: 'logout',
      userId,
      sessionId,
      ip,
      timestamp: new Date().toISOString()
    });
  }

  static logTokenRefresh(userId, tokenType, ip, success = true) {
    logger.info('Token Refresh', {
      context: 'auth',
      action: 'token_refresh',
      userId,
      tokenType,
      ip,
      success,
      timestamp: new Date().toISOString()
    });
  }

  static logPermissionDenied(userId, resource, action, ip) {
    logger.warn('Permission Denied', {
      context: 'auth',
      action: 'permission_denied',
      userId,
      resource,
      requestedAction: action,
      ip,
      timestamp: new Date().toISOString()
    });
  }

  static logSecurityEvent(eventType, userId, ip, details = {}) {
    logger.warn('Security Event', {
      context: 'security',
      action: eventType,
      userId,
      ip,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = AuthLogger;
```

#### AI Processing Logger (`src/services/AILogger.js`)
```javascript
const logger = require('../utils/Logger');

class AILogger {
  static logSummaryGeneration(userId, config, performance, result) {
    logger.info('Summary Generated', {
      context: 'ai',
      action: 'summary_generation',
      userId,
      configuration: {
        type: config.type,
        length: config.length,
        language: config.language,
        customPrompt: !!config.customPrompt
      },
      performance: {
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed,
        model: performance.model
      },
      result: {
        originalWordCount: result.originalWordCount,
        summaryWordCount: result.summaryWordCount,
        compressionRatio: result.compressionRatio,
        quality: result.qualityScore
      },
      timestamp: new Date().toISOString()
    });
  }

  static logExamGeneration(userId, config, performance, result) {
    logger.info('Exam Generated', {
      context: 'ai',
      action: 'exam_generation',
      userId,
      configuration: {
        questionTypes: config.questionTypes,
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        language: config.language
      },
      performance: {
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed,
        model: performance.model
      },
      result: {
        questionsGenerated: result.questionsGenerated,
        totalPoints: result.totalPoints,
        estimatedTime: result.estimatedTime
      },
      timestamp: new Date().toISOString()
    });
  }

  static logAIError(userId, operation, error, context = {}) {
    logger.error('AI Processing Error', {
      context: 'ai',
      action: 'ai_error',
      userId,
      operation,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logAPIUsage(userId, provider, endpoint, tokens, cost) {
    logger.info('External API Usage', {
      context: 'ai',
      action: 'api_usage',
      userId,
      provider,
      endpoint,
      tokens,
      cost,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = AILogger;
```

---

## Frontend Logging Implementation

### 1. **Frontend Logger Setup**

#### Client Logger (`src/utils/ClientLogger.js`)
```javascript
class ClientLogger {
  constructor() {
    this.logLevel = process.env.REACT_APP_LOG_LEVEL || 'info';
    this.apiEndpoint = process.env.REACT_APP_API_URL + '/api/logs';
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.logQueue = [];
    this.maxQueueSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    // Start auto-flush
    this.startAutoFlush();
    
    // Capture unhandled errors
    this.setupErrorHandlers();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  setUserId(userId) {
    this.userId = userId;
  }

  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: 'frontend',
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...context
    };

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console[level] || console.log(`[${level.toUpperCase()}]`, message, context);
    }

    // Add to queue for server transmission
    this.addToQueue(logEntry);
  }

  debug(message, context) {
    this.log('debug', message, context);
  }

  info(message, context) {
    this.log('info', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  error(message, context) {
    this.log('error', message, context);
  }

  // Specific logging methods
  logUserAction(action, component, details = {}) {
    this.info('User Action', {
      action: 'user_interaction',
      component,
      actionType: action,
      details,
      timestamp: Date.now()
    });
  }

  logPageView(page, loadTime) {
    this.info('Page View', {
      action: 'page_view',
      page,
      loadTime,
      referrer: document.referrer,
      timestamp: Date.now()
    });
  }

  logAPICall(method, url, duration, status, error = null) {
    const logData = {
      action: 'api_call',
      method,
      url,
      duration,
      status,
      timestamp: Date.now()
    };

    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack
      };
      this.error('API Call Failed', logData);
    } else {
      this.info('API Call', logData);
    }
  }

  logPerformance(metric, value, context = {}) {
    this.info('Performance Metric', {
      action: 'performance',
      metric,
      value,
      context,
      timestamp: Date.now()
    });
  }

  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel] || 1;
    const messageLevel = levels[level] || 1;
    return messageLevel >= currentLevel;
  }

  addToQueue(logEntry) {
    this.logQueue.push(logEntry);
    
    if (this.logQueue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ logs: logsToSend })
      });
    } catch (error) {
      console.warn('Failed to send logs to server:', error);
      // Re-add failed logs to queue (with limit)
      this.logQueue = [...logsToSend.slice(-50), ...this.logQueue];
    }
  }

  startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  setupErrorHandlers() {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('Unhandled JavaScript Error', {
        action: 'unhandled_error',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        action: 'unhandled_rejection',
        reason: event.reason,
        stack: event.reason?.stack
      });
    });

    // React Error Boundary integration
    this.setupReactErrorBoundary();
  }

  setupReactErrorBoundary() {
    // This method can be called from React Error Boundary
    window.logReactError = (error, errorInfo) => {
      this.error('React Component Error', {
        action: 'react_error',
        error: {
          message: error.message,
          stack: error.stack
        },
        errorInfo,
        component: errorInfo.componentStack
      });
    };
  }

  setupPerformanceMonitoring() {
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.logPerformance('LCP', lastEntry.startTime, {
          element: lastEntry.element?.tagName
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay (FID)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          this.logPerformance('FID', entry.processingStart - entry.startTime, {
            eventType: entry.name
          });
        });
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift (CLS)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            this.logPerformance('CLS', entry.value, {
              sources: entry.sources?.map(source => source.node)
            });
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          this.logPerformance('page_load', navigation.loadEventEnd - navigation.fetchStart, {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
            firstByte: navigation.responseStart - navigation.fetchStart,
            domComplete: navigation.domComplete - navigation.fetchStart
          });
        }
      }, 0);
    });
  }
}

// Create singleton instance
const logger = new ClientLogger();

export default logger;
```

### 2. **React Error Boundary with Logging**

#### Error Boundary Component (`src/components/common/ErrorBoundary.jsx`)
```javascript
import React from 'react';
import logger from '../../utils/ClientLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo
    });

    // Log to our logging system
    logger.error('React Error Boundary Caught Error', {
      action: 'error_boundary',
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      errorInfo,
      component: this.props.component || 'Unknown',
      props: this.props.logProps ? this.props : undefined
    });

    // Also call the global error handler if it exists
    if (window.logReactError) {
      window.logReactError(error, errorInfo);
    }
  }

  handleReload = () => {
    logger.logUserAction('error_boundary_reload', 'ErrorBoundary');
    window.location.reload();
  };

  handleGoBack = () => {
    logger.logUserAction('error_boundary_go_back', 'ErrorBoundary');
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>Oops! Something went wrong</h2>
            <p>We're sorry, but something unexpected happened. Our team has been notified.</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleReload} className="btn btn-primary">
                Reload Page
              </button>
              <button onClick={this.handleGoBack} className="btn btn-secondary">
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 3. **API Logger Hook**

#### API Logging Hook (`src/hooks/useAPILogger.js`)
```javascript
import { useCallback } from 'react';
import logger from '../utils/ClientLogger';

const useAPILogger = () => {
  const logAPICall = useCallback((config, response, error, duration) => {
    const logData = {
      method: config.method?.toUpperCase() || 'GET',
      url: config.url,
      duration,
      status: response?.status || (error ? 'ERROR' : 'UNKNOWN'),
      timestamp: Date.now()
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code,
        response: error.response?.data
      };
      logger.error('API Call Failed', logData);
    } else {
      logger.info('API Call Success', logData);
    }
  }, []);

  const createAPIInterceptor = useCallback(() => {
    // For Axios interceptors
    const requestInterceptor = (config) => {
      config.metadata = { startTime: Date.now() };
      return config;
    };

    const responseInterceptor = (response) => {
      const duration = Date.now() - response.config.metadata.startTime;
      logAPICall(response.config, response, null, duration);
      return response;
    };

    const errorInterceptor = (error) => {
      if (error.config?.metadata) {
        const duration = Date.now() - error.config.metadata.startTime;
        logAPICall(error.config, error.response, error, duration);
      }
      return Promise.reject(error);
    };

    return {
      request: requestInterceptor,
      response: responseInterceptor,
      error: errorInterceptor
    };
  }, [logAPICall]);

  return {
    logAPICall,
    createAPIInterceptor
  };
};

export default useAPILogger;
```

---

## ELK Stack Integration

### 1. **Elasticsearch Configuration**

#### Elasticsearch Docker Configuration (`elk/elasticsearch/elasticsearch.yml`)
```yaml
# Elasticsearch Configuration for AI Study Circle
cluster.name: ai-study-circle-logs
node.name: ai-study-circle-es-node-1

# Network settings
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# Discovery settings for single node
discovery.type: single-node
cluster.initial_master_nodes: ["ai-study-circle-es-node-1"]

# Memory settings
bootstrap.memory_lock: false
indices.memory.index_buffer_size: 10%

# Index settings
action.auto_create_index: true
action.destructive_requires_name: false

# Security settings (for production)
xpack.security.enabled: false
xpack.security.transport.ssl.enabled: false
xpack.security.http.ssl.enabled: false

# Monitoring
xpack.monitoring.collection.enabled: true

# Index lifecycle management
xpack.ilm.enabled: true

# Index templates
index.number_of_shards: 1
index.number_of_replicas: 0
index.refresh_interval: 30s

# Log retention (30 days)
indices.lifecycle.rollover.max_size: 1GB
indices.lifecycle.rollover.max_age: 7d
indices.lifecycle.delete.min_age: 30d
```

### 2. **Logstash Configuration**

#### Logstash Pipeline (`elk/logstash/pipeline/logstash.conf`)
```ruby
# Logstash Configuration for AI Study Circle

input {
  # Filebeat input for log files
  beats {
    port => 5044
  }

  # HTTP input for direct log submissions
  http {
    port => 8080
    codec => json
  }

  # Syslog input for system logs
  syslog {
    port => 5514
  }
}

filter {
  # Parse timestamp
  date {
    match => [ "timestamp", "ISO8601" ]
    target => "@timestamp"
  }

  # Add fields based on source
  if [fields][service] == "ai-study-circle-backend" {
    mutate {
      add_tag => ["backend"]
      add_field => { "service_type" => "backend" }
    }
  } else if [fields][service] == "ai-study-circle-frontend" {
    mutate {
      add_tag => ["frontend"]
      add_field => { "service_type" => "frontend" }
    }
  }

  # Parse JSON logs
  if [message] =~ /^\{.*\}$/ {
    json {
      source => "message"
    }
  }

  # GeoIP lookup for IP addresses
  if [ip] {
    geoip {
      source => "ip"
      target => "geoip"
      add_tag => ["geoip"]
    }
  }

  # User agent parsing
  if [userAgent] {
    useragent {
      source => "userAgent"
      target => "user_agent"
    }
  }

  # Extract error information
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
      add_field => { "alert_required" => "true" }
    }
  }

  # Performance metrics processing
  if [context] == "performance" {
    mutate {
      add_tag => ["performance"]
      convert => { "duration" => "integer" }
      convert => { "responseTime" => "integer" }
    }
  }

  # Security event processing
  if [context] == "security" {
    mutate {
      add_tag => ["security", "alert"]
      add_field => { "security_alert" => "true" }
    }
  }

  # Remove unnecessary fields
  mutate {
    remove_field => ["agent", "ecs", "host", "input"]
  }
}

output {
  # Main Elasticsearch output
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "ai-study-circle-logs-%{+YYYY.MM.dd}"
    template_name => "ai-study-circle-logs"
    template => "/usr/share/logstash/templates/ai-study-circle-template.json"
    template_overwrite => true
  }

  # Error logs to separate index
  if "error" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "ai-study-circle-errors-%{+YYYY.MM.dd}"
    }
  }

  # Performance logs to separate index
  if "performance" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "ai-study-circle-performance-%{+YYYY.MM.dd}"
    }
  }

  # Security logs to separate index
  if "security" in [tags] {
    elasticsearch {
      hosts => ["elasticsearch:9200"]
      index => "ai-study-circle-security-%{+YYYY.MM.dd}"
    }
  }

  # Debug output (development only)
  if [@metadata][debug] == true {
    stdout { codec => rubydebug }
  }
}
```

#### Elasticsearch Index Template (`elk/logstash/templates/ai-study-circle-template.json`)
```json
{
  "index_patterns": ["ai-study-circle-*"],
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "refresh_interval": "30s",
    "index": {
      "lifecycle": {
        "name": "ai-study-circle-policy",
        "rollover_alias": "ai-study-circle-logs"
      }
    }
  },
  "mappings": {
    "properties": {
      "@timestamp": { "type": "date" },
      "timestamp": { "type": "date" },
      "level": { "type": "keyword" },
      "message": { 
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "service": { "type": "keyword" },
      "service_type": { "type": "keyword" },
      "environment": { "type": "keyword" },
      "version": { "type": "keyword" },
      "hostname": { "type": "keyword" },
      "pid": { "type": "integer" },
      "userId": { "type": "keyword" },
      "requestId": { "type": "keyword" },
      "sessionId": { "type": "keyword" },
      "context": { "type": "keyword" },
      "action": { "type": "keyword" },
      
      "ip": { "type": "ip" },
      "geoip": {
        "properties": {
          "location": { "type": "geo_point" },
          "country_name": { "type": "keyword" },
          "city_name": { "type": "keyword" },
          "region_name": { "type": "keyword" }
        }
      },
      
      "userAgent": { 
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 512 }
        }
      },
      "user_agent": {
        "properties": {
          "browser": { "type": "keyword" },
          "os": { "type": "keyword" },
          "device": { "type": "keyword" }
        }
      },
      
      "method": { "type": "keyword" },
      "url": { 
        "type": "text",
        "fields": {
          "keyword": { "type": "keyword", "ignore_above": 256 }
        }
      },
      "statusCode": { "type": "integer" },
      "responseTime": { "type": "integer" },
      "duration": { "type": "integer" },
      
      "error": {
        "properties": {
          "name": { "type": "keyword" },
          "message": { 
            "type": "text",
            "fields": {
              "keyword": { "type": "keyword", "ignore_above": 256 }
            }
          },
          "code": { "type": "keyword" },
          "stack": { "type": "text" }
        }
      },
      
      "performance": {
        "properties": {
          "metric": { "type": "keyword" },
          "value": { "type": "float" },
          "unit": { "type": "keyword" }
        }
      },
      
      "ai": {
        "properties": {
          "operation": { "type": "keyword" },
          "model": { "type": "keyword" },
          "tokensUsed": { "type": "integer" },
          "cost": { "type": "float" },
          "processingTime": { "type": "integer" }
        }
      },
      
      "translation": {
        "properties": {
          "sourceLanguage": { "type": "keyword" },
          "targetLanguage": { "type": "keyword" },
          "confidence": { "type": "float" },
          "provider": { "type": "keyword" }
        }
      }
    }
  }
}
```

### 3. **Filebeat Configuration**

#### Filebeat Configuration (`elk/filebeat/filebeat.yml`)
```yaml
# Filebeat Configuration for AI Study Circle

# Filebeat inputs
filebeat.inputs:
  # Backend application logs
  - type: log
    enabled: true
    paths:
      - /app/logs/*.log
    fields:
      service: ai-study-circle-backend
      environment: ${ENVIRONMENT:development}
    fields_under_root: true
    multiline.pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}'
    multiline.negate: true
    multiline.match: after
    json.keys_under_root: true
    json.add_error_key: true

  # Frontend logs (if collected via log files)
  - type: log
    enabled: true
    paths:
      - /var/log/nginx/*.log
    fields:
      service: ai-study-circle-frontend
      log_type: access
    fields_under_root: true

  # Error logs specifically
  - type: log
    enabled: true
    paths:
      - /app/logs/error.log
      - /app/logs/exceptions.log
    fields:
      service: ai-study-circle-backend
      log_type: error
      priority: high
    fields_under_root: true

# Output configuration
output.logstash:
  hosts: ["logstash:5044"]

# Logging configuration
logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/filebeat
  name: filebeat
  keepfiles: 7
  permissions: 0644

# Processors
processors:
  - add_host_metadata:
      when.not.contains.tags: forwarded
  - add_docker_metadata: ~
  - add_kubernetes_metadata: ~

# Monitoring
monitoring.enabled: true
monitoring.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

### 4. **Kibana Configuration**

#### Kibana Configuration (`elk/kibana/kibana.yml`)
```yaml
# Kibana Configuration for AI Study Circle

# Server settings
server.name: ai-study-circle-kibana
server.host: "0.0.0.0"
server.port: 5601

# Elasticsearch connection
elasticsearch.hosts: ["http://elasticsearch:9200"]

# Kibana index
kibana.index: ".kibana"

# Default application
kibana.defaultAppId: "discover"

# Logging
logging.dest: stdout
logging.quiet: false

# Advanced settings
elasticsearch.requestTimeout: 30000
elasticsearch.shardTimeout: 30000

# Security (disable for development)
xpack.security.enabled: false
xpack.monitoring.ui.container.elasticsearch.enabled: true

# Saved objects
xpack.spaces.enabled: true
xpack.spaces.maxSpaces: 1000

# Reporting
xpack.reporting.enabled: true
xpack.reporting.encryptionKey: "a_random_string_of_at_least_32_characters"

# Canvas
xpack.canvas.enabled: true

# Maps
xpack.maps.enabled: true
map.regionmap.layers: []
```

### 5. **Docker Compose for ELK Stack**

#### ELK Stack Compose (`elk/docker-compose.elk.yml`)
```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    container_name: ai-study-circle-elasticsearch
    environment:
      - node.name=ai-study-circle-es-node-1
      - cluster.name=ai-study-circle-logs
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
      - xpack.security.enabled=false
      - xpack.security.http.ssl.enabled=false
      - xpack.security.transport.ssl.enabled=false
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
      - ./elk/elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml:ro
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - elk-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    container_name: ai-study-circle-logstash
    volumes:
      - ./elk/logstash/pipeline:/usr/share/logstash/pipeline:ro
      - ./elk/logstash/templates:/usr/share/logstash/templates:ro
      - ./elk/logstash/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
    ports:
      - "5044:5044"
      - "8080:8080"
      - "5514:5514"
    environment:
      LS_JAVA_OPTS: "-Xmx1g -Xms1g"
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9600/_node/stats || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    container_name: ai-study-circle-kibana
    volumes:
      - ./elk/kibana/kibana.yml:/usr/share/kibana/config/kibana.yml:ro
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_URL: http://elasticsearch:9200
      ELASTICSEARCH_HOSTS: '["http://elasticsearch:9200"]'
    networks:
      - elk-network
    depends_on:
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:5601/api/status || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  filebeat:
    image: docker.elastic.co/beats/filebeat:8.10.0
    container_name: ai-study-circle-filebeat
    user: root
    volumes:
      - ./elk/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ../logs:/app/logs:ro
      - filebeat_data:/usr/share/filebeat/data
    environment:
      - ENVIRONMENT=${NODE_ENV:-development}
    networks:
      - elk-network
    depends_on:
      logstash:
        condition: service_healthy
    command: filebeat -e -strict.perms=false

volumes:
  elasticsearch_data:
    driver: local
  filebeat_data:
    driver: local

networks:
  elk-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.25.0.0/16
```

---

**Document Status**: In Progress  
**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Continue to**: Log Analysis, Monitoring, and Alerting sections