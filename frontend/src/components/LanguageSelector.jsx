import React, { useState, useEffect } from 'react';
import { Globe, Check, AlertCircle, Loader2 } from 'lucide-react';

const LanguageSelector = ({ 
  onLanguageChange, 
  selectedLanguage, 
  showDetectedLanguage = false,
  detectedLanguage = null,
  className = "" 
}) => {
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSupportedLanguages();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/translation/languages');
      const data = await response.json();
      
      if (data.success) {
        setSupportedLanguages(data.data.languages);
      } else {
        setError('Failed to load supported languages');
      }
    } catch (err) {
      console.error('Error fetching languages:', err);
      setError('Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (languageCode) => {
    onLanguageChange(languageCode);
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">Loading languages...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center space-x-2 text-red-600 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Globe className="w-5 h-5 text-blue-600" />
        <label className="text-sm font-medium text-gray-700">
          Select Input Language
        </label>
      </div>

      {showDetectedLanguage && detectedLanguage && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              Detected: <strong>{detectedLanguage.native}</strong> 
              {detectedLanguage.confidence && (
                <span className="text-xs ml-1">
                  ({Math.round(detectedLanguage.confidence * 100)}% confidence)
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Auto-detect option */}
        <button
          type="button"
          onClick={() => handleLanguageSelect('auto')}
          className={`p-3 text-left border rounded-lg transition-all duration-200 ${
            selectedLanguage === 'auto'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="font-medium text-sm">Auto Detect</div>
          <div className="text-xs text-gray-500">Automatic detection</div>
        </button>

        {/* English option */}
        <button
          type="button"
          onClick={() => handleLanguageSelect('en')}
          className={`p-3 text-left border rounded-lg transition-all duration-200 ${
            selectedLanguage === 'en'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="font-medium text-sm">English</div>
          <div className="text-xs text-gray-500">English</div>
        </button>

        {/* Supported Indian languages */}
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => handleLanguageSelect(lang.code)}
            className={`p-3 text-left border rounded-lg transition-all duration-200 ${
              selectedLanguage === lang.code
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm">{lang.name}</div>
            <div className="text-xs text-gray-500" style={{ fontSize: '0.7rem' }}>
              {lang.native}
            </div>
          </button>
        ))}
      </div>

      {supportedLanguages.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No languages available</p>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;