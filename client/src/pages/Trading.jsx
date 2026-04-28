import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPrice, getHistory } from '../services/marketService';
import { placeBuyOrder, placeSellOrder } from '../services/orderService';
import { useAuth } from '../context/AuthContext';
import { BarChart2 } from 'lucide-react';
import CandlestickChart from '../components/charts/CandlestickChart';

const STOCK_META = {
  'AAPL': { name: 'Apple Inc.', exchange: 'NASDAQ' },
  'MSFT': { name: 'Microsoft Corp.', exchange: 'NASDAQ' },
  'GOOGL': { name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  'AMZN': { name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  'TSLA': { name: 'Tesla Inc.', exchange: 'NASDAQ' },
  'META': { name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  'NVDA': { name: 'NVIDIA Corp.', exchange: 'NASDAQ' },
  'NFLX': { name: 'Netflix Inc.', exchange: 'NASDAQ' },
  'AMD': { name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
  'UBER': { name: 'Uber Technologies', exchange: 'NYSE' },
};

const Trading = () => {
  const { symbol: rawSymbol } = useParams();
  const symbol = rawSymbol.toUpperCase();
  const { user, refreshUser } = useAuth();
  
  const [quote, setQuote] = useState(null);
  const [mode, setMode] = useState('Buy');
  const [orderType, setOrderType] = useState('Market');
  const [quantity, setQuantity] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [activeTab, setActiveTab] = useState('1M');
  
  const [chartData, setChartData] = useState([]);
  const [chartPeriod, setChartPeriod] = useState('1mo');
  const [chartLoading, setChartLoading] = useState(true);
  
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);

  const virtualBalance = user?.virtualBalance || 100000;

  useEffect(() => {
    const fetchQuote = async () => {
      if (!symbol) return;
      try {
        const data = await getPrice(symbol);
        setQuote(data);
      } catch (err) {}
    };
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    const fetchHistory = async () => {
      setChartLoading(true);
      try {
        const data = await getHistory(symbol, chartPeriod);
        setChartData(data);
      } catch (err) {
        console.error('Chart data fetch error:', err);
        setChartData([]);
      } finally {
        setChartLoading(false);
      }
    };
    if (symbol) fetchHistory();
  }, [symbol, chartPeriod]);

  useEffect(() => {
    console.log('[Trading] chartData updated:', chartData.length, 'candles');
  }, [chartData]);

  const stockName = STOCK_META[symbol]?.name || symbol;
  const isPositive = quote?.changePercent >= 0;
  const currency = '$';

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
      background: #0f0f0f; border: 1px solid ${type === 'success' ? 'rgba(17,255,153,0.3)' : 'rgba(255,32,71,0.3)'};
      color: ${type === 'success' ? '#11ff99' : '#ff2047'};
      padding: 12px 24px; border-radius: 10px; font-family: Inter, sans-serif;
      font-size: 13px; z-index: 9999; white-space: nowrap;
      box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      const payload = {
        symbol,
        quantity: parseInt(quantity),
        orderType: orderType.toLowerCase(),
        limitPrice: limitPrice || null,
        stopLossPrice: stopLoss || null,
      };

      let result;
      if (mode === 'Buy') {
        result = await placeBuyOrder(payload);
      } else {
        result = await placeSellOrder({ symbol, quantity: parseInt(quantity) });
      }

      setOrderResult(result);
      await refreshUser();

      // Show success toast
      if (orderType === 'Limit') {
        showToast(`⏳ Limit order placed — watching for $${limitPrice}`, 'success');
      } else if (orderType === 'Stop-Loss') {
        showToast(`🛡 Stop-loss set at $${stopLoss}`, 'success');
      } else {
        showToast(
          mode === 'Buy'
            ? `✓ Bought ${quantity} shares of ${symbol} at $${result.order.price}`
            : `✓ Sold ${quantity} shares of ${symbol}. P&L: $${result.realisedPnL}`,
          'success'
        );
      }

      // Reset form
      setQuantity(1);
      setLimitPrice('');
      setStopLoss('');

    } catch (err) {
      const msg = err.response?.data?.message || 'Order failed';
      setOrderError(msg);
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '24px' }}>
      
      {/* Top Header Card */}
      <div style={{ 
        border: '1px solid rgba(214, 235, 253, 0.19)', 
        borderRadius: '12px', 
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Link to="/markets" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#a1a4a5', textDecoration: 'none' }}>
            ← Markets
          </Link>
          <div style={{ marginTop: '8px', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '18px', fontWeight: 500, color: '#f0f0f0' }}>
            {stockName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#a1a4a5' }}>{symbol}</span>
            <span style={{ 
              fontFamily: "'Inter', ui-sans-serif, system-ui", 
              fontSize: '9px', 
              padding: '1px 6px', 
              borderRadius: '9999px',
              border: '1px solid rgba(214, 235, 253, 0.19)',
              color: '#464a4d'
            }}>
              US
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '36px', fontWeight: 400, color: '#f0f0f0', lineHeight: 1 }}>
            {quote ? `${currency}${quote.price?.toFixed(2)}` : '--'}
          </div>
          {quote && (
            <div style={{
              fontFamily: "'Inter', ui-sans-serif, system-ui",
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: isPositive ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)',
              color: isPositive ? '#11ff99' : '#ff2047',
              display: 'inline-block',
              marginTop: '4px'
            }}>
              {isPositive ? '+' : ''}{quote.changePercent?.toFixed(2)}%
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#11ff99', boxShadow: '0 0 8px #11ff99', animation: 'pulse 2s infinite' }}></div>
            <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#11ff99', letterSpacing: '0.16em' }}>LIVE</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px' }}>
          {['Open', 'High', 'Low', 'Volume'].map(stat => (
            <div key={stat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#464a4d', textTransform: 'uppercase' }}>{stat}</span>
              <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>
                {quote ? (stat === 'Volume' ? quote[stat.toLowerCase()] : `${currency}${quote[stat.toLowerCase()]?.toFixed(2)}`) : '--'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        
        {/* Left Chart Column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            border: '1px solid rgba(214, 235, 253, 0.19)', 
            borderRadius: '16px', 
            background: '#030303',
            height: '100%',
            minHeight: '400px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(214, 235, 253, 0.19)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '14px', fontWeight: 500, color: '#f0f0f0' }}>{symbol}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[{label: '1D', val: '1d'}, {label: '1W', val: '5d'}, {label: '1M', val: '1mo'}, {label: '3M', val: '3mo'}].map(t => (
                  <button key={t.label} onClick={() => { setActiveTab(t.label); setChartPeriod(t.val); }} style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontFamily: "'Inter', ui-sans-serif, system-ui",
                    fontSize: '12px',
                    border: 'none',
                    background: activeTab === t.label ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: activeTab === t.label ? '#f0f0f0' : '#a1a4a5',
                    cursor: 'pointer'
                  }}>{t.label}</button>
                ))}
              </div>
            </div>
            
            <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%', minHeight: 380, position: 'relative' }}>
                {chartLoading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#030303',
                    borderRadius: 12,
                    zIndex: 10,
                  }}>
                    <div style={{ color: '#464a4d', fontSize: 13 }}>
                      Loading chart data...
                    </div>
                  </div>
                )}
                <CandlestickChart
                  data={chartData}
                  symbol={symbol}
                  loading={chartLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Order Column */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div style={{ 
            border: '1px solid rgba(214, 235, 253, 0.19)', 
            borderRadius: '16px', 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h2 style={{ margin: 0, fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '15px', fontWeight: 500, color: '#f0f0f0' }}>
              Place Order
            </h2>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: 0, 
              border: '1px solid rgba(214, 235, 253, 0.19)', 
              borderRadius: '9999px', 
              padding: '3px', 
              background: '#0a0a0a' 
            }}>
              <button 
                onClick={() => setMode('Buy')}
                style={{
                  padding: '6px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: mode === 'Buy' ? 'rgba(17,255,153,0.15)' : 'transparent',
                  color: mode === 'Buy' ? '#11ff99' : '#a1a4a5',
                  fontFamily: "'Inter', ui-sans-serif, system-ui",
                  fontSize: '13px',
                  fontWeight: mode === 'Buy' ? 500 : 400,
                  transition: 'background 0.15s',
                  cursor: 'pointer'
                }}
              >Buy</button>
              <button 
                onClick={() => setMode('Sell')}
                style={{
                  padding: '6px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: mode === 'Sell' ? 'rgba(255,32,71,0.15)' : 'transparent',
                  color: mode === 'Sell' ? '#ff2047' : '#a1a4a5',
                  fontFamily: "'Inter', ui-sans-serif, system-ui",
                  fontSize: '13px',
                  fontWeight: mode === 'Sell' ? 500 : 400,
                  transition: 'background 0.15s',
                  cursor: 'pointer'
                }}
              >Sell</button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['Market', 'Limit', 'Stop-Loss'].map(type => (
                <button 
                  key={type}
                  onClick={() => setOrderType(type)}
                  style={{
                    border: '1px solid',
                    borderColor: orderType === type ? 'rgba(214,235,253,0.35)' : 'rgba(214, 235, 253, 0.19)',
                    borderRadius: '9999px',
                    padding: '4px 12px',
                    background: orderType === type ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: orderType === type ? '#f0f0f0' : '#a1a4a5',
                    fontFamily: "'Inter', ui-sans-serif, system-ui",
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >{type}</button>
              ))}
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
                QUANTITY
              </label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0a0a0a',
                  border: '1px solid rgba(214, 235, 253, 0.19)',
                  borderRadius: '6px',
                  color: '#f0f0f0',
                  fontFamily: "'Commit Mono', ui-monospace, monospace",
                  fontSize: '14px',
                  padding: '10px 14px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            {orderType === 'Limit' && (
              <div style={{ animation: 'fadeIn 0.15s ease-in' }}>
                <label style={{ display: 'block', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
                  LIMIT PRICE
                </label>
                <input 
                  type="number" 
                  value={limitPrice}
                  onChange={e => setLimitPrice(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0a0a0a',
                    border: '1px solid rgba(214, 235, 253, 0.19)',
                    borderRadius: '6px',
                    color: '#f0f0f0',
                    fontFamily: "'Commit Mono', ui-monospace, monospace",
                    fontSize: '14px',
                    padding: '10px 14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#a1a4a5', marginTop: '4px' }}>
                  Order will execute when price reaches your limit
                </div>
              </div>
            )}

            {orderType === 'Stop-Loss' && (
              <div style={{ animation: 'fadeIn 0.15s ease-in' }}>
                <label style={{ display: 'block', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '6px' }}>
                  STOP-LOSS PRICE
                </label>
                <input 
                  type="number" 
                  value={stopLoss}
                  onChange={e => setStopLoss(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#0a0a0a',
                    border: '1px solid rgba(214, 235, 253, 0.19)',
                    borderRadius: '6px',
                    color: '#f0f0f0',
                    fontFamily: "'Commit Mono', ui-monospace, monospace",
                    fontSize: '14px',
                    padding: '10px 14px',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
                <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#ffc53d', marginTop: '4px' }}>
                  Position will auto-close if price drops to this level
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(214, 235, 253, 0.19)',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#a1a4a5' }}>Estimated Total</span>
                <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>
                  {currency}{quote ? (quantity * quote.price).toFixed(2) : '0.00'}
                </span>
              </div>
              <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#a1a4a5' }}>Available Balance</span>
                <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#a1a4a5' }}>
                  ${virtualBalance.toFixed(2)}
                </span>
              </div>
              <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#a1a4a5' }}>Order Type</span>
                <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#a1a4a5' }}>
                  {orderType}
                </span>
              </div>
            </div>

            <button 
              disabled={submitting}
              onClick={handleSubmit}
              style={{
                width: '100%',
                borderRadius: '9999px',
                padding: '12px',
                fontFamily: "'Inter', ui-sans-serif, system-ui",
                fontSize: '14px',
                fontWeight: 600,
                border: mode === 'Buy' ? 'none' : '1px solid rgba(255,32,71,0.4)',
                background: mode === 'Buy' ? '#ffffff' : 'rgba(255,32,71,0.1)',
                color: mode === 'Buy' ? '#000000' : '#ff2047',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1,
                transition: '0.15s'
              }}
            >
              {submitting ? 'Placing order...' : 
                orderType === 'Limit' ? 'Place Limit Order' :
                orderType === 'Stop-Loss' ? 'Set Stop-Loss' :
                `${mode} ${symbol}`}
            </button>

          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        input:focus {
          border-color: rgba(214, 235, 253, 0.5) !important;
        }
      `}</style>
    </div>
  );
};

export default Trading;