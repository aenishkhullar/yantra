const Order = require('../models/Order');
const Position = require('../models/Position');
const User = require('../models/User');

// GET /api/analytics/summary
exports.getSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch all EXECUTED orders for the user
    const orders = await Order.find({ userId, status: 'executed' });
    const sellTrades = orders.filter(o => o.side === 'sell');
    const buyTrades = orders.filter(o => o.side === 'buy');

    // Calculate Realised P&L stats
    let totalRealised = 0;
    let winningTradesCount = 0;
    let losingTradesCount = 0;
    let bestTrade = null;
    let worstTrade = null;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

    sellTrades.forEach(order => {
      const pnl = order.realisedPnL || 0;
      totalRealised += pnl;

      if (pnl > 0) {
        winningTradesCount++;
        totalWinAmount += pnl;
      } else if (pnl < 0) {
        losingTradesCount++;
        totalLossAmount += Math.abs(pnl);
      }

      if (!bestTrade || pnl > (bestTrade.realisedPnL || 0)) {
        bestTrade = order;
      }
      if (!worstTrade || pnl < (worstTrade.realisedPnL || 0)) {
        worstTrade = order;
      }
    });

    const winRate = sellTrades.length > 0 ? (winningTradesCount / sellTrades.length) * 100 : 0;
    const avgPnL = sellTrades.length > 0 ? totalRealised / sellTrades.length : 0;
    
    // Average Risk Reward Calculation
    const avgWin = winningTradesCount > 0 ? totalWinAmount / winningTradesCount : 0;
    const avgLoss = losingTradesCount > 0 ? totalLossAmount / losingTradesCount : 0;
    const avgRiskReward = avgLoss !== 0 ? avgWin / avgLoss : 0;

    // Fetch open positions for Unrealised P&L and Portfolio Value
    const positions = await Position.find({ userId, isOpen: true });
    
    let totalInvested = 0;
    let currentPortfolioValue = 0;
    let unrealisedPnL = 0;

    positions.forEach(pos => {
      totalInvested += pos.totalInvested;
      currentPortfolioValue += (pos.currentPrice * pos.quantity);
      unrealisedPnL += pos.unrealisedPnL;
    });

    const totalPnL = totalRealised + unrealisedPnL;

    res.status(200).json({
      totalTrades: orders.length,
      buyTrades: buyTrades.length,
      sellTrades: sellTrades.length,
      totalRealised,
      winningTrades: winningTradesCount,
      losingTrades: losingTradesCount,
      winRate,
      bestTrade,
      worstTrade,
      avgPnL,
      totalInvested,
      currentPortfolioValue,
      unrealisedPnL,
      totalPnL,
      avgRiskReward,
      openPositionsCount: positions.length
    });

  } catch (err) {
    console.error('[Analytics] getSummary error:', err.message);
    res.status(500).json({ message: 'Failed to fetch analytics summary', error: err.message });
  }
};

// GET /api/analytics/portfolio-history
exports.getPortfolioHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const startingBalance = 100000;

    // Fetch all executed orders sorted by date
    const orders = await Order.find({ userId, status: 'executed' }).sort({ executedAt: 1 });

    if (orders.length === 0) {
      return res.status(200).json([]);
    }

    const history = [];
    let currentCash = startingBalance;
    const holdings = {}; // symbol -> { quantity, avgPrice }

    // Start point: day before first trade
    const firstTradeDate = new Date(orders[0].executedAt);
    const dayBefore = new Date(firstTradeDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    
    history.push({
      date: dayBefore.toISOString().split('T')[0],
      value: startingBalance
    });

    // Group orders by date to reduce noise
    const ordersByDate = {};
    orders.forEach(order => {
      const date = order.executedAt.toISOString().split('T')[0];
      if (!ordersByDate[date]) ordersByDate[date] = [];
      ordersByDate[date].push(order);
    });

    const sortedDates = Object.keys(ordersByDate).sort();

    sortedDates.forEach(date => {
      const dateOrders = ordersByDate[date];
      
      dateOrders.forEach(order => {
        if (order.side === 'buy') {
          currentCash -= order.total;
          if (!holdings[order.symbol]) {
            holdings[order.symbol] = { quantity: 0, totalCost: 0 };
          }
          holdings[order.symbol].quantity += order.quantity;
          holdings[order.symbol].totalCost += order.total;
        } else {
          currentCash += order.total;
          if (holdings[order.symbol]) {
            const ratio = order.quantity / holdings[order.symbol].quantity;
            holdings[order.symbol].totalCost -= (holdings[order.symbol].totalCost * ratio);
            holdings[order.symbol].quantity -= order.quantity;
            if (holdings[order.symbol].quantity <= 0) {
              delete holdings[order.symbol];
            }
          }
        }
      });

      // Calculate portfolio value at end of this day
      // Note: Historical market prices aren't easily available here without complex logic
      // So we use currentCash + sum of historical cost of current holdings as an approximation 
      // or just track cash + realised P&L progression.
      // BUT the prompt asks for "currentCash + (all positions market value)".
      // Since we don't have historical market values, we'll use (currentCash + cost basis of holdings)
      // or just base it on the cash + realised P&L.
      // Let's refine: The prompt says "Walk through orders chronologically... return array of data points".
      
      let holdingsValueAtCost = 0;
      Object.values(holdings).forEach(h => {
        holdingsValueAtCost += h.totalCost;
      });

      history.push({
        date: date,
        value: currentCash + holdingsValueAtCost
      });
    });

    // Add current state as final data point
    const user = await User.findById(userId);
    const positions = await Position.find({ userId, isOpen: true });
    let currentOpenValue = 0;
    positions.forEach(p => {
      currentOpenValue += (p.currentPrice * p.quantity);
    });

    const todayStr = new Date().toISOString().split('T')[0];
    if (history.length > 0 && history[history.length - 1].date !== todayStr) {
        history.push({
            date: todayStr,
            value: user.virtualBalance + currentOpenValue
        });
    } else if (history.length > 0) {
        history[history.length - 1].value = user.virtualBalance + currentOpenValue;
    }

    res.status(200).json(history);

  } catch (err) {
    console.error('[Analytics] getPortfolioHistory error:', err.message);
    res.status(500).json({ message: 'Failed to fetch portfolio history', error: err.message });
  }
};

// GET /api/analytics/breakdown
exports.getTradeBreakdown = async (req, res) => {
  try {
    const userId = req.user._id;

    // Last 20 executed sell orders
    const trades = await Order.find({ 
      userId, 
      side: 'sell', 
      status: 'executed' 
    })
    .sort({ executedAt: -1 })
    .limit(20);

    res.status(200).json(trades);
  } catch (err) {
    console.error('[Analytics] getTradeBreakdown error:', err.message);
    res.status(500).json({ message: 'Failed to fetch trade breakdown', error: err.message });
  }
};
