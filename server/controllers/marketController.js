const { getQuote, getMultipleQuotes, getHistory } = require('../services/yahooFinanceService');
const { STOCK_LIST } = require('../utils/stockList');
const PriceCache = require('../models/PriceCache');
const { isMarketOpen } = require('../utils/marketHours');
const { getLatestPrice } = require('../services/priceBroadcaster');

const getAllPrices = async (req, res) => {
  try {
    if (isMarketOpen()) {
      // Serve from in-memory broadcaster store (no API call needed)
      const live = STOCK_LIST.map((s) => getLatestPrice(s)).filter(Boolean);
      if (live.length > 0) {
        console.log(`[Market] Serving ${live.length} live prices from memory`);
        return res.status(200).json(live);
      }
    }

    // Market closed or memory empty — serve MongoDB cache
    console.log('[Market] Serving prices from MongoDB cache');
    const cached = await PriceCache.find({});
    const prices = cached.map((p) => ({
      symbol:        p.symbol,
      name:          p.name,
      price:         p.price,
      change:        p.change,
      changePercent: p.changePercent,
      volume:        p.volume,
      high:          p.high,
      low:           p.low,
      open:          p.open,
      previousClose: p.previousClose,
      fromCache:     true,
      savedAt:       p.savedAt,
    }));

    console.log(`[Market] Returning ${prices.length} cached prices`);
    res.status(200).json(prices);
  } catch (err) {
    console.error('[Market] getAllPrices error:', err.message);
    res.status(500).json({ message: 'Failed to fetch prices', error: err.message });
  }
};

const getPrice = async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    // 1. Try in-memory broadcaster store
    const live = getLatestPrice(symbol);
    if (live) return res.status(200).json(live);

    // 2. Try MongoDB cache
    const cached = await PriceCache.findOne({ symbol });
    if (cached) {
      return res.status(200).json({
        symbol:        cached.symbol,
        name:          cached.name,
        price:         cached.price,
        change:        cached.change,
        changePercent: cached.changePercent,
        volume:        cached.volume,
        high:          cached.high,
        low:           cached.low,
        open:          cached.open,
        previousClose: cached.previousClose,
        fromCache:     true,
        savedAt:       cached.savedAt,
      });
    }

    // 3. Last resort — call Finnhub directly
    const quote = await getQuote(symbol);
    res.status(200).json(quote);
  } catch (err) {
    console.error('[Market] getPrice error:', err.message);
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
