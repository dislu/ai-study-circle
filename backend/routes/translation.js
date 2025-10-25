const express = require('express');
const router = express.Router();
const TranslationMiddleware = require('../middleware/TranslationMiddleware');

const translationMiddleware = new TranslationMiddleware();

/**
 * @route   POST /api/translation/detect
 * @desc    Detect language of input text
 * @access  Public
 */
router.post('/detect', translationMiddleware.detectLanguage.bind(translationMiddleware));

/**
 * @route   POST /api/translation/translate
 * @desc    Translate text between languages
 * @access  Public
 */
router.post('/translate', translationMiddleware.translateText.bind(translationMiddleware));

/**
 * @route   GET /api/translation/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', translationMiddleware.getSupportedLanguages.bind(translationMiddleware));

/**
 * @route   GET /api/translation/health
 * @desc    Check translation service health
 * @access  Public
 */
router.get('/health', translationMiddleware.checkHealth.bind(translationMiddleware));

/**
 * @route   POST /api/translation/batch
 * @desc    Translate multiple texts at once
 * @access  Public
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts, sourceLanguage, targetLanguage = 'en' } = req.body;
    
    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of texts is required'
      });
    }

    const results = [];
    const translationService = translationMiddleware.translationService;
    
    for (const text of texts) {
      if (targetLanguage === 'en') {
        const result = await translationService.translateToEnglish(text, sourceLanguage);
        results.push(result);
      } else {
        const toEnglish = await translationService.translateToEnglish(text, sourceLanguage);
        const translated = await translationService.translateFromEnglish(
          toEnglish.translatedText, 
          targetLanguage
        );
        
        results.push({
          translatedText: translated,
          originalText: text,
          sourceLanguage: toEnglish.sourceLanguage,
          targetLanguage,
          translationNeeded: true,
          intermediateEnglish: toEnglish.translatedText
        });
      }
      
      // Small delay to avoid rate limits
      if (texts.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    res.json({
      success: true,
      data: {
        results,
        totalProcessed: texts.length,
        successfulTranslations: results.filter(r => r.translationNeeded).length
      }
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/translation/process
 * @desc    Process content for AI (detect + translate if needed)
 * @access  Public
 */
router.post('/process', async (req, res) => {
  try {
    const { content, options = {} } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const translationService = translationMiddleware.translationService;
    const result = await translationService.processContentForAI(content, options);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Content processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/translation/cache
 * @desc    Clear translation cache
 * @access  Public
 */
router.delete('/cache', (req, res) => {
  try {
    translationMiddleware.clearCache();
    
    res.json({
      success: true,
      message: 'Translation cache cleared successfully'
    });

  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   POST /api/translation/validate-config
 * @desc    Validate translation service configuration
 * @access  Public
 */
router.post('/validate-config', async (req, res) => {
  try {
    const translationService = translationMiddleware.translationService;
    const validation = await translationService.validateConfiguration();
    
    res.json({
      success: true,
      data: validation
    });

  } catch (error) {
    console.error('Config validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = { router, translationMiddleware };