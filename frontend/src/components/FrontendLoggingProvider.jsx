/**
 * Frontend Logging Provider - React Context Provider for comprehensive logging
 * Integrates all logging components: Logger, Error Boundary, Performance Monitor, etc.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initializeLogger, getLogger } from '../lib/Logger';
import { initializePerformanceMonitor, getPerformanceMonitor } from '../lib/PerformanceMonitor';
import { initializeApiLogger, getApiLogger } from '../lib/ApiLogger';
import { initializeUserTracker, getUserTracker } from '../lib/UserActionTracker';
import ErrorBoundary from './ErrorBoundary';

// Create contexts
const LoggingContext = createContext(null);

/**
 * Frontend Logging Provider Component
 */
export const FrontendLoggingProvider = ({ 
  children, 
  config = {},
  errorBoundaryProps = {},
  onError = null 
}) => {
  const [loggingServices, setLoggingServices] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize all logging services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('Initializing Frontend Logging Services...');

        // Initialize core services
        const logger = initializeLogger(config.logger);
        const performanceMonitor = initializePerformanceMonitor(config.performance);
        const apiLogger = initializeApiLogger(config.api);
        const userTracker = initializeUserTracker(config.userTracking);

        const services = {
          logger,
          performanceMonitor,
          apiLogger,
          userTracker
        };

        setLoggingServices(services);
        setIsInitialized(true);

        // Log successful initialization
        logger.info('Frontend Logging System initialized', {
          services: Object.keys(services),
          config: config,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }, { category: 'system_init' });

        // Setup global error handlers
        setupGlobalErrorHandlers(services);

        console.log('Frontend Logging Services initialized successfully');
      } catch (error) {
        console.error('Failed to initialize logging services:', error);
        setError(error);
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      if (loggingServices) {
        loggingServices.logger?.destroy();
        loggingServices.performanceMonitor?.destroy();
        loggingServices.userTracker?.destroy();
      }
    };
  }, []);

  /**
   * Setup global error handlers
   */
  const setupGlobalErrorHandlers = useCallback((services) => {
    // Unhandled JavaScript errors
    window.addEventListener('error', (event) => {
      services.logger.error('Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, { 
        category: 'global_error',
        type: 'javascript_error'
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      services.logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      }, { 
        category: 'global_error',
        type: 'promise_rejection'
      });
    });

    // Console error override (optional - be careful with this)
    if (config.interceptConsole) {
      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, args);
        services.logger.error('Console Error', {
          arguments: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
          )
        }, { category: 'console_error' });
      };
    }
  }, [config]);

  /**
   * Handle errors from Error Boundary
   */
  const handleBoundaryError = useCallback((error, errorInfo, errorId) => {
    if (loggingServices?.logger) {
      loggingServices.logger.error('Error Boundary Caught Error', error, {
        category: 'react_error_boundary',
        errorInfo,
        errorId,
        componentStack: errorInfo.componentStack
      });
    }

    if (onError) {
      onError(error, errorInfo, errorId);
    }
  }, [loggingServices, onError]);

  // If initialization failed
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-900">
                Logging System Error
              </h2>
              <p className="mt-2 text-sm text-red-600">
                Failed to initialize logging system: {error.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Context value
  const contextValue = {
    ...loggingServices,
    isInitialized,
    config,
    
    // Convenience methods
    log: loggingServices?.logger?.info.bind(loggingServices.logger),
    warn: loggingServices?.logger?.warn.bind(loggingServices.logger),
    error: loggingServices?.logger?.error.bind(loggingServices.logger),
    debug: loggingServices?.logger?.debug.bind(loggingServices.logger),
    
    trackAction: loggingServices?.userTracker?.track.bind(loggingServices.userTracker),
    trackPerformance: loggingServices?.performanceMonitor?.recordMetric.bind(loggingServices.performanceMonitor),
    
    // User methods
    setUser: loggingServices?.logger?.setUser.bind(loggingServices.logger),
    
    // Performance methods
    startTiming: loggingServices?.performanceMonitor?.startTiming.bind(loggingServices.performanceMonitor),
    endTiming: loggingServices?.performanceMonitor?.endTiming.bind(loggingServices.performanceMonitor),
    
    // API methods
    logApiCall: loggingServices?.logger?.logApiCall.bind(loggingServices.logger),
    
    // Utility methods
    flush: loggingServices?.logger?.flush.bind(loggingServices.logger),
    getMetrics: loggingServices?.performanceMonitor?.getMetrics.bind(loggingServices.performanceMonitor),
    getSessionSummary: loggingServices?.userTracker?.getSessionSummary.bind(loggingServices.userTracker)
  };

  return (
    <LoggingContext.Provider value={contextValue}>
      <ErrorBoundary 
        onError={handleBoundaryError}
        {...errorBoundaryProps}
      >
        {children}
      </ErrorBoundary>
    </LoggingContext.Provider>
  );
};

/**
 * Hook to use logging services
 */
export const useLogging = () => {
  const context = useContext(LoggingContext);
  
  if (!context) {
    // Fallback methods if provider is not available
    console.warn('useLogging used outside of FrontendLoggingProvider. Using fallback methods.');
    
    return {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      trackAction: () => {},
      trackPerformance: () => {},
      setUser: () => {},
      startTiming: () => Date.now(),
      endTiming: () => 0,
      logApiCall: () => {},
      flush: () => Promise.resolve(),
      getMetrics: () => [],
      getSessionSummary: () => ({}),
      isInitialized: false
    };
  }
  
  return context;
};

/**
 * Higher-order component to provide logging context
 */
export const withLogging = (WrappedComponent, loggingConfig = {}) => {
  return (props) => (
    <FrontendLoggingProvider config={loggingConfig}>
      <WrappedComponent {...props} />
    </FrontendLoggingProvider>
  );
};

/**
 * Hook for component-level performance tracking
 */
export const useComponentTracking = (componentName) => {
  const { trackPerformance, startTiming, endTiming, trackAction } = useLogging();
  
  useEffect(() => {
    const mountTime = startTiming(`${componentName}_mount`);
    
    // Track component mount
    trackAction('component_mount', { componentName });
    
    return () => {
      // Track component unmount and mount duration
      const mountDuration = endTiming(`${componentName}_mount`, mountTime);
      trackAction('component_unmount', { 
        componentName, 
        mountDuration 
      });
    };
  }, [componentName, startTiming, endTiming, trackAction]);
  
  const trackRender = useCallback(() => {
    trackPerformance(`component_render_${componentName}`, Date.now(), {
      component: componentName,
      category: 'component_render'
    });
  }, [componentName, trackPerformance]);
  
  const trackUserAction = useCallback((action, data = {}) => {
    trackAction(action, {
      component: componentName,
      ...data
    });
  }, [componentName, trackAction]);
  
  return {
    trackRender,
    trackUserAction
  };
};

/**
 * Hook for API call tracking
 */
export const useApiTracking = () => {
  const { logApiCall } = useLogging();
  
  const trackApiCall = useCallback(async (apiCall) => {
    const startTime = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      logApiCall('CUSTOM', 'api-call', 200, duration, {
        success: true,
        result: typeof result === 'object' ? 'object' : typeof result
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logApiCall('CUSTOM', 'api-call', 500, duration, {
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }, [logApiCall]);
  
  return { trackApiCall };
};

/**
 * Global logging instance for use outside React components
 */
export const globalLogging = {
  getLogger: () => getLogger(),
  getPerformanceMonitor: () => getPerformanceMonitor(),
  getApiLogger: () => getApiLogger(),
  getUserTracker: () => getUserTracker()
};

export default FrontendLoggingProvider;