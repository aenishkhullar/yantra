import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarket } from '../../context/MarketContext';

const Topbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { connected, marketOpen, fromCache } = useMarket();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/markets') return 'Markets';
    if (path.startsWith('/trading')) return 'Trading';
    if (path === '/portfolio') return 'Portfolio';
    if (path === '/orders') return 'Order History';
    if (path === '/analytics') return 'Analytics';
    if (path === '/journal') return 'Journal';
    if (path === '/leaderboard') return 'Leaderboard';
    if (path === '/settings') return 'Settings';
    return '';
  };

  const displayName = user?.displayName || 'Trader';
  const firstLetter = displayName.charAt(0).toUpperCase();
  const virtualBalance = user?.virtualBalance || 100000;

  return (
    <div style={{
      width: '100%',
      height: '56px',
      background: '#000000',
      borderBottom: '1px solid rgba(214, 235, 253, 0.19)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      position: 'relative',
      zIndex: 10,
      boxSizing: 'border-box'
    }}>
      <div style={{
        fontFamily: "'Inter', ui-sans-serif, system-ui",
        fontSize: '15px',
        fontWeight: 500,
        color: '#f0f0f0'
      }}>
        {getPageTitle()}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          border: '1px solid rgba(214, 235, 253, 0.19)',
          borderRadius: '9999px',
          padding: '4px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: connected ? (marketOpen ? '#11ff99' : '#ff2047') : '#ffc53d',
            boxShadow: connected && marketOpen ? '0 0 6px #11ff99' : 'none',
            animation: connected && marketOpen ? 'pulse 2s infinite' : !connected ? 'pulse 1s infinite' : 'none'
          }}></div>
          <span style={{
            fontFamily: "'Inter', ui-sans-serif, system-ui",
            fontSize: '11px',
            color: '#a1a4a5',
            display: 'flex',
            alignItems: 'center'
          }}>
            {connected ? (marketOpen ? 'NYSE Open' : 'Market Closed') : 'Reconnecting...'}
            {fromCache && (
              <span style={{
                fontFamily: "'Commit Mono', ui-monospace, monospace",
                fontSize: '9px',
                color: '#464a4d',
                border: '1px solid rgba(214, 235, 253, 0.19)',
                borderRadius: '3px',
                padding: '1px 5px',
                marginLeft: '6px'
              }}>
                Cached
              </span>
            )}
          </span>
        </div>

        <div style={{
          borderLeft: '1px solid rgba(214,235,253,0.19)',
          height: '20px'
        }}></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '9999px',
            background: 'rgba(59,158,255,0.15)',
            border: '1px solid rgba(59,158,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', ui-sans-serif, system-ui",
            fontSize: '12px',
            fontWeight: 600,
            color: '#3b9eff'
          }}>
            {firstLetter}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: "'Inter', ui-sans-serif, system-ui", fontSize: '13px', fontWeight: 500, color: '#f0f0f0', lineHeight: 1 }}>
              {displayName}
            </span>
            <span style={{ fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '12px', color: '#a1a4a5', marginTop: '2px' }}>
              ${virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Topbar;
