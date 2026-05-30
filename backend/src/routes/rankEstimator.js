const express = require('express');
const {
  estimate,
  checkAvailability,
  submitUserResult,
  adminGetRecords,
  adminAddRecord,
  adminImportCSV,
  adminUpdateRecord
} = require('../controllers/rankEstimator');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public estimation (auth required)
router.post('/estimate', protect, estimate);
router.get('/availability', protect, checkAvailability);
router.post('/submit', protect, submitUserResult);

// Admin only
router.get('/admin/records', protect, authorize('admin'), adminGetRecords);
router.post('/admin/record', protect, authorize('admin'), adminAddRecord);
router.post('/admin/import-csv', protect, authorize('admin'), adminImportCSV);
router.patch('/admin/record/:id', protect, authorize('admin'), adminUpdateRecord);

module.exports = router;
