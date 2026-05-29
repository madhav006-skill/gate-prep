const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRevisionQueue,
  getRevisionSummary,
  practiceRevision,
  snoozeRevision,
  completeRevision,
  generateRevisionFromAttempts
} = require('../controllers/revision');

router.get('/', protect, getRevisionQueue);
router.get('/summary', protect, getRevisionSummary);
router.post('/generate', protect, generateRevisionFromAttempts);
router.put('/:id/practice', protect, practiceRevision);
router.put('/:id/snooze', protect, snoozeRevision);
router.put('/:id/complete', protect, completeRevision);

module.exports = router;
