import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPositions, closePosition } from '../services/orderService';
import { getAnalyticsSummary } from '../services/analyticsService';

const Portfolio = () => {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(null);

  const fetchData = async () => {
    try {
      const [pos, ana] = await Promise.all([
        getPositions(),
        getAnalyticsSummary()
      ]);
      setPositions(pos);
      setAnalytics(ana);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalInvested = analytics?.totalInvested || positions.reduce((s, p) => s + p.totalInvested, 0);
  const totalCurrentValue = analytics?.currentPortfolioValue || positions.reduce(
    (s, p) => s + p.currentPrice * p.quantity, 0
  );
  const unrealisedPnL = analytics?.unrealisedPnL ?? positions.reduce((s, p) => s + p.unrealisedPnL, 0);
  const realisedPnL = analytics?.totalRealised || 0;

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: 500, color: '#f0f0f0', marginBottom: '32px', marginTop: 0 }}>Portfolio</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '16px' }}>
        <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(214, 235, 253, 0.19)', background: 'transparent' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#a1a4a5', marginBottom: '8px', letterSpacing: '0.14em' }}>Total Invested</div>
          <div style={{ fontSize: '28px', fontFamily: "'Commit Mono', ui-monospace, monospace", color: '#f0f0f0' }}>${totalInvested.toFixed(2)}</div>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(214, 235, 253, 0.19)', background: 'transparent' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#a1a4a5', marginBottom: '8px', letterSpacing: '0.14em' }}>Current Value</div>
          <div style={{ fontSize: '28px', fontFamily: "'Commit Mono', ui-monospace, monospace", color: '#f0f0f0' }}>${totalCurrentValue.toFixed(2)}</div>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(214, 235, 253, 0.19)', background: 'transparent' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#a1a4a5', marginBottom: '8px', letterSpacing: '0.14em' }}>Unrealised P&L</div>
          <div style={{ fontSize: '28px', fontFamily: "'Commit Mono', ui-monospace, monospace", color: unrealisedPnL > 0.005 ? '#11ff99' : (unrealisedPnL < -0.005 ? '#ff2047' : '#f0f0f0') }}>
            {unrealisedPnL > 0.005 ? '+' : (unrealisedPnL < -0.005 ? '-' : '')}${Math.abs(unrealisedPnL).toFixed(2)}
          </div>
        </div>
        <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(214, 235, 253, 0.19)', background: 'transparent' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#a1a4a5', marginBottom: '8px', letterSpacing: '0.14em' }}>Realised P&L</div>
          <div style={{ fontSize: '28px', fontFamily: "'Commit Mono', ui-monospace, monospace", color: realisedPnL > 0.005 ? '#11ff99' : (realisedPnL < -0.005 ? '#ff2047' : '#f0f0f0') }}>
            {realisedPnL > 0.005 ? '+' : (realisedPnL < -0.005 ? '-' : '')}${Math.abs(realisedPnL).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <button 
          onClick={() => navigate('/analytics')}
          style={{ background: 'none', border: 'none', color: '#3b9eff', fontSize: '12px', cursor: 'pointer', padding: 0, fontFamily: 'Inter' }}
        >
          Go to Analytics →
        </button>
      </div>

      {positions.length === 0 ? (
        <div style={{ 
          padding: '60px', 
          border: '1px solid rgba(214, 235, 253, 0.19)', 
          borderRadius: '16px', 
          textAlign: 'center' 
        }}>
          <p style={{ fontSize: '14px', color: '#a1a4a5', marginBottom: '16px' }}>No open positions yet.</p>
          <button 
            onClick={() => navigate('/markets')}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              fontFamily: "'Inter', ui-sans-serif, system-ui",
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Go to Markets
          </button>
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(214, 235, 253, 0.19)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Symbol</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Company</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Qty</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Avg Price</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Current Price</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Invested</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>P&L</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>P&L%</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Stop-Loss</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Close</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const upnl = p.unrealisedPnL || 0;
                const upnlP = p.unrealisedPnLPercent || 0;
                const pnlColor = upnl > 0.005 ? '#11ff99' : (upnl < -0.005 ? '#ff2047' : '#a1a4a5');
                const pnlBg = upnl > 0.005 ? 'rgba(17,255,153,0.1)' : (upnl < -0.005 ? 'rgba(255,32,71,0.1)' : 'rgba(161, 164, 165, 0.1)');
                const isClosing = closing === p._id;
                
                return (
                  <tr key={p._id} style={{ 
                    borderBottom: '1px solid rgba(214, 235, 253, 0.19)',
                    borderLeft: `3px solid ${upnl > 0.005 ? 'rgba(17,255,153,0.4)' : (upnl < -0.005 ? 'rgba(255,32,71,0.4)' : 'rgba(161, 164, 165, 0.4)')}`
                  }}>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0', fontWeight: 500 }}>{p.symbol}</td>
                    <td style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5' }}>{p.companyName}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>{p.quantity}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#a1a4a5' }}>${p.averagePrice.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>${p.currentPrice.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#a1a4a5' }}>${p.totalInvested.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: upnl > 0.005 ? '#11ff99' : (upnl < -0.005 ? '#ff2047' : '#f0f0f0') }}>
                      {upnl > 0.005 ? '+' : (upnl < -0.005 ? '-' : '')}${Math.abs(upnl).toFixed(2)}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        background: pnlBg, 
                        color: pnlColor,
                        fontSize: '11px',
                        fontFamily: "'Inter', ui-sans-serif, system-ui"
                      }}>
                        {upnlP > 0.005 ? '+' : (upnlP < -0.005 ? '-' : '')}{upnlP.toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '12px', color: p.stopLossPrice ? '#ffc53d' : '#a1a4a5' }}>
                      {p.stopLossPrice ? `$${p.stopLossPrice.toFixed(2)}` : '--'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        disabled={isClosing}
                        onClick={() => {
                          if (window.confirm(`Close entire position in ${p.symbol}?`)) {
                            setClosing(p._id);
                            closePosition(p._id).then(fetchPositions).catch(err => {
                              console.error('Failed to close position', err);
                              setClosing(null);
                            });
                          }
                        }}
                        style={{
                          border: '1px solid rgba(214, 235, 253, 0.19)',
                          borderRadius: '9999px',
                          padding: '4px 12px',
                          background: 'transparent',
                          color: '#a1a4a5',
                          fontFamily: "'Inter', ui-sans-serif, system-ui",
                          fontSize: '12px',
                          cursor: 'pointer',
                          opacity: isClosing ? 0.5 : 1,
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.target.style.color = '#ff2047';
                          e.target.style.borderColor = 'rgba(255,32,71,0.4)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.color = '#a1a4a5';
                          e.target.style.borderColor = 'rgba(214, 235, 253, 0.19)';
                        }}
                      >
                        {isClosing ? 'Closing...' : 'Close'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>

  );
};

export default Portfolio;