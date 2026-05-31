const express = require('express');
const {
  getMistakes,
  getSummary,
  addManualMistake,
  updateMistake,
  deleteMistake
} = require('../controllers/mistakes');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getMistakes);

router.route('/summary')
  .get(getSummary);

router.route('/manual')
  .post(addManualMistake);

router.route('/:id')
  .put(updateMistake)
  .delete(deleteMistake);

module.exports = router;
