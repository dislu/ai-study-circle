const IndianLanguageTranslationService = require('../services/TranslationService');

class TranslationMiddleware {
  constructor() {
    this.translationService = new IndianLanguageTranslationService();
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 3600000; // 1 hour in milliseconds
  }

  /**
   * Express middleware for automatic translation
   */
  translateContent() {
    return async (req, res, next) => {
      try {
        const { content, text, message, question } = req.body;
        
        // Find content to translate
        const contentToTranslate = content || text || message || question;
        
        if (!contentToTranslate || typeof contentToTranslate !== 'string') {
          return next(); // Skip translation if no content
        }

        // Check cache first
        const cacheKey = this.generateCacheKey(contentToTranslate);
        const cached = this.getFromCache(cacheKey);
        
        if (cached) {
          req.translation = cached;
          req.body.content = cached.processedContent;
          req.body.text = cached.processedContent;
          req.body.message = cached.processedContent;
          req.body.question = cached.processedContent;
          return next();
        }

        // Process content for AI
        const translationResult = await this.translationService.processContentForAI(contentToTranslate);
        
        // Cache the result
        this.setCache(cacheKey, translationResult);
        
        // Attach translation info to request
        req.translation = translationResult;
        
        // Update request body with processed content
        if (content) req.body.content = translationResult.processedContent;
        if (text) req.body.text = translationResult.processedContent;
        if (message) req.body.message = translationResult.processedContent;
        if (question) req.body.question = translationResult.processedContent;
        
        next();

      } catch (error) {
        console.error('Translation middleware error:', error);
        // Continue without translation on error
        req.translation = {
          success: false,
          error: error.message,
          processedContent: req.body.content || req.body.text || req.body.message || req.body.question
        };
        next();
      }
    };
  }

  /**
   * Middleware for batch translation
   */
  translateBatchContent() {
    return async (req, res, next) => {
      try {
        const { contents, texts, messages, questions } = req.body;
        
        // Find array content to translate
        const arrayToTranslate = contents || texts || messages || questions;
        
        if (!Array.isArray(arrayToTranslate)) {
          return next(); // Skip if no array content
        }

        // Process each item
        const translationResults = await this.translationService.batchProcess(arrayToTranslate);
        
        // Update request body with processed content
        if (contents) {
          req.body.contents = translationResults.map(r => r.processedContent);
        }
        if (texts) {
          req.body.texts = translationResults.map(r => r.processedContent);
        }
        if (messages) {
          req.body.messages = translationResults.map(r => r.processedContent);
        }
        if (questions) {
          req.body.questions = translationResults.map(r => r.processedContent);
        }
        
        req.batchTranslation = translationResults;
        next();

      } catch (error) {
        console.error('Batch translation middleware error:', error);
        req.batchTranslation = {
          success: false,
          error: error.message
        };
        next();
      }
    };
  }

  /**
   * Response wrapper to handle translation back to original language
   */
  wrapResponseWithTranslation() {
    return (req, res, next) => {
      const originalSend = res.send.bind(res);
      
      res.send = async (body) => {
        try {
          // Only process if we have translation info and successful response
          if (req.translation && req.translation.success && res.statusCode === 200) {
            const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
            
            // Add translation metadata to response
            if (parsedBody && typeof parsedBody === 'object') {
              parsedBody.translationMeta = {
                originalLanguage: req.translation.languageInfo?.language,
                originalLanguageName: req.translation.languageInfo?.native,
                wasTranslated: req.translation.metadata?.hasTranslation || false,
                detectionMethod: req.translation.languageInfo?.method,
                translationService: req.translation.translationInfo?.service,
                confidence: req.translation.languageInfo?.confidence,
                processingTime: req.translation.processingTime
              };

              // If user requested response in original language, translate back
              if (req.query.translateResponse === 'true' && req.translation.metadata?.hasTranslation) {
                const originalLang = req.translation.languageInfo.language;
                
                // Translate relevant fields back to original language
                if (parsedBody.result && typeof parsedBody.result === 'string') {
                  parsedBody.result = await this.translationService.translateFromEnglish(
                    parsedBody.result, 
                    originalLang
                  );
                  parsedBody.translationMeta.responseTranslated = true;
                }
                
                if (parsedBody.summary && typeof parsedBody.summary === 'string') {
                  parsedBody.summary = await this.translationService.translateFromEnglish(
                    parsedBody.summary, 
                    originalLang
                  );
                }

                if (parsedBody.analysis && typeof parsedBody.analysis === 'string') {
                  parsedBody.analysis = await this.translationService.translateFromEnglish(
                    parsedBody.analysis, 
                    originalLang
                  );
                }
              }

              return originalSend(JSON.stringify(parsedBody));
            }
          }
          
          return originalSend(body);

        } catch (error) {
          console.error('Response translation error:', error);
          return originalSend(body); // Send original response on error
        }
      };
      
      next();
    };
  }

  /**
   * Language detection endpoint
   */
  async detectLanguage(req, res) {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required for language detection'
        });
      }

      const detection = await this.translationService.detectLanguage(text);
      
      res.json({
        success: true,
        data: detection,
        supportedLanguages: this.translationService.getSupportedLanguages()
      });

    } catch (error) {
      console.error('Language detection error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Translation endpoint
   */
  async translateText(req, res) {
    try {
      const { text, sourceLanguage, targetLanguage = 'en' } = req.body;
      
      if (!text) {
        return res.status(400).json({
          success: false,
          error: 'Text is required for translation'
        });
      }

      let result;
      if (targetLanguage === 'en') {
        result = await this.translationService.translateToEnglish(text, sourceLanguage);
      } else {
        // First translate to English, then to target language
        const toEnglish = await this.translationService.translateToEnglish(text, sourceLanguage);
        const translated = await this.translationService.translateFromEnglish(
          toEnglish.translatedText, 
          targetLanguage
        );
        
        result = {
          translatedText: translated,
          originalText: text,
          sourceLanguage: toEnglish.sourceLanguage,
          targetLanguage,
          translationNeeded: true,
          intermediateEnglish: toEnglish.translatedText
        };
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(req, res) {
    try {
      const languages = this.translationService.getSupportedLanguages();
      const stats = this.translationService.getTranslationStats();
      
      res.json({
        success: true,
        data: {
          languages,
          stats
        }
      });

    } catch (error) {
      console.error('Get languages error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Translation service health check
   */
  async checkHealth(req, res) {
    try {
      const validation = await this.translationService.validateConfiguration();
      
      res.json({
        success: true,
        data: {
          service: 'TranslationService',
          status: validation.valid ? 'healthy' : 'degraded',
          configuration: validation,
          cache: {
            size: this.cache.size,
            maxAge: this.cacheTimeout
          }
        }
      });

    } catch (error) {
      console.error('Translation health check error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Cache management methods
   */
  generateCacheKey(content) {
    return `translate_${Buffer.from(content).toString('base64').substring(0, 50)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key); // Remove expired cache
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (this.cache.size > 1000) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (now - v.timestamp > this.cacheTimeout) {
          this.cache.delete(k);
        }
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

module.exports = TranslationMiddleware;