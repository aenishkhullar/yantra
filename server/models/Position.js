const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  averagePrice: { type: Number, required: true },  // avg buy price
  currentPrice: { type: Number, default: 0 },
  stopLossPrice: { type: Number, default: null },
  totalInvested: { type: Number, required: true },
  unrealisedPnL: { type: Number, default: 0 },
  unrealisedPnLPercent: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: true },
}, { timestamps: true });

// One open position per user per symbol
positionSchema.index({ userId: 1, symbol: 1, isOpen: 1 });

module.exports = mongoose.model('Position', positionSchema);
