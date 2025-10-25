/**
 * Performance Monitor - Web Vitals and custom performance tracking
 * Integrates with Web Vitals API and custom performance metrics
 */

import { getLogger } from '../lib/Logger';

class PerformanceMonitor {
  constructor() {
    this.logger = getLogger();
    this.observers = new Map();
    this.metrics = new Map();
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initializeMonitoring();
    }
  }

  /**
   * Check if performance monitoring is supported
   */
  checkSupport() {
    return (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'PerformanceObserver' in window
    );
  }

  /**
   * Initialize all performance monitoring
   */
  initializeMonitoring() {
    this.setupWebVitals();
    this.setupNavigationTiming();
    this.setupResourceTiming();
    this.setupCustomMetrics();
    this.setupLongTasks();
    this.setupLayoutShifts();
  }

  /**
   * Setup Core Web Vitals monitoring
   */
  setupWebVitals() {
    try {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entry) => {
        const lcp = entry.startTime;
        this.recordMetric('LCP', lcp, {
          element: entry.element?.tagName,
          url: entry.url,
          threshold: lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor'
        });
      });

      // First Input Delay (FID) - via event timing
      this.observeMetric('first-input', (entry) => {
        const fid = entry.processingStart - entry.startTime;
        this.recordMetric('FID', fid, {
          eventType: entry.name,
          threshold: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor'
        });
      });

      // Cumulative Layout Shift (CLS) - handled in setupLayoutShifts()
    } catch (error) {
      this.logger.warn('Failed to setup Web Vitals monitoring', { error: error.message });
    }
  }

  /**
   * Setup Navigation Timing monitoring
   */
  setupNavigationTiming() {
    try {
      this.observeMetric('navigation', (entry) => {
        const metrics = {
          // DNS lookup time
          dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
          // TCP connection time
          tcpTime: entry.connectEnd - entry.connectStart,
          // TLS time (if applicable)
          tlsTime: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
          // Request time
          requestTime: entry.responseStart - entry.requestStart,
          // Response time
          responseTime: entry.responseEnd - entry.responseStart,
          // DOM processing time
          domProcessingTime: entry.domContentLoadedEventStart - entry.responseEnd,
          // Total load time
          loadTime: entry.loadEventEnd - entry.navigationStart,
          // Time to Interactive (TTI) approximation
          tti: entry.domInteractive - entry.navigationStart,
          // First Contentful Paint (if available)
          fcp: entry.firstContentfulPaint ? entry.firstContentfulPaint - entry.navigationStart : null
        };

        Object.entries(metrics).forEach(([name, value]) => {
          if (value !== null && value >= 0) {
            this.recordMetric(name, value, { category: 'navigation' });
          }
        });

        // Overall page load performance
        this.recordMetric('pageLoad', metrics.loadTime, {
          category: 'navigation',
          threshold: metrics.loadTime <= 2000 ? 'good' : metrics.loadTime <= 4000 ? 'needs-improvement' : 'poor'
        });
      });
    } catch (error) {
      this.logger.warn('Failed to setup Navigation Timing monitoring', { error: error.message });
    }
  }

  /**
   * Setup Resource Timing monitoring
   */
  setupResourceTiming() {
    try {
      this.observeMetric('resource', (entry) => {
        // Only log slow resources to avoid spam
        const duration = entry.responseEnd - entry.startTime;
        if (duration > 1000) { // Only log resources taking >1s
          this.recordMetric('slowResource', duration, {
            name: entry.name,
            type: entry.initiatorType,
            size: entry.transferSize,
            category: 'resource'
          });
        }
      });
    } catch (error) {
      this.logger.warn('Failed to setup Resource Timing monitoring', { error: error.message });
    }
  }

  /**
   * Setup Long Tasks monitoring
   */
  setupLongTasks() {
    try {
      this.observeMetric('longtask', (entry) => {
        this.recordMetric('longTask', entry.duration, {
          startTime: entry.startTime,
          attribution: entry.attribution?.[0]?.name,
          category: 'performance'
        });
      });
    } catch (error) {
      this.logger.warn('Failed to setup Long Tasks monitoring', { error: error.message });
    }
  }

  /**
   * Setup Layout Shift monitoring for CLS
   */
  setupLayoutShifts() {
    try {
      let clsScore = 0;
      let sessionValue = 0;
      let sessionEntries = [];

      this.observeMetric('layout-shift', (entry) => {
        // Only count unexpected layout shifts
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
          sessionValue += entry.value;
          sessionEntries.push(entry);

          // Log individual significant shifts
          if (entry.value > 0.1) {
            this.recordMetric('layoutShift', entry.value, {
              sources: entry.sources?.map(source => ({
                node: source.node?.tagName,
                previousRect: source.previousRect,
                currentRect: source.currentRect
              })),
              category: 'layout'
            });
          }
        }
      });

      // Log final CLS score on page unload
      window.addEventListener('beforeunload', () => {
        if (clsScore > 0) {
          this.recordMetric('CLS', clsScore, {
            threshold: clsScore <= 0.1 ? 'good' : clsScore <= 0.25 ? 'needs-improvement' : 'poor',
            sessionEntries: sessionEntries.length,
            category: 'web-vitals'
          });
        }
      });
    } catch (error) {
      this.logger.warn('Failed to setup Layout Shift monitoring', { error: error.message });
    }
  }

  /**
   * Setup custom performance metrics
   */
  setupCustomMetrics() {
    // Memory usage (if supported)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.recordMetric('memoryUsage', memory.usedJSHeapSize, {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
          category: 'memory'
        });
      }, 30000); // Every 30 seconds
    }

    // Connection information
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.recordMetric('connectionInfo', 0, {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        category: 'network'
      });

      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.recordMetric('connectionChange', 0, {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          category: 'network'
        });
      });
    }
  }

  /**
   * Generic method to observe performance metrics
   */
  observeMetric(type, callback) {
    try {
      if (this.observers.has(type)) {
        return; // Already observing this type
      }

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });

      observer.observe({ type, buffered: true });
      this.observers.set(type, observer);
    } catch (error) {
      this.logger.warn(`Failed to observe ${type} metrics`, { error: error.message });
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      ...metadata
    };

    this.metrics.set(`${name}_${Date.now()}`, metric);
    
    // Log to our logging system
    this.logger.logPerformance(name, value, metadata);

    // Emit custom event for external listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('performanceMetric', { detail: metric }));
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics() {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics by category
   */
  getMetricsByCategory(category) {
    return this.getMetrics().filter(metric => metric.category === category);
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const metrics = this.getMetrics();
    const summary = {};

    metrics.forEach(metric => {
      const category = metric.category || 'general';
      if (!summary[category]) {
        summary[category] = [];
      }
      summary[category].push(metric);
    });

    return summary;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics.clear();
  }

  /**
   * Start timing a custom operation
   */
  startTiming(name) {
    if (this.isSupported) {
      performance.mark(`${name}-start`);
    }
    return Date.now();
  }

  /**
   * End timing a custom operation
   */
  endTiming(name, startTime = null) {
    const endTime = Date.now();
    
    if (this.isSupported) {
      performance.mark(`${name}-end`);
      
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        
        this.recordMetric(`custom_${name}`, measure.duration, {
          category: 'custom',
          startTime: measure.startTime
        });

        // Clean up marks and measures
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
        
        return measure.duration;
      } catch (error) {
        // Fallback to manual timing
        const duration = startTime ? endTime - startTime : 0;
        this.recordMetric(`custom_${name}`, duration, {
          category: 'custom',
          method: 'fallback'
        });
        return duration;
      }
    }

    return startTime ? endTime - startTime : 0;
  }

  /**
   * Monitor React component render performance
   */
  measureComponent(componentName, renderFunction) {
    const startTime = this.startTiming(`component_${componentName}`);
    
    try {
      const result = renderFunction();
      
      // Handle both sync and async render functions
      if (result && typeof result.then === 'function') {
        return result.finally(() => {
          this.endTiming(`component_${componentName}`, startTime);
        });
      } else {
        this.endTiming(`component_${componentName}`, startTime);
        return result;
      }
    } catch (error) {
      this.endTiming(`component_${componentName}`, startTime);
      this.logger.error(`Component ${componentName} render error`, error, {
        category: 'component_error'
      });
      throw error;
    }
  }

  /**
   * Destroy performance monitor and cleanup observers
   */
  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics.clear();
  }
}

// Create singleton instance
let performanceMonitor = null;

export const initializePerformanceMonitor = () => {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

export const getPerformanceMonitor = () => {
  if (!performanceMonitor && typeof window !== 'undefined') {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = getPerformanceMonitor();
  
  const measureRender = (componentName) => {
    return monitor?.measureComponent || (() => {});
  };

  const startTiming = (name) => {
    return monitor?.startTiming(name) || Date.now();
  };

  const endTiming = (name, startTime) => {
    return monitor?.endTiming(name, startTime) || 0;
  };

  return {
    measureRender,
    startTiming,
    endTiming,
    getMetrics: () => monitor?.getMetrics() || [],
    getSummary: () => monitor?.getSummary() || {}
  };
};

export default PerformanceMonitor;