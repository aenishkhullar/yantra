const mongoose = require('mongoose');

const priceCacheSchema = new mongoose.Schema({
  symbol:         { type: String, required: true, unique: true, uppercase: true },
  name:           { type: String, default: '' },
  price:          { type: Number, required: true },
  change:         { type: Number, default: 0 },
  changePercent:  { type: Number, default: 0 },
  volume:         { type: Number, default: 0 },
  high:           { type: Number, default: 0 },
  low:            { type: Number, default: 0 },
  open:           { type: Number, default: 0 },
  previousClose:  { type: Number, default: 0 },
  savedAt:        { type: Date, default: Date.now },
  marketWasOpen:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PriceCache', priceCacheSchema);
