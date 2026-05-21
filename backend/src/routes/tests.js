const express = require('express');
const {
  getTests,
  getTest,
  createTest,
  startTestAttempt,
  saveAnswer,
  submitTest,
  getTestResult,
  getMyAttempts
} = require('../controllers/tests');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getTests)
  .post(protect, authorize('admin'), createTest);

router.route('/:id')
  .get(getTest);

router.route('/user/my-attempts')
  .get(protect, getMyAttempts);

router.route('/:id/start')
  .post(protect, startTestAttempt);

router.route('/attempts/:attemptId/save-answer')
  .post(protect, saveAnswer);

router.route('/attempts/:attemptId/submit')
  .post(protect, submitTest);

router.route('/attempts/:attemptId/result')
  .get(protect, getTestResult);

module.exports = router;
