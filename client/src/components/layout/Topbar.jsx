import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function getMarketStatus() {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const totalUTCMinutes = utcHour * 60 + utcMinute;

  const isWeekday = utcDay >= 1 && utcDay <= 5;

  // NSE hours: 3:45 AM UTC to 10:00 AM UTC (Mon–Fri)
  // (IST 9:15 AM – 3:30 PM = UTC 3:45 AM – 10:00 AM)
  const nseOpen = 3 * 60 + 45;   // 225 minutes
  const nseClose = 10 * 60;       // 600 minutes
  const nseIsOpen =
    isWeekday && totalUTCMinutes >= nseOpen && totalUTCMinutes < nseClose;

  // NYSE hours: 14:30 UTC to 21:00 UTC (Mon–Fri)
  const nyseOpen = 14 * 60 + 30;  // 870 minutes
  const nyseClose = 21 * 60;       // 1260 minutes
  const nyseIsOpen =
    isWeekday && totalUTCMinutes >= nyseOpen && totalUTCMinutes < nyseClose;

  if (nseIsOpen && nyseIsOpen) {
    return { label: 'NSE & NYSE Open', color: '#11ff99', open: true };
  } else if (nseIsOpen) {
    return { label: 'NSE Open', color: '#11ff99', open: true };
  } else if (nyseIsOpen) {
    return { label: 'NYSE Open', color: '#11ff99', open: true };
  } else {
    return { label: 'Market Closed', color: '#ff2047', open: false };
  }
}

const Topbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: marketStatus.color,
            boxShadow: `0 0 6px ${marketStatus.color}`,
            animation: marketStatus.open ? 'pulse 2s infinite' : 'none'
          }}></div>
          <span style={{
            fontFamily: "'Inter', ui-sans-serif, system-ui",
            fontSize: '11px',
            color: '#a1a4a5'
          }}>
            {marketStatus.label}
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
              ₹{virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
