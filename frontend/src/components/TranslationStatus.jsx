import React from 'react';
import { Languages, ArrowRight, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const TranslationStatus = ({ 
  translationMeta, 
  showDetails = false, 
  className = "" 
}) => {
  if (!translationMeta) {
    return null;
  }

  const {
    originalLanguage,
    originalLanguageName,
    wasTranslated,
    detectionMethod,
    translationService,
    confidence,
    processingTime,
    responseTranslated
  } = translationMeta;

  const getStatusColor = () => {
    if (!wasTranslated) return 'text-gray-600';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (!wasTranslated) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.8) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.6) return <AlertTriangle className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatProcessingTime = (time) => {
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  if (!showDetails && !wasTranslated) {
    return null; // Don't show status if no translation occurred and details not requested
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Languages className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-700">Translation Status</span>
        </div>
        <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {wasTranslated ? 'Translated' : 'Original'}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {/* Language Information */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Input Language:</span>
          <span className="font-medium">
            {originalLanguageName || originalLanguage || 'Unknown'}
            {originalLanguage && originalLanguage !== 'en' && (
              <span className="ml-1 text-xs text-gray-500">({originalLanguage})</span>
            )}
          </span>
        </div>

        {wasTranslated && (
          <>
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-2 text-blue-600">
                <span className="text-xs font-medium">{originalLanguageName || originalLanguage}</span>
                <ArrowRight className="w-3 h-3" />
                <span className="text-xs font-medium">English</span>
                {responseTranslated && (
                  <>
                    <ArrowRight className="w-3 h-3" />
                    <span className="text-xs font-medium">{originalLanguageName || originalLanguage}</span>
                  </>
                )}
              </div>
            </div>

            {showDetails && (
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-600">Detection Method:</span>
                  <div className="font-medium capitalize">
                    {detectionMethod || 'automatic'}
                  </div>
                </div>
                
                <div className="text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <div className={`font-medium ${getStatusColor()}`}>
                    {confidence ? `${Math.round(confidence * 100)}%` : 'N/A'}
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-600">Translation Service:</span>
                  <div className="font-medium capitalize">
                    {translationService || 'none'}
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-600">Processing Time:</span>
                  <div className="font-medium flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatProcessingTime(processingTime || 0)}</span>
                  </div>
                </div>

                {responseTranslated && (
                  <div className="col-span-2 text-sm">
                    <span className="text-gray-600">Response:</span>
                    <div className="font-medium text-blue-600">
                      Translated back to {originalLanguageName || originalLanguage}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!wasTranslated && originalLanguage === 'en' && (
          <div className="text-sm text-gray-600 text-center py-2">
            Content is already in English - no translation needed
          </div>
        )}

        {confidence && confidence < 0.6 && (
          <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-700">
              <div className="font-medium">Low Confidence Translation</div>
              <div>The translation quality may not be optimal. Please review the results.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationStatus;