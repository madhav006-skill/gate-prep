const mongoose = require('mongoose');

const historyEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  wasCorrect: { type: Boolean },
  timeSpent: { type: Number, default: 0 }, // seconds
  answer: { type: mongoose.Schema.Types.Mixed },
  resultType: {
    type: String,
    enum: ['Correct Fast', 'Correct Slow', 'Wrong', 'Skipped']
  }
}, { _id: false });

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

  // Denormalized for fast queries (avoid joining Question every time)
  subject: { type: String, default: 'General' },
  topic: { type: String, default: 'General' },
  questionType: { type: String, enum: ['MCQ', 'MSQ', 'NAT'], default: 'MCQ' },

  reason: {
    type: String,
    enum: ['Wrong Answer', 'Slow but Correct', 'Marked for Review', 'Skipped Easy', 'Repeated Topic Weakness'],
    required: true
  },

  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },

  status: {
    type: String,
    enum: ['Due', 'Upcoming', 'Completed', 'Overdue'],
    default: 'Due'
  },

  dueDate: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
  },

  nextIntervalDays: { type: Number, default: 1 },

  attempts: { type: Number, default: 1 },
  lastPracticed: { type: Date },

  history: [historyEntrySchema],

  notes: { type: String }
}, {
  timestamps: true
});

// Ensure a user only has one revision entry per question
RevisionQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

// Index for efficient due-today queries
RevisionQuestionSchema.index({ user: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('RevisionQuestion', RevisionQuestionSchema);
