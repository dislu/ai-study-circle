/**
 * API Logger - HTTP request/response logging with Axios interceptors
 * Tracks API performance, errors, and request/response data
 */

import axios from 'axios';
import { getLogger } from './Logger';

class ApiLogger {
  constructor(config = {}) {
    this.config = {
      logRequests: config.logRequests !== false,
      logResponses: config.logResponses !== false,
      logErrors: config.logErrors !== false,
      includeHeaders: config.includeHeaders || false,
      includeData: config.includeData !== false,
      maxDataSize: config.maxDataSize || 1000,
      excludeUrls: config.excludeUrls || ['/api/logs'], // Don't log our logging endpoint
      ...config
    };

    this.logger = getLogger();
    this.pendingRequests = new Map();
    this.setupInterceptors();
  }

  /**
   * Setup Axios interceptors for request/response logging
   */
  setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => this.handleRequestError(error)
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    );
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Check if URL should be excluded from logging
   */
  shouldExcludeUrl(url) {
    return this.config.excludeUrls.some(excludeUrl => 
      url && url.includes(excludeUrl)
    );
  }

  /**
   * Safely truncate and serialize data
   */
  serializeData(data, maxSize = this.config.maxDataSize) {
    try {
      if (!data) return null;
      
      const serialized = typeof data === 'string' ? data : JSON.stringify(data);
      
      if (serialized.length > maxSize) {
        return serialized.substring(0, maxSize) + '... [truncated]';
      }
      
      return serialized;
    } catch (error) {
      return '[Serialization Error]';
    }
  }

  /**
   * Extract safe headers (excluding sensitive ones)
   */
  getSafeHeaders(headers) {
    if (!this.config.includeHeaders || !headers) return null;

    const sensitiveHeaders = [
      'authorization', 'cookie', 'x-api-key', 'x-auth-token',
      'x-csrf-token', 'x-session-token', 'authentication'
    ];

    const safeHeaders = {};
    Object.keys(headers).forEach(key => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        safeHeaders[key] = headers[key];
      } else {
        safeHeaders[key] = '[REDACTED]';
      }
    });

    return safeHeaders;
  }

  /**
   * Handle outgoing requests
   */
  handleRequest(config) {
    if (!this.config.logRequests || this.shouldExcludeUrl(config.url)) {
      return config;
    }

    const requestId = this.generateRequestId();
    const startTime = Date.now();

    // Store request info for later correlation with response
    this.pendingRequests.set(requestId, {
      config,
      startTime,
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL
    });

    // Add request ID to headers for tracking
    config.metadata = { requestId };

    // Log the request
    this.logger.info('API Request', {
      requestId,
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: this.getSafeHeaders(config.headers),
      data: this.config.includeData ? this.serializeData(config.data) : null,
      params: config.params,
      timestamp: new Date().toISOString()
    }, { category: 'api_request' });

    return config;
  }

  /**
   * Handle request errors (before sending)
   */
  handleRequestError(error) {
    this.logger.error('API Request Error (before send)', error, {
      category: 'api_request_error',
      config: error.config ? {
        method: error.config.method?.toUpperCase(),
        url: error.config.url,
        baseURL: error.config.baseURL
      } : null
    });

    return Promise.reject(error);
  }

  /**
   * Handle successful responses
   */
  handleResponse(response) {
    const requestId = response.config?.metadata?.requestId;
    
    if (!this.config.logResponses || this.shouldExcludeUrl(response.config?.url)) {
      // Clean up pending request
      if (requestId) {
        this.pendingRequests.delete(requestId);
      }
      return response;
    }

    const pendingRequest = requestId ? this.pendingRequests.get(requestId) : null;
    const duration = pendingRequest ? Date.now() - pendingRequest.startTime : 0;

    // Log the response
    this.logger.logApiCall(
      response.config?.method?.toUpperCase() || 'UNKNOWN',
      response.config?.url || 'unknown',
      response.status,
      duration,
      {
        requestId,
        statusText: response.statusText,
        headers: this.getSafeHeaders(response.headers),
        data: this.config.includeData ? this.serializeData(response.data) : null,
        dataSize: response.data ? JSON.stringify(response.data).length : 0,
        timestamp: new Date().toISOString()
      }
    );

    // Performance logging for slow requests
    if (duration > 3000) { // Log slow requests (>3s)
      this.logger.warn('Slow API Response', {
        requestId,
        method: response.config?.method?.toUpperCase(),
        url: response.config?.url,
        duration,
        status: response.status
      }, { category: 'api_performance' });
    }

    // Clean up
    if (requestId) {
      this.pendingRequests.delete(requestId);
    }

    return response;
  }

  /**
   * Handle response errors
   */
  handleResponseError(error) {
    const requestId = error.config?.metadata?.requestId;
    const pendingRequest = requestId ? this.pendingRequests.get(requestId) : null;
    const duration = pendingRequest ? Date.now() - pendingRequest.startTime : 0;

    if (!this.config.logErrors || this.shouldExcludeUrl(error.config?.url)) {
      // Clean up pending request
      if (requestId) {
        this.pendingRequests.delete(requestId);
      }
      return Promise.reject(error);
    }

    // Determine error type
    let errorType = 'unknown';
    let statusCode = null;
    let errorData = null;

    if (error.response) {
      // Server responded with error status
      errorType = 'response_error';
      statusCode = error.response.status;
      errorData = this.config.includeData ? this.serializeData(error.response.data) : null;
    } else if (error.request) {
      // Request was made but no response received
      errorType = 'network_error';
    } else {
      // Error in setting up the request
      errorType = 'request_setup_error';
    }

    // Log the error
    this.logger.error('API Error', error, {
      category: 'api_error',
      requestId,
      errorType,
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      statusCode,
      duration,
      headers: error.response ? this.getSafeHeaders(error.response.headers) : null,
      responseData: errorData,
      requestData: this.config.includeData ? this.serializeData(error.config?.data) : null,
      timeout: error.config?.timeout,
      timestamp: new Date().toISOString()
    });

    // Log API call for tracking
    this.logger.logApiCall(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || 'unknown',
      statusCode || 0,
      duration,
      {
        requestId,
        error: true,
        errorType,
        errorMessage: error.message
      }
    );

    // Clean up
    if (requestId) {
      this.pendingRequests.delete(requestId);
    }

    return Promise.reject(error);
  }

  /**
   * Create a custom Axios instance with logging
   */
  createLoggedAxios(config = {}) {
    const instance = axios.create(config);
    
    // Apply the same interceptors to the custom instance
    instance.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => this.handleRequestError(error)
    );

    instance.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    );

    return instance;
  }

  /**
   * Manually log an API call (for non-Axios requests)
   */
  logManualApiCall(method, url, status, duration, data = {}) {
    this.logger.logApiCall(method, url, status, duration, {
      ...data,
      manual: true,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get API call statistics
   */
  getApiStats() {
    // This would require storing stats in the logger or a separate store
    return {
      pending: this.pendingRequests.size,
      totalCalls: 0, // Would need to track this
      errors: 0, // Would need to track this
      averageResponseTime: 0 // Would need to calculate this
    };
  }

  /**
   * Clear pending requests (cleanup)
   */
  clearPendingRequests() {
    this.pendingRequests.clear();
  }

  /**
   * Disable API logging
   */
  disable() {
    this.config.logRequests = false;
    this.config.logResponses = false;
    this.config.logErrors = false;
  }

  /**
   * Enable API logging
   */
  enable() {
    this.config.logRequests = true;
    this.config.logResponses = true;
    this.config.logErrors = true;
  }
}

// Create singleton instance
let apiLoggerInstance = null;

export const initializeApiLogger = (config = {}) => {
  if (!apiLoggerInstance) {
    apiLoggerInstance = new ApiLogger(config);
  }
  return apiLoggerInstance;
};

export const getApiLogger = () => {
  if (!apiLoggerInstance) {
    apiLoggerInstance = new ApiLogger();
  }
  return apiLoggerInstance;
};

// Export a pre-configured axios instance with logging
export const loggedAxios = axios.create();

// Initialize default API logger when module loads
if (typeof window !== 'undefined') {
  initializeApiLogger();
}

export default ApiLogger;