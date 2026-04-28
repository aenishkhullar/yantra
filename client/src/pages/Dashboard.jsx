import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllPrices } from '../services/marketService';
import { getPositions, getOrderHistory } from '../services/orderService';
import { getAnalyticsSummary } from '../services/analyticsService';
import { Clock } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [marketData, setMarketData] = useState([]);
  const [marketLoading, setMarketLoading] = useState(true);
  
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getAllPrices()
      .then((data) => {
        setMarketData(data.slice(0, 5));
        setMarketLoading(false);
      })
      .catch((err) => {
        console.error('Dashboard market fetch error:', err);
        setMarketLoading(false);
      });
      
    getPositions().then(setPositions).catch(() => {});
    getOrderHistory().then(setOrders).catch(() => {});
    getAnalyticsSummary().then(setSummary).catch(() => {});
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.displayName || 'Trader';
  const virtualBalance = user?.virtualBalance || 100000;

  const totalPnL = summary?.totalPnL ?? positions.reduce((s, p) => s + p.unrealisedPnL, 0);
  const winRate = summary ? `${summary.winRate.toFixed(1)}%` : '0%';
  const openPositionsCount = summary ? summary.openPositionsCount : positions.length;

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yr ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " mo ago";
    interval = seconds / 86400;
    if (interval > 1) {
        if(Math.floor(interval) === 1) return "Yesterday";
        return Math.floor(interval) + " days ago";
    }
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hr ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return Math.floor(seconds) + " sec ago";
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ 
          margin: '0 0 4px 0', 
          fontFamily: "'Inter', ui-sans-serif, system-ui", 
          fontSize: '22px', 
          fontWeight: 500, 
          color: '#f0f0f0' 
        }}>
          {getGreeting()}, {displayName}
        </h1>
        <div style={{ 
          fontFamily: "'Inter', ui-sans-serif, system-ui", 
          fontSize: '14px', 
          color: '#a1a4a5' 
        }}>
          Here's your trading overview.
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {/* Card 1 */}
        <div style={{ flex: 1, border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
          <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>VIRTUAL BALANCE</div>
          <div style={{ marginTop: '10px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '26px', fontWeight: 400, color: '#f0f0f0' }}>
            ${virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '8px', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#464a4d' }}>Available cash</div>
        </div>

        {/* Card 2 */}
        <div style={{ flex: 1, border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
          <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>TOTAL P&L</div>
          <div style={{ marginTop: '10px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '26px', fontWeight: 400, color: totalPnL > 0.005 ? '#11ff99' : (totalPnL < -0.005 ? '#ff2047' : '#f0f0f0') }}>
            {totalPnL > 0.005 ? '+' : (totalPnL < -0.005 ? '-' : '')}${Math.abs(totalPnL).toFixed(2)}
          </div>
          <div style={{ marginTop: '8px' }}>
            <span style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '9999px', padding: '2px 8px', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#a1a4a5' }}>
              {orders.length} trades
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div style={{ flex: 1, border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
          <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>OPEN POSITIONS</div>
          <div style={{ marginTop: '10px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '26px', fontWeight: 400, color: '#3b9eff' }}>
            {openPositionsCount}
          </div>
          <div style={{ marginTop: '8px', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#464a4d' }}>
            {openPositionsCount > 0 ? 'Active trades' : 'No active trades'}
          </div>
        </div>

        {/* Card 4 */}
        <div style={{ flex: 1, border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
          <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>WIN RATE</div>
          <div style={{ marginTop: '10px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '26px', fontWeight: 400, color: '#ffc53d' }}>
            {winRate}
          </div>
          <div style={{ marginTop: '8px', fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#464a4d' }}>Based on realized P&L</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 2 }}>
          <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Quick Market</div>
              <Link to="/markets" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#3b9eff', textDecoration: 'none' }}>
                View all →
              </Link>
            </div>
            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px 12px -24px' }}></div>
            
            {marketLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ 
                    height: '42px', 
                    borderRadius: '4px', 
                    background: 'linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite linear'
                  }}></div>
                ))}
              </div>
            ) : (
              <div>
                {marketData.map((stock, idx) => (
                  <div key={stock.symbol} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 0', 
                    borderBottom: idx === marketData.length - 1 ? 'none' : '1px solid rgba(214, 235, 253, 0.19)' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', fontWeight: 500, color: '#f0f0f0' }}>{stock.name || stock.symbol}</span>
                      <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '11px', color: '#a1a4a5' }}>{stock.symbol}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>{stock.symbol.endsWith('.NS') ? '₹' : '$'}{stock.price?.toFixed(2)}</span>
                      <span style={{ 
                        fontFamily: "'Inter', ui-sans-serif, system-ui", 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '9999px',
                        background: stock.changePercent >= 0 ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)',
                        color: stock.changePercent >= 0 ? '#11ff99' : '#ff2047'
                      }}>
                        {stock.changePercent > 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>
              Recent Activity
            </div>
            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px' }}></div>
            
            <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.length === 0 ? (
                <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Clock size={28} color="#464a4d" />
                  <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '14px', color: '#a1a4a5', marginTop: '12px' }}>No trades yet</div>
                  <div style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '12px', color: '#464a4d', marginTop: '4px' }}>Your trade history will appear here.</div>
                  <Link to="/markets" style={{ 
                    marginTop: '16px', 
                    padding: '6px 16px', 
                    borderRadius: '9999px', 
                    background: '#ffffff', 
                    color: '#000000', 
                    fontFamily: "'Inter', ui-sans-serif, system-ui", 
                    fontSize: '13px', 
                    fontWeight: 500, 
                    textDecoration: 'none',
                    display: 'inline-block'
                  }}>
                    Start Trading →
                  </Link>
                </div>
              ) : (
                orders.slice(0, 5).map(o => (
                  <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        background: o.side === 'buy' ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)', 
                        color: o.side === 'buy' ? '#11ff99' : '#ff2047',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', ui-sans-serif, system-ui"
                      }}>
                        {o.side}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>{o.symbol}</span>
                        <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '11px', color: '#a1a4a5' }}>
                          {timeAgo(o.executedAt)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0', textAlign: 'right' }}>
                      ${o.total.toFixed(2)}
                      <div style={{ fontSize: '10px', color: '#a1a4a5' }}>{o.quantity} × ${o.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;