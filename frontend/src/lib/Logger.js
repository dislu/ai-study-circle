/**
 * Frontend Logger - Client-side logging with queue management
 * Integrates with backend Winston logging system
 */

class FrontendLogger {
  constructor(config = {}) {
    this.config = {
      enabled: process.env.NODE_ENV !== 'test',
      logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
      apiEndpoint: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 30000, // 30 seconds
      maxQueueSize: config.maxQueueSize || 100,
      enableConsole: process.env.NODE_ENV === 'development',
      enableStorage: config.enableStorage !== false,
      storageKey: 'ai_study_circle_logs',
      ...config
    };

    this.logQueue = [];
    this.sessionId = this.generateSessionId();
    this.userId = null;
    this.deviceInfo = this.getDeviceInfo();
    this.flushTimer = null;

    // Initialize
    this.initializeLogger();
    this.startFlushTimer();
    this.setupUnloadHandler();
  }

  /**
   * Initialize logger and restore from localStorage
   */
  initializeLogger() {
    if (this.config.enableStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
          const parsedLogs = JSON.parse(stored);
          this.logQueue.push(...parsedLogs.slice(-this.config.maxQueueSize / 2));
        }
      } catch (error) {
        console.warn('Failed to restore logs from storage:', error);
      }
    }

    // Log initialization
    this.info('Logger initialized', {
      sessionId: this.sessionId,
      deviceInfo: this.deviceInfo,
      config: {
        logLevel: this.config.logLevel,
        batchSize: this.config.batchSize,
        flushInterval: this.config.flushInterval
      }
    });
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device and browser information
   */
  getDeviceInfo() {
    if (typeof window === 'undefined') return {};

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      url: window.location.href,
      referrer: document.referrer
    };
  }

  /**
   * Set user information for log context
   */
  setUser(userId, userData = {}) {
    this.userId = userId;
    this.userContext = {
      userId,
      ...userData,
      setAt: new Date().toISOString()
    };

    this.info('User context set', { userId, userData });
  }

  /**
   * Create log entry with metadata
   */
  createLogEntry(level, message, data = {}, context = {}) {
    const timestamp = new Date().toISOString();
    const logId = `log_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;

    return {
      id: logId,
      timestamp,
      level,
      message,
      data,
      context: {
        sessionId: this.sessionId,
        userId: this.userId,
        userContext: this.userContext,
        deviceInfo: this.deviceInfo,
        url: typeof window !== 'undefined' ? window.location.href : null,
        source: 'frontend',
        ...context
      },
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'
    };
  }

  /**
   * Check if log level should be processed
   */
  shouldLog(level) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel] || 1;
    const logLevel = levels[level] || 1;
    return logLevel >= configLevel;
  }

  /**
   * Add log to queue and optionally flush
   */
  addToQueue(logEntry) {
    if (!this.config.enabled || !this.shouldLog(logEntry.level)) {
      return;
    }

    // Console logging for development
    if (this.config.enableConsole) {
      const consoleMethod = console[logEntry.level] || console.log;
      consoleMethod(
        `[${logEntry.timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`,
        logEntry.data
      );
    }

    // Add to queue
    this.logQueue.push(logEntry);

    // Manage queue size
    if (this.logQueue.length > this.config.maxQueueSize) {
      this.logQueue = this.logQueue.slice(-this.config.maxQueueSize);
    }

    // Save to localStorage
    if (this.config.enableStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.logQueue));
      } catch (error) {
        console.warn('Failed to save logs to storage:', error);
      }
    }

    // Auto flush if queue is full
    if (this.logQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = {}, context = {}) {
    const logEntry = this.createLogEntry('debug', message, data, context);
    this.addToQueue(logEntry);
    return logEntry.id;
  }

  /**
   * Info level logging
   */
  info(message, data = {}, context = {}) {
    const logEntry = this.createLogEntry('info', message, data, context);
    this.addToQueue(logEntry);
    return logEntry.id;
  }

  /**
   * Warning level logging
   */
  warn(message, data = {}, context = {}) {
    const logEntry = this.createLogEntry('warn', message, data, context);
    this.addToQueue(logEntry);
    return logEntry.id;
  }

  /**
   * Error level logging
   */
  error(message, error = null, context = {}) {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      ...error
    } : {};

    const logEntry = this.createLogEntry('error', message, errorData, {
      ...context,
      errorType: error?.constructor?.name || 'Unknown'
    });
    this.addToQueue(logEntry);
    return logEntry.id;
  }

  /**
   * Log user actions and interactions
   */
  logUserAction(action, element = null, data = {}) {
    return this.info('User action', {
      action,
      element: element ? {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent?.substring(0, 100)
      } : null,
      ...data
    }, { category: 'user_action' });
  }

  /**
   * Log page views and navigation
   */
  logPageView(path, title = null, data = {}) {
    return this.info('Page view', {
      path,
      title: title || (typeof document !== 'undefined' ? document.title : null),
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      loadTime: typeof window !== 'undefined' ? Date.now() - window.performance.timeOrigin : null,
      ...data
    }, { category: 'navigation' });
  }

  /**
   * Log API calls and responses
   */
  logApiCall(method, url, status, duration, data = {}) {
    const level = status >= 400 ? 'error' : 'info';
    return this[level]('API call', {
      method,
      url,
      status,
      duration,
      ...data
    }, { category: 'api' });
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, value, data = {}) {
    return this.info('Performance metric', {
      metric,
      value,
      ...data
    }, { category: 'performance' });
  }

  /**
   * Flush logs to server
   */
  async flush() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      const response = await fetch(`${this.config.apiEndpoint}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          source: 'frontend',
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send logs: ${response.status} ${response.statusText}`);
      }

      // Clear localStorage on successful send
      if (this.config.enableStorage && typeof window !== 'undefined') {
        localStorage.removeItem(this.config.storageKey);
      }

      if (this.config.enableConsole) {
        console.log(`Successfully sent ${logsToSend.length} logs to server`);
      }
    } catch (error) {
      // Put logs back in queue on failure
      this.logQueue.unshift(...logsToSend);
      
      if (this.config.enableConsole) {
        console.warn('Failed to send logs to server:', error);
      }
    }
  }

  /**
   * Start automatic flush timer
   */
  startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (this.logQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Setup beforeunload handler to flush logs
   */
  setupUnloadHandler() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        // Use sendBeacon for reliable log sending on page unload
        if (this.logQueue.length > 0 && navigator.sendBeacon) {
          const logsData = JSON.stringify({
            logs: this.logQueue,
            source: 'frontend',
            sessionId: this.sessionId
          });
          
          navigator.sendBeacon(
            `${this.config.apiEndpoint}/api/logs`,
            new Blob([logsData], { type: 'application/json' })
          );
        }
      });
    }
  }

  /**
   * Destroy logger and cleanup
   */
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    this.flush();
  }
}

// Create singleton instance
let loggerInstance = null;

export const initializeLogger = (config = {}) => {
  if (!loggerInstance) {
    loggerInstance = new FrontendLogger(config);
  }
  return loggerInstance;
};

export const getLogger = () => {
  if (!loggerInstance) {
    loggerInstance = new FrontendLogger();
  }
  return loggerInstance;
};

// Default export
export default FrontendLogger;