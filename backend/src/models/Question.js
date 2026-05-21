const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: String, // e.g., 'CS', 'ME', 'Aptitude'
    required: true
  },
  topic: {
    type: String, // e.g., 'Data Structures', 'Operating Systems'
    required: true
  },
  year: {
    type: Number, // e.g., 2023, 2022
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['MCQ', 'MSQ', 'NAT'], // Multiple Choice, Multiple Select, Numerical Answer Type
    required: true
  },
  content: {
    type: String,
    required: false // Can be plain text. Now optional because questionHtml exists.
  },
  questionHtml: {
    type: String // HTML content extracted from PDF containing MathJax
  },
  imageUrl: {
    type: String // Optional Cloudinary image URL for the question diagram
  },
  pdfUrl: {
    type: String // Optional Cloudinary PDF URL for supplementary material
  },
  multipleImages: [{
    type: String // Optional Cloudinary image URLs if a question has multiple diagrams
  }],
  image: {
    type: String // Legacy Optional image URL for the question
  },
  extractedImages: [{
    type: String // List of image URLs extracted from PDF
  }],
  options: [{
    text: String,
    image: String,
    html: String // Extracted option HTML
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // String for MCQ (e.g., 'A'), Array for MSQ (e.g., ['A', 'C']), Number/Range for NAT (e.g., '4.5-4.7')
    required: true
  },
  marks: {
    type: Number,
    enum: [1, 2], // GATE questions are either 1 or 2 marks
    required: true
  },
  negativeMarks: {
    type: Number,
    default: 0 // Automatically calculated in some cases, but good to store. Usually 1/3 for 1 mark, 2/3 for 2 marks. 0 for MSQ/NAT
  },
  explanation: {
    type: String // Detailed solution
  },
  explanationHtml: {
    type: String
  },
  importedFromPdf: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', QuestionSchema);
