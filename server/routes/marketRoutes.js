const express = require('express');
const { getAllPrices, getPrice, getHistoryData } = require('../controllers/marketController');

const router = express.Router();

router.get('/prices', getAllPrices);
router.get('/price/:symbol', getPrice);
router.get('/history/:symbol', getHistoryData);

module.exports = router;
