# AI Study Circle - API Documentation and Testing Guide

**Document 5: Complete API Reference, Testing Strategies, and Quality Assurance**

---

## Table of Contents

1. [API Reference](#api-reference)
2. [Authentication Endpoints](#authentication-endpoints)
3. [Content Management APIs](#content-management-apis)
4. [AI Processing APIs](#ai-processing-apis)
5. [Translation APIs](#translation-apis)
6. [Testing Strategy](#testing-strategy)
7. [Quality Assurance](#quality-assurance)

---

## API Reference

### 1. **Base Configuration**

#### API Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

#### Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

#### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message",
  "timestamp": "2025-10-25T12:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details (development only)
  },
  "timestamp": "2025-10-25T12:00:00.000Z"
}
```

#### Rate Limiting
- **General Endpoints**: 100 requests per 15 minutes per IP
- **AI Processing**: 10 requests per 5 minutes per user
- **Authentication**: 5 requests per 15 minutes per IP

#### Status Codes
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Authentication Endpoints

### 1. **Social Authentication**

#### GET /api/auth/google
Initiate Google OAuth authentication

**Parameters:** None

**Response:** Redirects to Google OAuth consent screen

**Example:**
```bash
curl -X GET "http://localhost:5000/api/auth/google"
```

#### GET /api/auth/google/callback
Google OAuth callback endpoint

**Parameters:** 
- `code` (query): Authorization code from Google
- `state` (query): CSRF protection state

**Response:** Redirects to frontend with JWT token

#### GET /api/auth/facebook
Initiate Facebook OAuth authentication

**Parameters:** None

**Response:** Redirects to Facebook OAuth consent screen

#### GET /api/auth/facebook/callback
Facebook OAuth callback endpoint

**Response:** Redirects to frontend with JWT token

#### GET /api/auth/microsoft
Initiate Microsoft OAuth authentication

**Parameters:** None

**Response:** Redirects to Microsoft OAuth consent screen

#### GET /api/auth/microsoft/callback
Microsoft OAuth callback endpoint

**Response:** Redirects to frontend with JWT token

### 2. **User Management**

#### GET /api/auth/me
Get current authenticated user information

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "picture": "https://example.com/profile.jpg",
      "provider": "google"
    },
    "preferences": {
      "language": "hi",
      "theme": "light"
    },
    "stats": {
      "summariesGenerated": 15,
      "examsCreated": 8,
      "documentsAnalyzed": 23
    },
    "createdAt": "2025-01-15T10:30:00.000Z",
    "lastLogin": "2025-10-25T12:00:00.000Z"
  }
}
```

#### PATCH /api/auth/preferences
Update user preferences

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "language": "hi",
  "theme": "dark"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "language": "hi",
    "theme": "dark"
  },
  "message": "Preferences updated successfully"
}
```

#### POST /api/auth/logout
Logout current user

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Content Management APIs

### 1. **Content Operations**

#### POST /api/content
Create new content entry

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `text` (string): Content text (if not uploading file)
- `file` (file): Content file (PDF, DOCX, TXT)
- `title` (string): Content title
- `category` (string): Content category (academic, business, technical, personal)
- `tags` (string): Comma-separated tags

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Sample Document",
    "category": "academic",
    "metadata": {
      "type": "text",
      "language": {
        "detected": "hi",
        "confidence": 0.95
      },
      "wordCount": {
        "original": 1250,
        "processed": 1180
      },
      "readingTime": 6
    },
    "processing": {
      "status": "completed",
      "translationApplied": true,
      "aiProcessed": false
    },
    "createdAt": "2025-10-25T12:00:00.000Z"
  }
}
```

#### GET /api/content
Get user's content list

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `category` (string): Filter by category
- `tags` (string): Filter by tags (comma-separated)
- `search` (string): Search in content
- `sortBy` (string): Sort field (createdAt, title, category)
- `sortOrder` (string): Sort order (asc, desc)

**Example:**
```bash
curl -H "Authorization: Bearer <token>" \
     "http://localhost:5000/api/content?page=1&limit=10&category=academic&sortBy=createdAt&sortOrder=desc"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Sample Document",
        "category": "academic",
        "tags": ["education", "ai"],
        "metadata": {
          "type": "text",
          "wordCount": { "original": 1250 },
          "readingTime": 6
        },
        "usage": {
          "summariesGenerated": 2,
          "examsGenerated": 1,
          "lastAccessed": "2025-10-25T11:30:00.000Z"
        },
        "createdAt": "2025-10-25T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 45,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /api/content/:id
Get specific content by ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Sample Document",
    "originalText": "Full content text here...",
    "processedText": "Processed English text here...",
    "category": "academic",
    "tags": ["education", "ai"],
    "metadata": {
      "type": "text",
      "language": {
        "detected": "hi",
        "confidence": 0.95,
        "original": "hi"
      },
      "wordCount": {
        "original": 1250,
        "processed": 1180
      },
      "readingTime": 6,
      "complexity": "intermediate"
    },
    "analysis": {
      "topics": ["artificial intelligence", "education", "technology"],
      "keywords": ["AI", "learning", "student", "analysis"],
      "sentiment": {
        "score": 0.8,
        "label": "positive"
      },
      "readabilityScore": 75
    },
    "usage": {
      "summariesGenerated": 2,
      "examsGenerated": 1,
      "accessCount": 15,
      "lastAccessed": "2025-10-25T11:30:00.000Z"
    },
    "createdAt": "2025-10-25T10:00:00.000Z",
    "updatedAt": "2025-10-25T11:30:00.000Z"
  }
}
```

#### PUT /api/content/:id
Update content

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Document Title",
  "category": "business",
  "tags": ["business", "analysis", "report"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Updated Document Title",
    "category": "business",
    "tags": ["business", "analysis", "report"],
    "updatedAt": "2025-10-25T12:15:00.000Z"
  }
}
```

#### DELETE /api/content/:id
Delete content

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Content deleted successfully"
}
```

---

## AI Processing APIs

### 1. **Summary Generation**

#### POST /api/summary/generate
Generate content summary

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `text` (string): Text to summarize (if not using file)
- `file` (file): File to summarize (PDF, DOCX, TXT)
- `contentId` (string): Existing content ID to summarize
- `type` (string): Summary type (academic, business, technical, general)
- `length` (string): Summary length (short, medium, long, detailed)
- `language` (string): Target language code
- `customPrompt` (string): Custom summarization prompt (optional)
- `includeKeywords` (boolean): Include keyword extraction (default: true)

**Example:**
```bash
curl -X POST -H "Authorization: Bearer <token>" \
     -F "text=Your long content text here..." \
     -F "type=academic" \
     -F "length=medium" \
     -F "language=hi" \
     http://localhost:5000/api/summary/generate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "यह एक बुद्धिमत्ता आधारित सारांश है जो मूल पाठ के मुख्य बिंदुओं को प्रस्तुत करता है...",
    "originalText": "Original content text...",
    "metadata": {
      "type": "academic",
      "length": "medium",
      "language": {
        "detected": "en",
        "processed": "en",
        "final": "hi"
      },
      "wordCount": {
        "original": 1250,
        "summary": 275
      },
      "compressionRatio": 78,
      "keywords": [
        "artificial intelligence",
        "machine learning",
        "education",
        "analysis"
      ],
      "processingTime": 3450,
      "translationApplied": true,
      "confidence": 0.92
    },
    "options": {
      "type": "academic",
      "length": "medium",
      "customPrompt": false,
      "includeKeywords": true
    }
  }
}
```

#### GET /api/summary
Get user's summaries

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `type` (string): Filter by summary type
- `language` (string): Filter by language
- `isBookmarked` (boolean): Filter bookmarked summaries
- `sortBy` (string): Sort field (createdAt, rating)
- `sortOrder` (string): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "summaryText": "Summary content...",
        "configuration": {
          "type": "academic",
          "length": "medium",
          "language": "hi"
        },
        "metadata": {
          "wordCount": {
            "original": 1250,
            "summary": 275
          },
          "compressionRatio": 78,
          "processingTime": 3450
        },
        "interaction": {
          "rating": 4,
          "isBookmarked": true,
          "downloadCount": 2,
          "shareCount": 1
        },
        "createdAt": "2025-10-25T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 28
    }
  }
}
```

#### GET /api/summary/:id
Get specific summary

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "originalText": "Original content...",
    "summaryText": "Generated summary...",
    "configuration": {
      "type": "academic",
      "length": "medium",
      "language": "hi",
      "customPrompt": "Custom prompt used..."
    },
    "metadata": {
      "wordCount": {
        "original": 1250,
        "summary": 275
      },
      "compressionRatio": 78,
      "processingTime": 3450,
      "model": "gpt-4",
      "confidence": 0.92,
      "language": {
        "detected": "en",
        "processed": "en",
        "final": "hi"
      }
    },
    "analysis": {
      "keywords": ["AI", "education", "technology"],
      "mainTopics": ["artificial intelligence", "learning methods"],
      "keyPoints": [
        "AI is transforming education",
        "Personalized learning approaches",
        "Technology integration challenges"
      ],
      "qualityScore": 88,
      "readabilityScore": 76
    },
    "interaction": {
      "rating": 4,
      "feedback": "Very helpful summary",
      "isBookmarked": true,
      "shareCount": 1,
      "downloadCount": 2
    },
    "exports": [
      {
        "format": "pdf",
        "exportedAt": "2025-10-25T12:30:00.000Z",
        "fileSize": 45678
      }
    ],
    "createdAt": "2025-10-25T12:00:00.000Z"
  }
}
```

#### POST /api/summary/:id/rate
Rate a summary

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 4,
  "feedback": "Very helpful and accurate summary"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "data": {
    "rating": 4,
    "feedback": "Very helpful and accurate summary"
  }
}
```

#### POST /api/summary/:id/bookmark
Toggle bookmark status

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isBookmarked": true
  },
  "message": "Summary bookmarked successfully"
}
```

#### GET /api/summary/:id/export
Export summary in different formats

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `format` (string): Export format (txt, pdf, docx, html)

**Response:** Binary file download

### 2. **Exam Generation**

#### POST /api/exam/generate
Generate exam questions

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `text` (string): Source text for questions
- `file` (file): Source file for questions
- `contentId` (string): Existing content ID
- `questionTypes` (string): Comma-separated question types (mcq, short-answer, true-false, fill-blank)
- `difficulty` (string): Difficulty level (beginner, intermediate, advanced, expert)
- `questionCount` (number): Number of questions (1-50)
- `language` (string): Target language code
- `includeAnswers` (boolean): Include answer key (default: true)
- `customInstructions` (string): Custom exam instructions

**Example:**
```bash
curl -X POST -H "Authorization: Bearer <token>" \
     -F "text=Educational content..." \
     -F "questionTypes=mcq,short-answer" \
     -F "difficulty=intermediate" \
     -F "questionCount=10" \
     -F "language=hi" \
     http://localhost:5000/api/exam/generate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "title": "Generated Exam - Academic Content",
      "instructions": "परीक्षा निर्देश...",
      "questions": [
        {
          "id": 1,
          "type": "mcq",
          "question": "कृत्रिम बुद्धिमत्ता का मुख्य उद्देश्य क्या है?",
          "options": [
            "मानव बुद्धि का अनुकरण",
            "कंप्यूटर की गति बढ़ाना",
            "डेटा संग्रहण",
            "इंटरनेट कनेक्टिविटी"
          ],
          "correctAnswer": 0,
          "explanation": "कृत्रिम बुद्धिमत्ता का मुख्य लक्ष्य मानव बुद्धि की नकल करना है...",
          "difficulty": "intermediate",
          "points": 2
        },
        {
          "id": 2,
          "type": "short-answer",
          "question": "मशीन लर्निंग और डीप लर्निंग के बीच अंतर बताएं।",
          "sampleAnswer": "मशीन लर्निंग एक व्यापक क्षेत्र है जबकि डीप लर्निंग इसका एक उपभाग है...",
          "difficulty": "advanced",
          "points": 5
        }
      ],
      "answerKey": {
        "1": {
          "type": "mcq",
          "answer": 0,
          "explanation": "Detailed explanation..."
        },
        "2": {
          "type": "short-answer",
          "sampleAnswer": "Sample answer...",
          "keyPoints": ["Point 1", "Point 2", "Point 3"]
        }
      }
    },
    "metadata": {
      "sourceWordCount": 1250,
      "questionCount": 10,
      "difficulty": "intermediate",
      "language": {
        "detected": "en",
        "processed": "en",
        "final": "hi"
      },
      "questionTypes": {
        "mcq": 6,
        "short-answer": 4
      },
      "estimatedTime": 30,
      "totalPoints": 28,
      "processingTime": 5200,
      "translationApplied": true
    },
    "configuration": {
      "questionTypes": ["mcq", "short-answer"],
      "difficulty": "intermediate",
      "questionCount": 10,
      "language": "hi",
      "includeAnswers": true
    }
  }
}
```

#### GET /api/exam
Get user's exams

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (number): Page number
- `limit` (number): Items per page
- `difficulty` (string): Filter by difficulty
- `language` (string): Filter by language
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort order

**Response:**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "title": "AI Fundamentals Exam",
        "configuration": {
          "questionCount": 10,
          "difficulty": "intermediate",
          "language": "hi"
        },
        "metadata": {
          "questionTypes": {
            "mcq": 6,
            "short-answer": 4
          },
          "estimatedTime": 30,
          "totalPoints": 28
        },
        "interaction": {
          "downloadCount": 3,
          "shareCount": 2,
          "isBookmarked": true
        },
        "createdAt": "2025-10-25T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15
    }
  }
}
```

---

## Translation APIs

### 1. **Language Operations**

#### GET /api/translation/languages
Get supported languages

**Response:**
```json
{
  "success": true,
  "data": {
    "languages": {
      "hi": {
        "name": "Hindi",
        "native": "हिन्दी",
        "speakers": "500M+"
      },
      "bn": {
        "name": "Bengali",
        "native": "বাংলা",
        "speakers": "230M+"
      },
      "ta": {
        "name": "Tamil",
        "native": "தமிழ்",
        "speakers": "75M+"
      },
      "en": {
        "name": "English",
        "native": "English",
        "speakers": "1.5B+"
      }
    },
    "totalSupported": 17
  }
}
```

#### POST /api/translation/detect
Detect language of text

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "यह हिंदी भाषा में लिखा गया पाठ है।"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detected": {
      "code": "hi",
      "name": "Hindi",
      "native": "हिन्दी",
      "confidence": 0.95,
      "isSupported": true
    }
  }
}
```

#### POST /api/translation/translate
Translate text

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "This is a sample text for translation.",
  "targetLanguage": "hi",
  "sourceLanguage": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translatedText": "यह अनुवाद के लिए एक नमूना पाठ है।",
    "originalText": "This is a sample text for translation.",
    "sourceLanguage": "en",
    "targetLanguage": "hi",
    "confidence": 0.92,
    "translationTime": 245
  }
}
```

---

## Testing Strategy

### 1. **Unit Testing**

#### Backend Unit Tests
```javascript
// Example: tests/unit/services/translationService.test.js
const TranslationService = require('../../../src/services/TranslationService');

describe('TranslationService', () => {
  describe('detectLanguage', () => {
    it('should detect Hindi language correctly', async () => {
      const text = 'यह हिंदी भाषा का पाठ है।';
      const result = await TranslationService.detectLanguage(text);
      
      expect(result.code).toBe('hi');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.isSupported).toBe(true);
    });

    it('should handle empty text gracefully', async () => {
      const result = await TranslationService.detectLanguage('');
      
      expect(result.code).toBe('en');
      expect(result.confidence).toBe(0);
    });
  });

  describe('translateText', () => {
    it('should translate English to Hindi', async () => {
      const text = 'Hello, how are you?';
      const result = await TranslationService.translateText(text, 'hi', 'en');
      
      expect(result.translatedText).toBeDefined();
      expect(result.sourceLanguage).toBe('en');
      expect(result.targetLanguage).toBe('hi');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should return original text for same source and target', async () => {
      const text = 'Hello World';
      const result = await TranslationService.translateText(text, 'en', 'en');
      
      expect(result.translatedText).toBe(text);
      expect(result.confidence).toBe(1);
    });
  });
});
```

#### Frontend Unit Tests
```javascript
// Example: src/components/__tests__/AuthForm.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthForm from '../auth/AuthForm';
import { AuthProvider } from '../../hooks/useAuth';
import { TranslationProvider } from '../../hooks/useTranslation';

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <TranslationProvider>
          {component}
        </TranslationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthForm Component', () => {
  it('renders login form correctly', () => {
    renderWithProviders(<AuthForm />);
    
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
    expect(screen.getByText(/continue with microsoft/i)).toBeInTheDocument();
  });

  it('displays language selector', () => {
    renderWithProviders(<AuthForm />);
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles Google login button click', () => {
    // Mock window.location
    delete window.location;
    window.location = { href: '' };
    
    renderWithProviders(<AuthForm />);
    
    const googleBtn = screen.getByText(/continue with google/i);
    fireEvent.click(googleBtn);
    
    expect(window.location.href).toContain('/api/auth/google');
  });
});
```

### 2. **Integration Testing**

#### API Integration Tests
```javascript
// Example: tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Authentication API', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('GET /api/auth/me', () => {
    it('should return user data for authenticated user', async () => {
      const user = await User.create({
        googleId: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        profile: {
          provider: 'google'
        }
      });

      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.name).toBe('Test User');
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/auth/me')
        .expect(401);
    });
  });
});
```

### 3. **End-to-End Testing**

#### Cypress E2E Tests
```javascript
// Example: cypress/e2e/summary-generation.cy.js
describe('Summary Generation', () => {
  beforeEach(() => {
    // Mock authentication
    cy.login('test@example.com');
    cy.visit('/summary');
  });

  it('should generate summary from text input', () => {
    const testText = 'This is a long text that needs to be summarized. It contains multiple sentences and paragraphs that should be condensed into a shorter format while maintaining the key information.';

    // Enter text
    cy.get('[data-testid="text-input"]').type(testText);
    
    // Select configuration
    cy.get('[data-testid="summary-type"]').select('academic');
    cy.get('[data-testid="summary-length"]').select('medium');
    cy.get('[data-testid="language-selector"]').select('hi');
    
    // Generate summary
    cy.get('[data-testid="generate-btn"]').click();
    
    // Verify loading state
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    
    // Verify result
    cy.get('[data-testid="summary-result"]', { timeout: 10000 })
      .should('be.visible')
      .and('contain.text', 'यह');
    
    // Verify metadata
    cy.get('[data-testid="word-count-original"]').should('contain', '28');
    cy.get('[data-testid="compression-ratio"]').should('exist');
  });

  it('should handle file upload and generation', () => {
    // Upload file
    cy.get('[data-testid="file-tab"]').click();
    cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/sample.txt');
    
    // Configure and generate
    cy.get('[data-testid="summary-type"]').select('business');
    cy.get('[data-testid="generate-btn"]').click();
    
    // Verify result
    cy.get('[data-testid="summary-result"]', { timeout: 15000 })
      .should('be.visible');
  });

  it('should allow copying and downloading summary', () => {
    // Generate a summary first
    cy.generateSummary('Sample text for testing copy functionality');
    
    // Test copy functionality
    cy.get('[data-testid="copy-btn"]').click();
    cy.get('[data-testid="copy-success"]')
      .should('be.visible')
      .and('contain', 'Copied');
    
    // Test download functionality
    cy.get('[data-testid="download-btn"]').click();
    
    // Verify download (this is tricky with Cypress, might need mocking)
    cy.readFile('cypress/downloads/summary-*.txt').should('exist');
  });
});
```

### 4. **Performance Testing**

#### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 5
    - duration: 120
      arrivalRate: 10
    - duration: 60
      arrivalRate: 20
  environments:
    development:
      target: 'http://localhost:5000'
    production:
      target: 'https://your-domain.com'

scenarios:
  - name: 'Summary Generation Load Test'
    weight: 70
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: 'test@example.com'
            password: 'testpass'
          capture:
            - json: '$.token'
              as: 'authToken'
      - post:
          url: '/api/summary/generate'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          formData:
            text: 'Sample text for load testing summary generation...'
            type: 'general'
            length: 'medium'
            language: 'en'
  
  - name: 'Authentication Load Test'
    weight: 20
    flow:
      - get:
          url: '/api/auth/me'
          headers:
            Authorization: 'Bearer {{ authToken }}'
  
  - name: 'Content Retrieval Load Test'
    weight: 10
    flow:
      - get:
          url: '/api/content'
          headers:
            Authorization: 'Bearer {{ authToken }}'
          qs:
            page: 1
            limit: 20
```

---

## Quality Assurance

### 1. **Code Quality Standards**

#### ESLint Configuration (`.eslintrc.js`)
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    
    // Best practices
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Security
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-unsafe-regex': 'error',
    
    // Node.js specific
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-missing-import': 'off'
  }
};
```

#### Prettier Configuration (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 2. **Git Hooks with Husky**

#### Pre-commit Hook (`.husky/pre-commit`)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Lint and format code
npm run lint
npm run format

# Run tests
npm run test:unit

# Check for security vulnerabilities
npm audit --audit-level moderate

echo "✅ Pre-commit checks passed!"
```

#### Commit Message Hook (`.husky/commit-msg`)
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Conventional Commit format validation
npx commitlint --edit $1
```

#### Commitlint Configuration (`commitlint.config.js`)
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Code style changes
        'refactor', // Code refactoring
        'test',     // Adding tests
        'chore',    // Maintenance tasks
        'perf',     // Performance improvements
        'ci',       // CI/CD changes
        'build'     // Build system changes
      ]
    ],
    'subject-max-length': [2, 'always', 100],
    'subject-case': [2, 'always', 'lower-case']
  }
};
```

### 3. **Security Testing**

#### Security Audit Script (`scripts/security-audit.js`)
```javascript
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔒 Running Security Audit...\n');

// 1. NPM Audit
console.log('📦 Checking NPM dependencies...');
try {
  execSync('npm audit --audit-level moderate', { stdio: 'inherit' });
  console.log('✅ NPM audit passed\n');
} catch (error) {
  console.log('❌ NPM audit found vulnerabilities\n');
  process.exit(1);
}

// 2. Snyk Security Scan (if available)
console.log('🛡️  Running Snyk security scan...');
try {
  execSync('npx snyk test', { stdio: 'inherit' });
  console.log('✅ Snyk scan passed\n');
} catch (error) {
  console.log('⚠️  Snyk scan found issues or is not configured\n');
}

// 3. Check for sensitive files
console.log('🔍 Checking for sensitive files...');
const sensitivePatterns = [
  '.env',
  '*.pem',
  '*.key',
  'id_rsa*',
  '.aws/credentials',
  '.docker/config.json'
];

const sensitiveFiles = [];
sensitivePatterns.forEach(pattern => {
  try {
    const files = execSync(`find . -name "${pattern}" -not -path "./node_modules/*"`, { encoding: 'utf8' });
    if (files.trim()) {
      sensitiveFiles.push(...files.trim().split('\n'));
    }
  } catch (error) {
    // File not found, which is good
  }
});

if (sensitiveFiles.length > 0) {
  console.log('❌ Sensitive files found:');
  sensitiveFiles.forEach(file => console.log(`   ${file}`));
  console.log('   Please add these to .gitignore\n');
} else {
  console.log('✅ No sensitive files found in repository\n');
}

// 4. Check Docker security (if Dockerfile exists)
if (fs.existsSync('Dockerfile') || fs.existsSync('backend/Dockerfile')) {
  console.log('🐳 Checking Docker security...');
  try {
    // Check if running as root
    const dockerfiles = ['Dockerfile', 'backend/Dockerfile', 'frontend/Dockerfile'];
    dockerfiles.forEach(dockerfile => {
      if (fs.existsSync(dockerfile)) {
        const content = fs.readFileSync(dockerfile, 'utf8');
        if (!content.includes('USER ') || content.includes('USER root')) {
          console.log(`⚠️  ${dockerfile} may be running as root user`);
        }
      }
    });
    console.log('✅ Docker security check completed\n');
  } catch (error) {
    console.log('❌ Docker security check failed\n');
  }
}

console.log('🔒 Security audit completed!');
```

### 4. **Performance Monitoring**

#### Performance Test Script (`scripts/performance-test.js`)
```javascript
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceTest() {
  console.log('🚀 Starting Performance Test...\n');

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  // Test different pages
  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/login',
    'http://localhost:3000/summary',
    'http://localhost:3000/exam'
  ];

  const results = [];

  for (const url of urls) {
    console.log(`📊 Testing ${url}...`);
    
    try {
      const runnerResult = await lighthouse(url, options);
      const scores = runnerResult.lhr.categories;
      
      results.push({
        url,
        performance: Math.round(scores.performance.score * 100),
        accessibility: Math.round(scores.accessibility.score * 100),
        bestPractices: Math.round(scores['best-practices'].score * 100),
        seo: Math.round(scores.seo.score * 100)
      });
      
      console.log(`   Performance: ${Math.round(scores.performance.score * 100)}`);
      console.log(`   Accessibility: ${Math.round(scores.accessibility.score * 100)}`);
      console.log(`   Best Practices: ${Math.round(scores['best-practices'].score * 100)}`);
      console.log(`   SEO: ${Math.round(scores.seo.score * 100)}\n`);
    } catch (error) {
      console.log(`   ❌ Failed to test ${url}: ${error.message}\n`);
    }
  }

  await chrome.kill();

  // Generate report
  console.log('📈 Performance Summary:');
  console.log('========================');
  results.forEach(result => {
    console.log(`${result.url}:`);
    console.log(`   Performance: ${result.performance}/100`);
    console.log(`   Accessibility: ${result.accessibility}/100`);
    console.log(`   Best Practices: ${result.bestPractices}/100`);
    console.log(`   SEO: ${result.seo}/100\n`);
  });

  // Check if scores meet thresholds
  const thresholds = {
    performance: 90,
    accessibility: 95,
    bestPractices: 90,
    seo: 90
  };

  let allPassed = true;
  results.forEach(result => {
    Object.keys(thresholds).forEach(metric => {
      if (result[metric] < thresholds[metric]) {
        console.log(`❌ ${result.url} ${metric} score (${result[metric]}) below threshold (${thresholds[metric]})`);
        allPassed = false;
      }
    });
  });

  if (allPassed) {
    console.log('✅ All performance tests passed!');
  } else {
    console.log('❌ Some performance tests failed');
    process.exit(1);
  }
}

runPerformanceTest().catch(console.error);
```

---

**Document Status**: Complete  
**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Final Document**: Complete AI Study Circle Documentation Suite**Document Status**: Complete  
**Last Updated**: October 25, 2025  
**Version**: 1.0  
**Final Document**: Complete AI Study Circle Documentation Suite