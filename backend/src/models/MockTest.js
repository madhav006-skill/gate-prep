const mongoose = require('mongoose');

const MockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a test title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  subject: {
    type: String,
    required: true // 'CS', 'General'
  },
  type: {
    type: String,
    enum: ['Full Mock', 'Topic-wise', 'Subject-wise PYQ', 'Year-wise PYQ', 'Daily Practice'],
    required: true
  },
  duration: {
    type: Number, // In minutes (e.g., 180 for full GATE)
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  questions: [{
    question: {
      type: mongoose.Schema.ObjectId,
      ref: 'Question',
      required: true
    },
    order: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MockTest', MockTestSchema);
