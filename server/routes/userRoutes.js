const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateDisplayName,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getProfile);
router.patch('/display-name', updateDisplayName);
router.patch('/change-password', changePassword);

module.exports = router;
