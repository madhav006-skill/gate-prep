const mongoose = require('mongoose');

const RevisionQuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.ObjectId,
    ref: 'Question',
    required: true
  },
  reason: {
    type: String,
    enum: ['Wrong', 'Slow', 'Bookmarked'],
    required: true
  },
  attempts: {
    type: Number,
    default: 1
  },
  lastPracticed: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String // User's personal notes for this question
  }
}, {
  timestamps: true
});

// Ensure a user only has one revision entry per question
RevisionQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('RevisionQuestion', RevisionQuestionSchema);
