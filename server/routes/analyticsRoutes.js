const express = require('express');
const router = express.Router();
const { getSummary, getPortfolioHistory, getTradeBreakdown } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/summary', getSummary);
router.get('/portfolio-history', getPortfolioHistory);
router.get('/breakdown', getTradeBreakdown);

module.exports = router;
