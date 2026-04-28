const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  symbol: { type: String, required: true, uppercase: true },
  companyName: { type: String, default: '' },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  orderType: {
    type: String,
    enum: ['market', 'limit', 'stop-loss'],
    default: 'market',
  },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },        // execution price
  limitPrice: { type: Number, default: null },
  stopLossPrice: { type: Number, default: null },
  total: { type: Number, required: true },         // price × quantity
  status: {
    type: String,
    enum: ['pending', 'executed', 'cancelled'],
    default: 'market',  // market orders default to executed
  },
  filledAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null }, // null = GTC (good till cancelled)
  executedAt: { type: Date, default: Date.now },
  realisedPnL: { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
