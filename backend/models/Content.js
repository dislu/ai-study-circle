const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  originalText: {
    type: String,
    required: true
  },
  processedText: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['file_upload', 'text_input', 'url_import'],
    required: true
  },
  sourceMetadata: {
    originalName: String,
    fileType: String,
    fileSize: Number,
    pageCount: Number,
    wordCount: Number,
    characterCount: Number,
    estimatedReadTime: Number,
    processingMethod: String
  },
  contentAnalysis: {
    mainTopics: [String],
    keyPoints: [String],
    concepts: [{
      term: String,
      definition: String
    }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced']
    },
    subject: String,
    learningObjectives: [String],
    readingLevel: {
      type: String,
      enum: ['elementary', 'middle', 'high_school', 'undergraduate', 'graduate']
    },
    technicalComplexity: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    prerequisiteKnowledge: [String]
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['science', 'mathematics', 'history', 'literature', 'technology', 'business', 'other'],
    default: 'other'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'edit'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  usage: {
    views: {
      type: Number,
      default: 0
    },
    summariesGenerated: {
      type: Number,
      default: 0
    },
    examsGenerated: {
      type: Number,
      default: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'archived'],
    default: 'processing'
  }
}, {
  timestamps: true
});

// Indexes for better performance
contentSchema.index({ owner: 1, createdAt: -1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ category: 1 });
contentSchema.index({ isPublic: 1 });
contentSchema.index({ 'contentAnalysis.subject': 1 });
contentSchema.index({ title: 'text', originalText: 'text' });

// Virtual for content excerpt
contentSchema.virtual('excerpt').get(function() {
  return this.originalText.substring(0, 200) + (this.originalText.length > 200 ? '...' : '');
});

// Method to increment usage
contentSchema.methods.incrementUsage = async function(type) {
  if (type === 'view') {
    this.usage.views += 1;
  } else if (type === 'summary') {
    this.usage.summariesGenerated += 1;
  } else if (type === 'exam') {
    this.usage.examsGenerated += 1;
  }
  
  this.usage.lastAccessed = new Date();
  await this.save();
};

// Check if user has access to content
contentSchema.methods.hasAccess = function(userId, permission = 'read') {
  // Owner has full access
  if (this.owner.toString() === userId.toString()) {
    return true;
  }
  
  // Check if content is public for read access
  if (permission === 'read' && this.isPublic) {
    return true;
  }
  
  // Check shared permissions
  const sharedAccess = this.sharedWith.find(share => 
    share.user.toString() === userId.toString()
  );
  
  if (!sharedAccess) return false;
  
  if (permission === 'read') return true;
  if (permission === 'edit') return sharedAccess.permission === 'edit';
  
  return false;
};

module.exports = mongoose.model('Content', contentSchema);