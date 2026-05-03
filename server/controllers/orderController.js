const User = require('../models/User');
const Order = require('../models/Order');
const Position = require('../models/Position');
const { getQuote } = require('../services/yahooFinanceService');
const { calcUnrealisedPnL, calcRealisedPnL } = require('../utils/calcPnL');

// POST /api/orders/buy
const placeBuyOrder = async (req, res) => {
  try {
    const { symbol, quantity, orderType, limitPrice, stopLossPrice } = req.body;
    const userId = req.user._id;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Symbol and quantity are required' });
    }

    if (orderType === 'stop-loss') {
      const position = await Position.findOne({
        userId,
        symbol: symbol.toUpperCase(),
        isOpen: true,
      });

      if (!position) {
        return res.status(400).json({ message: 'No open position for this symbol to set stop-loss' });
      }

      position.stopLossPrice = parseFloat(stopLossPrice);
      await position.save();

      const order = await Order.create({
        userId,
        symbol: symbol.toUpperCase(),
        companyName: position.companyName,
        side: 'sell',
        orderType: 'stop-loss',
        quantity: parseInt(quantity),
        price: 0, // will be filled at execution
        stopLossPrice: parseFloat(stopLossPrice),
        total: 0,
        status: 'pending',
      });

      return res.status(202).json({
        message: `Stop-loss set at $${stopLossPrice}`,
        order
      });
    }

    // Fetch live price for market or limit evaluation
    const quote = await getQuote(symbol.toUpperCase());
    if (!quote || !quote.price) {
      return res.status(400).json({ message: 'Could not fetch current price' });
    }

    const executionPrice = orderType === 'limit' && limitPrice
      ? parseFloat(limitPrice)
      : quote.price;

    const total = parseFloat((executionPrice * quantity).toFixed(2));

    if (orderType === 'limit') {
      const order = await Order.create({
        userId,
        symbol: symbol.toUpperCase(),
        companyName: quote.name,
        side: 'buy',
        orderType: 'limit',
        quantity: parseInt(quantity),
        price: executionPrice,
        limitPrice: parseFloat(limitPrice),
        total,
        status: 'pending',
      });

      return res.status(202).json({
        message: 'Limit order placed — waiting for target price',
        order
      });
    }

    // Market order
    // Check balance
    const user = await User.findById(userId);
    if (user.virtualBalance < total) {
      return res.status(400).json({
        message: `Insufficient balance. Need $${total.toFixed(2)}, have $${user.virtualBalance.toFixed(2)}`,
      });
    }

    // Deduct balance
    const newBalance = parseFloat((user.virtualBalance - total).toFixed(2));

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { virtualBalance: newBalance } },
      { new: true }
    );

    // Create order record
    const order = await Order.create({
      userId,
      symbol: symbol.toUpperCase(),
      companyName: quote.name,
      side: 'buy',
      orderType: 'market',
      quantity: parseInt(quantity),
      price: executionPrice,
      total,
      status: 'executed',
      filledAt: new Date(),
    });

    // Update or create position
    let position = await Position.findOne({
      userId,
      symbol: symbol.toUpperCase(),
      isOpen: true,
    });

    if (position) {
      // Average down/up existing position
      const newTotalInvested = position.totalInvested + total;
      const newQuantity = position.quantity + parseInt(quantity);
      const newAvgPrice = newTotalInvested / newQuantity;

      position.quantity = newQuantity;
      position.averagePrice = parseFloat(newAvgPrice.toFixed(4));
      position.totalInvested = parseFloat(newTotalInvested.toFixed(2));
      position.currentPrice = quote.price;

      const pnl = calcUnrealisedPnL(position, quote.price);
      position.unrealisedPnL = pnl.unrealisedPnL;
      position.unrealisedPnLPercent = pnl.unrealisedPnLPercent;

      await position.save();
    } else {
      const pnl = calcUnrealisedPnL(
        { averagePrice: executionPrice, quantity: parseInt(quantity) },
        quote.price
      );

      position = await Position.create({
        userId,
        symbol: symbol.toUpperCase(),
        companyName: quote.name,
        quantity: parseInt(quantity),
        averagePrice: executionPrice,
        currentPrice: quote.price,
        totalInvested: total,
        unrealisedPnL: pnl.unrealisedPnL,
        unrealisedPnLPercent: pnl.unrealisedPnLPercent,
        isOpen: true,
      });
    }

    res.status(201).json({
      message: 'Buy order executed',
      order,
      position,
      newBalance: updatedUser.virtualBalance,
    });

  } catch (err) {
    console.error('[Order] placeBuyOrder error:', err.message);
    res.status(500).json({ message: 'Order failed', error: err.message });
  }
};

// POST /api/orders/sell
const placeSellOrder = async (req, res) => {
  /*
   * SELL ORDER BALANCE LOGIC
   * ─────────────────────────────────────────────────────────
   * When user sells shares, they receive the full sale proceeds
   * back into their virtual balance. This covers both cases:
   *
   * PROFIT SCENARIO:
   *   Bought 1 share @ $100 → balance was reduced by $100
   *   Sell  1 share @ $110 → balance credited with $110
   *   Net effect: +$10 profit on balance ✓
   *
   * LOSS SCENARIO:
   *   Bought 1 share @ $100 → balance was reduced by $100
   *   Sell  1 share @ $90  → balance credited with $90
   *   Net effect: -$10 loss on balance ✓
   *
   * Formula: newBalance = currentBalance + (sellPrice × quantity)
   * RealisedPnL = (sellPrice - avgBuyPrice) × quantity
   * ─────────────────────────────────────────────────────────
   */
  try {
    const { symbol, quantity } = req.body;
    const userId = req.user._id;

    if (!symbol || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Symbol and quantity are required' });
    }

    // Find open position
    const position = await Position.findOne({
      userId,
      symbol: symbol.toUpperCase(),
      isOpen: true,
    });

    if (!position) {
      return res.status(400).json({ message: 'No open position for this symbol' });
    }

    if (position.quantity < parseInt(quantity)) {
      return res.status(400).json({
        message: `You only have ${position.quantity} shares of ${symbol}`,
      });
    }

    // Fetch live price
    const quote = await getQuote(symbol.toUpperCase());
    if (!quote || !quote.price) {
      return res.status(400).json({ message: 'Could not fetch current price' });
    }

    const executionPrice = quote.price;
    const sellQty = parseInt(quantity);
    
    // Credit = full sale proceeds (original investment back + profit/loss)
    const saleProceeds = parseFloat((executionPrice * sellQty).toFixed(2));
    const realisedPnL = parseFloat(
      ((executionPrice - position.averagePrice) * sellQty).toFixed(2)
    );

    // Credit balance
    const user = await User.findById(userId);
    
    const newBalance = parseFloat(
      (user.virtualBalance + saleProceeds).toFixed(2)
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { virtualBalance: newBalance } },
      { new: true }
    );

    console.log(`[Sell] Sale proceeds: $${saleProceeds}`);
    console.log(`[Sell] Balance: $${user.virtualBalance} → $${newBalance}`);
    console.log(`[Sell] Realised P&L: $${realisedPnL}`);

    // Create sell order
    const order = await Order.create({
      userId,
      symbol: symbol.toUpperCase(),
      companyName: position.companyName,
      side: 'sell',
      orderType: 'market',
      quantity: sellQty,
      price: executionPrice,
      total: saleProceeds,
      status: 'executed',
      realisedPnL: realisedPnL,
    });

    // Update position
    position.quantity -= sellQty;

    if (position.quantity === 0) {
      position.isOpen = false;
      position.unrealisedPnL = 0;
      position.unrealisedPnLPercent = 0;
    } else {
      const pnl = calcUnrealisedPnL(position, executionPrice);
      position.unrealisedPnL = pnl.unrealisedPnL;
      position.unrealisedPnLPercent = pnl.unrealisedPnLPercent;
      position.totalInvested = parseFloat(
        (position.averagePrice * position.quantity).toFixed(2)
      );
    }

    position.currentPrice = executionPrice;
    await position.save();

    res.status(200).json({
      message: 'Sell order executed',
      order,
      position,
      realisedPnL,
      newBalance: updatedUser.virtualBalance,
    });

  } catch (err) {
    console.error('[Order] placeSellOrder error:', err.message);
    res.status(500).json({ message: 'Sell order failed', error: err.message });
  }
};

// GET /api/orders/history
const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ executedAt: -1 })
      .limit(100);
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
};

// GET /api/orders/positions
const getPositions = async (req, res) => {
  try {
    const positions = await Position.find({
      userId: req.user._id,
      isOpen: true,
    }).sort({ createdAt: -1 });

    // Update current prices for all positions
    const updated = await Promise.all(
      positions.map(async (pos) => {
        try {
          const quote = await getQuote(pos.symbol);
          if (quote && quote.price) {
            const pnl = calcUnrealisedPnL(pos, quote.price);
            pos.currentPrice = quote.price;
            pos.unrealisedPnL = pnl.unrealisedPnL;
            pos.unrealisedPnLPercent = pnl.unrealisedPnLPercent;
            await pos.save();
          }
        } catch (e) {
          // keep stale price if fetch fails
        }
        return pos;
      })
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch positions', error: err.message });
  }
};

// POST /api/orders/close/:positionId
const closePosition = async (req, res) => {
  try {
    const position = await Position.findOne({
      _id: req.params.positionId,
      userId: req.user._id,
      isOpen: true,
    });

    if (!position) {
      return res.status(404).json({ message: 'Position not found' });
    }

    // Sell entire quantity at market price
    req.body = { symbol: position.symbol, quantity: position.quantity };
    return placeSellOrder(req, res);

  } catch (err) {
    res.status(500).json({ message: 'Failed to close position', error: err.message });
  }
};

// GET /api/orders/pending
const getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id, status: 'pending' })
      .sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch pending orders', error: err.message });
  }
};

// PATCH /api/orders/cancel/:orderId
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, userId: req.user._id, status: 'pending' });
    if (!order) {
      return res.status(404).json({ message: 'Pending order not found' });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel order', error: err.message });
  }
};

module.exports = {
  placeBuyOrder,
  placeSellOrder,
  getOrderHistory,
  getPositions,
  closePosition,
  getPendingOrders,
  cancelOrder,
};
