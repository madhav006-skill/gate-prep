const mongoose = require('mongoose');

const gateResultRecordSchema = new mongoose.Schema({
  examYear: {
    type: Number,
    required: true,
    min: 2018,
    max: 2030
  },
  paperCode: {
    type: String,
    required: true,
    enum: ['CS', 'DA', 'ECE', 'ME', 'EE', 'CE', 'IN', 'CH', 'BT', 'MN'],
    uppercase: true
  },
  paperName: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['General', 'OBC', 'EWS', 'SC', 'ST']
  },
  rawMarks: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  gateScore: {
    type: Number,
    min: 0,
    max: 1000,
    default: null
  },
  allIndiaRank: {
    type: Number,
    required: true,
    min: 1
  },
  sourceType: {
    type: String,
    required: true,
    enum: ['admin_import', 'user_submission', 'public_dataset']
  },
  sourceLabel: {
    type: String,
    required: true,
    maxlength: 200
  },
  verificationStatus: {
    type: String,
    required: true,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // For user submissions - proof upload
  proofUrl: {
    type: String,
    default: null
  },
  // Admin notes
  adminNote: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index for fast querying
gateResultRecordSchema.index({ paperCode: 1, examYear: 1, category: 1, verificationStatus: 1 });
gateResultRecordSchema.index({ rawMarks: 1 });
gateResultRecordSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('GateResultRecord', gateResultRecordSchema);
