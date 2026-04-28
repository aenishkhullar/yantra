const calcUnrealisedPnL = (position, currentPrice) => {
  const pnl = (currentPrice - position.averagePrice) * position.quantity;
  const pnlPercent = ((currentPrice - position.averagePrice) / position.averagePrice) * 100;
  return {
    unrealisedPnL: parseFloat(pnl.toFixed(2)),
    unrealisedPnLPercent: parseFloat(pnlPercent.toFixed(2)),
    currentValue: parseFloat((currentPrice * position.quantity).toFixed(2)),
  };
};

const calcRealisedPnL = (position, sellPrice, sellQty) => {
  const pnl = (sellPrice - position.averagePrice) * sellQty;
  return parseFloat(pnl.toFixed(2));
};

module.exports = { calcUnrealisedPnL, calcRealisedPnL };
