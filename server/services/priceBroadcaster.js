const WebSocket = require('ws');
const { getMultipleQuotes } = require('./yahooFinanceService');
const { STOCK_LIST } = require('../utils/stockList');
const PriceCache = require('../models/PriceCache');
const {
  isMarketOpen,
  getMsUntilMarketOpen,
} = require('../utils/marketHours');

let wss = null;
let fetchTimer = null;
const clients = new Set();

// In-memory store — fastest access, no DB roundtrip
let latestPrices = {};

// ── Persist prices to MongoDB ─────────────────────────────
const savePricesToDB = async (quotes) => {
  try {
    const ops = quotes.map((q) => ({
      updateOne: {
        filter: { symbol: q.symbol },
        update: {
          $set: {
            symbol:        q.symbol,
            name:          q.name,
            price:         q.price,
            change:        q.change,
            changePercent: q.changePercent,
            volume:        q.volume,
            high:          q.high,
            low:           q.low,
            open:          q.open,
            previousClose: q.previousClose,
            savedAt:       new Date(),
            marketWasOpen: true,
          },
        },
        upsert: true,
      },
    }));
    await PriceCache.bulkWrite(ops);
    console.log(`[Cache] Saved ${quotes.length} prices to MongoDB`);
  } catch (err) {
    console.error('[Cache] Save failed:', err.message);
  }
};

// ── Load saved prices from MongoDB on startup ─────────────
const loadCachedPrices = async () => {
  try {
    const cached = await PriceCache.find({});
    cached.forEach((p) => {
      latestPrices[p.symbol] = {
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
        savedAt:       p.savedAt,
        fromCache:     true,
      };
    });
    console.log(`[Cache] Loaded ${cached.length} prices from MongoDB`);
  } catch (err) {
    console.error('[Cache] Load failed:', err.message);
  }
};

// ── Push to all connected WebSocket clients ───────────────
const broadcast = (payload) => {
  if (!wss) return;
  const message = JSON.stringify(payload);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(message); } catch (e) { /* ignore */ }
    }
  });
};

// ── Fetch live prices and broadcast ──────────────────────
const fetchAndBroadcast = async () => {
  if (!isMarketOpen()) {
    console.log('[Broadcaster] Market closed — skipping Finnhub call');
    return;
  }

  try {
    console.log('[Broadcaster] Fetching live prices from Finnhub...');
    const quotes = await getMultipleQuotes(STOCK_LIST);

    if (!quotes || quotes.length === 0) {
      console.warn('[Broadcaster] No quotes returned from Finnhub');
      return;
    }

    // Update in-memory store
    quotes.forEach((q) => {
      latestPrices[q.symbol] = {
        ...q,
        savedAt: new Date(),
        fromCache: false,
      };
    });

    // Persist to MongoDB so they survive server restarts
    await savePricesToDB(quotes);

    // Push to all WebSocket clients
    broadcast({
      type:       'PRICE_UPDATE',
      data:       quotes,
      timestamp:  new Date().toISOString(),
      marketOpen: true,
      fromCache:  false,
    });

    console.log(`[Broadcaster] Broadcasted ${quotes.length} prices to ${clients.size} clients`);
  } catch (err) {
    console.error('[Broadcaster] Fetch error:', err.message);
  }
};

// ── Smart scheduler ───────────────────────────────────────
// When market open: fetch every 60 seconds
// When market closed: wait until market opens, then start fetching
const scheduleNext = () => {
  if (fetchTimer) clearTimeout(fetchTimer);

  if (isMarketOpen()) {
    fetchTimer = setTimeout(async () => {
      await fetchAndBroadcast();
      scheduleNext();
    }, 60 * 1000);
    console.log('[Broadcaster] Next fetch in 60s (market open)');
  } else {
    const ms = getMsUntilMarketOpen();
    const mins = Math.round(ms / 60000);
    console.log(`[Broadcaster] Market closed — next fetch in ~${mins} min`);
    fetchTimer = setTimeout(async () => {
      console.log('[Broadcaster] Market just opened — starting live feed');
      await fetchAndBroadcast();
      scheduleNext();
    }, ms);
  }
};

// ── Initialize WebSocket server ───────────────────────────
const initWebSocket = async (httpServer) => {
  wss = new WebSocket.Server({ server: httpServer });
  console.log('[WebSocket] Server started');

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log(`[WebSocket] Client connected. Total: ${clients.size}`);

    // Send current prices immediately to new client
    const currentData = Object.values(latestPrices);
    if (currentData.length > 0) {
      try {
        ws.send(JSON.stringify({
          type:       'PRICE_UPDATE',
          data:       currentData,
          timestamp:  new Date().toISOString(),
          marketOpen: isMarketOpen(),
          fromCache:  !isMarketOpen(),
        }));
      } catch (e) { /* ignore */ }
    }

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WebSocket] Client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });

  // Load last known prices from DB first
  await loadCachedPrices();

  // If market is open right now, fetch immediately
  if (isMarketOpen()) {
    await fetchAndBroadcast();
  } else {
    // Broadcast cached data to any early connections
    broadcast({
      type:       'PRICE_UPDATE',
      data:       Object.values(latestPrices),
      timestamp:  new Date().toISOString(),
      marketOpen: false,
      fromCache:  true,
    });
  }

  scheduleNext();
};

// ── Expose latest price for simulation engine ─────────────
const getLatestPrice = (symbol) => latestPrices[symbol?.toUpperCase()] || null;

module.exports = { initWebSocket, getLatestPrice, broadcast };
