const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Question = require('../models/Question');
const { classifyQuestions } = require('../utils/aiClassifier');

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';

exports.uploadPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }

    // Read file into memory buffer to avoid Axios stream/Content-Length bugs
    const fileBuffer = fs.readFileSync(req.file.path);
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: req.file.originalname,
      contentType: 'application/pdf',
    });

    // Send to Python microservice
    const response = await axios.post(`${PYTHON_API_URL}/api/pdf/upload`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    // Cleanup local temp file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      jobId: response.data.job_id
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error proxying to Python API:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process PDF upload' });
  }
};

exports.getJobStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const response = await axios.get(`${PYTHON_API_URL}/api/pdf/status/${jobId}`);
    
    res.status(200).json({
      success: true,
      data: response.data
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    res.status(500).json({ success: false, error: 'Failed to check job status' });
  }
};

// Global store for save progress
global.saveProgressStore = global.saveProgressStore || {};

exports.getSaveProgress = (req, res) => {
  const { jobId } = req.params;
  const progress = global.saveProgressStore[jobId] || { completed: 0, total: 0, percentage: 0 };
  res.status(200).json({ success: true, data: progress });
};

exports.saveImportedQuestions = async (req, res, next) => {
  try {
    const { questions, title, description, subject, type, importJobId } = req.body;
    
    if (!questions || !Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Invalid questions array' });
    }

    if (importJobId) {
      global.saveProgressStore[importJobId] = { completed: 0, total: questions.length, percentage: 0 };
    }

    const { cloudinary } = require('../config/cloudinary');

    // --- AI Topic Classification ---
    let aiClassifications = [];
    try {
      console.log('Sending questions to Gemini for deep topic classification...');
      aiClassifications = await classifyQuestions(questions, subject || 'CS', (completed, total) => {
        if (importJobId) {
          global.saveProgressStore[importJobId] = {
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
          };
        }
      });
      console.log(`Classification complete.`);
    } catch (e) {
      console.error('Failed to classify with AI', e);
    }

    // Process questions: if they have a base64Image, upload it to Cloudinary
    const processedQuestions = await Promise.all(
      questions.map(async (q, idx) => {
        let uploadedImageUrl = null;
        if (q.base64Image) {
          try {
            const uploadRes = await cloudinary.uploader.upload(q.base64Image, {
              folder: 'gate_prep/images'
            });
            uploadedImageUrl = uploadRes.secure_url;
          } catch (err) {
            console.error('Failed to upload extracted diagram to Cloudinary:', err);
          }
        }
        
        // Remove the massive base64 string before saving to MongoDB
        const { base64Image, approved, id, ...rest } = q;
        
        // Match with AI classification
        const classification = aiClassifications.find(c => c.index === idx);
        
        return {
          ...rest,
          subject: classification?.subject || rest.subject || subject || 'CS',
          topic: classification?.topic || rest.topic || 'General',
          imageUrl: uploadedImageUrl || rest.imageUrl,
          importedFromPdf: true
        };
      })
    );

    // Automatically create a Mock Test from these questions so students can attempt it!
    const MockTest = require('../models/MockTest');
    
    const testTitle = title || `Imported GATE Paper - ${new Date().toLocaleDateString()}`;
    
    // ── IDEMPOTENCY: If a test with same title already exists, delete its old
    //    questions and update it — prevents duplicate tests on re-import ────────
    const existingTest = await MockTest.findOne({ title: testTitle });
    if (existingTest) {
      console.log(`[Import] Test "${testTitle}" already exists. Removing old questions and updating...`);
      const oldQIds = existingTest.questions.map(q => q.question);
      await Question.deleteMany({ _id: { $in: oldQIds } });
      await MockTest.findByIdAndDelete(existingTest._id);
      console.log(`[Import] Deleted ${oldQIds.length} old questions and stale test.`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Insert approved questions into the DB
    const savedQuestions = await Question.insertMany(processedQuestions);

    // Calculate total marks
    const totalMarks = savedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    
    const newTest = await MockTest.create({
      title: testTitle,
      description: description || 'Automatically generated mock test from imported PDF questions.',
      subject: subject || savedQuestions[0]?.subject || 'CS',
      type: type || 'Full Mock',
      duration: (type === 'Year-wise PYQ' || type === 'Full Mock') ? 180 : savedQuestions.length * 2,
      totalMarks,
      questions: savedQuestions.map((q, index) => ({
        question: q._id,
        order: index + 1
      }))
    });

    res.status(201).json({
      success: true,
      count: savedQuestions.length,
      testId: newTest._id,
      data: savedQuestions
    });
  } catch (error) {
    console.error('Error saving questions:', error);
    res.status(500).json({ success: false, error: 'Failed to save questions to database' });
  }
};
