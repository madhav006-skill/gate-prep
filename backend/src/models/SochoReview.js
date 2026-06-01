const mongoose = require('mongoose');

const SochoReviewSchema = new mongoose.Schema({
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
  attempt: {
    type: mongoose.Schema.ObjectId,
    ref: 'TestAttempt',
    required: true
  },
  test: {
    type: mongoose.Schema.ObjectId,
    ref: 'MockTest',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  questionType: {
    type: String, // MCQ, MSQ, NAT
    required: true
  },
  originalResult: {
    type: String,
    enum: ['Correct', 'Wrong', 'Skipped'],
    required: true
  },
  originalStatus: {
    type: String
  },
  userAnswer: {
    type: mongoose.Schema.Types.Mixed
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  marks: {
    type: Number,
    required: true
  },
  marksAwarded: {
    type: Number,
    required: true
  },
  suspicionReason: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  explanationText: {
    type: String
  },
  masteryLabel: {
    type: String,
    enum: [
      'Mastered', 
      'Correct but Doubtful', 
      'Lucky Correct', 
      'Partial Understanding', 
      'Concept Gap', 
      'Calculation Error', 
      'Question Misread', 
      'Formula Forgotten', 
      'Needs Revision'
    ]
  },
  explanationQuality: {
    type: Number,
    min: 0,
    max: 100
  },
  conceptClarity: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: {
    type: String
  },
  recommendedAction: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'AddedToRevision', 'Mastered'],
    default: 'Pending'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Prevent duplicate Socho reviews for the same attempt and question
SochoReviewSchema.index({ user: 1, attempt: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('SochoReview', SochoReviewSchema);
