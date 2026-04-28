const { getQuote, getMultipleQuotes, getHistory } = require('../services/yahooFinanceService');
const { STOCK_LIST } = require('../utils/stockList');

const getAllPrices = async (req, res) => {
  try {
    console.log('[Controller] getAllPrices called');
    const quotes = await getMultipleQuotes(STOCK_LIST);
    console.log('[Controller] Returning', quotes.length, 'quotes');
    res.status(200).json(quotes);
  } catch (err) {
    console.error('[Controller] getAllPrices failed:', err.message);
    res.status(500).json({ message: 'Failed to fetch prices', error: err.message });
  }
};

const getPrice = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    console.log('[Controller] getPrice called for:', symbol);
    const quote = await getQuote(symbol);
    res.status(200).json(quote);
  } catch (err) {
    console.error('[Controller] getPrice failed:', err.message);
    res.status(500).json({ message: 'Failed to fetch price', error: err.message });
  }
};

const getHistoryData = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const { period } = req.query;
    const history = await getHistory(symbol, period);
    res.status(200).json(history);
  } catch (err) {
    console.error('[Controller] getHistory failed:', err.message);
    res.status(500).json({ message: 'Failed to fetch history', error: err.message });
  }
};

module.exports = { getAllPrices, getPrice, getHistoryData };
