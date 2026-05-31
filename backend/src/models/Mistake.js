const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  attemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt'
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  },
  date: {
    type: Date,
    default: Date.now
  },
  userAnswer: mongoose.Schema.Types.Mixed,
  wasCorrect: Boolean,
  timeSpent: Number, // in seconds
  marksLost: Number,
  source: {
    type: String,
    enum: ['mock_test', 'revision_practice', 'manual'],
    required: true
  },
  detectedCategory: String
});

const mistakeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question' // Optional, null if manual note without question
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
    type: String,
    enum: ['MCQ', 'MSQ', 'NAT', 'Manual']
  },
  detectedCategory: {
    type: String,
    enum: [
      'Concept Gap',
      'Silly Mistake',
      'Calculation Error',
      'Time Pressure',
      'Question Misread',
      'Formula Forgotten',
      'Skipped Easy',
      'Marked for Review',
      'Other'
    ],
    default: 'Concept Gap'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'Resolved'],
    default: 'Open'
  },
  timesRepeated: {
    type: Number,
    default: 1
  },
  marksLost: {
    type: Number,
    default: 0
  },
  shortSummary: {
    type: String
  },
  fixAction: {
    type: String
  },
  userNote: {
    type: String
  },
  source: {
    type: String,
    enum: ['mock_test', 'revision_practice', 'manual'],
    required: true
  },
  history: [historySchema],
  resolvedAt: {
    type: Date
  },
  lastOccurredAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure unique mistake per user-question pair, unless manual
mistakeSchema.index({ user: 1, question: 1 }, { unique: true, partialFilterExpression: { question: { $exists: true, $type: "objectId" } } });

module.exports = mongoose.model('Mistake', mistakeSchema);
