const Order = require('../models/Order');
const Position = require('../models/Position');
const User = require('../models/User');
const { calcUnrealisedPnL, calcRealisedPnL } = require('../utils/calcPnL');
const { isMarketOpen } = require('../utils/marketHours');
const { getLatestPrice } = require('./priceBroadcaster');

const executeLimitBuy = async (order, currentPrice) => {
  try {
    const user = await User.findById(order.userId);
    const total = parseFloat((currentPrice * order.quantity).toFixed(2));

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
    const saleProceeds = parseFloat((currentPrice * sellQty).toFixed(2));
    const realisedPnL = calcRealisedPnL(position, currentPrice, sellQty);

    // Credit balance
    const user = await User.findById(order.userId);
    const newBalance = parseFloat((user.virtualBalance + saleProceeds).toFixed(2));

    await User.findByIdAndUpdate(
      order.userId,
      { $set: { virtualBalance: newBalance } },
      { new: true }
    );

    console.log(`[Engine] Stop-loss credit: $${saleProceeds} → balance: $${newBalance}`);

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
  if (!isMarketOpen()) {
    // Market closed — no point checking limit orders
    // Prices are not moving so no triggers will fire
    return;
  }

  try {
    const pendingOrders = await Order.find({ status: 'pending' });
    if (pendingOrders.length === 0) return;

    console.log(`[Engine] Checking ${pendingOrders.length} pending orders...`);

    for (const order of pendingOrders) {
      // Use broadcaster's in-memory price — NO extra API call
      const priceData = getLatestPrice(order.symbol);
      if (!priceData || !priceData.price) continue;

      const currentPrice = priceData.price;

      if (order.orderType === 'limit' && order.side === 'buy') {
        if (currentPrice <= order.limitPrice) {
          await executeLimitBuy(order, currentPrice);
        }
      }

      if (order.orderType === 'limit' && order.side === 'sell') {
        const position = await Position.findOne({
          userId: order.userId, symbol: order.symbol, isOpen: true,
        });
        if (position && currentPrice >= order.limitPrice) {
          await executeStopLoss(order, position, currentPrice);
        }
      }

      if (order.orderType === 'stop-loss') {
        const position = await Position.findOne({
          userId: order.userId, symbol: order.symbol, isOpen: true,
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

// Run 65 seconds after broadcaster (slightly offset so prices are fresh)
const startSimulationEngine = () => {
  console.log('[Engine] Simulation engine started — checking every 65s');
  setInterval(runEngine, 65 * 1000);
};

module.exports = { startSimulationEngine };
