/**
 * Frontend Logging Configuration
 * Centralized configuration for all logging services
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const frontendLoggingConfig = {
  // Logger configuration
  logger: {
    enabled: true,
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    apiEndpoint: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    batchSize: isDevelopment ? 5 : 10,
    flushInterval: isDevelopment ? 10000 : 30000, // 10s dev, 30s prod
    maxQueueSize: 100,
    enableConsole: isDevelopment,
    enableStorage: true,
    storageKey: 'ai_study_circle_logs'
  },

  // Performance Monitor configuration
  performance: {
    enabled: true,
    trackWebVitals: true,
    trackNavigation: true,
    trackResources: !isDevelopment, // Only in production to avoid dev noise
    trackLongTasks: true,
    trackMemory: isProduction,
    memoryInterval: 60000, // 1 minute
    slowResourceThreshold: 1000 // 1 second
  },

  // API Logger configuration
  api: {
    logRequests: true,
    logResponses: true,
    logErrors: true,
    includeHeaders: isDevelopment, // Only in development
    includeData: isDevelopment, // Only in development for privacy
    maxDataSize: 1000,
    excludeUrls: [
      '/api/logs', // Don't log our logging endpoint
      '/api/health', // Don't log health checks
      '/favicon.ico',
      '.js',
      '.css',
      '.png',
      '.jpg',
      '.svg'
    ]
  },

  // User Action Tracker configuration
  userTracking: {
    enabled: true,
    trackClicks: true,
    trackFormSubmissions: true,
    trackNavigation: true,
    trackScrolling: true,
    trackFocus: true,
    trackKeyboard: false, // Disabled for privacy by default
    trackTouch: true,
    trackViewport: true,
    debounceDelay: 100,
    scrollThreshold: 25, // Log every 25% scroll
    idleTimeout: 300000 // 5 minutes
  },

  // Error Boundary configuration
  errorBoundary: {
    maxRetries: 3,
    errorMessage: "We're sorry, but something unexpected happened. Please try again.",
    showErrorDetails: isDevelopment,
    onError: null // Can be set by the application
  },

  // Global configuration
  interceptConsole: false, // Set to true to intercept console errors
  enableAnalytics: isProduction, // Only enable in production
  
  // Privacy settings
  privacy: {
    maskSensitiveData: true,
    excludePersonalInfo: true,
    sensitiveFields: [
      'password', 'token', 'secret', 'key', 'auth',
      'ssn', 'social', 'credit', 'card', 'cvv',
      'email', 'phone', 'address'
    ]
  },

  // Feature flags
  features: {
    webVitals: true,
    userSession: true,
    performanceMonitoring: true,
    errorTracking: true,
    apiMonitoring: true,
    realTimeLogging: isProduction
  }
};

// Environment-specific overrides
if (isDevelopment) {
  // Development overrides
  frontendLoggingConfig.logger.batchSize = 1; // Immediate logging in dev
  frontendLoggingConfig.logger.flushInterval = 5000; // 5 seconds
  frontendLoggingConfig.userTracking.debounceDelay = 50; // More responsive
  frontendLoggingConfig.privacy.maskSensitiveData = false; // Show all data in dev
}

if (isProduction) {
  // Production overrides
  frontendLoggingConfig.logger.enableConsole = false; // No console logs in prod
  frontendLoggingConfig.api.includeData = false; // No request/response data
  frontendLoggingConfig.api.includeHeaders = false; // No headers
  frontendLoggingConfig.userTracking.trackKeyboard = false; // No keyboard tracking
}

// Configuration for different log levels
export const logLevelConfigs = {
  debug: {
    logger: { logLevel: 'debug' },
    api: { includeData: true, includeHeaders: true },
    userTracking: { trackKeyboard: true },
    performance: { trackResources: true }
  },
  info: {
    logger: { logLevel: 'info' },
    api: { includeData: false, includeHeaders: false },
    userTracking: { trackKeyboard: false },
    performance: { trackResources: false }
  },
  warn: {
    logger: { logLevel: 'warn' },
    api: { logRequests: false, logResponses: false },
    userTracking: { enabled: false },
    performance: { enabled: false }
  },
  error: {
    logger: { logLevel: 'error' },
    api: { logRequests: false, logResponses: false, logErrors: true },
    userTracking: { enabled: false },
    performance: { enabled: false }
  }
};

// Merge configurations based on log level
export const getLoggingConfig = (logLevel = null) => {
  const level = logLevel || frontendLoggingConfig.logger.logLevel;
  const levelConfig = logLevelConfigs[level] || logLevelConfigs.info;
  
  return {
    logger: { ...frontendLoggingConfig.logger, ...levelConfig.logger },
    performance: { ...frontendLoggingConfig.performance, ...levelConfig.performance },
    api: { ...frontendLoggingConfig.api, ...levelConfig.api },
    userTracking: { ...frontendLoggingConfig.userTracking, ...levelConfig.userTracking },
    errorBoundary: frontendLoggingConfig.errorBoundary,
    interceptConsole: frontendLoggingConfig.interceptConsole,
    privacy: frontendLoggingConfig.privacy,
    features: frontendLoggingConfig.features
  };
};

// Configuration validation
export const validateConfig = (config) => {
  const errors = [];
  
  if (!config.logger?.apiEndpoint) {
    errors.push('Logger API endpoint is required');
  }
  
  if (config.logger?.batchSize && config.logger.batchSize < 1) {
    errors.push('Logger batch size must be at least 1');
  }
  
  if (config.userTracking?.idleTimeout && config.userTracking.idleTimeout < 60000) {
    errors.push('User tracking idle timeout should be at least 60 seconds');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Export environment detection utilities
export const environment = {
  isDevelopment,
  isProduction,
  isTest: process.env.NODE_ENV === 'test',
  logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL,
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
};

export default frontendLoggingConfig;