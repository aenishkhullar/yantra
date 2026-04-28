import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllPrices } from '../services/marketService';
import { Search, RotateCw, AlertCircle } from 'lucide-react';

const SkeletonRows = () => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {[...Array(8)].map((_, i) => (
      <div key={i} style={{ display: 'flex', padding: '12px 16px', borderBottom: '1px solid rgba(214,235,253,0.08)' }}>
        <div style={{ width: '40px' }}><div className="skeleton-box" style={{ width: '20px', height: '14px' }}></div></div>
        <div style={{ flex: 2 }}><div className="skeleton-box" style={{ width: '120px', height: '14px' }}></div></div>
        <div style={{ width: '120px' }}><div className="skeleton-box" style={{ width: '80px', height: '14px', marginLeft: 'auto' }}></div></div>
        <div style={{ width: '100px' }}><div className="skeleton-box" style={{ width: '60px', height: '18px', marginLeft: 'auto', borderRadius: '9999px' }}></div></div>
        <div style={{ width: '90px' }}><div className="skeleton-box" style={{ width: '50px', height: '14px', marginLeft: 'auto' }}></div></div>
        <div style={{ width: '90px' }}><div className="skeleton-box" style={{ width: '50px', height: '14px', marginLeft: 'auto' }}></div></div>
        <div style={{ width: '100px' }}><div className="skeleton-box" style={{ width: '60px', height: '14px', marginLeft: 'auto' }}></div></div>
        <div style={{ width: '80px' }}><div className="skeleton-box" style={{ width: '60px', height: '24px', marginLeft: 'auto', borderRadius: '9999px' }}></div></div>
      </div>
    ))}
  </div>
);

const ErrorState = ({ message, onRetry }) => (
  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
    <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '48px', textAlign: 'center', maxWidth: '400px' }}>
      <AlertCircle size={32} color="#ff2047" style={{ marginBottom: '12px' }} />
      <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '15px', color: '#f0f0f0' }}>Failed to load market data</div>
      <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', color: '#a1a4a5', marginTop: '4px' }}>{message}</div>
      <button 
        onClick={onRetry}
        style={{
          marginTop: '16px',
          padding: '8px 20px',
          borderRadius: '9999px',
          background: '#ffffff',
          color: '#000000',
          border: 'none',
          fontFamily: "'Inter', ui-sans-serif, system-ui",
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer'
        }}
      >
        Retry
      </button>
    </div>
  </div>
);

const EmptyState = ({ message }) => (
  <div style={{ padding: '32px', textAlign: 'center', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '14px', color: '#a1a4a5' }}>
    {message}
  </div>
);

const StockRow = ({ stock, index }) => {
  const navigate = useNavigate();
  const isPositive = stock.changePercent >= 0;
  const currency = '$';
  
  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
    if (vol >= 1000) return (vol / 1000).toFixed(1) + 'K';
    return vol.toString();
  };

  return (
    <div 
      onClick={() => navigate(`/trading/${stock.symbol}`)}
      style={{ 
        display: 'flex', 
        alignItems: 'center',
        padding: '12px 16px', 
        borderRadius: '10px',
        borderBottom: '1px solid rgba(214,235,253,0.08)',
        cursor: 'pointer',
        transition: 'background 0.12s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ width: '40px', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#464a4d' }}>
        {index}
      </div>
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', fontWeight: 500, color: '#f0f0f0' }}>{stock.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '11px', color: '#a1a4a5' }}>{stock.symbol}</span>
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
      <div style={{ width: '120px', textAlign: 'right', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>
        {currency}{stock.price?.toFixed(2) || '--'}
      </div>
      <div style={{ width: '100px', textAlign: 'right' }}>
        <span style={{ 
          fontFamily: "'Inter', ui-sans-serif, system-ui", 
          fontSize: '11px', 
          padding: '2px 8px', 
          borderRadius: '9999px',
          background: isPositive ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)',
          color: isPositive ? '#11ff99' : '#ff2047',
          display: 'inline-block'
        }}>
          {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
        </span>
      </div>
      <div style={{ width: '90px', textAlign: 'right', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '12px', color: '#a1a4a5' }}>
        {currency}{stock.high?.toFixed(2) || '--'}
      </div>
      <div style={{ width: '90px', textAlign: 'right', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '12px', color: '#a1a4a5' }}>
        {currency}{stock.low?.toFixed(2) || '--'}
      </div>
      <div style={{ width: '100px', textAlign: 'right', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#a1a4a5' }}>
        {formatVolume(stock.volume)}
      </div>
      <div style={{ width: '80px', textAlign: 'right' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/trading/${stock.symbol}`);
          }}
          style={{
            padding: '5px 12px',
            borderRadius: '9999px',
            background: 'transparent',
            color: '#f0f0f0',
            border: '1px solid rgba(214, 235, 253, 0.19)',
            fontFamily: "'Inter', ui-sans-serif, system-ui",
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Trade →
        </button>
      </div>
    </div>
  );
};

const Markets = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('US Stocks');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);

  const fetchPrices = async () => {
    setIsSpinning(true);
    try {
      setError(null);
      const data = await getAllPrices();
      setStocks(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Markets fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load market data');
    } finally {
      setLoading(false);
      setTimeout(() => setIsSpinning(false), 500);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch =
      search.trim() === '' ||
      stock.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (stock.name && stock.name.toLowerCase().includes(search.toLowerCase()));

    const matchesTab = true; // All stocks are US now

    return matchesSearch && matchesTab;
  });

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '24px', fontWeight: 500, color: '#f0f0f0' }}>
            Markets
          </h1>
          <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', color: '#a1a4a5' }}>
            {stocks.length} stocks · prices update every 60s
          </div>
        </div>
        <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#464a4d' }}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Updating...'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ flex: 1, maxWidth: '320px', position: 'relative' }}>
          <Search size={14} color="#464a4d" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search symbol or company…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px 9px 36px',
              borderRadius: '8px',
              border: '1px solid rgba(214, 235, 253, 0.19)',
              background: '#0a0a0a',
              color: '#f0f0f0',
              fontFamily: "'Inter', ui-sans-serif, system-ui",
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button 
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #ffffff',
              fontFamily: "'Inter', ui-sans-serif, system-ui",
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            US Stocks
          </button>
        </div>

        <button 
          onClick={fetchPrices}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '9999px',
            border: '1px solid rgba(214, 235, 253, 0.19)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <RotateCw size={14} color="#a1a4a5" style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          padding: '0 16px', 
          marginBottom: '8px',
          fontFamily: "'Inter', ui-sans-serif, system-ui",
          fontSize: '10px',
          color: '#464a4d',
          textTransform: 'uppercase',
          letterSpacing: '0.12em'
        }}>
          <div style={{ width: '40px' }}>#</div>
          <div style={{ flex: 2 }}>Name</div>
          <div style={{ width: '120px', textAlign: 'right' }}>Price</div>
          <div style={{ width: '100px', textAlign: 'right' }}>Change</div>
          <div style={{ width: '90px', textAlign: 'right' }}>High</div>
          <div style={{ width: '90px', textAlign: 'right' }}>Low</div>
          <div style={{ width: '100px', textAlign: 'right' }}>Volume</div>
          <div style={{ width: '80px', textAlign: 'right' }}>Action</div>
        </div>

        {loading && <SkeletonRows />}

        {!loading && error && (
          <ErrorState message={error} onRetry={fetchPrices} />
        )}

        {!loading && !error && stocks.length === 0 && (
          <EmptyState message="No market data loaded. Check server logs." />
        )}

        {!loading && !error && stocks.length > 0 && filteredStocks.length === 0 && (
          <EmptyState message={`No stocks match "${search}"`} />
        )}

        {!loading && !error && filteredStocks.length > 0 && (
          <div>
            {filteredStocks.map((stock, index) => (
              <StockRow key={stock.symbol} stock={stock} index={index + 1} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .skeleton-box {
          background: #111;
          border-radius: 4px;
          background-image: linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Markets;