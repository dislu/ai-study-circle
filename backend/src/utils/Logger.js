const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// Ensure log directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format for structured logging
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
    // Error log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Authentication logs
    new DailyRotateFile({
      filename: path.join(logDir, 'auth-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'auth' ? info : false;
        })()
      )
    }),

    // API request logs
    new DailyRotateFile({
      filename: path.join(logDir, 'api-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'api' ? info : false;
        })()
      )
    }),

    // AI processing logs
    new DailyRotateFile({
      filename: path.join(logDir, 'ai-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'ai' ? info : false;
        })()
      )
    }),

    // Performance logs
    new DailyRotateFile({
      filename: path.join(logDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '10m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info) => {
          return info.context === 'performance' ? info : false;
        })()
      )
    })
  ],

  // Exception handling
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Rejection handling
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '10m',
      maxFiles: '14d',
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

// Add ElasticSearch transport for production (if configured)
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  const { ElasticsearchTransport } = require('winston-elasticsearch');
  
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
        password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
      }
    },
    index: 'ai-study-circle-logs',
    indexTemplate: {
      name: 'ai-study-circle-logs',
      body: {
        index_patterns: ['ai-study-circle-logs-*'],
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          refresh_interval: '30s'
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
            action: { type: 'keyword' }
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
  } else if (res.statusCode >= 300) {
    logger.warn('HTTP Request Redirected', logData);
  } else {
    logger.info('HTTP Request Success', logData);
  }
};

logger.logAuth = (action, userId, metadata = {}) => {
  logger.info('Authentication Event', {
    context: 'auth',
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

logger.logAI = (action, userId, metadata = {}) => {
  logger.info('AI Processing Event', {
    context: 'ai',
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

logger.logTranslation = (action, sourceLanguage, targetLanguage, metadata = {}) => {
  logger.info('Translation Event', {
    context: 'translation',
    action,
    sourceLanguage,
    targetLanguage,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

logger.logSecurity = (action, ip, metadata = {}) => {
  logger.warn('Security Event', {
    context: 'security',
    action,
    ip,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

logger.logPerformance = (action, duration, metadata = {}) => {
  const level = duration > 5000 ? 'warn' : 'info';
  logger.log(level, 'Performance Event', {
    context: 'performance',
    action,
    duration,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Filter sensitive data from logs
logger.filterSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const filtered = { ...data };
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'authorization',
    'cookie', 'session', 'ssn', 'creditCard', 'cvv', 'key',
    'auth', 'jwt', 'bearer'
  ];
  
  const filterRecursive = (obj) => {
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[FILTERED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        filterRecursive(obj[key]);
      }
    });
  };

  filterRecursive(filtered);
  return filtered;
};

module.exports = logger;