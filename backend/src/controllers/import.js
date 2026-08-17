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
    if (error.response) {
      console.error('Python API Data:', error.response.data);
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process PDF upload', 
      details: error.message,
      pythonData: error.response ? error.response.data : null
    });
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

    console.log(`[Import] Received ${questions.length} raw questions for "${title}"`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 0: CLEAN & DEDUPLICATE before doing anything expensive
    // ═══════════════════════════════════════════════════════════════════════
    const seenHtml = new Set();
    const cleanedQuestions = [];
    let rejectedBlank = 0;
    let rejectedDuplicate = 0;

    for (const q of questions) {
      // Reject blank/empty questions
      const html = (q.questionHtml || '').trim();
      const content = (q.content || '').trim();
      const textContent = html.replace(/<[^>]*>/g, '').trim(); // strip HTML tags

      if (!textContent && !content) {
        rejectedBlank++;
        continue;
      }
      if (textContent === '' || html === '<p></p>' || html === '<p> </p>') {
        rejectedBlank++;
        continue;
      }

      // Reject duplicates (by normalized questionHtml)
      const normalizedKey = (html || content).replace(/\s+/g, ' ').trim().toLowerCase();
      if (seenHtml.has(normalizedKey)) {
        rejectedDuplicate++;
        continue;
      }
      seenHtml.add(normalizedKey);

      cleanedQuestions.push(q);
    }

    console.log(`[Import] Rejected ${rejectedBlank} blank, ${rejectedDuplicate} duplicate. Clean: ${cleanedQuestions.length}`);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 0.5: CAP AT 65 QUESTIONS (GATE standard)
    // ═══════════════════════════════════════════════════════════════════════
    const GATE_MAX_QUESTIONS = 65;
    const cappedQuestions = cleanedQuestions.slice(0, GATE_MAX_QUESTIONS);
    if (cleanedQuestions.length > GATE_MAX_QUESTIONS) {
      console.log(`[Import] Capped from ${cleanedQuestions.length} to ${GATE_MAX_QUESTIONS} questions`);
    }

    if (cappedQuestions.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid questions found after filtering blanks and duplicates' });
    }

    if (importJobId) {
      global.saveProgressStore[importJobId] = { completed: 0, total: cappedQuestions.length, percentage: 0 };
    }

    const { cloudinary } = require('../config/cloudinary');

    // --- AI Topic Classification ---
    let aiClassifications = [];
    try {
      console.log('[Import] Sending questions to Gemini for deep topic classification...');
      aiClassifications = await classifyQuestions(cappedQuestions, subject || 'CS', (completed, total) => {
        if (importJobId) {
          global.saveProgressStore[importJobId] = {
            completed,
            total,
            percentage: Math.round((completed / total) * 100)
          };
        }
      });
      console.log(`[Import] Classification complete.`);
    } catch (e) {
      console.error('[Import] Failed to classify with AI', e);
    }

    // Process questions: if they have a base64Image, upload it to Cloudinary
    const processedQuestions = await Promise.all(
      cappedQuestions.map(async (q, idx) => {
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

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 1: IDEMPOTENT MOCK TEST — delete old test+questions on re-import
    // ═══════════════════════════════════════════════════════════════════════
    const MockTest = require('../models/MockTest');
    const testTitle = title || `Imported GATE Paper - ${new Date().toLocaleDateString()}`;
    
    const existingTest = await MockTest.findOne({ title: testTitle });
    if (existingTest) {
      console.log(`[Import] Test "${testTitle}" already exists. Replacing entirely...`);
      const oldQIds = existingTest.questions.map(q => q.question);
      await Question.deleteMany({ _id: { $in: oldQIds } });
      await MockTest.findByIdAndDelete(existingTest._id);
      console.log(`[Import] Deleted ${oldQIds.length} old questions and stale test.`);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 2: INSERT CLEAN QUESTIONS
    // ═══════════════════════════════════════════════════════════════════════
    const savedQuestions = await Question.insertMany(processedQuestions);

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: CREATE MOCK TEST — force 100 marks for GATE papers
    // ═══════════════════════════════════════════════════════════════════════
    const isGatePaper = (type === 'Year-wise PYQ' || type === 'Full Mock');
    const totalMarks = isGatePaper ? 100 : savedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
    
    const newTest = await MockTest.create({
      title: testTitle,
      description: description || 'Official GATE Previous Year Question Paper.',
      subject: subject || savedQuestions[0]?.subject || 'CS',
      type: type || 'Full Mock',
      duration: isGatePaper ? 180 : savedQuestions.length * 2,
      totalMarks,
      questions: savedQuestions.map((q, index) => ({
        question: q._id,
        order: index + 1
      }))
    });

    console.log(`[Import] ✅ Created "${testTitle}" with ${savedQuestions.length} questions, ${totalMarks} marks`);

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
