const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadPdf, getJobStatus, saveImportedQuestions } = require('../controllers/import');
const { protect, authorize } = require('../middleware/auth');

// Multer setup for temporary storage
const upload = multer({ dest: 'uploads/' });

router.post('/upload', protect, authorize('admin'), upload.single('file'), uploadPdf);
router.get('/status/:jobId', protect, authorize('admin'), getJobStatus);
router.post('/save', protect, authorize('admin'), saveImportedQuestions);

module.exports = router;
