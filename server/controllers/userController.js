const User = require('../models/User');
const Order = require('../models/Order');
const Position = require('../models/Position');
const bcrypt = require('bcryptjs');

// GET /api/user/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    const [orders, openPositions] = await Promise.all([
      Order.find({ userId: req.user._id, status: 'executed' }),
      Position.find({ userId: req.user._id, isOpen: true }),
    ]);

    const sellOrders = orders.filter((o) => o.side === 'sell');
    const totalVolume = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalRealised = sellOrders.reduce(
      (sum, o) => sum + (o.realisedPnL || 0), 0
    );
    const unrealisedPnL = openPositions.reduce(
      (sum, p) => sum + (p.unrealisedPnL || 0), 0
    );
    const currentPortfolioValue =
      user.virtualBalance +
      openPositions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
    const returnPercent =
      ((currentPortfolioValue - 100000) / 100000) * 100;

    res.status(200).json({
      user,
      stats: {
        totalTrades: orders.length,
        totalVolume: parseFloat(totalVolume.toFixed(2)),
        totalRealised: parseFloat(totalRealised.toFixed(2)),
        unrealisedPnL: parseFloat(unrealisedPnL.toFixed(2)),
        openPositions: openPositions.length,
        currentPortfolioValue: parseFloat(currentPortfolioValue.toFixed(2)),
        returnPercent: parseFloat(returnPercent.toFixed(2)),
        memberSince: user.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// PATCH /api/user/display-name
const updateDisplayName = async (req, res) => {
  try {
    const { displayName } = req.body;

    if (!displayName || displayName.trim().length < 2) {
      return res.status(400).json({
        message: 'Display name must be at least 2 characters',
      });
    }

    if (displayName.trim().length > 30) {
      return res.status(400).json({
        message: 'Display name cannot exceed 30 characters',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { displayName: displayName.trim() } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Display name updated',
      user,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update name', error: err.message });
  }
};

// PATCH /api/user/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Both current and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: 'New password must be different from current password',
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

module.exports = { getProfile, updateDisplayName, changePassword };
