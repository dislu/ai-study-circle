import { useState, useCallback } from 'react';

export const useTranslation = () => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState(null);
  const [lastTranslationMeta, setLastTranslationMeta] = useState(null);

  // Detect language of text
  const detectLanguage = useCallback(async (text) => {
    try {
      setIsTranslating(true);
      setTranslationError(null);

      const response = await fetch('/api/translation/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Language detection failed');
      }
    } catch (error) {
      console.error('Language detection error:', error);
      setTranslationError(error.message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Translate text
  const translateText = useCallback(async (text, sourceLanguage = null, targetLanguage = 'en') => {
    try {
      setIsTranslating(true);
      setTranslationError(null);

      const response = await fetch('/api/translation/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError(error.message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Process content for AI (detect + translate if needed)
  const processContentForAI = useCallback(async (content, options = {}) => {
    try {
      setIsTranslating(true);
      setTranslationError(null);

      const response = await fetch('/api/translation/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          options,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setLastTranslationMeta(data.data.metadata);
        return data.data;
      } else {
        throw new Error(data.error || 'Content processing failed');
      }
    } catch (error) {
      console.error('Content processing error:', error);
      setTranslationError(error.message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Batch translate multiple texts
  const batchTranslate = useCallback(async (texts, sourceLanguage = null, targetLanguage = 'en') => {
    try {
      setIsTranslating(true);
      setTranslationError(null);

      const response = await fetch('/api/translation/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts,
          sourceLanguage,
          targetLanguage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Batch translation failed');
      }
    } catch (error) {
      console.error('Batch translation error:', error);
      setTranslationError(error.message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, []);

  // Get supported languages
  const getSupportedLanguages = useCallback(async () => {
    try {
      const response = await fetch('/api/translation/languages');
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to get supported languages');
      }
    } catch (error) {
      console.error('Get languages error:', error);
      setTranslationError(error.message);
      return null;
    }
  }, []);

  // Check translation service health
  const checkTranslationHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/translation/health');
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Health check failed');
      }
    } catch (error) {
      console.error('Health check error:', error);
      return {
        service: 'TranslationService',
        status: 'unhealthy',
        error: error.message
      };
    }
  }, []);

  // Clear translation cache
  const clearTranslationCache = useCallback(async () => {
    try {
      const response = await fetch('/api/translation/cache', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Cache clear failed');
      }
    } catch (error) {
      console.error('Cache clear error:', error);
      setTranslationError(error.message);
      return false;
    }
  }, []);

  // Enhanced API call wrapper that includes translation metadata
  const callApiWithTranslation = useCallback(async (url, options = {}, translateResponse = false) => {
    try {
      // Add translation response flag if requested
      const urlWithParams = translateResponse 
        ? `${url}${url.includes('?') ? '&' : '?'}translateResponse=true`
        : url;

      const response = await fetch(urlWithParams, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      // Extract translation metadata if present
      if (data.translationMeta) {
        setLastTranslationMeta(data.translationMeta);
      }

      return data;
    } catch (error) {
      console.error('API call with translation error:', error);
      setTranslationError(error.message);
      throw error;
    }
  }, []);

  return {
    // State
    isTranslating,
    translationError,
    lastTranslationMeta,
    
    // Methods
    detectLanguage,
    translateText,
    processContentForAI,
    batchTranslate,
    getSupportedLanguages,
    checkTranslationHealth,
    clearTranslationCache,
    callApiWithTranslation,
    
    // Utilities
    clearError: () => setTranslationError(null),
    clearMeta: () => setLastTranslationMeta(null),
  };
};