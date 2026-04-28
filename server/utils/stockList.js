const STOCK_LIST = [
  // US Stocks
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
  'META', 'NVDA', 'NFLX', 'AMD', 'UBER',
  // Indian ADRs on NYSE (tradeable via Finnhub free tier)
  'INFY',   // Infosys
  'HDB',    // HDFC Bank
  'WIT',    // Wipro
  'IBN',    // ICICI Bank
  'TTM',    // Tata Motors
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
  'INFY':  { name: 'Infosys Ltd.',             exchange: 'NYSE'   },
  'HDB':   { name: 'HDFC Bank Ltd.',           exchange: 'NYSE'   },
  'WIT':   { name: 'Wipro Ltd.',               exchange: 'NYSE'   },
  'IBN':   { name: 'ICICI Bank Ltd.',          exchange: 'NYSE'   },
  'TTM':   { name: 'Tata Motors Ltd.',         exchange: 'NYSE'   },
};

module.exports = { STOCK_LIST, STOCK_META };
