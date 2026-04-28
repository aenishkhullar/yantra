const STOCK_LIST = [
  // US Stocks
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'META', 'NVDA', 'NFLX', 'AMD', 'UBER',
];

const STOCK_META = {
  'AAPL':  { name: 'Apple Inc.',              exchange: 'NASDAQ' },
  'MSFT':  { name: 'Microsoft Corp.',          exchange: 'NASDAQ' },
  'GOOGL': { name: 'Alphabet Inc.',            exchange: 'NASDAQ' },
  'AMZN':  { name: 'Amazon.com Inc.',          exchange: 'NASDAQ' },
  'TSLA':  { name: 'Tesla Inc.',               exchange: 'NASDAQ' },
  'META':  { name: 'Meta Platforms Inc.',      exchange: 'NASDAQ' },
  'NVDA':  { name: 'NVIDIA Corp.',             exchange: 'NASDAQ' },
  'NFLX':  { name: 'Netflix Inc.',             exchange: 'NASDAQ' },
  'AMD':   { name: 'Advanced Micro Devices',   exchange: 'NASDAQ' },
  'UBER':  { name: 'Uber Technologies',        exchange: 'NYSE'   },
};

module.exports = { STOCK_LIST, STOCK_META };
