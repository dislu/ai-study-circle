import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Download, Copy, RefreshCw, Languages, Settings } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';
import TranslationStatus from './TranslationStatus';

const SummaryGenerator = ({ selectedLanguage = 'auto' }) => {
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({
    length: 'medium',
    style: 'academic',
    focus: 'general'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);

  const { 
    callApiWithTranslation, 
    detectLanguage, 
    lastTranslationMeta, 
    isTranslating,
    translationError 
  } = useTranslation();

  useEffect(() => {
    if (content && content.length > 10 && selectedLanguage === 'auto') {
      handleLanguageDetection();
    }
  }, [content, selectedLanguage]);

  const handleLanguageDetection = async () => {
    const detection = await detectLanguage(content);
    setDetectedLanguage(detection);
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Please enter content to summarize');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSummary('');

      const response = await callApiWithTranslation('/api/summary/generate', {
        method: 'POST',
        body: JSON.stringify({
          content,
          options: {
            ...options,
            language: selectedLanguage
          }
        })
      }, true); // Enable response translation

      if (response.success) {
        setSummary(response.data.summary);
      } else {
        setError(response.error || 'Failed to generate summary');
      }
    } catch (err) {
      console.error('Summary generation error:', err);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = (text, filename) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Summary Generator</h1>
        <p className="text-gray-600">
          Transform any content into intelligent summaries in multiple Indian languages
        </p>
      </div>

      {/* Translation Status */}
      {lastTranslationMeta && (
        <TranslationStatus 
          translationMeta={lastTranslationMeta}
          showDetails={showAdvanced}
        />
      )}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Input Content</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Advanced</span>
                </button>
              </div>
            </div>

            {/* Language Detection Status */}
            {selectedLanguage === 'auto' && detectedLanguage && (
              <LanguageSelector
                selectedLanguage={selectedLanguage}
                onLanguageChange={() => {}} // Read-only in this context
                showDetectedLanguage={true}
                detectedLanguage={detectedLanguage}
                className="mb-4"
              />
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter or paste your content here in any supported language..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />

            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-gray-600">
                {content.length} characters
              </span>
              <div className="flex items-center space-x-2">
                {(isTranslating || loading) && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">
                      {isTranslating ? 'Processing language...' : 'Generating...'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Options */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Summary Options</h3>
            
            <div className="space-y-4">
              {/* Length */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Length
                </label>
                <select
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="brief">Brief (1-2 paragraphs)</option>
                  <option value="medium">Medium (3-4 paragraphs)</option>
                  <option value="detailed">Detailed (5+ paragraphs)</option>
                </select>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Style
                </label>
                <select
                  value={options.style}
                  onChange={(e) => setOptions({ ...options, style: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="academic">Academic</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              {/* Focus */}
              {showAdvanced && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Focus Area
                  </label>
                  <select
                    value={options.focus}
                    onChange={(e) => setOptions({ ...options, focus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General Summary</option>
                    <option value="key-points">Key Points</option>
                    <option value="conclusions">Main Conclusions</option>
                    <option value="methodology">Methodology</option>
                    <option value="findings">Research Findings</option>
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerate}
              disabled={!content.trim() || loading || isTranslating}
              className="w-full mt-6 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Summary...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Generated Summary</h2>
              {summary && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCopy(summary)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </button>
                  <button
                    onClick={() => handleDownload(summary, 'summary.txt')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-64">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generating your summary...</p>
                    {isTranslating && (
                      <p className="text-sm text-blue-600 mt-2">Processing multilingual content...</p>
                    )}
                  </div>
                </div>
              ) : summary ? (
                <div className="prose max-w-none">
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {summary}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Your summary will appear here</p>
                    <p className="text-sm mt-2">Enter content and click "Generate Summary" to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {(error || translationError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <div className="text-red-600">⚠️</div>
                <div>
                  <h4 className="text-red-800 font-medium">Error</h4>
                  <p className="text-red-700 text-sm">
                    {error || translationError}
                  </p>
                  <button
                    onClick={() => {
                      setError(null);
                      handleGenerate();
                    }}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SummaryGenerator;