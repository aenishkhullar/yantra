const JournalEntry = require('../models/JournalEntry');
const Order = require('../models/Order');

// GET /api/journal — get all journal entries for user
const getEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.status(200).json(entries);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journal', error: err.message });
  }
};

// POST /api/journal — create a manual journal entry
const createEntry = async (req, res) => {
  try {
    const {
      symbol, side, entryPrice, exitPrice, quantity,
      entryThought, exitThought, tags, mood,
    } = req.body;

    if (!symbol || !side) {
      return res.status(400).json({ message: 'Symbol and side are required' });
    }

    const entry = await JournalEntry.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      side,
      entryPrice: entryPrice || null,
      exitPrice: exitPrice || null,
      quantity: quantity || null,
      entryThought: entryThought || '',
      exitThought: exitThought || '',
      tags: tags || [],
      mood: mood || 'neutral',
      isManual: true,
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create entry', error: err.message });
  }
};

// PATCH /api/journal/:id — update entry thoughts and tags
const updateEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    const { entryThought, exitThought, tags, mood } = req.body;

    if (entryThought !== undefined) entry.entryThought = entryThought;
    if (exitThought !== undefined) entry.exitThought = exitThought;
    if (tags !== undefined) entry.tags = tags;
    if (mood !== undefined) entry.mood = mood;

    await entry.save();
    res.status(200).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update entry', error: err.message });
  }
};

// DELETE /api/journal/:id — delete a journal entry
const deleteEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    res.status(200).json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete entry', error: err.message });
  }
};

// POST /api/journal/from-order/:orderId
// Auto-create a journal entry from an existing order
const createFromOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if journal entry already exists for this order
    const existing = await JournalEntry.findOne({
      orderId: order._id,
      userId: req.user._id,
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const entry = await JournalEntry.create({
      userId: req.user._id,
      orderId: order._id,
      symbol: order.symbol,
      side: order.side,
      entryPrice: order.side === 'buy' ? order.price : null,
      exitPrice: order.side === 'sell' ? order.price : null,
      quantity: order.quantity,
      realisedPnL: order.realisedPnL || null,
      entryThought: '',
      exitThought: '',
      tags: [],
      mood: 'neutral',
      isManual: false,
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create from order', error: err.message });
  }
};

// GET /api/journal/stats — tag frequency and mood breakdown
const getStats = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ userId: req.user._id });

    const tagCount = {};
    const moodCount = {};

    entries.forEach((e) => {
      e.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
      if (e.mood) {
        moodCount[e.mood] = (moodCount[e.mood] || 0) + 1;
      }
    });

    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));

    res.status(200).json({
      totalEntries: entries.length,
      tagBreakdown: sortedTags,
      moodBreakdown: moodCount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch stats', error: err.message });
  }
};

module.exports = {
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  createFromOrder,
  getStats,
};
