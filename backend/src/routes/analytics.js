const express = require('express');
const { getWeaknessRadar, getOverview, getTopicAnalysis } = require('../controllers/analytics');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.route('/weakness-radar').get(protect, getWeaknessRadar);
router.route('/overview').get(protect, getOverview);
router.route('/topic-analysis').get(protect, getTopicAnalysis);

module.exports = router;
