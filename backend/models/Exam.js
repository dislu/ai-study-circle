const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  instructions: {
    type: String,
    default: 'Answer all questions to the best of your ability.'
  },
  questions: [{
    id: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['mcq', 'short_answer', 'essay', 'true_false', 'fill_blank', 'matching'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true
    },
    topic: String,
    question: {
      type: String,
      required: true
    },
    options: [String], // For MCQ
    correctAnswer: String,
    explanation: String,
    points: {
      type: Number,
      default: 1
    },
    estimatedTime: Number // in minutes
  }],
  configuration: {
    totalQuestions: {
      type: Number,
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'mixed'],
      default: 'medium'
    },
    questionTypes: [{
      type: String,
      enum: ['mcq', 'short_answer', 'essay', 'true_false', 'fill_blank', 'matching']
    }],
    timeLimit: Number, // in minutes
    passingScore: {
      type: Number,
      default: 70
    },
    randomizeQuestions: {
      type: Boolean,
      default: false
    },
    showAnswers: {
      type: Boolean,
      default: true
    },
    allowMultipleAttempts: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    totalPoints: Number,
    estimatedDuration: Number,
    aiModel: String,
    generationTime: Number,
    generatedAt: {
      type: Date,
      default: Date.now
    },
    topics: [String],
    cognitiveLevels: [{
      level: {
        type: String,
        enum: ['knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation']
      },
      count: Number
    }]
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
  template: {
    type: String,
    enum: ['quick_assessment', 'standard_exam', 'comprehensive_test', 'critical_thinking', 'custom'],
    default: 'custom'
  },
  category: {
    type: String,
    enum: ['science', 'mathematics', 'history', 'literature', 'technology', 'business', 'other'],
    default: 'other'
  },
  tags: [String],
  usage: {
    downloads: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    attempts: {
      type: Number,
      default: 0
    },
    averageScore: Number,
    completionRate: Number
  },
  attempts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    answers: [{
      questionId: Number,
      answer: String,
      isCorrect: Boolean,
      points: Number,
      timeSpent: Number
    }],
    score: {
      correct: Number,
      total: Number,
      percentage: Number,
      points: Number,
      maxPoints: Number
    },
    timeSpent: Number,
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress'
    }
  }],
  feedback: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    difficulty_rating: {
      type: String,
      enum: ['too_easy', 'just_right', 'too_hard']
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
examSchema.index({ owner: 1, createdAt: -1 });
examSchema.index({ content: 1 });
examSchema.index({ template: 1 });
examSchema.index({ category: 1 });
examSchema.index({ isPublic: 1 });
examSchema.index({ tags: 1 });
examSchema.index({ 'configuration.difficulty': 1 });

// Virtual for average rating
examSchema.virtual('averageRating').get(function() {
  if (this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return sum / this.feedback.length;
});

// Calculate total points
examSchema.pre('save', function(next) {
  if (this.questions && this.questions.length > 0) {
    this.metadata.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
    this.metadata.estimatedDuration = this.questions.reduce((sum, q) => sum + (q.estimatedTime || 2), 0);
  }
  next();
});

// Method to generate exam statistics
examSchema.methods.getStatistics = function() {
  const completedAttempts = this.attempts.filter(attempt => attempt.status === 'completed');
  
  if (completedAttempts.length === 0) {
    return {
      totalAttempts: 0,
      completedAttempts: 0,
      averageScore: 0,
      completionRate: 0,
      averageTime: 0
    };
  }
  
  const avgScore = completedAttempts.reduce((sum, attempt) => sum + attempt.score.percentage, 0) / completedAttempts.length;
  const avgTime = completedAttempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / completedAttempts.length;
  const completionRate = (completedAttempts.length / this.attempts.length) * 100;
  
  return {
    totalAttempts: this.attempts.length,
    completedAttempts: completedAttempts.length,
    averageScore: Math.round(avgScore * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    averageTime: Math.round(avgTime)
  };
};

// Method to export exam in different formats
examSchema.methods.exportFormat = function(format, includeAnswers = true) {
  const examData = {
    title: this.title,
    description: this.description,
    instructions: this.instructions,
    questions: this.questions.map(q => ({
      id: q.id,
      type: q.type,
      question: q.question,
      options: q.options,
      points: q.points,
      ...(includeAnswers && { correctAnswer: q.correctAnswer, explanation: q.explanation })
    })),
    totalPoints: this.metadata.totalPoints,
    timeLimit: this.configuration.timeLimit
  };
  
  switch (format) {
    case 'json':
      return JSON.stringify(examData, null, 2);
    case 'markdown':
      let md = `# ${examData.title}\n\n`;
      if (examData.description) md += `${examData.description}\n\n`;
      md += `**Instructions:** ${examData.instructions}\n`;
      md += `**Time Limit:** ${examData.timeLimit} minutes\n`;
      md += `**Total Points:** ${examData.totalPoints}\n\n`;
      
      examData.questions.forEach((q, index) => {
        md += `## Question ${index + 1} (${q.points} points)\n\n`;
        md += `${q.question}\n\n`;
        if (q.options && q.options.length > 0) {
          q.options.forEach((option, i) => {
            md += `${String.fromCharCode(65 + i)}) ${option}\n`;
          });
          md += '\n';
        }
        if (includeAnswers && q.correctAnswer) {
          md += `**Answer:** ${q.correctAnswer}\n`;
          if (q.explanation) md += `**Explanation:** ${q.explanation}\n`;
        }
        md += '\n';
      });
      return md;
    default:
      return examData;
  }
};

module.exports = mongoose.model('Exam', examSchema);