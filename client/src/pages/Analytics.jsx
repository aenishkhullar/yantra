import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import {
  getAnalyticsSummary,
  getPortfolioHistory,
  getTradeBreakdown,
} from '../services/analyticsService';

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAnalyticsSummary(),
      getPortfolioHistory(),
      getTradeBreakdown()
    ])
    .then(([sum, hist, breakd]) => {
      setSummary(sum);
      setHistory(hist);
      setBreakdown(breakd);
    })
    .catch(err => console.error('Analytics fetch error:', err))
    .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '$0.00';
    if (Math.abs(val) < 0.005) return '$0.00';
    const sign = val > 0 ? '+' : '-';
    return `${sign}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const Shimmer = () => (
    <div style={{
      height: '100px',
      borderRadius: '16px',
      background: 'linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite linear'
    }}></div>
  );

  return (
    <div style={{ color: '#f0f0f0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#f0f0f0', margin: '0 0 4px 0' }}>Analytics</h1>
        <p style={{ color: '#a1a4a5', fontSize: '13px', margin: 0 }}>Your trading performance at a glance</p>
      </div>

      {/* STAT CARDS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {loading ? (
          <>
            <Shimmer />
            <Shimmer />
            <Shimmer />
            <Shimmer />
          </>
        ) : (
          <>
            <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
              <div style={{ fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>TOTAL P&L</div>
              <div style={{ marginTop: '10px', fontFamily: 'Commit Mono, monospace', fontSize: '28px', color: summary?.totalPnL > 0.005 ? '#11ff99' : (summary?.totalPnL < -0.005 ? '#ff2047' : '#f0f0f0') }}>
                {formatCurrency(summary?.totalPnL)}
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#464a4d' }}>Realised + Unrealised</div>
            </div>

            <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
              <div style={{ fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>WIN RATE</div>
              <div style={{ marginTop: '10px', fontFamily: 'Commit Mono, monospace', fontSize: '28px', color: '#ffc53d' }}>
                {summary?.winRate.toFixed(1)}%
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#464a4d' }}>{summary?.winningTrades} wins / {summary?.sellTrades} closed trades</div>
            </div>

            <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
              <div style={{ fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>BEST TRADE</div>
              <div style={{ marginTop: '10px', fontFamily: 'Commit Mono, monospace', fontSize: '28px', color: (summary?.bestTrade?.realisedPnL || 0) > 0.005 ? '#11ff99' : '#f0f0f0' }}>
                {formatCurrency(summary?.bestTrade?.realisedPnL)}
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#464a4d' }}>{summary?.bestTrade?.symbol || 'None'}</div>
            </div>

            <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
              <div style={{ fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>WORST TRADE</div>
              <div style={{ marginTop: '10px', fontFamily: 'Commit Mono, monospace', fontSize: '28px', color: (summary?.worstTrade?.realisedPnL || 0) < -0.005 ? '#ff2047' : '#f0f0f0' }}>
                {formatCurrency(summary?.worstTrade?.realisedPnL)}
              </div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#464a4d' }}>{summary?.worstTrade?.symbol || 'None'}</div>
            </div>
          </>
        )}
      </div>

      {/* PORTFOLIO GROWTH CHART */}
      <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Portfolio Growth</div>
          {!loading && (
            <div style={{ 
              background: (summary?.currentPortfolioValue + (summary?.totalRealised || 0) - 100000) > 0.005 ? 'rgba(17,255,153,0.1)' : ((summary?.currentPortfolioValue + (summary?.totalRealised || 0) - 100000) < -0.005 ? 'rgba(255,32,71,0.1)' : 'rgba(255,255,255,0.05)'),
              color: (summary?.currentPortfolioValue + (summary?.totalRealised || 0) - 100000) > 0.005 ? '#11ff99' : ((summary?.currentPortfolioValue + (summary?.totalRealised || 0) - 100000) < -0.005 ? '#ff2047' : '#f0f0f0'),
              padding: '2px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              {(((summary?.currentPortfolioValue + (summary?.totalRealised || 0)) - 100000) / 100000 * 100).toFixed(2)}%
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px 16px -24px' }}></div>
        
        {loading ? (
          <div style={{ height: '260px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}></div>
        ) : history.length < 2 ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#464a4d', fontSize: '13px' }}>
            Make your first trade to see portfolio growth
          </div>
        ) : (
          <div style={{ height: '260px', marginTop: '16px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(214,235,253,0.06)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#464a4d', fontSize: 11 }} 
                  tickFormatter={(d) => {
                    const date = new Date(d);
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#464a4d', fontSize: 11 }} 
                  tickFormatter={(v) => '$' + (v/1000).toFixed(0) + 'k'}
                  width={55}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    background: '#0f0f0f',
                    border: '1px solid rgba(214, 235, 253, 0.19)',
                    borderRadius: 8,
                    color: '#f0f0f0',
                    fontSize: 12,
                    fontFamily: 'Commit Mono, monospace',
                  }}
                  formatter={(value) => ['$' + value.toLocaleString(), 'Portfolio Value']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#11ff99" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, fill: '#11ff99', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* TWO COLUMN ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Left card — Trade Breakdown */}
        <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
          <div style={{ fontSize: '14px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Trade Breakdown</div>
          <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px 16px -24px' }}></div>
          
          {loading ? (
            <div style={{ height: '200px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}></div>
          ) : breakdown.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#464a4d', fontSize: '13px' }}>
              No closed trades yet
            </div>
          ) : (
            <div style={{ height: '200px', marginTop: '16px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown.slice(0, 10)}>
                  <XAxis dataKey="symbol" tick={{ fill: '#464a4d', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#464a4d', fontSize: 10 }} tickFormatter={(v) => '$' + v} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{
                      background: '#0f0f0f',
                      border: '1px solid rgba(214, 235, 253, 0.19)',
                      borderRadius: 8,
                      color: '#f0f0f0',
                      fontSize: 12,
                      fontFamily: 'Commit Mono, monospace',
                    }}
                    formatter={(v) => ['$' + v.toFixed(2), 'P&L']}
                  />
                  <Bar dataKey="realisedPnL" radius={[4, 4, 0, 0]}>
                    {breakdown.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.realisedPnL >= 0 ? '#11ff99' : '#ff2047'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right card — Performance Stats */}
        <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
          <div style={{ fontSize: '14px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Stats</div>
          <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px 16px -24px' }}></div>
          
          <div style={{ marginTop: '16px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...Array(6)].map((_, i) => <div key={i} style={{ height: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}></div>)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { label: 'Total Trades', value: summary?.totalTrades, color: '#f0f0f0' },
                  { label: 'Buy Orders', value: summary?.buyTrades, color: '#3b9eff' },
                  { label: 'Sell Orders', value: summary?.sellTrades, color: '#a1a4a5' },
                  { label: 'Avg P&L/Trade', value: `$${summary?.avgPnL.toFixed(2)}`, color: summary?.avgPnL > 0.005 ? '#11ff99' : (summary?.avgPnL < -0.005 ? '#ff2047' : '#f0f0f0') },
                  { label: 'Total Invested', value: `$${summary?.totalInvested.toLocaleString()}`, color: '#f0f0f0' },
                  { label: 'Unrealised P&L', value: formatCurrency(summary?.unrealisedPnL), color: summary?.unrealisedPnL > 0.005 ? '#11ff99' : (summary?.unrealisedPnL < -0.005 ? '#ff2047' : '#f0f0f0') },
                  { label: 'Open Positions', value: summary?.openPositionsCount, color: '#3b9eff' }
                ].map((stat, i, arr) => (
                  <div key={stat.label} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '10px 0', 
                    borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(214, 235, 253, 0.08)' 
                  }}>
                    <span style={{ fontSize: '13px', color: '#a1a4a5' }}>{stat.label}</span>
                    <span style={{ fontSize: '13px', fontFamily: 'Commit Mono, monospace', color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECENT CLOSED TRADES TABLE */}
      <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
        <div style={{ fontSize: '14px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Closed Trades</div>
        <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px 0 -24px' }}></div>
        
        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {[...Array(5)].map((_, i) => <div key={i} style={{ height: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}></div>)}
          </div>
        ) : breakdown.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: '#464a4d', fontSize: '13px' }}>
            No closed trades yet. Close a position to see results.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(214, 235, 253, 0.08)' }}>
                <th style={{ padding: '12px 0', fontSize: '11px', color: '#464a4d', fontWeight: 500 }}>DATE</th>
                <th style={{ padding: '12px 0', fontSize: '11px', color: '#464a4d', fontWeight: 500 }}>SYMBOL</th>
                <th style={{ padding: '12px 0', fontSize: '11px', color: '#464a4d', fontWeight: 500 }}>QTY</th>
                <th style={{ padding: '12px 0', fontSize: '11px', color: '#464a4d', fontWeight: 500 }}>EXIT PRICE</th>
                <th style={{ padding: '12px 0', fontSize: '11px', color: '#464a4d', fontWeight: 500 }}>P&L</th>
                <th style={{ padding: '12px 0', fontSize: '11px', color: '#464a4d', fontWeight: 500, textAlign: 'right' }}>RESULT</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((trade) => {
                const pnl = trade.realisedPnL || 0;
                const isWin = pnl > 0.005;
                const isLoss = pnl < -0.005;
                
                let pnlColor = '#a1a4a5'; // Neutral
                let pnlBg = 'rgba(161, 164, 165, 0.1)';
                let resultLabel = 'BREAK EVEN';

                if (isWin) {
                  pnlColor = '#11ff99';
                  pnlBg = 'rgba(17, 255, 153, 0.1)';
                  resultLabel = 'WIN';
                } else if (isLoss) {
                  pnlColor = '#ff2047';
                  pnlBg = 'rgba(255, 32, 71, 0.1)';
                  resultLabel = 'LOSS';
                }

                return (
                  <tr key={trade._id} style={{ borderBottom: '1px solid rgba(214, 235, 253, 0.08)' }} className="trade-row">
                    <td style={{ padding: '14px 0', fontSize: '12px', color: '#a1a4a5' }}>
                      {new Date(trade.executedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '13px', fontFamily: 'Commit Mono, monospace', color: '#f0f0f0', fontWeight: 500 }}>
                      {trade.symbol}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '12px', fontFamily: 'Commit Mono, monospace', color: '#a1a4a5' }}>
                      {trade.quantity}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '13px', fontFamily: 'Commit Mono, monospace', color: '#f0f0f0' }}>
                      ${trade.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 0', fontSize: '13px', fontFamily: 'Commit Mono, monospace', color: pnlColor }}>
                      {formatCurrency(pnl)}
                    </td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        background: pnlBg, 
                        color: pnlColor,
                        fontSize: '10px',
                        fontWeight: 600
                      }}>
                        {resultLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .trade-row:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
};

export default Analytics;