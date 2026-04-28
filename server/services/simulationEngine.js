const Order = require('../models/Order');
const Position = require('../models/Position');
const User = require('../models/User');
const { getQuote } = require('./yahooFinanceService');
const { calcUnrealisedPnL, calcRealisedPnL } = require('../utils/calcPnL');

const executeLimitBuy = async (order, currentPrice) => {
  try {
    const user = await User.findById(order.userId);
    const total = parseFloat((order.price * order.quantity).toFixed(2));

    if (user.virtualBalance < total) {
      // Cancel order — insufficient funds
      order.status = 'cancelled';
      await order.save();
      console.log(`[Engine] Limit buy cancelled — insufficient funds: ${order.symbol}`);
      return;
    }

    // Deduct balance
    const newBalance = parseFloat((user.virtualBalance - total).toFixed(2));
    await User.findByIdAndUpdate(order.userId, { $set: { virtualBalance: newBalance } });

    // Mark order executed
    order.status = 'executed';
    order.filledAt = new Date();
    order.price = currentPrice; // fill at current price
    order.total = parseFloat((currentPrice * order.quantity).toFixed(2));
    await order.save();

    // Create or update position
    let position = await Position.findOne({
      userId: order.userId,
      symbol: order.symbol,
      isOpen: true,
    });

    if (position) {
      const newTotalInvested = position.totalInvested + order.total;
      const newQuantity = position.quantity + order.quantity;
      position.averagePrice = parseFloat((newTotalInvested / newQuantity).toFixed(4));
      position.quantity = newQuantity;
      position.totalInvested = parseFloat(newTotalInvested.toFixed(2));
      position.currentPrice = currentPrice;
      const pnl = calcUnrealisedPnL(position, currentPrice);
      position.unrealisedPnL = pnl.unrealisedPnL;
      position.unrealisedPnLPercent = pnl.unrealisedPnLPercent;
      await position.save();
    } else {
      await Position.create({
        userId: order.userId,
        symbol: order.symbol,
        companyName: order.companyName,
        quantity: order.quantity,
        averagePrice: currentPrice,
        currentPrice,
        totalInvested: order.total,
        unrealisedPnL: 0,
        unrealisedPnLPercent: 0,
        isOpen: true,
      });
    }

    console.log(`[Engine] Limit buy executed: ${order.quantity} x ${order.symbol} @ $${currentPrice}`);
  } catch (err) {
    console.error(`[Engine] executeLimitBuy error:`, err.message);
  }
};

const executeStopLoss = async (order, position, currentPrice) => {
  try {
    const sellQty = position.quantity;
    const total = parseFloat((currentPrice * sellQty).toFixed(2));
    const realisedPnL = calcRealisedPnL(position, currentPrice, sellQty);

    // Credit balance
    const user = await User.findById(order.userId);
    const newBalance = parseFloat((user.virtualBalance + total).toFixed(2));
    await User.findByIdAndUpdate(order.userId, { $set: { virtualBalance: newBalance } });

    // Close position
    position.quantity = 0;
    position.isOpen = false;
    position.unrealisedPnL = 0;
    position.unrealisedPnLPercent = 0;
    position.currentPrice = currentPrice;
    await position.save();

    // Mark stop-loss order executed
    order.status = 'executed';
    order.filledAt = new Date();
    order.price = currentPrice;
    order.total = total;
    await order.save();

    console.log(`[Engine] Stop-loss triggered: ${order.symbol} @ $${currentPrice} | P&L: $${realisedPnL}`);
  } catch (err) {
    console.error(`[Engine] executeStopLoss error:`, err.message);
  }
};

const runEngine = async () => {
  try {
    // Get all pending orders
    const pendingOrders = await Order.find({ status: 'pending' });
    if (pendingOrders.length === 0) return;

    console.log(`[Engine] Checking ${pendingOrders.length} pending orders...`);

    // Group by symbol to minimize API calls
    const symbols = [...new Set(pendingOrders.map((o) => o.symbol))];

    const quotes = {};
    for (const symbol of symbols) {
      try {
        const quote = await getQuote(symbol);
        if (quote) quotes[symbol] = quote.price;
        await new Promise((r) => setTimeout(r, 200)); // rate limit protection
      } catch (e) {
        console.warn(`[Engine] Could not fetch ${symbol}`);
      }
    }

    for (const order of pendingOrders) {
      const currentPrice = quotes[order.symbol];
      if (!currentPrice) continue;

      if (order.orderType === 'limit' && order.side === 'buy') {
        // Execute if current price <= limit price (price dropped to target)
        if (currentPrice <= order.limitPrice) {
          await executeLimitBuy(order, currentPrice);
        }
      }

      if (order.orderType === 'limit' && order.side === 'sell') {
        // Execute if current price >= limit price (price rose to target)
        const position = await Position.findOne({
          userId: order.userId,
          symbol: order.symbol,
          isOpen: true,
        });
        if (position && currentPrice >= order.limitPrice) {
          await executeStopLoss(order, position, currentPrice);
        }
      }

      if (order.orderType === 'stop-loss') {
        // Execute if current price <= stop-loss price (price dropped to danger level)
        const position = await Position.findOne({
          userId: order.userId,
          symbol: order.symbol,
          isOpen: true,
        });
        if (position && currentPrice <= order.stopLossPrice) {
          await executeStopLoss(order, position, currentPrice);
        }
      }
    }
  } catch (err) {
    console.error('[Engine] runEngine error:', err.message);
  }
};

// Start the engine — check every 30 seconds
const startSimulationEngine = () => {
  console.log('[Engine] Simulation engine started — checking every 30s');
  setInterval(runEngine, 30000);
};

module.exports = { startSimulationEngine };
