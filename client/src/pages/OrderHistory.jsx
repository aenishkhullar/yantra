import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getOrderHistory } from '../services/orderService';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrderHistory().then(data => {
      setOrders(data);
      setLoading(false);
    }).catch(err => {
      console.error('Failed to fetch orders:', err);
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000000', color: '#f0f0f0', fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <Sidebar active="Order History" />
      
      <div style={{ marginLeft: '220px', flex: 1, padding: '40px', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 500, color: '#f0f0f0', marginBottom: '32px', marginTop: 0 }}>Order History</h1>

        <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(214, 235, 253, 0.19)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Symbol</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Side</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Type</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Qty</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Price</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>Total</th>
                <th style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', fontWeight: 500 }}>P&L</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(214, 235, 253, 0.19)' }}>
                    <td colSpan="8" style={{ padding: '16px' }}>
                      <div style={{ 
                        height: '24px', 
                        borderRadius: '4px', 
                        background: 'linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite linear'
                      }}></div>
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '60px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#a1a4a5', marginBottom: '16px' }}>No orders yet. Start trading.</p>
                    <Link to="/markets" style={{
                      padding: '10px 24px',
                      borderRadius: '9999px',
                      background: '#ffffff',
                      color: '#000000',
                      border: 'none',
                      fontFamily: "'Inter', ui-sans-serif, system-ui",
                      fontSize: '14px',
                      fontWeight: 500,
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}>Go to Markets</Link>
                  </td>
                </tr>
              ) : (
                orders.map(o => (
                  <tr key={o._id} style={{ borderBottom: '1px solid rgba(214, 235, 253, 0.19)' }}>
                    <td style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5' }}>{formatDate(o.executedAt)}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0', fontWeight: 500 }}>{o.symbol}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        background: o.side === 'buy' ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)', 
                        color: o.side === 'buy' ? '#11ff99' : '#ff2047',
                        fontSize: '11px',
                        textTransform: 'capitalize'
                      }}>
                        {o.side}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '12px', color: '#a1a4a5', textTransform: 'capitalize' }}>{o.orderType}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>{o.quantity}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>${o.price.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#f0f0f0' }}>${o.total.toFixed(2)}</td>
                    <td style={{ padding: '16px', fontFamily: "'Commit Mono', ui-monospace, monospace", fontSize: '13px', color: '#a1a4a5' }}>--</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        tr:hover {
          background: rgba(255,255,255,0.03);
        }
      `}</style>
    </div>
  );
};

export default OrderHistory;