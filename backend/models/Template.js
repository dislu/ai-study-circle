const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  
  description: {
    type: String,
    required: true,
    maxLength: 500
  },
  
  type: {
    type: String,
    required: true,
    enum: ['summary', 'exam', 'both']
  },
  
  category: {
    type: String,
    required: true,
    enum: [
      'academic', 'business', 'technical', 'medical', 'legal',
      'scientific', 'literature', 'history', 'language', 'math',
      'general', 'custom'
    ],
    default: 'general'
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  
  // Template configuration for summaries
  summaryConfig: {
    style: {
      type: String,
      enum: ['bullet_points', 'paragraph', 'outline', 'mind_map', 'timeline'],
      default: 'bullet_points'
    },
    
    length: {
      type: String,
      enum: ['brief', 'moderate', 'detailed', 'comprehensive'],
      default: 'moderate'
    },
    
    targetAudience: {
      type: String,
      enum: ['student', 'professional', 'general', 'expert'],
      default: 'student'
    },
    
    includeKeyPoints: {
      type: Boolean,
      default: true
    },
    
    includeExamples: {
      type: Boolean,
      default: false
    },
    
    includeDefinitions: {
      type: Boolean,
      default: true
    },
    
    tone: {
      type: String,
      enum: ['formal', 'informal', 'academic', 'conversational'],
      default: 'academic'
    },
    
    structure: [{
      section: {
        type: String,
        required: true
      },
      description: String,
      required: {
        type: Boolean,
        default: true
      }
    }]
  },
  
  // Template configuration for exams
  examConfig: {
    questionTypes: [{
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank', 'matching'],
        required: true
      },
      percentage: {
        type: Number,
        min: 0,
        max: 100,
        required: true
      }
    }],
    
    totalQuestions: {
      type: Number,
      min: 5,
      max: 100,
      default: 20
    },
    
    timeLimit: {
      type: Number, // in minutes
      min: 10,
      max: 300,
      default: 60
    },
    
    passingScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 70
    },
    
    showAnswers: {
      type: Boolean,
      default: true
    },
    
    allowReview: {
      type: Boolean,
      default: true
    },
    
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    
    randomizeOptions: {
      type: Boolean,
      default: false
    },
    
    feedback: {
      immediate: {
        type: Boolean,
        default: false
      },
      detailed: {
        type: Boolean,
        default: true
      }
    },
    
    sections: [{
      name: {
        type: String,
        required: true
      },
      description: String,
      questionCount: {
        type: Number,
        required: true
      },
      timeAllocation: Number // in minutes
    }]
  },
  
  // AI prompts and instructions
  aiInstructions: {
    summaryPrompt: {
      type: String,
      maxLength: 2000
    },
    
    examPrompt: {
      type: String,
      maxLength: 2000
    },
    
    additionalContext: {
      type: String,
      maxLength: 1000
    }
  },
  
  // Template metadata
  tags: [{
    type: String,
    trim: true
  }],
  
  isPublic: {
    type: Boolean,
    default: false
  },
  
  isDefault: {
    type: Boolean,
    default: false
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  usage: {
    timesUsed: {
      type: Number,
      default: 0
    },
    
    averageRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 0
    },
    
    totalRatings: {
      type: Number,
      default: 0
    },
    
    lastUsed: Date
  },
  
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      maxLength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  version: {
    type: Number,
    default: 1
  },
  
  parentTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template'
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
templateSchema.index({ type: 1, category: 1 });
templateSchema.index({ isPublic: 1, isDefault: 1 });
templateSchema.index({ createdBy: 1 });
templateSchema.index({ 'usage.averageRating': -1 });
templateSchema.index({ 'usage.timesUsed': -1 });
templateSchema.index({ tags: 1 });

// Virtual for popularity score
templateSchema.virtual('popularityScore').get(function() {
  const usageWeight = 0.7;
  const ratingWeight = 0.3;
  
  const normalizedUsage = Math.min(this.usage.timesUsed / 100, 1); // Normalize to 0-1
  const normalizedRating = this.usage.averageRating / 5; // Normalize to 0-1
  
  return (normalizedUsage * usageWeight + normalizedRating * ratingWeight) * 100;
});

// Methods
templateSchema.methods.incrementUsage = function() {
  this.usage.timesUsed += 1;
  this.usage.lastUsed = new Date();
  return this.save();
};

templateSchema.methods.addRating = function(userId, rating, comment) {
  // Remove existing rating from this user
  this.ratings = this.ratings.filter(r => !r.user.equals(userId));
  
  // Add new rating
  this.ratings.push({
    user: userId,
    rating,
    comment
  });
  
  // Update average rating
  this.usage.totalRatings = this.ratings.length;
  this.usage.averageRating = this.ratings.reduce((sum, r) => sum + r.rating, 0) / this.ratings.length;
  
  return this.save();
};

templateSchema.methods.canUserModify = function(userId, userRole) {
  return this.createdBy.equals(userId) || userRole === 'admin';
};

templateSchema.methods.clone = function(userId, modifications = {}) {
  const clonedData = this.toObject();
  
  // Remove fields that shouldn't be cloned
  delete clonedData._id;
  delete clonedData.__v;
  delete clonedData.createdAt;
  delete clonedData.updatedAt;
  delete clonedData.usage;
  delete clonedData.ratings;
  
  // Set new owner and parent
  clonedData.createdBy = userId;
  clonedData.parentTemplate = this._id;
  clonedData.isPublic = false;
  clonedData.isDefault = false;
  clonedData.name = `${clonedData.name} (Copy)`;
  
  // Apply modifications
  Object.assign(clonedData, modifications);
  
  return new this.constructor(clonedData);
};

// Static methods
templateSchema.statics.getPopularTemplates = function(type = null, limit = 10) {
  const match = { isPublic: true, status: 'active' };
  if (type) {
    match.type = { $in: [type, 'both'] };
  }
  
  return this.find(match)
    .sort({ 'usage.averageRating': -1, 'usage.timesUsed': -1 })
    .limit(limit)
    .populate('createdBy', 'username email');
};

templateSchema.statics.getDefaultTemplates = function(type = null) {
  const match = { isDefault: true, status: 'active' };
  if (type) {
    match.type = { $in: [type, 'both'] };
  }
  
  return this.find(match).sort({ name: 1 });
};

templateSchema.statics.getUserTemplates = function(userId, type = null) {
  const match = { 
    $or: [
      { createdBy: userId },
      { isPublic: true }
    ],
    status: 'active'
  };
  
  if (type) {
    match.type = { $in: [type, 'both'] };
  }
  
  return this.find(match)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username email');
};

templateSchema.statics.searchTemplates = function(query, filters = {}) {
  const match = {
    status: 'active',
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } }
    ]
  };
  
  // Apply filters
  if (filters.type) {
    match.type = { $in: [filters.type, 'both'] };
  }
  
  if (filters.category) {
    match.category = filters.category;
  }
  
  if (filters.difficulty) {
    match.difficulty = filters.difficulty;
  }
  
  if (filters.isPublic !== undefined) {
    match.isPublic = filters.isPublic;
  }
  
  if (filters.createdBy) {
    match.createdBy = filters.createdBy;
  }
  
  if (filters.minRating) {
    match['usage.averageRating'] = { $gte: filters.minRating };
  }
  
  return this.find(match)
    .sort({ 'usage.averageRating': -1, 'usage.timesUsed': -1 })
    .populate('createdBy', 'username email');
};

// Pre-save middleware
templateSchema.pre('save', function(next) {
  // Validate question type percentages for exam templates
  if ((this.type === 'exam' || this.type === 'both') && this.examConfig && this.examConfig.questionTypes) {
    const totalPercentage = this.examConfig.questionTypes.reduce((sum, qt) => sum + qt.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) { // Allow for small floating point errors
      return next(new Error('Question type percentages must sum to 100'));
    }
  }
  
  // Validate section question counts for exam templates
  if (this.examConfig && this.examConfig.sections && this.examConfig.sections.length > 0) {
    const totalSectionQuestions = this.examConfig.sections.reduce((sum, section) => sum + section.questionCount, 0);
    if (totalSectionQuestions !== this.examConfig.totalQuestions) {
      return next(new Error('Section question counts must sum to total questions'));
    }
  }
  
  next();
});

module.exports = mongoose.model('Template', templateSchema);