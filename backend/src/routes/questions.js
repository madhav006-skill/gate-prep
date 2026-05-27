const express = require('express');
const {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion
} = require('../controllers/questions');

const { protect, authorize, optionalProtect } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(optionalProtect, getQuestions)
  .post(protect, authorize('admin'), createQuestion);

router.route('/:id')
  .get(optionalProtect, getQuestion)
  .put(protect, authorize('admin'), updateQuestion)
  .delete(protect, authorize('admin'), deleteQuestion);

module.exports = router;
