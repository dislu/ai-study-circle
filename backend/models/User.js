const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 30,
    sparse: true // Allow null/undefined for social login users
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: 6
    // Not required for social login users
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: null
  },
  profilePictureProvider: {
    type: String,
    enum: ['google', 'facebook', 'microsoft', 'upload'],
    default: null
  },
  registrationMethod: {
    type: String,
    enum: ['email', 'google', 'facebook', 'microsoft'],
    default: 'email'
  },
  socialProfiles: {
    google: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    },
    facebook: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    },
    microsoft: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'educator'],
    default: 'user'
  },
  preferences: {
    language: {
      type: String,
      default: 'auto'
    },
    summaryLength: {
      type: String,
      enum: ['brief', 'medium', 'detailed'],
      default: 'medium'
    },
    summaryStyle: {
      type: String,
      enum: ['academic', 'casual', 'professional', 'technical'],
      default: 'academic'
    },
    examDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    defaultQuestionTypes: [{
      type: String,
      enum: ['mcq', 'short_answer', 'essay', 'true_false', 'fill_blank']
    }],
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  avatar: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  apiUsage: {
    summariesGenerated: {
      type: Number,
      default: 0
    },
    examsGenerated: {
      type: Number,
      default: 0
    },
    monthlyUsage: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Sanitize user data for responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpires;
  return user;
};

// Check if user has reached usage limits
userSchema.methods.hasReachedLimit = function(action) {
  const limits = {
    free: { summaries: 10, exams: 5 },
    basic: { summaries: 50, exams: 25 },
    premium: { summaries: 200, exams: 100 },
    enterprise: { summaries: -1, exams: -1 } // unlimited
  };
  
  const userLimits = limits[this.subscriptionPlan];
  if (!userLimits) return false;
  
  if (action === 'summary' && userLimits.summaries !== -1) {
    return this.apiUsage.summariesGenerated >= userLimits.summaries;
  }
  
  if (action === 'exam' && userLimits.exams !== -1) {
    return this.apiUsage.examsGenerated >= userLimits.exams;
  }
  
  return false;
};

// Increment usage counter
userSchema.methods.incrementUsage = async function(action) {
  if (action === 'summary') {
    this.apiUsage.summariesGenerated += 1;
  } else if (action === 'exam') {
    this.apiUsage.examsGenerated += 1;
  }
  
  this.apiUsage.monthlyUsage += 1;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);