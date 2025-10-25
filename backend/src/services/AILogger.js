const logger = require('../utils/Logger');

/**
 * AI Processing Service Logger
 * Specialized logging for AI operations, performance tracking, and cost monitoring
 */
class AILogger {
  /**
   * Log summary generation events
   */
  static logSummaryGeneration(userId, config, performance, result, metadata = {}) {
    const logData = {
      context: 'ai',
      action: 'summary_generation',
      userId,
      timestamp: new Date().toISOString(),
      configuration: {
        type: config.type,
        length: config.length,
        language: config.language,
        customPrompt: !!config.customPrompt,
        model: config.model || 'default'
      },
      performance: {
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed || 0,
        model: performance.model,
        apiCalls: performance.apiCalls || 1,
        cacheHit: performance.cacheHit || false
      },
      result: {
        originalWordCount: result.originalWordCount || 0,
        summaryWordCount: result.summaryWordCount || 0,
        compressionRatio: result.compressionRatio || 0,
        qualityScore: result.qualityScore,
        success: result.success !== false
      },
      cost: {
        estimated: performance.estimatedCost || 0,
        currency: 'USD'
      },
      ...metadata
    };

    if (result.success !== false) {
      logger.info('🤖 AI Summary Generated', logData);
    } else {
      logger.error('❌ AI Summary Generation Failed', {
        ...logData,
        error: result.error
      });
    }

    // Log performance metrics
    this.logPerformanceMetrics('summary_generation', performance, userId);
  }

  /**
   * Log exam/quiz generation events
   */
  static logExamGeneration(userId, config, performance, result, metadata = {}) {
    const logData = {
      context: 'ai',
      action: 'exam_generation',
      userId,
      timestamp: new Date().toISOString(),
      configuration: {
        questionTypes: config.questionTypes || [],
        difficulty: config.difficulty,
        questionCount: config.questionCount,
        language: config.language,
        subject: config.subject,
        model: config.model || 'default'
      },
      performance: {
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed || 0,
        model: performance.model,
        apiCalls: performance.apiCalls || 1,
        cacheHit: performance.cacheHit || false
      },
      result: {
        questionsGenerated: result.questionsGenerated || 0,
        totalPoints: result.totalPoints || 0,
        estimatedTime: result.estimatedTime || 0,
        qualityScore: result.qualityScore,
        success: result.success !== false
      },
      cost: {
        estimated: performance.estimatedCost || 0,
        currency: 'USD'
      },
      ...metadata
    };

    if (result.success !== false) {
      logger.info('📝 AI Exam Generated', logData);
    } else {
      logger.error('❌ AI Exam Generation Failed', {
        ...logData,
        error: result.error
      });
    }

    // Log performance metrics
    this.logPerformanceMetrics('exam_generation', performance, userId);
  }

  /**
   * Log flashcard generation events
   */
  static logFlashcardGeneration(userId, config, performance, result, metadata = {}) {
    const logData = {
      context: 'ai',
      action: 'flashcard_generation',
      userId,
      timestamp: new Date().toISOString(),
      configuration: {
        cardCount: config.cardCount,
        difficulty: config.difficulty,
        language: config.language,
        includeImages: config.includeImages || false,
        model: config.model || 'default'
      },
      performance: {
        processingTime: performance.processingTime,
        tokensUsed: performance.tokensUsed || 0,
        model: performance.model,
        apiCalls: performance.apiCalls || 1,
        cacheHit: performance.cacheHit || false
      },
      result: {
        cardsGenerated: result.cardsGenerated || 0,
        qualityScore: result.qualityScore,
        success: result.success !== false
      },
      cost: {
        estimated: performance.estimatedCost || 0,
        currency: 'USD'
      },
      ...metadata
    };

    if (result.success !== false) {
      logger.info('🗂️ AI Flashcards Generated', logData);
    } else {
      logger.error('❌ AI Flashcard Generation Failed', {
        ...logData,
        error: result.error
      });
    }

    // Log performance metrics
    this.logPerformanceMetrics('flashcard_generation', performance, userId);
  }

  /**
   * Log content analysis events
   */
  static logContentAnalysis(userId, analysisType, content, result, metadata = {}) {
    const logData = {
      context: 'ai',
      action: 'content_analysis',
      userId,
      analysisType,
      timestamp: new Date().toISOString(),
      content: {
        type: content.type,
        length: content.text?.length || 0,
        language: content.language,
        source: content.source
      },
      result: {
        confidence: result.confidence,
        categories: result.categories || [],
        sentiment: result.sentiment,
        complexity: result.complexity,
        keyTopics: result.keyTopics || [],
        success: result.success !== false
      },
      performance: {
        processingTime: result.processingTime || 0,
        model: result.model
      },
      ...metadata
    };

    if (result.success !== false) {
      logger.info('🔍 AI Content Analysis Completed', logData);
    } else {
      logger.error('❌ AI Content Analysis Failed', {
        ...logData,
        error: result.error
      });
    }
  }

  /**
   * Log AI errors and failures
   */
  static logAIError(userId, operation, error, context = {}) {
    const errorData = {
      context: 'ai',
      action: 'ai_error',
      userId,
      operation,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        type: error.constructor.name
      },
      context: logger.filterSensitiveData(context),
      severity: this.determineErrorSeverity(error)
    };

    // Check if it's a rate limit error
    if (error.message?.includes('rate limit') || error.code === 429) {
      errorData.rateLimitInfo = {
        provider: context.provider,
        resetTime: context.resetTime,
        remaining: context.remaining
      };
      logger.warn('⚡ AI Rate Limit Exceeded', errorData);
    } 
    // Check if it's a quota/billing error
    else if (error.message?.includes('quota') || error.message?.includes('billing')) {
      errorData.quotaInfo = {
        provider: context.provider,
        plan: context.plan,
        usage: context.usage
      };
      logger.error('💳 AI Quota/Billing Error', errorData);
    }
    // General AI processing error
    else {
      logger.error('🤖 AI Processing Error', errorData);
    }
  }

  /**
   * Log external API usage (OpenAI, etc.)
   */
  static logAPIUsage(userId, provider, endpoint, tokens, cost, metadata = {}) {
    logger.info('📊 External AI API Usage', {
      context: 'ai',
      action: 'api_usage',
      userId,
      provider,
      endpoint,
      usage: {
        tokens: tokens || 0,
        cost: cost || 0,
        currency: 'USD'
      },
      timestamp: new Date().toISOString(),
      model: metadata.model,
      requestId: metadata.requestId,
      cacheHit: metadata.cacheHit || false,
      ...metadata
    });
  }

  /**
   * Log AI model performance metrics
   */
  static logPerformanceMetrics(operation, performance, userId, metadata = {}) {
    const performanceData = {
      context: 'performance',
      action: 'ai_performance',
      operation,
      userId,
      timestamp: new Date().toISOString(),
      metrics: {
        processingTime: performance.processingTime || 0,
        tokensPerSecond: performance.tokensUsed && performance.processingTime ? 
          (performance.tokensUsed / (performance.processingTime / 1000)) : 0,
        efficiency: performance.efficiency || 0,
        cacheHitRate: performance.cacheHit ? 1 : 0,
        errorRate: performance.errors ? (performance.errors / (performance.apiCalls || 1)) : 0
      },
      thresholds: {
        slowProcessing: performance.processingTime > 10000, // 10 seconds
        highTokenUsage: performance.tokensUsed > 4000,
        lowEfficiency: performance.efficiency < 0.7
      },
      ...metadata
    };

    // Log performance warnings
    if (performanceData.thresholds.slowProcessing) {
      logger.warn('🐌 Slow AI Processing Detected', performanceData);
    } else if (performanceData.thresholds.highTokenUsage) {
      logger.warn('💰 High Token Usage Detected', performanceData);
    } else {
      logger.info('⚡ AI Performance Metrics', performanceData);
    }
  }

  /**
   * Log AI cache operations
   */
  static logCacheOperation(operation, key, hit, metadata = {}) {
    logger.info(`🗄️ AI Cache ${operation}`, {
      context: 'ai',
      action: `cache_${operation}`,
      cacheKey: key ? this.hashCacheKey(key) : null,
      hit,
      timestamp: new Date().toISOString(),
      ttl: metadata.ttl,
      size: metadata.size,
      ...metadata
    });
  }

  /**
   * Log AI usage analytics
   */
  static logUsageAnalytics(userId, timeframe, analytics, metadata = {}) {
    logger.info('📈 AI Usage Analytics', {
      context: 'ai',
      action: 'usage_analytics',
      userId,
      timeframe,
      timestamp: new Date().toISOString(),
      analytics: {
        totalRequests: analytics.totalRequests || 0,
        totalTokens: analytics.totalTokens || 0,
        totalCost: analytics.totalCost || 0,
        averageResponseTime: analytics.averageResponseTime || 0,
        successRate: analytics.successRate || 0,
        popularOperations: analytics.popularOperations || [],
        peakUsageHours: analytics.peakUsageHours || []
      },
      ...metadata
    });
  }

  /**
   * Determine error severity based on error type and context
   */
  static determineErrorSeverity(error) {
    if (error.code === 429 || error.message?.includes('rate limit')) {
      return 'medium';
    }
    if (error.message?.includes('quota') || error.message?.includes('billing')) {
      return 'high';
    }
    if (error.code >= 500) {
      return 'high';
    }
    if (error.code >= 400) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Hash cache keys for privacy in logs
   */
  static hashCacheKey(key) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Generate AI usage report
   */
  static generateUsageReport(timeframe = '24h', metadata = {}) {
    logger.info('📋 AI Usage Report Generated', {
      context: 'ai',
      action: 'usage_report',
      timeframe,
      timestamp: new Date().toISOString(),
      reportType: 'summary',
      ...metadata
    });
  }
}

module.exports = AILogger;