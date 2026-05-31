const mongoose = require('mongoose');

const TestAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.ObjectId,
    ref: 'MockTest',
    required: true
  },
  status: {
    type: String,
    enum: ['In Progress', 'Submitted'],
    default: 'In Progress'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  timeTaken: {
    type: Number, // in seconds
    default: 0
  },
  answers: [{
    question: {
      type: mongoose.Schema.ObjectId,
      ref: 'Question'
    },
    answer: mongoose.Schema.Types.Mixed, // User's given answer
    status: {
      type: String,
      enum: ['Not Visited', 'Not Answered', 'Answered', 'Marked for Review', 'Answered and Marked for Review'],
      default: 'Not Visited'
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    marksAwarded: {
      type: Number,
      default: 0
    }
  }],
  score: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number, // Percentage
    default: 0
  },
  adaptiveInsights: {
    type: Object
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestAttempt', TestAttemptSchema);
