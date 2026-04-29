import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCw, ExternalLink, Search, Clock, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { getOrderHistory, getPendingOrders, cancelOrder } from '../services/orderService';

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [sideFilter, setSideFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [hist, pend] = await Promise.all([
        getOrderHistory(),
        getPendingOrders(),
      ]);
      setOrders(hist);
      setPending(pend);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const refresh = async () => {
    setLoading(true);
    await fetchAll();
    setLoading(false);
  };

  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      setPending(prev => prev.filter(o => o._id !== orderId));
      // Optionally refresh history to see the cancelled order there
      const hist = await getOrderHistory();
      setOrders(hist);
    } catch (err) {
      alert('Failed to cancel order: ' + (err.response?.data?.message || err.message));
    } finally {
      setCancelling(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Logic adjustment to match "show both sections" for 'all'
      // and "hide table" for 'pending'
      const matchTab =
        activeTab === 'all' ? true :
        activeTab === 'pending' ? false :
        o.status === activeTab;
      
      const matchSide =
        sideFilter === 'all' || o.side === sideFilter;
      
      const matchSearch =
        search.trim() === '' ||
        o.symbol.toLowerCase().includes(search.toLowerCase());
      
      return matchTab && matchSide && matchSearch;
    });
  }, [orders, activeTab, sideFilter, search]);

  const itemsPerPage = 20;
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const stats = useMemo(() => {
    return {
      total: orders.length + pending.length,
      buy: orders.filter(o => o.side === 'buy').length,
      sell: orders.filter(o => o.side === 'sell').length,
      pending: pending.length
    };
  }, [orders, pending]);

  const timeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    };
  };

  const formatPrice = (p) => `$${p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const Skeleton = ({ width = '100%', height = '20px', radius = '4px' }) => (
    <div style={{
      width,
      height,
      borderRadius: radius,
      background: 'rgba(255,255,255,0.03)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        animation: 'shimmer 2s infinite linear'
      }} />
    </div>
  );

  return (
    <div style={{ 
      background: '#000000', 
      minHeight: '100vh', 
      color: '#f0f0f0', 
      fontFamily: "'Inter', sans-serif",
      padding: '40px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#f0f0f0', margin: 0 }}>Order History</h1>
          <div style={{ color: '#a1a4a5', fontSize: '13px', marginTop: '4px' }}>
            {stats.total} total orders
          </div>
        </div>
        <button 
          onClick={refresh}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '9999px',
            border: '1px solid rgba(214, 235, 253, 0.19)',
            background: 'transparent',
            color: '#a1a4a5',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f0f0f0'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a4a5'; }}
        >
          <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOTAL ORDERS', value: stats.total, color: '#f0f0f0' },
          { label: 'BUY ORDERS', value: stats.buy, color: '#11ff99' },
          { label: 'SELL ORDERS', value: stats.sell, color: '#ff2047' },
          { label: 'PENDING', value: stats.pending, color: '#ffc53d', pulse: stats.pending > 0 }
        ].map((s, i) => (
          <div key={i} style={{
            border: '1px solid rgba(214, 235, 253, 0.19)',
            borderRadius: '12px',
            padding: '16px 20px',
            background: 'transparent'
          }}>
            <div style={{ fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.14em', marginBottom: '8px' }}>{s.label}</div>
            {loading ? <Skeleton height="28px" width="60%" /> : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontFamily: "'Commit Mono', monospace", color: s.color }}>
                  {s.value}
                </span>
                {s.pulse && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ffc53d',
                    boxShadow: '0 0 6px #ffc53d',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tabs & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'All Orders', value: 'all', count: stats.total },
            { label: 'Executed', value: 'executed', count: orders.filter(o => o.status === 'executed').length },
            { label: 'Pending', value: 'pending', count: stats.pending },
            { label: 'Cancelled', value: 'cancelled', count: orders.filter(o => o.status === 'cancelled').length }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
                ...(activeTab === tab.value ? {
                  background: '#ffffff',
                  color: '#000000',
                  border: '1px solid #ffffff'
                } : {
                  background: 'transparent',
                  color: '#a1a4a5',
                  border: '1px solid rgba(214, 235, 253, 0.19)'
                })
              }}
            >
              {tab.label}
              <span style={{ 
                fontFamily: "'Commit Mono', monospace", 
                fontSize: '11px', 
                marginLeft: '4px',
                opacity: activeTab === tab.value ? 0.7 : 0.5 
              }}>
                ({tab.count})
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input 
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                background: '#0a0a0a',
                border: '1px solid rgba(214, 235, 253, 0.19)',
                borderRadius: '8px',
                color: '#f0f0f0',
                padding: '8px 12px',
                fontSize: '13px',
                fontFamily: "'Inter', sans-serif",
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {['all', 'buy', 'sell'].map((side) => (
              <button
                key={side}
                onClick={() => { setSideFilter(side); setPage(1); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  border: sideFilter === side ? '1px solid rgba(214, 235, 253, 0.19)' : '1px solid transparent',
                  background: sideFilter === side ? 'rgba(255,255,255,0.08)' : 'transparent',
                  color: sideFilter === side ? '#f0f0f0' : '#464a4d',
                  transition: 'all 0.2s'
                }}
              >
                {side}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Orders Section */}
      {(activeTab === 'all' || activeTab === 'pending') && pending.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ffc53d',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontSize: '13px', color: '#ffc53d', fontWeight: 500 }}>Pending Orders</span>
            <span style={{ fontFamily: "'Commit Mono', monospace", fontSize: '11px', color: '#ffc53d', opacity: 0.8 }}>{pending.length}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pending.map((order) => (
              <div key={order._id} style={{
                border: '1px solid rgba(255, 197, 61, 0.25)',
                background: 'rgba(255, 197, 61, 0.02)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: order.side === 'buy' ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)',
                    color: order.side === 'buy' ? '#11ff99' : '#ff2047'
                  }}>
                    {order.side}
                  </span>
                  <span style={{ fontFamily: "'Commit Mono', monospace", fontSize: '14px', color: '#f0f0f0', fontWeight: 500, marginLeft: '10px' }}>
                    {order.symbol}
                  </span>
                  <span style={{ fontSize: '11px', color: '#a1a4a5', textTransform: 'capitalize', marginLeft: '8px' }}>
                    {order.orderType}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '24px' }}>
                  {order.limitPrice && (
                    <div>
                      <div style={{ fontSize: '9px', color: '#464a4d', textTransform: 'uppercase', marginBottom: '2px' }}>LIMIT</div>
                      <div style={{ fontFamily: "'Commit Mono', monospace", fontSize: '13px', color: '#ffc53d' }}>{formatPrice(order.limitPrice)}</div>
                    </div>
                  )}
                  {order.stopPrice && (
                    <div>
                      <div style={{ fontSize: '9px', color: '#464a4d', textTransform: 'uppercase', marginBottom: '2px' }}>STOP-LOSS</div>
                      <div style={{ fontFamily: "'Commit Mono', monospace", fontSize: '13px', color: '#ff2047' }}>{formatPrice(order.stopPrice)}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '9px', color: '#464a4d', textTransform: 'uppercase', marginBottom: '2px' }}>QTY</div>
                    <div style={{ fontFamily: "'Commit Mono', monospace", fontSize: '13px', color: '#f0f0f0' }}>{order.quantity}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '11px', color: '#464a4d' }}>{timeAgo(order.createdAt)}</span>
                  <button
                    onClick={() => handleCancel(order._id)}
                    disabled={cancelling === order._id}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '9999px',
                      border: '1px solid rgba(214, 235, 253, 0.19)',
                      background: 'transparent',
                      color: cancelling === order._id ? '#464a4d' : '#a1a4a5',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: cancelling === order._id ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { 
                      if (cancelling !== order._id) {
                        e.currentTarget.style.borderColor = 'rgba(255, 32, 71, 0.4)';
                        e.currentTarget.style.color = '#ff2047';
                      }
                    }}
                    onMouseOut={(e) => { 
                      if (cancelling !== order._id) {
                        e.currentTarget.style.borderColor = 'rgba(214, 235, 253, 0.19)';
                        e.currentTarget.style.color = '#a1a4a5';
                      }
                    }}
                  >
                    {cancelling === order._id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Section */}
      {activeTab !== 'pending' && (
        <div style={{
          border: '1px solid rgba(214, 235, 253, 0.19)',
          borderRadius: '16px',
          padding: '24px',
          background: 'transparent'
        }}>
          {/* Table Header */}
          <div style={{ display: 'flex', padding: '0 8px', marginBottom: '8px' }}>
            <div style={{ width: '140px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Date</div>
            <div style={{ width: '100px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Symbol</div>
            <div style={{ width: '80px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Side</div>
            <div style={{ width: '90px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Type</div>
            <div style={{ width: '70px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Qty</div>
            <div style={{ width: '110px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Price</div>
            <div style={{ width: '120px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total</div>
            <div style={{ width: '110px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>P&L</div>
            <div style={{ width: '90px', fontSize: '10px', color: '#464a4d', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Status</div>
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', padding: '13px 8px', borderBottom: '1px solid rgba(214, 235, 253, 0.07)' }}>
                  <div style={{ width: '140px' }}><Skeleton width="80px" /></div>
                  <div style={{ width: '100px' }}><Skeleton width="60px" /></div>
                  <div style={{ width: '80px' }}><Skeleton width="40px" radius="9999px" /></div>
                  <div style={{ width: '90px' }}><Skeleton width="50px" /></div>
                  <div style={{ width: '70px' }}><Skeleton width="30px" /></div>
                  <div style={{ width: '110px' }}><Skeleton width="60px" /></div>
                  <div style={{ width: '120px' }}><Skeleton width="70px" /></div>
                  <div style={{ width: '110px' }}><Skeleton width="50px" /></div>
                  <div style={{ width: '90px' }}><Skeleton width="50px" radius="9999px" /></div>
                </div>
              ))
            ) : paginated.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', color: '#a1a4a5' }}>
                  {orders.length === 0 && pending.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
                      <span style={{ fontSize: '32px', marginBottom: '12px' }}>📋</span>
                      <div style={{ fontSize: '15px', color: '#a1a4a5' }}>No orders yet.</div>
                      <div style={{ fontSize: '13px', color: '#464a4d', marginTop: '6px' }}>Your executed and pending orders will appear here.</div>
                      <button 
                        onClick={() => navigate('/markets')}
                        style={{
                          marginTop: '16px',
                          padding: '10px 24px',
                          borderRadius: '9999px',
                          background: '#ffffff',
                          color: '#000000',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        Go to Markets
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>No orders match your filters.</div>
                      <div 
                        onClick={() => { setSideFilter('all'); setSearch(''); setActiveTab('all'); }}
                        style={{ color: '#3b9eff', fontSize: '12px', marginTop: '8px', cursor: 'pointer' }}
                      >
                        Clear filters
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              paginated.map((order, i) => {
                const { date, time } = formatDate(order.executedAt || order.createdAt);
                const isBuy = order.side === 'buy';
                const pnl = order.realisedPnL;

                return (
                  <div 
                    key={order._id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '13px 8px', 
                      borderRadius: '8px',
                      borderBottom: i === paginated.length - 1 ? 'none' : '1px solid rgba(214, 235, 253, 0.07)',
                      transition: 'background 0.12s',
                      cursor: 'default'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ width: '140px' }}>
                      <div style={{ fontSize: '12px', color: '#a1a4a5' }}>{date}</div>
                      <div style={{ fontSize: '10px', color: '#464a4d' }}>{time}</div>
                    </div>
                    <div style={{ width: '100px' }}>
                      <span 
                        onClick={() => navigate(`/trading/${order.symbol}`)}
                        style={{ 
                          fontFamily: "'Commit Mono', monospace", 
                          fontSize: '13px', 
                          color: '#f0f0f0', 
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'color 0.12s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.color = '#3b9eff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.color = '#f0f0f0'; }}
                      >
                        {order.symbol}
                      </span>
                    </div>
                    <div style={{ width: '80px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 600,
                        background: isBuy ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)',
                        color: isBuy ? '#11ff99' : '#ff2047'
                      }}>
                        {isBuy ? 'BUY' : 'SELL'}
                      </span>
                    </div>
                    <div style={{ width: '90px', fontSize: '12px', color: '#a1a4a5', textTransform: 'capitalize' }}>{order.orderType}</div>
                    <div style={{ width: '70px', fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#f0f0f0' }}>{order.quantity}</div>
                    <div style={{ width: '110px', fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#f0f0f0' }}>{formatPrice(order.price)}</div>
                    <div style={{ width: '120px', fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#f0f0f0' }}>{formatPrice(order.total)}</div>
                    <div style={{ width: '110px', fontFamily: "'Commit Mono', monospace", fontSize: '12px' }}>
                      {pnl !== undefined && pnl !== null ? (
                        <span style={{ color: pnl >= 0 ? '#11ff99' : '#ff2047' }}>
                          {pnl >= 0 ? '+' : '-'}{formatPrice(Math.abs(pnl))}
                        </span>
                      ) : (
                        <span style={{ color: '#464a4d' }}>--</span>
                      )}
                    </div>
                    <div style={{ width: '90px' }}>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: '9999px',
                        fontSize: '10px',
                        fontWeight: 500,
                        background: 
                          order.status === 'executed' ? 'rgba(17,255,153,0.1)' :
                          order.status === 'cancelled' ? 'rgba(255,255,255,0.05)' :
                          'rgba(255,197,61,0.1)',
                        color:
                          order.status === 'executed' ? '#11ff99' :
                          order.status === 'cancelled' ? '#464a4d' :
                          '#ffc53d'
                      }}>
                        {order.status === 'executed' ? 'Filled' : order.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {filtered.length > itemsPerPage && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '8px', 
              marginTop: '20px', 
              paddingTop: '16px',
              borderTop: '1px solid rgba(214, 235, 253, 0.19)'
            }}>
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(214, 235, 253, 0.19)',
                  background: 'transparent',
                  color: '#a1a4a5',
                  fontSize: '12px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowLeft size={12} /> Prev
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) {
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid rgba(214, 235, 253, 0.19)',
                        background: page === p ? '#ffffff' : 'transparent',
                        color: page === p ? '#000000' : '#a1a4a5',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {p}
                    </button>
                  );
                }
                if (p === page - 3 || p === page + 3) return <span key={p} style={{ color: '#464a4d' }}>...</span>;
                return null;
              })}

              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(214, 235, 253, 0.19)',
                  background: 'transparent',
                  color: '#a1a4a5',
                  fontSize: '12px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.4 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Next <ArrowRight size={12} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Global Styles for Animations */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrderHistory;