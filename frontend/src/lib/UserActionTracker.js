/**
 * User Action Tracker - Track user interactions and behaviors
 * Provides insights into user engagement and application usage
 */

import { getLogger } from './Logger';

class UserActionTracker {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled !== false,
      trackClicks: config.trackClicks !== false,
      trackFormSubmissions: config.trackFormSubmissions !== false,
      trackNavigation: config.trackNavigation !== false,
      trackScrolling: config.trackScrolling !== false,
      trackFocus: config.trackFocus !== false,
      trackKeyboard: config.trackKeyboard !== false,
      trackTouch: config.trackTouch !== false,
      trackViewport: config.trackViewport !== false,
      debounceDelay: config.debounceDelay || 100,
      scrollThreshold: config.scrollThreshold || 25, // Percentage
      idleTimeout: config.idleTimeout || 300000, // 5 minutes
      ...config
    };

    this.logger = getLogger();
    this.isInitialized = false;
    this.sessionData = {
      startTime: Date.now(),
      lastAction: Date.now(),
      actions: 0,
      scrollDepth: 0,
      timeOnPage: 0,
      isIdle: false
    };

    this.debounceTimers = new Map();
    this.idleTimer = null;

    if (this.config.enabled && typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize all tracking
   */
  initialize() {
    if (this.isInitialized) return;

    this.setupEventListeners();
    this.startIdleTracking();
    this.trackPageView();
    
    this.isInitialized = true;
    this.logger.info('User Action Tracker initialized', {
      config: this.config,
      sessionId: this.sessionData.startTime
    }, { category: 'user_tracking' });
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    if (this.config.trackClicks) {
      this.setupClickTracking();
    }
    
    if (this.config.trackFormSubmissions) {
      this.setupFormTracking();
    }
    
    if (this.config.trackNavigation) {
      this.setupNavigationTracking();
    }
    
    if (this.config.trackScrolling) {
      this.setupScrollTracking();
    }
    
    if (this.config.trackFocus) {
      this.setupFocusTracking();
    }
    
    if (this.config.trackKeyboard) {
      this.setupKeyboardTracking();
    }
    
    if (this.config.trackTouch) {
      this.setupTouchTracking();
    }
    
    if (this.config.trackViewport) {
      this.setupViewportTracking();
    }

    // Page lifecycle events
    this.setupLifecycleTracking();
  }

  /**
   * Track clicks and interactions
   */
  setupClickTracking() {
    const handleClick = (event) => {
      const element = event.target;
      const elementInfo = this.getElementInfo(element);
      
      this.trackAction('click', {
        element: elementInfo,
        coordinates: {
          x: event.clientX,
          y: event.clientY,
          pageX: event.pageX,
          pageY: event.pageY
        },
        modifiers: {
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          altKey: event.altKey,
          metaKey: event.metaKey
        },
        button: event.button,
        detail: event.detail // Click count
      });
    };

    document.addEventListener('click', handleClick, { passive: true });
    
    // Also track right-clicks
    document.addEventListener('contextmenu', (event) => {
      const element = event.target;
      const elementInfo = this.getElementInfo(element);
      
      this.trackAction('rightclick', {
        element: elementInfo,
        coordinates: {
          x: event.clientX,
          y: event.clientY
        }
      });
    }, { passive: true });
  }

  /**
   * Track form submissions and interactions
   */
  setupFormTracking() {
    // Form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        const formInfo = this.getFormInfo(form);
        
        this.trackAction('form_submit', {
          form: formInfo,
          method: form.method || 'GET',
          action: form.action,
          fieldCount: form.elements.length
        });
      }
    }, { passive: true });

    // Form field focus and blur
    document.addEventListener('focusin', (event) => {
      const element = event.target;
      if (this.isFormField(element)) {
        this.trackAction('form_field_focus', {
          element: this.getElementInfo(element),
          fieldType: element.type,
          fieldName: element.name
        });
      }
    }, { passive: true });

    document.addEventListener('focusout', (event) => {
      const element = event.target;
      if (this.isFormField(element)) {
        this.trackAction('form_field_blur', {
          element: this.getElementInfo(element),
          fieldType: element.type,
          fieldName: element.name,
          hasValue: !!element.value
        });
      }
    }, { passive: true });
  }

  /**
   * Track navigation events
   */
  setupNavigationTracking() {
    // Hash changes
    window.addEventListener('hashchange', (event) => {
      this.trackAction('navigation_hash', {
        oldURL: event.oldURL,
        newURL: event.newURL,
        hash: window.location.hash
      });
    }, { passive: true });

    // Back/forward button usage
    window.addEventListener('popstate', (event) => {
      this.trackAction('navigation_popstate', {
        state: event.state,
        url: window.location.href
      });
    }, { passive: true });

    // Link clicks (delegated)
    document.addEventListener('click', (event) => {
      const element = event.target.closest('a');
      if (element && element.href) {
        const isExternal = element.hostname !== window.location.hostname;
        const opensNewTab = element.target === '_blank' || event.metaKey || event.ctrlKey;
        
        this.trackAction('link_click', {
          element: this.getElementInfo(element),
          href: element.href,
          text: element.textContent?.trim().substring(0, 100),
          isExternal,
          opensNewTab
        });
      }
    }, { passive: true });
  }

  /**
   * Track scrolling behavior
   */
  setupScrollTracking() {
    let lastScrollY = window.scrollY;
    let maxScrollDepth = 0;

    const handleScroll = this.debounce(() => {
      const currentScrollY = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = documentHeight > 0 ? (currentScrollY / documentHeight) * 100 : 0;

      // Update max scroll depth
      if (scrollPercentage > maxScrollDepth) {
        maxScrollDepth = scrollPercentage;
        this.sessionData.scrollDepth = maxScrollDepth;

        // Log milestone percentages
        const milestone = Math.floor(scrollPercentage / this.config.scrollThreshold) * this.config.scrollThreshold;
        if (milestone > 0 && milestone !== this.lastScrollMilestone) {
          this.lastScrollMilestone = milestone;
          this.trackAction('scroll_milestone', {
            percentage: milestone,
            scrollY: currentScrollY,
            documentHeight: documentHeight + window.innerHeight
          });
        }
      }

      // Detect scroll direction
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      lastScrollY = currentScrollY;

      this.trackAction('scroll', {
        scrollY: currentScrollY,
        percentage: scrollPercentage,
        direction,
        maxDepth: maxScrollDepth
      });
    }, this.config.debounceDelay);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Track focus events
   */
  setupFocusTracking() {
    window.addEventListener('focus', () => {
      this.trackAction('window_focus', {
        timestamp: Date.now(),
        wasIdle: this.sessionData.isIdle
      });
      this.sessionData.isIdle = false;
    }, { passive: true });

    window.addEventListener('blur', () => {
      this.trackAction('window_blur', {
        timestamp: Date.now(),
        timeOnPage: Date.now() - this.sessionData.startTime
      });
    }, { passive: true });

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      this.trackAction('visibility_change', {
        hidden: document.hidden,
        visibilityState: document.visibilityState,
        timeOnPage: Date.now() - this.sessionData.startTime
      });
    }, { passive: true });
  }

  /**
   * Track keyboard interactions
   */
  setupKeyboardTracking() {
    const handleKeyDown = this.debounce((event) => {
      // Only track special keys and shortcuts, not regular typing
      const specialKeys = ['Escape', 'Enter', 'Tab', 'Delete', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      const isShortcut = event.ctrlKey || event.metaKey || event.altKey;
      
      if (specialKeys.includes(event.key) || isShortcut) {
        this.trackAction('keyboard', {
          key: event.key,
          code: event.code,
          isShortcut,
          modifiers: {
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            metaKey: event.metaKey
          },
          target: this.getElementInfo(event.target)
        });
      }
    }, this.config.debounceDelay);

    document.addEventListener('keydown', handleKeyDown, { passive: true });
  }

  /**
   * Track touch interactions
   */
  setupTouchTracking() {
    if ('ontouchstart' in window) {
      let touchStartTime;
      let touchStartPosition;

      document.addEventListener('touchstart', (event) => {
        touchStartTime = Date.now();
        touchStartPosition = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };
      }, { passive: true });

      document.addEventListener('touchend', (event) => {
        const touchEndTime = Date.now();
        const duration = touchEndTime - touchStartTime;
        const touch = event.changedTouches[0];
        
        const distance = touchStartPosition ? Math.sqrt(
          Math.pow(touch.clientX - touchStartPosition.x, 2) +
          Math.pow(touch.clientY - touchStartPosition.y, 2)
        ) : 0;

        this.trackAction('touch', {
          duration,
          distance,
          touchCount: event.changedTouches.length,
          element: this.getElementInfo(event.target),
          startPosition: touchStartPosition,
          endPosition: {
            x: touch.clientX,
            y: touch.clientY
          }
        });
      }, { passive: true });

      // Swipe detection
      document.addEventListener('touchmove', this.debounce((event) => {
        if (touchStartPosition && event.touches.length === 1) {
          const touch = event.touches[0];
          const deltaX = touch.clientX - touchStartPosition.x;
          const deltaY = touch.clientY - touchStartPosition.y;
          
          if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
            this.trackAction('swipe', {
              deltaX,
              deltaY,
              direction: Math.abs(deltaX) > Math.abs(deltaY) ? 
                (deltaX > 0 ? 'right' : 'left') : 
                (deltaY > 0 ? 'down' : 'up')
            });
          }
        }
      }, this.config.debounceDelay), { passive: true });
    }
  }

  /**
   * Track viewport changes
   */
  setupViewportTracking() {
    const handleResize = this.debounce(() => {
      this.trackAction('viewport_change', {
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: screen.orientation?.type || 'unknown',
        pixelRatio: window.devicePixelRatio
      });
    }, this.config.debounceDelay);

    window.addEventListener('resize', handleResize, { passive: true });
    
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => {
        this.trackAction('orientation_change', {
          orientation: screen.orientation.type,
          angle: screen.orientation.angle
        });
      });
    }
  }

  /**
   * Track page lifecycle events
   */
  setupLifecycleTracking() {
    // Page load
    window.addEventListener('load', () => {
      this.trackAction('page_load', {
        loadTime: Date.now() - this.sessionData.startTime,
        referrer: document.referrer
      });
    }, { passive: true });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.trackAction('page_unload', {
        timeOnPage: Date.now() - this.sessionData.startTime,
        actions: this.sessionData.actions,
        scrollDepth: this.sessionData.scrollDepth
      });
    });
  }

  /**
   * Start idle tracking
   */
  startIdleTracking() {
    const resetIdleTimer = () => {
      if (this.idleTimer) {
        clearTimeout(this.idleTimer);
      }

      if (this.sessionData.isIdle) {
        this.sessionData.isIdle = false;
        this.trackAction('idle_end', {
          timeOnPage: Date.now() - this.sessionData.startTime
        });
      }

      this.idleTimer = setTimeout(() => {
        this.sessionData.isIdle = true;
        this.trackAction('idle_start', {
          timeOnPage: Date.now() - this.sessionData.startTime,
          lastAction: this.sessionData.lastAction
        });
      }, this.config.idleTimeout);
    };

    // Reset idle timer on any user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Start the timer
    resetIdleTimer();
  }

  /**
   * Get element information for logging
   */
  getElementInfo(element) {
    if (!element) return null;

    return {
      tagName: element.tagName?.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      type: element.type || null,
      name: element.name || null,
      textContent: element.textContent?.trim().substring(0, 100) || null,
      value: element.value?.substring(0, 50) || null, // Truncated for privacy
      href: element.href || null,
      src: element.src || null,
      ariaLabel: element.getAttribute('aria-label') || null,
      dataAttributes: this.getDataAttributes(element)
    };
  }

  /**
   * Get form information
   */
  getFormInfo(form) {
    return {
      id: form.id || null,
      className: form.className || null,
      method: form.method || 'GET',
      action: form.action || null,
      fieldCount: form.elements.length,
      fields: Array.from(form.elements).slice(0, 10).map(field => ({
        name: field.name,
        type: field.type,
        required: field.required
      }))
    };
  }

  /**
   * Check if element is a form field
   */
  isFormField(element) {
    const formTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return formTags.includes(element.tagName);
  }

  /**
   * Get data attributes from element
   */
  getDataAttributes(element) {
    const dataAttrs = {};
    if (element.dataset) {
      Object.keys(element.dataset).slice(0, 5).forEach(key => {
        dataAttrs[key] = element.dataset[key];
      });
    }
    return Object.keys(dataAttrs).length > 0 ? dataAttrs : null;
  }

  /**
   * Track page view
   */
  trackPageView() {
    this.logger.logPageView(window.location.pathname, document.title, {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generic action tracking method
   */
  trackAction(action, data = {}) {
    if (!this.config.enabled) return;

    this.sessionData.actions++;
    this.sessionData.lastAction = Date.now();

    this.logger.logUserAction(action, null, {
      ...data,
      sessionData: {
        actions: this.sessionData.actions,
        timeOnPage: Date.now() - this.sessionData.startTime,
        scrollDepth: this.sessionData.scrollDepth
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Debounce utility
   */
  debounce(func, delay) {
    const key = func.toString();
    return (...args) => {
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }
      
      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Get session summary
   */
  getSessionSummary() {
    return {
      ...this.sessionData,
      timeOnPage: Date.now() - this.sessionData.startTime,
      url: window.location.href,
      title: document.title
    };
  }

  /**
   * Manually track custom action
   */
  track(action, data = {}) {
    this.trackAction(action, data);
  }

  /**
   * Enable/disable tracking
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    
    if (enabled) {
      this.logger.info('User tracking enabled');
    } else {
      this.logger.info('User tracking disabled');
    }
  }

  /**
   * Cleanup and destroy tracker
   */
  destroy() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    
    // Log final session summary
    this.trackAction('session_end', this.getSessionSummary());
  }
}

// Create singleton instance
let userTrackerInstance = null;

export const initializeUserTracker = (config = {}) => {
  if (!userTrackerInstance && typeof window !== 'undefined') {
    userTrackerInstance = new UserActionTracker(config);
  }
  return userTrackerInstance;
};

export const getUserTracker = () => {
  if (!userTrackerInstance && typeof window !== 'undefined') {
    userTrackerInstance = new UserActionTracker();
  }
  return userTrackerInstance;
};

// React Hook for user tracking
export const useUserTracker = () => {
  const tracker = getUserTracker();
  
  return {
    track: (action, data) => tracker?.track(action, data),
    getSessionSummary: () => tracker?.getSessionSummary() || {},
    setEnabled: (enabled) => tracker?.setEnabled(enabled)
  };
};

export default UserActionTracker;