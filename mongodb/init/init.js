// MongoDB Initialization Script for AI Study Circle
// This script creates the initial database structure and sample data

// Switch to ai-study-circle database
db = db.getSiblingDB('ai-study-circle');

// Create collections with initial indexes
print('Creating collections and indexes...');

// Users collection
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ 'socialProfiles.google.id': 1 });
db.users.createIndex({ 'socialProfiles.facebook.id': 1 });
db.users.createIndex({ 'socialProfiles.microsoft.id': 1 });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ isActive: 1 });

// Content collection
db.content.createIndex({ userId: 1 });
db.content.createIndex({ title: 'text', content: 'text' });
db.content.createIndex({ createdAt: 1 });
db.content.createIndex({ type: 1 });

// Summaries collection
db.summaries.createIndex({ userId: 1 });
db.summaries.createIndex({ contentId: 1 });
db.summaries.createIndex({ createdAt: 1 });

// Exams collection
db.exams.createIndex({ userId: 1 });
db.exams.createIndex({ contentId: 1 });
db.exams.createIndex({ createdAt: 1 });
db.exams.createIndex({ difficulty: 1 });

// Templates collection
db.templates.createIndex({ userId: 1 });
db.templates.createIndex({ isPublic: 1 });
db.templates.createIndex({ category: 1 });
db.templates.createIndex({ createdAt: 1 });

// Analytics collection  
db.analytics.createIndex({ userId: 1 });
db.analytics.createIndex({ event: 1 });
db.analytics.createIndex({ timestamp: 1 });
db.analytics.createIndex({ userId: 1, timestamp: 1 });

// Sessions collection (for connect-mongo)
db.sessions.createIndex({ expires: 1 }, { expireAfterSeconds: 0 });

print('✅ Collections and indexes created successfully!');

// Insert sample templates for development
print('Creating sample templates...');

const sampleTemplates = [
  {
    _id: ObjectId(),
    name: 'Academic Paper Summary',
    description: 'Template for summarizing academic papers and research documents',
    category: 'academic',
    isPublic: true,
    userId: null, // System template
    prompt: 'Summarize this academic paper focusing on: 1) Main research question 2) Methodology 3) Key findings 4) Implications and future research',
    language: 'en',
    settings: {
      maxLength: 500,
      includeKeywords: true,
      structuredFormat: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: 'Business Report Summary',
    description: 'Template for business reports and corporate documents',
    category: 'business',
    isPublic: true,
    userId: null,
    prompt: 'Create a business summary highlighting: 1) Executive summary 2) Key metrics and KPIs 3) Strategic recommendations 4) Risk factors',
    language: 'en',
    settings: {
      maxLength: 400,
      includeMetrics: true,
      executiveFocus: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: 'Study Material Summary',
    description: 'Template for educational content and study materials',
    category: 'education',
    isPublic: true,
    userId: null,
    prompt: 'Summarize this study material with: 1) Key concepts and definitions 2) Important formulas or principles 3) Examples and applications 4) Study tips',
    language: 'en',
    settings: {
      maxLength: 600,
      includeExamples: true,
      studentFriendly: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: 'Technical Documentation',
    description: 'Template for technical guides and documentation',
    category: 'technical',
    isPublic: true,
    userId: null,
    prompt: 'Summarize this technical content covering: 1) Overview and purpose 2) Key technical details 3) Implementation steps 4) Common issues and solutions',
    language: 'en',
    settings: {
      maxLength: 550,
      includeTechnicalDetails: true,
      stepByStep: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.templates.insertMany(sampleTemplates);
print(`✅ Inserted ${sampleTemplates.length} sample templates!`);

// Create sample exam question templates
print('Creating exam question templates...');

const examTemplates = [
  {
    _id: ObjectId(),
    name: 'Multiple Choice Questions',
    description: 'Generate multiple choice questions from content',
    category: 'exam',
    type: 'multiple-choice',
    isPublic: true,
    userId: null,
    prompt: 'Generate multiple choice questions based on this content. Each question should have 4 options with only one correct answer. Focus on key concepts and important details.',
    settings: {
      questionCount: 10,
      difficulty: 'medium',
      includeExplanations: true,
      questionTypes: ['factual', 'conceptual', 'analytical']
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: 'Short Answer Questions',
    description: 'Generate short answer questions for deeper understanding',
    category: 'exam',
    type: 'short-answer',
    isPublic: true,
    userId: null,
    prompt: 'Create short answer questions that test understanding of key concepts. Questions should require 2-3 sentence responses and test comprehension rather than memorization.',
    settings: {
      questionCount: 8,
      difficulty: 'medium',
      wordLimit: 100,
      focusAreas: ['analysis', 'application', 'synthesis']
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.templates.insertMany(examTemplates);
print(`✅ Inserted ${examTemplates.length} exam templates!`);

// Create application settings
print('Creating application settings...');

const appSettings = {
  _id: 'app-settings',
  version: '1.0.0',
  features: {
    translation: {
      enabled: true,
      supportedLanguages: [
        'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 
        'pa', 'or', 'as', 'ur', 'sa', 'sd', 'ne', 'gom'
      ],
      autoDetect: true,
      fallbackLanguage: 'en'
    },
    authentication: {
      socialLogin: true,
      providers: ['google', 'facebook', 'microsoft'],
      sessionTimeout: '7d',
      refreshToken: true
    },
    analytics: {
      enabled: true,
      trackUserActivity: true,
      trackTranslations: true
    }
  },
  limits: {
    maxContentLength: 50000,
    maxSummaryLength: 2000,
    maxQuestionsPerExam: 50,
    rateLimits: {
      translate: 100, // per hour
      summary: 20,    // per hour
      exam: 10        // per hour
    }
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

db.settings.insertOne(appSettings);
print('✅ Application settings created!');

print('🎉 MongoDB initialization completed successfully!');
print('📊 Database summary:');
print(`   - Collections created: ${db.getCollectionNames().length}`);
print(`   - Sample templates: ${db.templates.countDocuments()}`);
print(`   - Indexes created on all collections`);
print('🚀 Ready for AI Study Circle application!');