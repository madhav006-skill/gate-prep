const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');

// @desc    Upload single file (image/pdf)
// @route   POST /api/upload
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a file' });
    }

    res.status(200).json({
      success: true,
      data: {
        url: req.file.path, // Cloudinary secure URL
        filename: req.file.filename,
        format: req.file.mimetype === 'application/pdf' ? 'pdf' : 'image'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Upload multiple files
// @route   POST /api/upload/multiple
// @access  Private/Admin
router.post('/multiple', protect, authorize('admin'), upload.array('files', 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload files' });
    }

    const urls = req.files.map(file => ({
      url: file.path,
      filename: file.filename
    }));

    res.status(200).json({
      success: true,
      data: urls
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
