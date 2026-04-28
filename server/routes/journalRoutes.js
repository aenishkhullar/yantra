const express = require('express');
const router = express.Router();
const {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  createFromOrder,
  getStats,
} = require('../controllers/journalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getEntries);
router.get('/stats', getStats);
router.post('/', createEntry);
router.post('/from-order/:orderId', createFromOrder);
router.patch('/:id', updateEntry);
router.delete('/:id', deleteEntry);

module.exports = router;
