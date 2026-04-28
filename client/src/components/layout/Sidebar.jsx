import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Grid, BarChart2, Activity, Briefcase, List, 
  TrendingUp, Book, Award, Settings, LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Grid },
    { label: 'Markets', path: '/markets', icon: BarChart2 },
    { label: 'Trading', path: '/trading/AAPL', icon: Activity },
    { label: 'Portfolio', path: '/portfolio', icon: Briefcase },
    { label: 'Orders', path: '/orders', icon: List },
    { label: 'Analytics', path: '/analytics', icon: TrendingUp },
    { label: 'Journal', path: '/journal', icon: Book },
    { label: 'Leaderboard', path: '/leaderboard', icon: Award },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      width: '220px',
      height: '100vh',
      background: '#000000',
      borderRight: '1px solid rgba(214, 235, 253, 0.19)',
      display: 'flex',
      flexDirection: 'column',
      padding: 0,
      overflow: 'hidden'
    }}>
      <div style={{ padding: '24px 20px 16px' }}>
        <div style={{
          fontFamily: "'Inter', ui-sans-serif, system-ui",
          fontSize: '18px',
          fontWeight: 600,
          color: '#f0f0f0',
          letterSpacing: '-0.5px'
        }}>
          yantra
        </div>
        <div style={{
          marginTop: '16px',
          borderTop: '1px solid rgba(214,235,253,0.19)'
        }}></div>
      </div>

      <div style={{
        flex: 1,
        padding: '12px 12px',
        overflowY: 'auto'
      }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.label === 'Trading' && location.pathname.startsWith('/trading'));
            
          const Icon = item.icon;
          
          return (
            <div
              key={item.label}
              onClick={() => navigate(item.path)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#a1a4a5';
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: "'Inter', ui-sans-serif, system-ui",
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? '#f0f0f0' : '#a1a4a5',
                background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                transition: 'background 0.15s, color 0.15s',
                marginBottom: '2px'
              }}
            >
              <Icon size={14} />
              {item.label}
            </div>
          );
        })}
      </div>

      <div style={{ padding: '12px 12px 20px' }}>
        <div style={{ borderTop: '1px solid rgba(214,235,253,0.19)', marginBottom: '12px' }}></div>
        <button
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ff2047';
            e.currentTarget.style.background = 'rgba(255,32,71,0.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#a1a4a5';
            e.currentTarget.style.background = 'transparent';
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '8px',
            color: '#a1a4a5',
            fontFamily: "'Inter', ui-sans-serif, system-ui",
            fontSize: '13px',
            cursor: 'pointer',
            width: '100%',
            background: 'transparent',
            border: 'none',
            transition: 'background 0.15s, color 0.15s',
            textAlign: 'left'
          }}
        >
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
