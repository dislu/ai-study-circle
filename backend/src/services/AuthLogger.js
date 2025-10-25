const logger = require('../utils/Logger');

/**
 * Authentication Service Logger
 * Specialized logging for authentication events and security monitoring
 */
class AuthLogger {
  /**
   * Log login attempts (successful and failed)
   */
  static logLoginAttempt(provider, email, ip, success = true, error = null, metadata = {}) {
    const logData = {
      context: 'auth',
      action: 'login_attempt',
      provider,
      email: email ? this.maskEmail(email) : null,
      ip,
      success,
      timestamp: new Date().toISOString(),
      userAgent: metadata.userAgent,
      sessionId: metadata.sessionId,
      requestId: metadata.requestId,
      ...metadata
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code,
        name: error.name
      };
    }

    if (success) {
      logger.info('✅ Successful Login', logData);
    } else {
      logger.warn('❌ Failed Login Attempt', logData);
      
      // Log potential security threat
      this.logSecurityEvent('failed_login', ip, {
        email,
        provider,
        error: error?.message,
        attempts: metadata.attempts
      });
    }
  }

  /**
   * Log user registration events
   */
  static logRegistration(provider, email, ip, success = true, error = null, metadata = {}) {
    const logData = {
      context: 'auth',
      action: 'user_registration',
      provider,
      email: email ? this.maskEmail(email) : null,
      ip,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code
      };
    }

    if (success) {
      logger.info('🆕 User Registration Successful', logData);
    } else {
      logger.warn('⚠️ User Registration Failed', logData);
    }
  }

  /**
   * Log user logout events
   */
  static logLogout(userId, sessionId, ip, metadata = {}) {
    logger.info('👋 User Logout', {
      context: 'auth',
      action: 'logout',
      userId,
      sessionId,
      ip,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Log token refresh events
   */
  static logTokenRefresh(userId, tokenType, ip, success = true, error = null, metadata = {}) {
    const logData = {
      context: 'auth',
      action: 'token_refresh',
      userId,
      tokenType,
      ip,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code
      };
    }

    if (success) {
      logger.info('🔄 Token Refresh Successful', logData);
    } else {
      logger.warn('⚠️ Token Refresh Failed', logData);
    }
  }

  /**
   * Log password change events
   */
  static logPasswordChange(userId, ip, success = true, error = null, metadata = {}) {
    const logData = {
      context: 'auth',
      action: 'password_change',
      userId,
      ip,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code
      };
    }

    if (success) {
      logger.info('🔐 Password Changed Successfully', logData);
    } else {
      logger.warn('❌ Password Change Failed', logData);
    }
  }

  /**
   * Log permission denied events
   */
  static logPermissionDenied(userId, resource, action, ip, metadata = {}) {
    logger.warn('🚫 Permission Denied', {
      context: 'auth',
      action: 'permission_denied',
      userId,
      resource,
      requestedAction: action,
      ip,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    // Also log as security event
    this.logSecurityEvent('permission_denied', ip, {
      userId,
      resource,
      requestedAction: action
    });
  }

  /**
   * Log security events and potential threats
   */
  static logSecurityEvent(eventType, ip, details = {}) {
    const securityLevels = {
      'failed_login': 'medium',
      'brute_force': 'high',
      'suspicious_activity': 'medium',
      'account_lockout': 'high',
      'invalid_token': 'medium',
      'permission_denied': 'medium',
      'rate_limit_exceeded': 'high',
      'sql_injection_attempt': 'critical',
      'xss_attempt': 'high',
      'csrf_attempt': 'high'
    };

    const severity = securityLevels[eventType] || 'medium';
    const logLevel = severity === 'critical' ? 'error' : 
                    severity === 'high' ? 'warn' : 'info';

    logger[logLevel](`🔒 Security Event: ${eventType}`, {
      context: 'security',
      action: eventType,
      severity,
      ip,
      timestamp: new Date().toISOString(),
      geoLocation: details.geoLocation,
      userAgent: details.userAgent,
      details: logger.filterSensitiveData(details)
    });
  }

  /**
   * Log OAuth events
   */
  static logOAuthEvent(provider, action, userId, success = true, error = null, metadata = {}) {
    const logData = {
      context: 'auth',
      action: `oauth_${action}`,
      provider,
      userId,
      success,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    if (error) {
      logData.error = {
        message: error.message,
        code: error.code,
        oauth_error: error.oauth_error
      };
    }

    if (success) {
      logger.info(`✅ OAuth ${action} successful with ${provider}`, logData);
    } else {
      logger.warn(`❌ OAuth ${action} failed with ${provider}`, logData);
    }
  }

  /**
   * Log session events
   */
  static logSessionEvent(action, sessionId, userId, metadata = {}) {
    logger.info(`Session ${action}`, {
      context: 'auth',
      action: `session_${action}`,
      sessionId,
      userId,
      timestamp: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Log rate limiting events
   */
  static logRateLimit(ip, endpoint, limit, windowMs, metadata = {}) {
    logger.warn('⚡ Rate Limit Exceeded', {
      context: 'security',
      action: 'rate_limit_exceeded',
      ip,
      endpoint,
      limit,
      windowMs,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    this.logSecurityEvent('rate_limit_exceeded', ip, {
      endpoint,
      limit,
      windowMs
    });
  }

  /**
   * Log account lockout events
   */
  static logAccountLockout(email, ip, reason, duration, metadata = {}) {
    logger.warn('🔒 Account Locked', {
      context: 'security',
      action: 'account_lockout',
      email: this.maskEmail(email),
      ip,
      reason,
      duration,
      timestamp: new Date().toISOString(),
      ...metadata
    });

    this.logSecurityEvent('account_lockout', ip, {
      email: this.maskEmail(email),
      reason,
      duration
    });
  }

  /**
   * Mask sensitive parts of email for logging
   */
  static maskEmail(email) {
    if (!email || typeof email !== 'string') return null;
    
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const maskedLocal = localPart.length > 2 ? 
      localPart.substring(0, 2) + '*'.repeat(localPart.length - 2) : 
      '*'.repeat(localPart.length);
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Generate authentication summary for monitoring
   */
  static generateAuthSummary(timeframe = '1h') {
    logger.info('📊 Authentication Summary', {
      context: 'auth',
      action: 'auth_summary',
      timeframe,
      timestamp: new Date().toISOString(),
      note: 'Summary generated for monitoring dashboard'
    });
  }
}

module.exports = AuthLogger;