const { Translate } = require('@google-cloud/translate').v2;
const franc = require('franc');
const { transliterate } = require('transliteration');

class IndianLanguageTranslationService {
  constructor() {
    // Initialize Google Translate (primary service)
    this.googleTranslate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    // Supported Indian languages mapping
    this.supportedLanguages = {
      'hi': { name: 'Hindi', native: 'हिन्दी', script: 'Devanagari' },
      'bn': { name: 'Bengali', native: 'বাংলা', script: 'Bengali' },
      'te': { name: 'Telugu', native: 'తెలుగు', script: 'Telugu' },
      'mr': { name: 'Marathi', native: 'मराठी', script: 'Devanagari' },
      'ta': { name: 'Tamil', native: 'தமிழ்', script: 'Tamil' },
      'gu': { name: 'Gujarati', native: 'ગુજરાતી', script: 'Gujarati' },
      'kn': { name: 'Kannada', native: 'ಕನ್ನಡ', script: 'Kannada' },
      'ml': { name: 'Malayalam', native: 'മലയാളം', script: 'Malayalam' },
      'pa': { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
      'or': { name: 'Odia', native: 'ଓଡ଼ିଆ', script: 'Odia' },
      'as': { name: 'Assamese', native: 'অসমীয়া', script: 'Bengali' },
      'ur': { name: 'Urdu', native: 'اردو', script: 'Arabic' },
      'ne': { name: 'Nepali', native: 'नेपाली', script: 'Devanagari' },
      'si': { name: 'Sinhala', native: 'සිංහල', script: 'Sinhala' },
      'my': { name: 'Myanmar', native: 'မြန်မာ', script: 'Myanmar' },
      'sa': { name: 'Sanskrit', native: 'संस्कृतम्', script: 'Devanagari' }
    };

    // Language detection patterns for Indian languages
    this.languagePatterns = {
      hindi: /[\u0900-\u097F]/,
      bengali: /[\u0980-\u09FF]/,
      tamil: /[\u0B80-\u0BFF]/,
      telugu: /[\u0C00-\u0C7F]/,
      gujarati: /[\u0A80-\u0AFF]/,
      kannada: /[\u0C80-\u0CFF]/,
      malayalam: /[\u0D00-\u0D7F]/,
      punjabi: /[\u0A00-\u0A7F]/,
      odia: /[\u0B00-\u0B7F]/,
      urdu: /[\u0600-\u06FF]/,
      sinhala: /[\u0D80-\u0DFF]/,
      myanmar: /[\u1000-\u109F]/
    };

    this.isConfigured = this.checkConfiguration();
  }

  checkConfiguration() {
    const hasGoogleConfig = process.env.GOOGLE_TRANSLATE_API_KEY && process.env.GOOGLE_CLOUD_PROJECT_ID;
    
    if (!hasGoogleConfig) {
      console.warn('⚠️  Google Translate API not configured. Translation features will be limited.');
      console.log('💡 To enable full translation: Set GOOGLE_TRANSLATE_API_KEY and GOOGLE_CLOUD_PROJECT_ID');
    }

    return hasGoogleConfig;
  }

  /**
   * Detect the language of the input text
   */
  async detectLanguage(text) {
    try {
      // First, try pattern-based detection for Indian languages
      const patternDetected = this.detectIndianLanguageByPattern(text);
      if (patternDetected) {
        return {
          language: patternDetected.code,
          confidence: 0.9,
          name: patternDetected.name,
          native: patternDetected.native,
          method: 'pattern'
        };
      }

      // Use franc library for statistical language detection
      const francResult = franc(text);
      if (francResult !== 'und' && this.supportedLanguages[francResult]) {
        return {
          language: francResult,
          confidence: 0.8,
          name: this.supportedLanguages[francResult].name,
          native: this.supportedLanguages[francResult].native,
          method: 'statistical'
        };
      }

      // Use Google Translate API if available
      if (this.isConfigured) {
        const [detection] = await this.googleTranslate.detect(text);
        const detectedLang = Array.isArray(detection) ? detection[0] : detection;
        
        if (this.supportedLanguages[detectedLang.language]) {
          return {
            language: detectedLang.language,
            confidence: detectedLang.confidence,
            name: this.supportedLanguages[detectedLang.language].name,
            native: this.supportedLanguages[detectedLang.language].native,
            method: 'google'
          };
        }
      }

      // Default to English if no Indian language detected
      return {
        language: 'en',
        confidence: 0.5,
        name: 'English',
        native: 'English',
        method: 'default'
      };

    } catch (error) {
      console.error('Language detection error:', error);
      return {
        language: 'unknown',
        confidence: 0,
        name: 'Unknown',
        native: 'Unknown',
        method: 'error',
        error: error.message
      };
    }
  }

  /**
   * Pattern-based detection for Indian languages
   */
  detectIndianLanguageByPattern(text) {
    for (const [pattern, regex] of Object.entries(this.languagePatterns)) {
      if (regex.test(text)) {
        // Map pattern names to language codes
        const langCodeMap = {
          hindi: 'hi',
          bengali: 'bn',
          tamil: 'ta',
          telugu: 'te',
          gujarati: 'gu',
          kannada: 'kn',
          malayalam: 'ml',
          punjabi: 'pa',
          odia: 'or',
          urdu: 'ur',
          sinhala: 'si',
          myanmar: 'my'
        };

        const langCode = langCodeMap[pattern];
        if (langCode && this.supportedLanguages[langCode]) {
          return {
            code: langCode,
            name: this.supportedLanguages[langCode].name,
            native: this.supportedLanguages[langCode].native
          };
        }
      }
    }
    return null;
  }

  /**
   * Translate text to English
   */
  async translateToEnglish(text, sourceLanguage = null) {
    try {
      // If already in English, return as is
      if (sourceLanguage === 'en' || this.isEnglish(text)) {
        return {
          translatedText: text,
          originalText: text,
          sourceLanguage: 'en',
          targetLanguage: 'en',
          translationNeeded: false,
          confidence: 1.0
        };
      }

      // Detect source language if not provided
      if (!sourceLanguage) {
        const detection = await this.detectLanguage(text);
        sourceLanguage = detection.language;
        
        if (sourceLanguage === 'en' || sourceLanguage === 'unknown') {
          return {
            translatedText: text,
            originalText: text,
            sourceLanguage: sourceLanguage,
            targetLanguage: 'en',
            translationNeeded: false,
            confidence: detection.confidence
          };
        }
      }

      // Perform translation using Google Translate
      if (this.isConfigured) {
        const [translation] = await this.googleTranslate.translate(text, {
          from: sourceLanguage,
          to: 'en'
        });

        return {
          translatedText: translation,
          originalText: text,
          sourceLanguage: sourceLanguage,
          targetLanguage: 'en',
          translationNeeded: true,
          confidence: 0.9,
          service: 'google'
        };
      }

      // Fallback: Try to transliterate if it's a Devanagari script
      if (this.isDevanagariScript(text)) {
        const transliterated = transliterate(text);
        return {
          translatedText: transliterated,
          originalText: text,
          sourceLanguage: sourceLanguage,
          targetLanguage: 'en',
          translationNeeded: true,
          confidence: 0.6,
          service: 'transliteration',
          note: 'Transliterated from Devanagari script'
        };
      }

      // If no translation service available, return original
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage: sourceLanguage,
        targetLanguage: 'en',
        translationNeeded: false,
        confidence: 0.3,
        service: 'none',
        note: 'Translation service not configured'
      };

    } catch (error) {
      console.error('Translation error:', error);
      return {
        translatedText: text,
        originalText: text,
        sourceLanguage: sourceLanguage || 'unknown',
        targetLanguage: 'en',
        translationNeeded: false,
        confidence: 0,
        error: error.message
      };
    }
  }

  /**
   * Translate text from English back to target language
   */
  async translateFromEnglish(text, targetLanguage) {
    try {
      if (!this.supportedLanguages[targetLanguage]) {
        throw new Error(`Unsupported target language: ${targetLanguage}`);
      }

      if (targetLanguage === 'en') {
        return text;
      }

      if (this.isConfigured) {
        const [translation] = await this.googleTranslate.translate(text, {
          from: 'en',
          to: targetLanguage
        });

        return translation;
      }

      // If no translation service, return English text
      return text;

    } catch (error) {
      console.error('Back-translation error:', error);
      return text; // Return original English text on error
    }
  }

  /**
   * Process content for AI agents (main method)
   */
  async processContentForAI(content, options = {}) {
    const startTime = Date.now();
    
    try {
      const result = {
        processedContent: content,
        originalContent: content,
        languageInfo: null,
        translationInfo: null,
        processingTime: 0,
        success: true
      };

      // Step 1: Detect language
      const detection = await this.detectLanguage(content);
      result.languageInfo = detection;

      // Step 2: Translate if needed
      if (detection.language !== 'en' && detection.language !== 'unknown') {
        const translation = await this.translateToEnglish(content, detection.language);
        result.translationInfo = translation;
        result.processedContent = translation.translatedText;
      }

      // Step 3: Add metadata
      result.processingTime = Date.now() - startTime;
      result.metadata = {
        hasTranslation: result.translationInfo?.translationNeeded || false,
        originalLanguage: detection.language,
        detectionMethod: detection.method,
        translationService: result.translationInfo?.service || 'none',
        confidence: detection.confidence
      };

      return result;

    } catch (error) {
      console.error('Content processing error:', error);
      return {
        processedContent: content,
        originalContent: content,
        languageInfo: null,
        translationInfo: null,
        processingTime: Date.now() - startTime,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages() {
    return Object.entries(this.supportedLanguages).map(([code, info]) => ({
      code,
      ...info
    }));
  }

  /**
   * Check if text is primarily in English
   */
  isEnglish(text) {
    const englishPattern = /^[a-zA-Z0-9\s\.,;:!?'"()\-\[\]{}\/\\@#$%^&*+=<>|`~_]*$/;
    const englishRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    return englishPattern.test(text.substring(0, 100)) || englishRatio > 0.7;
  }

  /**
   * Check if text contains Devanagari script
   */
  isDevanagariScript(text) {
    return this.languagePatterns.hindi.test(text);
  }

  /**
   * Batch process multiple texts
   */
  async batchProcess(texts, options = {}) {
    const results = [];
    
    for (const text of texts) {
      try {
        const result = await this.processContentForAI(text, options);
        results.push(result);
        
        // Add small delay to avoid rate limits
        if (this.isConfigured && texts.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        results.push({
          processedContent: text,
          originalContent: text,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get translation statistics
   */
  getTranslationStats() {
    return {
      supportedLanguages: Object.keys(this.supportedLanguages).length,
      isConfigured: this.isConfigured,
      services: {
        google: this.isConfigured,
        transliteration: true,
        patternDetection: true,
        statisticalDetection: true
      }
    };
  }

  /**
   * Validate translation configuration
   */
  async validateConfiguration() {
    try {
      if (!this.isConfigured) {
        return {
          valid: false,
          message: 'Google Translate API not configured',
          suggestions: [
            'Set GOOGLE_TRANSLATE_API_KEY environment variable',
            'Set GOOGLE_CLOUD_PROJECT_ID environment variable',
            'Enable Google Cloud Translation API in your project'
          ]
        };
      }

      // Test with a simple translation
      const testResult = await this.translateToEnglish('नमस्ते', 'hi');
      
      if (testResult.translationNeeded && testResult.service === 'google') {
        return {
          valid: true,
          message: 'Translation service is working correctly',
          testResult
        };
      } else {
        return {
          valid: false,
          message: 'Translation service test failed',
          testResult
        };
      }

    } catch (error) {
      return {
        valid: false,
        message: 'Translation service validation failed',
        error: error.message
      };
    }
  }
}

module.exports = IndianLanguageTranslationService;