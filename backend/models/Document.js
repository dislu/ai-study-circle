const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt'],
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'processing', 'failed'],
    default: 'processing'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  summaryGenerated: {
    type: Boolean,
    default: false
  },
  examGenerated: {
    type: Boolean,
    default: false
  },
  wordsCount: {
    type: Number,
    default: 0
  },
  textContent: {
    type: String,
    default: ''
  },
  summary: {
    type: String,
    default: ''
  },
  examQuestions: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    explanation: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
documentSchema.index({ userId: 1, uploadDate: -1 });
documentSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Document', documentSchema);