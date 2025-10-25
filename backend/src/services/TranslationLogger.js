const logger = require('../utils/Logger');

/**
 * Translation Service Logger
 * Specialized logging for translation operations, language detection, and multilingual support
 */
class TranslationLogger {
  /**
   * Log translation operations
   */
  static logTranslation(userId, sourceLanguage, targetLanguage, success = true, metadata = {}) {
    const logData = {
      context: 'translation',
      action: 'translate',
      userId,
      sourceLanguage,
      targetLanguage,
      success,
      timestamp: new Date().toISOString(),
      textLength: metadata.textLength || 0,
      processingTime: metadata.processingTime || 0,
      provider: metadata.provider || 'google',
      confidence: metadata.confidence,
      cacheHit: metadata.cacheHit || false,
      cost: metadata.cost || 0,
      requestId: metadata.requestId,
      ...metadata
    };

    if (success) {
      logger.info('🌐 Translation Completed', logData);
    } else {
      logger.warn('❌ Translation Failed', {
        ...logData,
        error: metadata.error
      });
    }

    // Log performance metrics for translation
    this.logTranslationPerformance(sourceLanguage, targetLanguage, metadata);
  }

  /**
   * Log language detection events
   */
  static logLanguageDetection(text, detectedLanguage, confidence, metadata = {}) {
    const logData = {
      context: 'translation',
      action: 'language_detection',
      timestamp: new Date().toISOString(),
      textLength: text?.length || 0,
      detectedLanguage,
      confidence,
      processingTime: metadata.processingTime || 0,
      method: metadata.method || 'franc',
      alternatives: metadata.alternatives || [],
      userId: metadata.userId,
      requestId: metadata.requestId
    };

    if (confidence > 0.8) {
      logger.info('🔍 Language Detected (High Confidence)', logData);
    } else if (confidence > 0.6) {
      logger.info('🔍 Language Detected (Medium Confidence)', logData);
    } else {
      logger.warn('🔍 Language Detection (Low Confidence)', logData);
    }
  }

  /**
   * Log transliteration events (for Indian languages)
   */
  static logTransliteration(sourceScript, targetScript, success = true, metadata = {}) {
    const logData = {
      context: 'translation',
      action: 'transliteration',
      sourceScript,
      targetScript,
      success,
      timestamp: new Date().toISOString(),
      textLength: metadata.textLength || 0,
      processingTime: metadata.processingTime || 0,
      method: metadata.method || 'sanscript',
      userId: metadata.userId,
      requestId: metadata.requestId
    };

    if (success) {
      logger.info('🔤 Transliteration Completed', logData);
    } else {
      logger.warn('❌ Transliteration Failed', {
        ...logData,
        error: metadata.error
      });
    }
  }

  /**
   * Log batch translation operations
   */
  static logBatchTranslation(userId, batchInfo, results, metadata = {}) {
    const logData = {
      context: 'translation',
      action: 'batch_translation',
      userId,
      timestamp: new Date().toISOString(),
      batch: {
        size: batchInfo.size || 0,
        sourceLanguage: batchInfo.sourceLanguage,
        targetLanguages: batchInfo.targetLanguages || [],
        totalTextLength: batchInfo.totalTextLength || 0
      },
      results: {
        successful: results.successful || 0,
        failed: results.failed || 0,
        totalProcessingTime: results.totalProcessingTime || 0,
        averageProcessingTime: results.averageProcessingTime || 0,
        totalCost: results.totalCost || 0
      },
      performance: {
        throughput: results.throughput || 0, // characters per second
        efficiency: results.efficiency || 0,
        cacheHitRate: results.cacheHitRate || 0
      },
      requestId: metadata.requestId
    };

    logger.info('📦 Batch Translation Completed', logData);

    // Log any failed translations in the batch
    if (results.failures && results.failures.length > 0) {
      this.logBatchFailures(userId, results.failures, metadata);
    }
  }

  /**
   * Log translation cache operations
   */
  static logTranslationCache(operation, cacheKey, hit = false, metadata = {}) {
    const logData = {
      context: 'translation',
      action: `cache_${operation}`,
      timestamp: new Date().toISOString(),
      cacheKey: this.hashCacheKey(cacheKey),
      hit,
      ttl: metadata.ttl,
      size: metadata.size,
      sourceLanguage: metadata.sourceLanguage,
      targetLanguage: metadata.targetLanguage,
      userId: metadata.userId
    };

    logger.info(`🗄️ Translation Cache ${operation}`, logData);
  }

  /**
   * Log translation quality assessment
   */
  static logQualityAssessment(sourceText, translatedText, qualityMetrics, metadata = {}) {
    const logData = {
      context: 'translation',
      action: 'quality_assessment',
      timestamp: new Date().toISOString(),
      sourceLanguage: metadata.sourceLanguage,
      targetLanguage: metadata.targetLanguage,
      textLength: sourceText?.length || 0,
      quality: {
        score: qualityMetrics.score || 0,
        fluency: qualityMetrics.fluency || 0,
        accuracy: qualityMetrics.accuracy || 0,
        completeness: qualityMetrics.completeness || 0,
        method: qualityMetrics.method || 'automated'
      },
      userId: metadata.userId,
      requestId: metadata.requestId
    };

    if (qualityMetrics.score > 0.8) {
      logger.info('✅ High Quality Translation', logData);
    } else if (qualityMetrics.score > 0.6) {
      logger.info('⚠️ Medium Quality Translation', logData);
    } else {
      logger.warn('❌ Low Quality Translation', logData);
    }
  }

  /**
   * Log translation API errors
   */
  static logTranslationError(operation, error, context = {}) {
    const errorData = {
      context: 'translation',
      action: 'translation_error',
      operation,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        provider: error.provider || context.provider,
        type: error.constructor.name
      },
      sourceLanguage: context.sourceLanguage,
      targetLanguage: context.targetLanguage,
      textLength: context.textLength || 0,
      userId: context.userId,
      requestId: context.requestId,
      severity: this.determineErrorSeverity(error)
    };

    // Specific error types
    if (error.code === 429 || error.message?.includes('quota')) {
      logger.warn('⚡ Translation API Quota Exceeded', errorData);
    } else if (error.message?.includes('language not supported')) {
      logger.warn('🚫 Unsupported Language Pair', errorData);
    } else if (error.code >= 500) {
      logger.error('🔥 Translation Service Error', errorData);
    } else {
      logger.error('❌ Translation Error', errorData);
    }
  }

  /**
   * Log multilingual content processing
   */
  static logMultilingualProcessing(userId, content, results, metadata = {}) {
    const logData = {
      context: 'translation',
      action: 'multilingual_processing',
      userId,
      timestamp: new Date().toISOString(),
      content: {
        originalLanguage: content.originalLanguage,
        detectedLanguages: content.detectedLanguages || [],
        mixedLanguage: content.mixedLanguage || false,
        segments: content.segments || 0
      },
      processing: {
        strategy: results.strategy || 'auto',
        totalProcessingTime: results.totalProcessingTime || 0,
        translationsPerformed: results.translationsPerformed || 0,
        success: results.success !== false
      },
      requestId: metadata.requestId
    };

    if (results.success !== false) {
      logger.info('🌍 Multilingual Content Processed', logData);
    } else {
      logger.warn('❌ Multilingual Processing Failed', {
        ...logData,
        error: results.error
      });
    }
  }

  /**
   * Log Indian language specific operations
   */
  static logIndianLanguageOperation(operation, language, metadata = {}) {
    const logData = {
      context: 'translation',
      action: `indian_language_${operation}`,
      language,
      timestamp: new Date().toISOString(),
      script: this.getIndianLanguageScript(language),
      region: this.getIndianLanguageRegion(language),
      complexity: metadata.complexity || 'medium',
      userId: metadata.userId,
      processingTime: metadata.processingTime || 0,
      success: metadata.success !== false
    };

    logger.info(`🇮🇳 Indian Language ${operation}`, logData);
  }

  /**
   * Log translation performance metrics
   */
  static logTranslationPerformance(sourceLanguage, targetLanguage, metrics) {
    const performanceData = {
      context: 'performance',
      action: 'translation_performance',
      timestamp: new Date().toISOString(),
      languagePair: `${sourceLanguage}-${targetLanguage}`,
      metrics: {
        processingTime: metrics.processingTime || 0,
        charactersPerSecond: metrics.textLength && metrics.processingTime ? 
          (metrics.textLength / (metrics.processingTime / 1000)) : 0,
        apiLatency: metrics.apiLatency || 0,
        cacheHitRate: metrics.cacheHit ? 1 : 0,
        cost: metrics.cost || 0
      },
      thresholds: {
        slowProcessing: metrics.processingTime > 5000, // 5 seconds
        highLatency: metrics.apiLatency > 2000, // 2 seconds
        highCost: metrics.cost > 0.01 // $0.01 per request
      }
    };

    if (performanceData.thresholds.slowProcessing) {
      logger.warn('🐌 Slow Translation Processing', performanceData);
    } else {
      logger.info('⚡ Translation Performance', performanceData);
    }
  }

  /**
   * Log batch translation failures
   */
  static logBatchFailures(userId, failures, metadata = {}) {
    failures.forEach((failure, index) => {
      logger.warn(`❌ Batch Translation Failure ${index + 1}`, {
        context: 'translation',
        action: 'batch_failure',
        userId,
        timestamp: new Date().toISOString(),
        failure: {
          sourceLanguage: failure.sourceLanguage,
          targetLanguage: failure.targetLanguage,
          error: failure.error,
          textLength: failure.textLength || 0
        },
        batchId: metadata.batchId,
        requestId: metadata.requestId
      });
    });
  }

  /**
   * Get script information for Indian languages
   */
  static getIndianLanguageScript(language) {
    const scripts = {
      'hi': 'Devanagari',
      'bn': 'Bengali',
      'ta': 'Tamil',
      'te': 'Telugu',
      'mr': 'Devanagari',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam',
      'or': 'Odia',
      'pa': 'Gurmukhi',
      'as': 'Assamese',
      'ur': 'Arabic',
      'sa': 'Devanagari',
      'ne': 'Devanagari',
      'si': 'Sinhala',
      'my': 'Myanmar'
    };
    return scripts[language] || 'Unknown';
  }

  /**
   * Get region information for Indian languages
   */
  static getIndianLanguageRegion(language) {
    const regions = {
      'hi': 'North India',
      'bn': 'East India',
      'ta': 'South India',
      'te': 'South India',
      'mr': 'West India',
      'gu': 'West India',
      'kn': 'South India',
      'ml': 'South India',
      'or': 'East India',
      'pa': 'North India',
      'as': 'Northeast India',
      'ur': 'North India',
      'sa': 'Classical',
      'ne': 'Nepal/North India',
      'si': 'Sri Lanka',
      'my': 'Myanmar'
    };
    return regions[language] || 'Other';
  }

  /**
   * Hash cache keys for privacy
   */
  static hashCacheKey(key) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
  }

  /**
   * Determine error severity
   */
  static determineErrorSeverity(error) {
    if (error.code === 429) return 'medium';
    if (error.code >= 500) return 'high';
    if (error.code >= 400) return 'medium';
    return 'low';
  }

  /**
   * Generate translation usage report
   */
  static generateTranslationReport(timeframe = '24h', metadata = {}) {
    logger.info('📊 Translation Usage Report', {
      context: 'translation',
      action: 'usage_report',
      timeframe,
      timestamp: new Date().toISOString(),
      reportType: 'summary',
      ...metadata
    });
  }
}

module.exports = TranslationLogger;