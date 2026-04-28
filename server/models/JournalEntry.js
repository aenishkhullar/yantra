const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null,
  },
  symbol: { type: String, required: true, uppercase: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  entryPrice: { type: Number, default: null },
  exitPrice: { type: Number, default: null },
  quantity: { type: Number, default: null },
  realisedPnL: { type: Number, default: null },
  entryThought: { type: String, default: '', maxlength: 1000 },
  exitThought: { type: String, default: '', maxlength: 1000 },
  tags: {
    type: [String],
    enum: [
      'Disciplined',
      'FOMO',
      'Revenge Trade',
      'Good Entry',
      'Bad Exit',
      'Overconfident',
      'Cut Loss',
      'Followed Plan',
      'Emotional',
      'Patient',
    ],
    default: [],
  },
  mood: {
    type: String,
    enum: ['confident', 'nervous', 'neutral', 'excited', 'fearful'],
    default: 'neutral',
  },
  isManual: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
