const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    tokens: Number,
    model: String,
    processingTime: Number
  }
}, { _id: true });

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  context: {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    documentName: String,
    topic: String,
    tags: [String]
  },
  settings: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2
    },
    maxTokens: {
      type: Number,
      default: 1000
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chatSchema.index({ userId: 1, lastActivity: -1 });
chatSchema.index({ userId: 1, isActive: 1 });
chatSchema.index({ 'context.documentId': 1 });

// Virtual for message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add a message
chatSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata
  });
  this.lastActivity = new Date();
  
  // Auto-generate title from first user message if still default
  if (this.title === 'New Conversation' && role === 'user' && this.messages.length === 1) {
    this.title = content.length > 50 ? content.substring(0, 47) + '...' : content;
  }
  
  return this.save();
};

// Method to get recent messages for context
chatSchema.methods.getRecentMessages = function(limit = 10) {
  return this.messages.slice(-limit).map(msg => ({
    role: msg.role,
    content: msg.content
  }));
};

// Static method to get user's active chats
chatSchema.statics.getUserActiveChats = function(userId, limit = 20) {
  return this.find({ 
    userId, 
    isActive: true 
  })
  .sort({ lastActivity: -1 })
  .limit(limit)
  .select('title lastActivity messageCount context');
};

// Static method to cleanup old inactive chats
chatSchema.statics.cleanupOldChats = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    isActive: false,
    lastActivity: { $lt: cutoffDate }
  });
};

module.exports = mongoose.model('Chat', chatSchema);