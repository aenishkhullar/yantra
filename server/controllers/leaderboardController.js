const User = require('../models/User');
const Order = require('../models/Order');
const Position = require('../models/Position');

// Helper to calculate full leaderboard data
const calculateLeaderboardData = async (period) => {
  // period: 'week' | 'month' | 'all' — default 'all'
  let dateFilter = {};
  if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    dateFilter = { executedAt: { $gte: weekAgo } };
  } else if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    dateFilter = { executedAt: { $gte: monthAgo } };
  }

  // Get all users
  const users = await User.find({}, 'displayName email virtualBalance createdAt');

  // For each user calculate leaderboard stats
  const leaderboardData = await Promise.all(
    users.map(async (user) => {
      // Get all executed orders for this user (with period filter)
      const orders = await Order.find({
        userId: user._id,
        status: 'executed',
        ...dateFilter,
      });

      const sellOrders = orders.filter((o) => o.side === 'sell');

      // Total realised PnL from sell orders
      const totalRealisedPnL = sellOrders.reduce(
        (sum, o) => sum + (o.realisedPnL || 0), 0
      );

      // Win rate
      const winningTrades = sellOrders.filter((o) => (o.realisedPnL || 0) > 0);
      const winRate = sellOrders.length > 0
        ? (winningTrades.length / sellOrders.length) * 100
        : 0;

      // Best single trade
      const bestTrade = sellOrders.reduce((best, o) => {
        if (!best || (o.realisedPnL || 0) > (best.realisedPnL || 0)) return o;
        return best;
      }, null);

      // Open positions unrealised PnL
      const openPositions = await Position.find({
        userId: user._id,
        isOpen: true,
      });
      const unrealisedPnL = openPositions.reduce(
        (sum, p) => sum + (p.unrealisedPnL || 0), 0
      );

      // REALIZED return % from starting 100000
      const startingBalance = 100000;
      const returnPercent = (totalRealisedPnL / startingBalance) * 100;

      // Current Value (Total Equity) for display
      const currentValue = user.virtualBalance + openPositions.reduce(
        (sum, p) => sum + (p.currentPrice * p.quantity), 0
      );

      return {
        userId: user._id.toString(),
        displayName: user.displayName,
        virtualBalance: user.virtualBalance,
        currentValue: parseFloat(currentValue.toFixed(2)),
        totalRealisedPnL: parseFloat(totalRealisedPnL.toFixed(2)),
        unrealisedPnL: parseFloat(unrealisedPnL.toFixed(2)),
        returnPercent: parseFloat(returnPercent.toFixed(2)),
        totalTrades: sellOrders.length, // Count only completed trades
        winRate: parseFloat(winRate.toFixed(1)),
        bestTrade: bestTrade ? {
          symbol: bestTrade.symbol,
          pnl: parseFloat((bestTrade.realisedPnL || 0).toFixed(2)),
        } : null,
        openPositions: openPositions.length,
        memberSince: user.createdAt,
      };
    })
  );

  // New Intelligent Sorting Logic:
  // 1. Primary: returnPercent descending
  // 2. Secondary: winRate descending
  // 3. Tertiary: totalTrades descending
  leaderboardData.sort((a, b) => {
    // Return % check
    if (b.returnPercent !== a.returnPercent) {
      return b.returnPercent - a.returnPercent;
    }
    // Win Rate check
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    // Trades activity check
    return b.totalTrades - a.totalTrades;
  });

  // Add rank
  return leaderboardData.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

const getLeaderboard = async (req, res) => {
  try {
    const { period } = req.query;
    const ranked = await calculateLeaderboardData(period);
    res.status(200).json(ranked);
  } catch (err) {
    console.error('[Leaderboard] Error:', err.message);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: err.message });
  }
};

const getUserRank = async (req, res) => {
  try {
    const { period } = req.query;
    const ranked = await calculateLeaderboardData(period);
    
    const rankEntry = ranked.find(
      (r) => r.userId === req.user._id.toString()
    );

    if (!rankEntry) {
      return res.status(200).json({ rank: ranked.length + 1, total: ranked.length });
    }

    res.status(200).json({ rank: rankEntry.rank, total: ranked.length });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get rank', error: err.message });
  }
};

module.exports = { getLeaderboard, getUserRank };

