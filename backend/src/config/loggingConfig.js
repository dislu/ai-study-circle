/**
 * Centralized Logging Configuration
 * Environment variables and settings for the logging system
 */

const loggingConfig = {
  // Log levels
  levels: {
    development: 'debug',
    test: 'warn',
    production: 'info'
  },

  // Log file settings
  files: {
    maxSize: '20m',
    maxFiles: '30d',
    datePattern: 'YYYY-MM-DD',
    errorRetention: '14d',
    combinedRetention: '30d',
    auditRetention: '90d'
  },

  // Performance thresholds
  performance: {
    slowRequest: 1000, // 1 second
    verySlowRequest: 5000, // 5 seconds
    highTokenUsage: 4000,
    highTranslationLatency: 2000, // 2 seconds
    lowCacheHitRate: 0.3 // 30%
  },

  // Security settings
  security: {
    maskSensitiveData: true,
    logSecurityEvents: true,
    rateLimitLogging: true,
    maxLogBodySize: 10000 // 10KB
  },

  // External service settings
  external: {
    elasticsearch: {
      enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
      url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
      password: process.env.ELASTICSEARCH_PASSWORD || 'changeme',
      index: 'ai-study-circle-logs',
      maxRetries: 3,
      requestTimeout: 30000
    },
    
    logstash: {
      enabled: process.env.LOGSTASH_ENABLED === 'true',
      host: process.env.LOGSTASH_HOST || 'localhost',
      port: parseInt(process.env.LOGSTASH_PORT) || 5044,
      protocol: process.env.LOGSTASH_PROTOCOL || 'tcp'
    },

    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1
    }
  },

  // Feature flags
  features: {
    enableConsoleLogging: process.env.NODE_ENV === 'development',
    enableFileLogging: true,
    enableRemoteLogging: process.env.NODE_ENV === 'production',
    enablePerformanceLogging: true,
    enableSecurityLogging: true,
    enableTranslationLogging: true,
    enableAILogging: true,
    enableAuthLogging: true,
    enableMetricsCollection: true,
    enableLogRotation: true,
    enableLogCompression: true
  },

  // Sampling rates (for high-volume logs)
  sampling: {
    successfulRequests: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
    performanceMetrics: 1.0,
    securityEvents: 1.0,
    errors: 1.0,
    debugLogs: process.env.NODE_ENV === 'development' ? 1.0 : 0.0
  },

  // Log formatting
  format: {
    timestamp: 'YYYY-MM-DD HH:mm:ss.SSS',
    timezone: 'UTC',
    includeStackTrace: process.env.NODE_ENV === 'development',
    prettyPrint: process.env.NODE_ENV === 'development',
    colorize: process.env.NODE_ENV === 'development'
  },

  // Alert thresholds
  alerts: {
    errorRate: {
      threshold: 0.05, // 5% error rate
      timeWindow: '5m'
    },
    responseTime: {
      threshold: 2000, // 2 seconds
      timeWindow: '1m'
    },
    diskUsage: {
      threshold: 0.85, // 85% disk usage
      timeWindow: '1m'
    },
    memoryUsage: {
      threshold: 0.9, // 90% memory usage
      timeWindow: '1m'
    }
  },

  // Log categories and their configurations
  categories: {
    api: {
      enabled: true,
      level: 'info',
      includeHeaders: false,
      includeBody: process.env.NODE_ENV === 'development',
      includeQuery: true,
      maskSensitiveFields: true
    },
    
    auth: {
      enabled: true,
      level: 'info',
      logFailedAttempts: true,
      logSuccessfulLogins: true,
      logLogouts: true,
      logTokenOperations: true,
      maskEmails: true
    },
    
    ai: {
      enabled: true,
      level: 'info',
      logTokenUsage: true,
      logPerformance: true,
      logCosts: true,
      logCacheOperations: true,
      trackQuality: true
    },
    
    translation: {
      enabled: true,
      level: 'info',
      logLanguageDetection: true,
      logQualityMetrics: true,
      logCacheOperations: true,
      logBatchOperations: true,
      trackIndianLanguages: true
    },
    
    security: {
      enabled: true,
      level: 'warn',
      logAllSecurityEvents: true,
      logRateLimiting: true,
      logSuspiciousActivity: true,
      alertOnCriticalEvents: true
    },
    
    performance: {
      enabled: true,
      level: 'info',
      logSlowRequests: true,
      logResourceUsage: true,
      logCacheMetrics: true,
      trackWebVitals: true
    },
    
    database: {
      enabled: true,
      level: 'warn',
      logQueries: process.env.NODE_ENV === 'development',
      logConnections: true,
      logErrors: true,
      logSlowQueries: true
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      level: 'debug',
      enableConsoleLogging: true,
      enableFileLogging: true,
      enableRemoteLogging: false,
      prettyPrint: true,
      colorize: true,
      includeStackTrace: true
    },
    
    test: {
      level: 'warn',
      enableConsoleLogging: false,
      enableFileLogging: false,
      enableRemoteLogging: false,
      prettyPrint: false,
      colorize: false
    },
    
    staging: {
      level: 'info',
      enableConsoleLogging: false,
      enableFileLogging: true,
      enableRemoteLogging: true,
      prettyPrint: false,
      colorize: false,
      includeStackTrace: false
    },
    
    production: {
      level: 'info',
      enableConsoleLogging: false,
      enableFileLogging: true,
      enableRemoteLogging: true,
      prettyPrint: false,
      colorize: false,
      includeStackTrace: false,
      sampling: {
        successfulRequests: 0.1,
        debugLogs: 0.0
      }
    }
  }
};

/**
 * Get configuration for current environment
 */
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = { ...loggingConfig };
  const envConfig = loggingConfig.environments[env] || {};
  
  // Merge environment-specific config
  return {
    ...baseConfig,
    ...envConfig,
    level: envConfig.level || loggingConfig.levels[env] || 'info'
  };
}

/**
 * Validate configuration
 */
function validateConfig(config = getConfig()) {
  const errors = [];
  
  // Check required environment variables for production
  if (config.external.elasticsearch.enabled && !process.env.ELASTICSEARCH_URL) {
    errors.push('ELASTICSEARCH_URL is required when Elasticsearch is enabled');
  }
  
  if (config.external.sentry.enabled && !process.env.SENTRY_DSN) {
    errors.push('SENTRY_DSN is required when Sentry is enabled');
  }
  
  // Validate sampling rates
  Object.entries(config.sampling || {}).forEach(([key, value]) => {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      errors.push(`Invalid sampling rate for ${key}: ${value}. Must be between 0 and 1.`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Logging configuration validation failed:\n${errors.join('\n')}`);
  }
  
  return true;
}

/**
 * Initialize logging configuration
 */
function initializeLogging() {
  const config = getConfig();
  
  try {
    validateConfig(config);
    console.log('✅ Logging configuration validated successfully');
    console.log(`📋 Log level: ${config.level}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 File logging: ${config.enableFileLogging ? 'enabled' : 'disabled'}`);
    console.log(`🖥️ Console logging: ${config.enableConsoleLogging ? 'enabled' : 'disabled'}`);
    console.log(`🌐 Remote logging: ${config.enableRemoteLogging ? 'enabled' : 'disabled'}`);
    
    return config;
  } catch (error) {
    console.error('❌ Logging configuration validation failed:', error.message);
    throw error;
  }
}

module.exports = {
  loggingConfig,
  getConfig,
  validateConfig,
  initializeLogging
};