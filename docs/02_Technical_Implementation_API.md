# AI Study Circle - Technical Implementation Guide

**Document 2: Technical Implementation and API Reference**

---

## Table of Contents

1. [Backend Implementation](#backend-implementation)
2. [Frontend Implementation](#frontend-implementation)
3. [API Documentation](#api-documentation)
4. [Database Design](#database-design)
5. [Authentication System](#authentication-system)
6. [Translation System](#translation-system)
7. [AI Integration](#ai-integration)

---

## Backend Implementation

### 1. **Server Architecture**

#### Main Server Configuration (`server.js`)
```javascript
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-circle', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-study-circle',
        touchAfter: 24 * 3600 // 24 hours
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Passport initialization
require('./src/config/passport');
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/translation', require('./src/routes/translation'));
app.use('/api/summary', require('./src/routes/summary'));
app.use('/api/exam', require('./src/routes/exam'));
app.use('/api/analytics', require('./src/routes/analytics'));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

### 2. **Authentication Implementation**

#### Passport Configuration (`src/config/passport.js`)
```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            // Update existing user
            user.lastLogin = new Date();
            user.profile.picture = profile.photos[0]?.value;
            await user.save();
            return done(null, user);
        }

        // Create new user
        user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            profile: {
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                picture: profile.photos[0]?.value,
                provider: 'google'
            },
            preferences: {
                language: 'en',
                theme: 'light'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });

        await user.save();
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "/api/auth/facebook/callback",
    profileFields: ['id', 'displayName', 'photos', 'email', 'name']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });
        
        if (user) {
            user.lastLogin = new Date();
            user.profile.picture = profile.photos[0]?.value;
            await user.save();
            return done(null, user);
        }

        user = new User({
            facebookId: profile.id,
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
            profile: {
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                picture: profile.photos[0]?.value,
                provider: 'facebook'
            },
            preferences: {
                language: 'en',
                theme: 'light'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });

        await user.save();
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Microsoft OAuth Strategy
passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: "/api/auth/microsoft/callback",
    scope: ['User.Read']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ microsoftId: profile.id });
        
        if (user) {
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
        }

        user = new User({
            microsoftId: profile.id,
            email: profile.emails?.[0]?.value || profile.userPrincipalName,
            name: profile.displayName,
            profile: {
                firstName: profile.name?.givenName,
                lastName: profile.name?.familyName,
                picture: profile.photos?.[0]?.value,
                provider: 'microsoft'
            },
            preferences: {
                language: 'en',
                theme: 'light'
            },
            createdAt: new Date(),
            lastLogin: new Date()
        });

        await user.save();
        done(null, user);
    } catch (error) {
        done(error, null);
    }
}));

// Serialize/Deserialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-__v');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
```

#### Authentication Routes (`src/routes/auth.js`)
```javascript
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Google authentication
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const token = jwt.sign(
                { 
                    userId: req.user._id,
                    email: req.user.email,
                    provider: 'google'
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            // Redirect to frontend with token
            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendURL}/auth/callback?token=${token}&provider=google`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);

// Facebook authentication
router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] })
);

router.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const token = jwt.sign(
                { 
                    userId: req.user._id,
                    email: req.user.email,
                    provider: 'facebook'
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendURL}/auth/callback?token=${token}&provider=facebook`);
        } catch (error) {
            console.error('Facebook callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);

// Microsoft authentication
router.get('/microsoft',
    passport.authenticate('microsoft', { scope: ['User.Read'] })
);

router.get('/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: '/login' }),
    async (req, res) => {
        try {
            const token = jwt.sign(
                { 
                    userId: req.user._id,
                    email: req.user.email,
                    provider: 'microsoft'
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
            res.redirect(`${frontendURL}/auth/callback?token=${token}&provider=microsoft`);
        } catch (error) {
            console.error('Microsoft callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
        }
    }
);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-googleId -facebookId -microsoftId -__v');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information'
        });
    }
});

// Logout
router.post('/logout', authenticateToken, (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }
        
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
});

// Update user preferences
router.patch('/preferences', authenticateToken, async (req, res) => {
    try {
        const { language, theme } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                'preferences.language': language,
                'preferences.theme': theme
            },
            { new: true }
        ).select('preferences');

        res.json({
            success: true,
            data: user.preferences
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update preferences'
        });
    }
});

module.exports = router;
```

### 3. **Translation System Implementation**

#### Translation Service (`src/services/TranslationService.js`)
```javascript
const { Translate } = require('@google-cloud/translate').v2;
const franc = require('franc');

class TranslationService {
    constructor() {
        this.translate = new Translate({
            key: process.env.GOOGLE_TRANSLATE_API_KEY,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });

        // Supported Indian languages mapping
        this.supportedLanguages = {
            'hi': { name: 'Hindi', native: 'हिन्दी' },
            'bn': { name: 'Bengali', native: 'বাংলা' },
            'ta': { name: 'Tamil', native: 'தமிழ்' },
            'te': { name: 'Telugu', native: 'తెలుగు' },
            'mr': { name: 'Marathi', native: 'मराठी' },
            'gu': { name: 'Gujarati', native: 'ગુજરાતી' },
            'kn': { name: 'Kannada', native: 'ಕನ್ನಡ' },
            'ml': { name: 'Malayalam', native: 'മലയാളം' },
            'pa': { name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
            'or': { name: 'Odia', native: 'ଓଡ଼ିଆ' },
            'as': { name: 'Assamese', native: 'অসমীয়া' },
            'ur': { name: 'Urdu', native: 'اردو' },
            'sa': { name: 'Sanskrit', native: 'संस्कृत' },
            'sd': { name: 'Sindhi', native: 'سنڌي' },
            'ne': { name: 'Nepali', native: 'नेपाली' },
            'gom': { name: 'Konkani', native: 'कोंकणी' },
            'en': { name: 'English', native: 'English' }
        };

        // Language detection cache
        this.detectionCache = new Map();
        
        // Translation cache
        this.translationCache = new Map();
    }

    /**
     * Detect language of the given text
     * @param {string} text - Text to detect language for
     * @returns {Object} - Detected language info
     */
    async detectLanguage(text) {
        if (!text || text.trim().length < 3) {
            return { code: 'en', confidence: 0, isSupported: true };
        }

        // Check cache first
        const cacheKey = this.generateCacheKey(text);
        if (this.detectionCache.has(cacheKey)) {
            return this.detectionCache.get(cacheKey);
        }

        try {
            // Use franc for statistical language detection
            const francResult = franc(text);
            let detectedCode = francResult;

            // If franc returns 'und' (undefined), try Google Translate detection
            if (francResult === 'und' || francResult === 'cmn') {
                const [detection] = await this.translate.detect(text);
                detectedCode = detection.language;
            }

            // Map common variations
            const languageMap = {
                'cmn': 'zh',
                'hin': 'hi',
                'ben': 'bn',
                'tam': 'ta',
                'tel': 'te',
                'mar': 'mr',
                'guj': 'gu',
                'kan': 'kn',
                'mal': 'ml',
                'pan': 'pa',
                'ori': 'or',
                'asm': 'as',
                'urd': 'ur',
                'san': 'sa',
                'snd': 'sd',
                'nep': 'ne'
            };

            detectedCode = languageMap[detectedCode] || detectedCode;

            const result = {
                code: detectedCode,
                confidence: 0.8, // Default confidence
                isSupported: this.isLanguageSupported(detectedCode),
                name: this.supportedLanguages[detectedCode]?.name || 'Unknown',
                native: this.supportedLanguages[detectedCode]?.native || detectedCode
            };

            // Cache the result
            this.detectionCache.set(cacheKey, result);
            
            return result;
        } catch (error) {
            console.error('Language detection error:', error);
            return { 
                code: 'en', 
                confidence: 0, 
                isSupported: true,
                name: 'English',
                native: 'English',
                error: error.message 
            };
        }
    }

    /**
     * Translate text from source to target language
     * @param {string} text - Text to translate
     * @param {string} targetLanguage - Target language code
     * @param {string} sourceLanguage - Source language code (optional)
     * @returns {Object} - Translation result
     */
    async translateText(text, targetLanguage, sourceLanguage = null) {
        if (!text || text.trim().length === 0) {
            return {
                translatedText: text,
                originalText: text,
                sourceLanguage: sourceLanguage || 'en',
                targetLanguage,
                confidence: 1
            };
        }

        // If source and target are the same, return original text
        if (sourceLanguage === targetLanguage) {
            return {
                translatedText: text,
                originalText: text,
                sourceLanguage,
                targetLanguage,
                confidence: 1
            };
        }

        const cacheKey = `${sourceLanguage || 'auto'}_${targetLanguage}_${this.generateCacheKey(text)}`;
        
        // Check cache first
        if (this.translationCache.has(cacheKey)) {
            return this.translationCache.get(cacheKey);
        }

        try {
            const options = {
                to: targetLanguage
            };

            if (sourceLanguage) {
                options.from = sourceLanguage;
            }

            const [translation, metadata] = await this.translate.translate(text, options);

            const result = {
                translatedText: Array.isArray(translation) ? translation[0] : translation,
                originalText: text,
                sourceLanguage: metadata?.data?.translations?.[0]?.detectedSourceLanguage || sourceLanguage,
                targetLanguage,
                confidence: 0.9 // Google Translate confidence
            };

            // Cache the result
            this.translationCache.set(cacheKey, result);

            return result;
        } catch (error) {
            console.error('Translation error:', error);
            throw new Error(`Translation failed: ${error.message}`);
        }
    }

    /**
     * Process text for AI - translate to English if needed
     * @param {string} text - Input text
     * @returns {Object} - Processing result with original and English text
     */
    async processForAI(text) {
        try {
            // Detect language
            const detection = await this.detectLanguage(text);
            
            let englishText = text;
            let translationNeeded = false;

            // If not English, translate to English
            if (detection.code !== 'en' && detection.isSupported) {
                const translation = await this.translateText(text, 'en', detection.code);
                englishText = translation.translatedText;
                translationNeeded = true;
            }

            return {
                originalText: text,
                englishText,
                detectedLanguage: detection,
                translationNeeded,
                processingLanguage: 'en'
            };
        } catch (error) {
            console.error('AI processing preparation error:', error);
            // Fallback to original text if translation fails
            return {
                originalText: text,
                englishText: text,
                detectedLanguage: { code: 'en', confidence: 0 },
                translationNeeded: false,
                processingLanguage: 'en',
                error: error.message
            };
        }
    }

    /**
     * Process AI response - translate back to original language if needed
     * @param {string} response - AI response in English
     * @param {string} targetLanguage - Target language for response
     * @returns {Object} - Processing result
     */
    async processAIResponse(response, targetLanguage) {
        try {
            if (!targetLanguage || targetLanguage === 'en') {
                return {
                    response,
                    originalResponse: response,
                    targetLanguage: 'en',
                    translationApplied: false
                };
            }

            const translation = await this.translateText(response, targetLanguage, 'en');

            return {
                response: translation.translatedText,
                originalResponse: response,
                targetLanguage,
                translationApplied: true,
                confidence: translation.confidence
            };
        } catch (error) {
            console.error('AI response processing error:', error);
            // Fallback to English response if translation fails
            return {
                response,
                originalResponse: response,
                targetLanguage: 'en',
                translationApplied: false,
                error: error.message
            };
        }
    }

    /**
     * Get list of supported languages
     * @returns {Object} - Supported languages list
     */
    getSupportedLanguages() {
        return this.supportedLanguages;
    }

    /**
     * Check if language is supported
     * @param {string} languageCode - Language code to check
     * @returns {boolean} - Whether language is supported
     */
    isLanguageSupported(languageCode) {
        return Object.keys(this.supportedLanguages).includes(languageCode);
    }

    /**
     * Generate cache key for text
     * @param {string} text - Text to generate key for
     * @returns {string} - Cache key
     */
    generateCacheKey(text) {
        // Create a simple hash of the text for caching
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Clear translation cache
     */
    clearCache() {
        this.detectionCache.clear();
        this.translationCache.clear();
    }

    /**
     * Get cache statistics
     * @returns {Object} - Cache statistics
     */
    getCacheStats() {
        return {
            detectionCacheSize: this.detectionCache.size,
            translationCacheSize: this.translationCache.size,
            supportedLanguages: Object.keys(this.supportedLanguages).length
        };
    }
}

module.exports = new TranslationService();
```

### 4. **AI Agent Implementation**

#### Summary Agent (`src/agents/SummaryAgent.js`)
```javascript
const OpenAI = require('openai');
const translationService = require('../services/TranslationService');

class SummaryAgent {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        this.defaultPrompts = {
            academic: `You are an expert academic summarizer. Please provide a comprehensive summary of the following text that:
1. Identifies key concepts and main ideas
2. Preserves important details and examples
3. Maintains logical structure and flow
4. Highlights critical learning objectives
5. Uses clear, educational language

Text to summarize:`,

            business: `You are a business analyst. Please provide a professional summary that:
1. Identifies key business insights and recommendations
2. Highlights important metrics and data points
3. Focuses on actionable outcomes
4. Maintains professional tone
5. Emphasizes strategic implications

Text to summarize:`,

            technical: `You are a technical expert. Please provide a detailed summary that:
1. Explains technical concepts clearly
2. Maintains accuracy of technical details
3. Includes relevant examples and use cases
4. Focuses on implementation aspects
5. Uses appropriate technical terminology

Text to summarize:`,

            general: `Please provide a clear, well-structured summary that:
1. Captures the main points and key information
2. Maintains the original context and meaning
3. Uses clear and concise language
4. Organizes information logically
5. Preserves important details

Text to summarize:`
        };
    }

    /**
     * Generate summary for the given text
     * @param {string} text - Text to summarize
     * @param {Object} options - Summarization options
     * @returns {Object} - Summary result
     */
    async generateSummary(text, options = {}) {
        try {
            const {
                type = 'general',
                length = 'medium',
                language = 'en',
                customPrompt = null,
                preserveFormatting = true,
                includeKeywords = true
            } = options;

            // Validate input
            if (!text || text.trim().length < 50) {
                throw new Error('Text too short for meaningful summarization (minimum 50 characters)');
            }

            // Process input for AI (translate to English if needed)
            const processedInput = await translationService.processForAI(text);
            
            // Generate summary using OpenAI
            const summaryResult = await this.generateAISummary(
                processedInput.englishText,
                type,
                length,
                customPrompt
            );

            // Process AI response (translate back if needed)
            const finalResponse = await translationService.processAIResponse(
                summaryResult.summary,
                processedInput.detectedLanguage.code
            );

            // Generate additional features if requested
            let keywords = [];
            if (includeKeywords) {
                keywords = await this.extractKeywords(processedInput.englishText);
            }

            return {
                success: true,
                data: {
                    summary: finalResponse.response,
                    originalText: text,
                    metadata: {
                        type,
                        length,
                        language: processedInput.detectedLanguage,
                        wordCount: {
                            original: text.split(/\s+/).length,
                            summary: finalResponse.response.split(/\s+/).length
                        },
                        compressionRatio: this.calculateCompressionRatio(text, finalResponse.response),
                        keywords,
                        processingTime: Date.now() - summaryResult.startTime,
                        translationApplied: processedInput.translationNeeded || finalResponse.translationApplied
                    },
                    options: {
                        type,
                        length,
                        customPrompt: !!customPrompt,
                        preserveFormatting,
                        includeKeywords
                    }
                }
            };
        } catch (error) {
            console.error('Summary generation error:', error);
            return {
                success: false,
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    /**
     * Generate AI summary using OpenAI GPT
     * @param {string} text - Text to summarize
     * @param {string} type - Summary type
     * @param {string} length - Summary length
     * @param {string} customPrompt - Custom prompt
     * @returns {Object} - AI summary result
     */
    async generateAISummary(text, type, length, customPrompt) {
        const startTime = Date.now();

        try {
            // Prepare prompt
            const basePrompt = customPrompt || this.defaultPrompts[type] || this.defaultPrompts.general;
            
            // Length specifications
            const lengthSpecs = {
                short: 'in 100-200 words',
                medium: 'in 200-400 words', 
                long: 'in 400-600 words',
                detailed: 'in 600-1000 words'
            };

            const lengthSpec = lengthSpecs[length] || lengthSpecs.medium;
            const fullPrompt = `${basePrompt} ${lengthSpec}.\n\n${text}`;

            // Call OpenAI API
            const completion = await this.openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert content summarizer. Provide clear, accurate, and well-structured summaries that preserve the essential information and context of the original text."
                    },
                    {
                        role: "user",
                        content: fullPrompt
                    }
                ],
                max_tokens: this.getMaxTokensForLength(length),
                temperature: 0.3, // Lower temperature for more focused summaries
                top_p: 0.9,
                frequency_penalty: 0.1,
                presence_penalty: 0.1
            });

            const summary = completion.choices[0]?.message?.content?.trim();

            if (!summary) {
                throw new Error('Failed to generate summary - empty response from AI');
            }

            return {
                summary,
                startTime,
                usage: completion.usage,
                model: "gpt-4"
            };
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`AI summary generation failed: ${error.message}`);
        }
    }

    /**
     * Extract keywords from text
     * @param {string} text - Text to extract keywords from
     * @returns {Array} - Array of keywords
     */
    async extractKeywords(text) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Extract 5-10 key terms/phrases from the following text. Return only the keywords, one per line, without numbering or additional formatting."
                    },
                    {
                        role: "user",
                        content: text.substring(0, 2000) // Limit text length for keyword extraction
                    }
                ],
                max_tokens: 200,
                temperature: 0.3
            });

            const keywordsText = completion.choices[0]?.message?.content?.trim();
            return keywordsText ? keywordsText.split('\n').filter(k => k.trim()) : [];
        } catch (error) {
            console.error('Keyword extraction error:', error);
            return [];
        }
    }

    /**
     * Calculate compression ratio
     * @param {string} original - Original text
     * @param {string} summary - Summary text
     * @returns {number} - Compression ratio
     */
    calculateCompressionRatio(original, summary) {
        const originalWords = original.split(/\s+/).length;
        const summaryWords = summary.split(/\s+/).length;
        return Math.round((1 - summaryWords / originalWords) * 100);
    }

    /**
     * Get max tokens for length setting
     * @param {string} length - Length setting
     * @returns {number} - Max tokens
     */
    getMaxTokensForLength(length) {
        const tokenLimits = {
            short: 300,
            medium: 600,
            long: 900,
            detailed: 1500
        };
        return tokenLimits[length] || 600;
    }

    /**
     * Get available summary types
     * @returns {Array} - Available types
     */
    getAvailableTypes() {
        return Object.keys(this.defaultPrompts);
    }

    /**
     * Get type description
     * @param {string} type - Summary type
     * @returns {string} - Type description
     */
    getTypeDescription(type) {
        const descriptions = {
            academic: 'Structured academic summary with key concepts and learning objectives',
            business: 'Professional business analysis with insights and recommendations',
            technical: 'Detailed technical summary with accurate terminology and examples',
            general: 'Clear, general-purpose summary suitable for any content'
        };
        return descriptions[type] || descriptions.general;
    }
}

module.exports = new SummaryAgent();
```

---

**Document Status**: Complete  
**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Next Document**: Frontend Implementation and Database Design