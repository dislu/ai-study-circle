# Indian Language Translation System Documentation

## Overview

The AI Study Circle platform now includes comprehensive support for Indian languages, allowing users to input content in their native language and receive AI-processed results. The system automatically detects the input language, translates it to English for AI processing, and can optionally translate responses back to the original language.

## Supported Languages

The system supports 16+ Indian and South Asian languages:

- **Hindi** (हिन्दी) - Devanagari script
- **Bengali** (বাংলা) - Bengali script  
- **Telugu** (తెలుగు) - Telugu script
- **Marathi** (मराठी) - Devanagari script
- **Tamil** (தமிழ்) - Tamil script
- **Gujarati** (ગુજરાતી) - Gujarati script
- **Kannada** (ಕನ್ನಡ) - Kannada script
- **Malayalam** (മലയാളം) - Malayalam script
- **Punjabi** (ਪੰਜਾਬੀ) - Gurmukhi script
- **Odia** (ଓଡ଼ିଆ) - Odia script
- **Assamese** (অসমীয়া) - Bengali script
- **Urdu** (اردو) - Arabic script
- **Nepali** (नेपाली) - Devanagari script
- **Sinhala** (සිංහල) - Sinhala script
- **Myanmar** (မြန်မာ) - Myanmar script
- **Sanskrit** (संस्कृतम्) - Devanagari script

## Architecture

### Core Components

1. **TranslationService** (`/backend/services/TranslationService.js`)
   - Main service handling language detection and translation
   - Integrates Google Cloud Translate API
   - Provides fallback transliteration for Devanagari scripts
   - Supports batch processing

2. **TranslationMiddleware** (`/backend/middleware/TranslationMiddleware.js`)
   - Express middleware for automatic translation in API routes
   - Caches translation results for performance
   - Handles request preprocessing and response translation

3. **Translation Routes** (`/backend/routes/translation.js`)
   - RESTful API endpoints for translation services
   - Health monitoring and configuration validation
   - Language detection and batch translation endpoints

### Frontend Components

1. **LanguageSelector** (`/frontend/src/components/LanguageSelector.jsx`)
   - Language selection interface
   - Auto-detection display
   - Native script display for languages

2. **TranslationStatus** (`/frontend/src/components/TranslationStatus.jsx`)
   - Shows translation metadata
   - Confidence indicators
   - Processing time metrics

3. **useTranslation Hook** (`/frontend/src/hooks/useTranslation.js`)
   - React hook for translation functionality
   - API integration utilities
   - State management for translation operations

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Translation Service Configuration
GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id_here

# Translation Settings
TRANSLATION_CACHE_TIMEOUT=3600000
ENABLE_AUTO_TRANSLATION=true
DEFAULT_TARGET_LANGUAGE=en
```

### Google Cloud Setup

1. **Enable APIs**:
   - Go to Google Cloud Console
   - Enable Cloud Translation API
   - Create API credentials

2. **Authentication**:
   - Create service account key
   - Set environment variables
   - Or use Application Default Credentials

## API Endpoints

### Language Detection
```http
POST /api/translation/detect
Content-Type: application/json

{
  "text": "आपका स्वागत है"
}
```

### Text Translation
```http
POST /api/translation/translate
Content-Type: application/json

{
  "text": "Hello, how are you?",
  "sourceLanguage": "en",
  "targetLanguage": "hi"
}
```

### Content Processing for AI
```http
POST /api/translation/process
Content-Type: application/json

{
  "content": "मैं एक छात्र हूं और मुझे पढ़ाई में मदद चाहिए।",
  "options": {}
}
```

### Batch Translation
```http
POST /api/translation/batch
Content-Type: application/json

{
  "texts": ["Text 1", "Text 2"],
  "sourceLanguage": "hi",
  "targetLanguage": "en"
}
```

### Get Supported Languages
```http
GET /api/translation/languages
```

### Health Check
```http
GET /api/translation/health
```

## Integration with AI Agents

### Automatic Translation

The translation middleware is automatically applied to AI agent routes:

```javascript
// Summary generation with translation
app.use('/api/summary', 
  translationMiddleware.translateContent(), 
  translationWrapper, 
  summaryRoutes
);

// Exam generation with translation
app.use('/api/exam', 
  translationMiddleware.translateContent(), 
  translationWrapper, 
  examRoutes
);
```

### Response Translation

To get responses translated back to the original language:

```http
POST /api/summary/generate?translateResponse=true
Content-Type: application/json

{
  "content": "Hindi content here"
}
```

The response will include translation metadata:

```json
{
  "success": true,
  "data": {
    "summary": "Translated summary in original language"
  },
  "translationMeta": {
    "originalLanguage": "hi",
    "originalLanguageName": "हिन्दी",
    "wasTranslated": true,
    "responseTranslated": true,
    "confidence": 0.95
  }
}
```

## Usage Examples

### React Component Integration

```jsx
import { useTranslation } from '../hooks/useTranslation';
import LanguageSelector from './LanguageSelector';
import TranslationStatus from './TranslationStatus';

function MyComponent() {
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const { callApiWithTranslation, lastTranslationMeta } = useTranslation();

  const handleSubmit = async () => {
    const response = await callApiWithTranslation('/api/summary/generate', {
      method: 'POST',
      body: JSON.stringify({
        content: userInput,
        language: selectedLanguage
      })
    }, true); // Enable response translation
  };

  return (
    <div>
      <LanguageSelector 
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
      
      {/* Your form */}
      
      <TranslationStatus 
        translationMeta={lastTranslationMeta}
        showDetails={true}
      />
    </div>
  );
}
```

### Backend Service Usage

```javascript
const TranslationService = require('./services/TranslationService');

const translationService = new TranslationService();

// Process content for AI
const result = await translationService.processContentForAI(
  "यह एक हिंदी वाक्य है।"
);

console.log(result.processedContent); // English translation
console.log(result.languageInfo.language); // "hi"
console.log(result.translationInfo.translationNeeded); // true
```

## Language Detection Methods

The system uses multiple detection methods for accuracy:

1. **Pattern-based Detection**: Unicode ranges for specific scripts
2. **Statistical Detection**: `franc` library for statistical analysis  
3. **Google Cloud Detection**: Professional-grade detection service
4. **Fallback Logic**: Defaults to English if detection fails

## Performance Considerations

### Caching
- In-memory cache for frequent translations
- 1-hour cache timeout by default
- Automatic cache cleanup for memory management

### Rate Limiting
- Built-in delays for batch operations
- Respects API rate limits
- Graceful degradation on service unavailability

### Fallback Strategies
- Transliteration for unsupported content
- Original text passthrough on translation failure
- Multiple detection methods for reliability

## Error Handling

The system provides comprehensive error handling:

```javascript
// Translation with error handling
try {
  const result = await translationService.translateToEnglish(content);
  if (result.error) {
    console.log('Translation failed:', result.error);
    // Use original content
  }
} catch (error) {
  console.error('Service error:', error);
  // Fallback to original content
}
```

## Monitoring and Health Checks

### Health Endpoint Response
```json
{
  "success": true,
  "data": {
    "service": "TranslationService",
    "status": "healthy",
    "configuration": {
      "valid": true,
      "message": "Translation service is working correctly"
    }
  }
}
```

### Translation Metadata
Each translation provides detailed metadata:
- Source language detection confidence
- Translation service used
- Processing time
- Error information if applicable

## Best Practices

1. **Language Selection**:
   - Use auto-detection for unknown input languages
   - Allow manual language selection for accuracy
   - Display detected language for user confirmation

2. **Error Handling**:
   - Always provide fallback to original content
   - Show translation confidence to users
   - Handle service unavailability gracefully

3. **Performance**:
   - Cache frequent translations
   - Use batch processing for multiple texts
   - Implement appropriate timeouts

4. **User Experience**:
   - Show translation status to users
   - Provide option to view original content
   - Allow toggling of response translation

## Troubleshooting

### Common Issues

1. **Translation Service Not Working**:
   - Check Google Cloud API key configuration
   - Verify project ID and API permissions
   - Check network connectivity

2. **Low Translation Quality**:
   - Review confidence scores
   - Use manual language selection
   - Check for mixed-language content

3. **Performance Issues**:
   - Clear translation cache
   - Check API rate limits
   - Monitor service health

### Debug Information

Enable verbose logging:
```bash
NODE_ENV=development
TRANSLATION_DEBUG=true
```

Check service status:
```bash
curl http://localhost:3001/api/translation/health
```

## Future Enhancements

1. **Additional Languages**: Support for more regional languages
2. **Offline Translation**: Local translation models for privacy
3. **Translation Quality Assessment**: ML-based quality scoring
4. **Custom Vocabularies**: Domain-specific translation improvements
5. **Real-time Translation**: WebSocket-based live translation

---

For technical support or feature requests, please refer to the project repository or contact the development team.