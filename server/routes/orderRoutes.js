const express = require('express');
const router = express.Router();
const {
  placeBuyOrder,
  placeSellOrder,
  getOrderHistory,
  getPositions,
  closePosition,
  getPendingOrders,
  cancelOrder,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

// All order routes require auth
router.use(protect);

router.post('/buy', placeBuyOrder);
router.post('/sell', placeSellOrder);
router.get('/history', getOrderHistory);
router.get('/pending', getPendingOrders);
router.get('/positions', getPositions);
router.post('/close/:positionId', closePosition);
router.patch('/cancel/:orderId', cancelOrder);

module.exports = router;
