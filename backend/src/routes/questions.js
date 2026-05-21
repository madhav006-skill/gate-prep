const express = require('express');
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questions');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getQuestions)
  .post(protect, authorize('admin'), createQuestion);

router.route('/:id')
  .get(getQuestion)
  .put(protect, authorize('admin'), updateQuestion)
  .delete(protect, authorize('admin'), deleteQuestion);

module.exports = router;
