const express = require('express');
const { getRecommendation, generateTest, getHistory, getPreview } = require('../controllers/adaptive');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/recommendation', getRecommendation);
router.post('/generate', generateTest);
router.get('/history', getHistory);
router.get('/:id/preview', getPreview);

module.exports = router;
