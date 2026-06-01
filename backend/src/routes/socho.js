const express = require('express');
const { 
  getSummary, 
  getQueue, 
  generateQueue, 
  getHistory, 
  getReview, 
  submitExplanation, 
  addToRevision, 
  markMastered 
} = require('../controllers/socho');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All routes are private

router.get('/summary', getSummary);
router.get('/queue', getQueue);
router.post('/generate', generateQueue);
router.get('/history', getHistory);

router.route('/reviews/:id')
  .get(getReview);

router.post('/reviews/:id/submit', submitExplanation);
router.post('/reviews/:id/add-to-revision', addToRevision);
router.post('/reviews/:id/mark-mastered', markMastered);

module.exports = router;
