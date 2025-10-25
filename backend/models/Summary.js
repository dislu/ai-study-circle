const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  summaryText: {
    type: String,
    required: true
  },
  summaryType: {
    type: String,
    enum: ['brief', 'medium', 'detailed', 'bullet_points', 'custom'],
    required: true
  },
  style: {
    type: String,
    enum: ['academic', 'casual', 'professional', 'technical'],
    default: 'academic'
  },
  targetAudience: {
    type: String,
    enum: ['students', 'professionals', 'general', 'experts'],
    default: 'general'
  },
  focusAreas: [String],
  configuration: {
    includeKeyPoints: {
      type: Boolean,
      default: true
    },
    includeConcepts: {
      type: Boolean,
      default: true
    },
    maxLength: Number,
    customInstructions: String
  },
  metadata: {
    wordCount: Number,
    characterCount: Number,
    processingTime: Number,
    aiModel: String,
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    usefulness: {
      type: Number,
      min: 1,
      max: 5
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    ratedAt: Date
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String],
  downloads: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
summarySchema.index({ owner: 1, createdAt: -1 });
summarySchema.index({ content: 1 });
summarySchema.index({ summaryType: 1 });
summarySchema.index({ isPublic: 1 });
summarySchema.index({ tags: 1 });

// Virtual for average rating
summarySchema.virtual('averageRating').get(function() {
  if (!this.rating.quality || !this.rating.usefulness) return 0;
  return (this.rating.quality + this.rating.usefulness) / 2;
});

// Method to export summary in different formats
summarySchema.methods.exportFormat = function(format) {
  const data = {
    title: this.title,
    summary: this.summaryText,
    type: this.summaryType,
    style: this.style,
    generatedAt: this.metadata.generatedAt,
    wordCount: this.metadata.wordCount
  };

  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'markdown':
      return `# ${data.title}\n\n**Type:** ${data.type}\n**Style:** ${data.style}\n**Generated:** ${data.generatedAt}\n**Words:** ${data.wordCount}\n\n## Summary\n\n${data.summary}`;
    case 'html':
      return `<h1>${data.title}</h1><p><strong>Type:</strong> ${data.type}</p><p><strong>Style:</strong> ${data.style}</p><div>${data.summary.replace(/\n/g, '<br>')}</div>`;
    default:
      return data.summary;
  }
};

module.exports = mongoose.model('Summary', summarySchema);