const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

const cache = {};
const CACHE_TTL = 60 * 1000;

const SYMBOL_MAP = {
  'INFY': 'INFY',
  'HDB':  'HDB',
  'WIT':  'WIT',
  'IBN':  'IBN',
  'TTM':  'TTM',
};

const toFinnhubSymbol = (symbol) => {
  if (symbol in SYMBOL_MAP) return SYMBOL_MAP[symbol];
  return symbol;
};

// Yahoo Finance symbol map for history
// Finnhub ADR symbols map back to Yahoo tickers
const toYahooSymbol = (symbol) => {
  const map = {
    'INFY': 'INFY',
    'HDB':  'HDB',
    'WIT':  'WIT',
    'IBN':  'IBN',
    'TTM':  'TTM',
  };
  return map[symbol] || symbol;
};

// ─── LIVE QUOTES via Finnhub ───────────────────────────────

const getQuote = async (symbol) => {
  const finnhubSymbol = toFinnhubSymbol(symbol);
  if (!finnhubSymbol) return null;

  try {
    const [quoteRes, profileRes] = await Promise.all([
      axios.get(`${BASE_URL}/quote`, {
        params: { symbol: finnhubSymbol, token: FINNHUB_KEY },
      }),
      axios.get(`${BASE_URL}/stock/profile2`, {
        params: { symbol: finnhubSymbol, token: FINNHUB_KEY },
      }),
    ]);

    const q = quoteRes.data;
    const profile = profileRes.data;

    if (!q.c || q.c === 0) {
      console.warn(`[Finnhub] No price data for ${symbol}`);
      return null;
    }

    return {
      symbol,
      name: profile.name || symbol,
      price: q.c || 0,
      change: q.d || 0,
      changePercent: q.dp || 0,
      volume: 0,
      high: q.h || 0,
      low: q.l || 0,
      open: q.o || 0,
      previousClose: q.pc || 0,
    };
  } catch (err) {
    console.error(`[Finnhub] getQuote failed for ${symbol}:`, err.message);
    return null;
  }
};

const getMultipleQuotes = async (symbols) => {
  const now = Date.now();
  const cacheKey = 'all_quotes';

  if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_TTL) {
    console.log('[Finnhub] Returning cached quotes');
    return cache[cacheKey].data;
  }

  console.log(`[Finnhub] Fetching ${symbols.length} symbols...`);

  const results = [];
  for (const symbol of symbols) {
    const quote = await getQuote(symbol);
    if (quote) results.push(quote);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[Finnhub] Got ${results.length} quotes`);
  cache[cacheKey] = { data: results, timestamp: now };
  return results;
};

// Separate cache for history — longer TTL to preserve Alpha Vantage quota
const historyCache = {};
const HISTORY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const getHistory = async (symbol, period = '1mo') => {
  const cacheKey = `${symbol}_${period}`;
  const now = Date.now();

  // Return cached data if fresh
  if (
    historyCache[cacheKey] &&
    now - historyCache[cacheKey].timestamp < HISTORY_CACHE_TTL
  ) {
    console.log(`[History] Returning cached candles for ${symbol}`);
    return historyCache[cacheKey].data;
  }

  try {
    const AV_KEY = process.env.ALPHA_VANTAGE_KEY;

    if (!AV_KEY) {
      console.error('[History] ALPHA_VANTAGE_KEY not set in .env');
      return [];
    }

    // Alpha Vantage uses TIME_SERIES_DAILY for daily OHLCV
    // outputsize: compact = last 100 days, full = 20+ years
    const outputsize = period === '3mo' ? 'full' : 'compact';

    console.log(`[AV History] Fetching candles for ${symbol} period=${period}...`);

    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: outputsize,
        apikey: AV_KEY,
      },
    });

    const data = response.data;

    // Check for API limit message
    if (data['Note']) {
      console.warn('[AV History] Rate limit hit:', data['Note']);
      return historyCache[cacheKey]?.data || [];
    }

    if (data['Information']) {
      console.warn('[AV History] API message:', data['Information']);
      return [];
    }

    const timeSeries = data['Time Series (Daily)'];

    if (!timeSeries) {
      console.warn(`[AV History] No time series data for ${symbol}`);
      console.warn('[AV History] Response keys:', Object.keys(data));
      return [];
    }

    // Calculate cutoff date based on period
    const periodDays = { '1d': 1, '5d': 5, '1mo': 30, '3mo': 90 };
    const days = periodDays[period] || 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // Convert Alpha Vantage format to our candle format
    const candles = Object.entries(timeSeries)
      .filter(([date]) => date >= cutoffStr)
      .map(([date, values]) => ({
        date,
        open:   parseFloat(values['1. open']),
        high:   parseFloat(values['2. high']),
        low:    parseFloat(values['3. low']),
        close:  parseFloat(values['4. close']),
        volume: parseInt(values['5. volume']),
      }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    console.log(`[AV History] Got ${candles.length} candles for ${symbol}`);

    // Cache the result
    historyCache[cacheKey] = { data: candles, timestamp: now };
    return candles;

  } catch (err) {
    console.error(`[AV History] getHistory failed for ${symbol}:`, err.message);
    // Return stale cache if available rather than empty
    return historyCache[cacheKey]?.data || [];
  }
};

module.exports = { getQuote, getMultipleQuotes, getHistory };
