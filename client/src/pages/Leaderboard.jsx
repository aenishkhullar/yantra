import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, getMyRank } from '../services/leaderboardService';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [activePeriod, setActivePeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async (period) => {
    setLoading(true);
    try {
      const [lb, rank] = await Promise.all([
        getLeaderboard(period),
        getMyRank(period),
      ]);
      setLeaderboard(lb);
      setMyRank(rank);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activePeriod);
  }, [activePeriod]);

  const currentUserData = leaderboard.find((entry) => entry.userId === user?._id);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatPercent = (val) => {
    const prefix = val > 0 ? '+' : '';
    return `${prefix}${val.toFixed(2)}%`;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const renderSkeletonRows = () => {
    return Array(8).fill(0).map((_, i) => (
      <div key={i} className="table-row skeleton-row">
        <div className="skeleton-item" style={{ width: '60px' }}></div>
        <div className="skeleton-item" style={{ flex: 2 }}></div>
        <div className="skeleton-item" style={{ width: '120px' }}></div>
        <div className="skeleton-item" style={{ width: '140px' }}></div>
        <div className="skeleton-item" style={{ width: '80px' }}></div>
        <div className="skeleton-item" style={{ width: '90px' }}></div>
        <div className="skeleton-item" style={{ width: '120px' }}></div>
      </div>
    ));
  };

  const PodiumCard = ({ entry, rank, type }) => {
    if (!entry) return null;

    const isCurrentUser = entry.userId === user?._id;
    const isFirst = rank === 1;
    const isSecond = rank === 2;
    const isThird = rank === 3;

    let emoji = '';
    let rankText = '';
    let badgeColor = '';
    let borderColor = 'rgba(214, 235, 253, 0.19)';
    let bgColor = 'transparent';
    let avatarBorder = '';
    let avatarBg = '';
    let avatarColor = '';

    if (isFirst) {
      emoji = '👑';
      rankText = '1st';
      badgeColor = '#ffc53d';
      borderColor = 'rgba(255, 197, 61, 0.4)';
      bgColor = 'rgba(255, 197, 61, 0.04)';
      avatarBorder = '2px solid rgba(255,197,61,0.5)';
      avatarBg = 'rgba(255,197,61,0.1)';
      avatarColor = '#ffc53d';
    } else if (isSecond) {
      emoji = '🥈';
      rankText = '2nd';
      badgeColor = '#a1a4a5';
      borderColor = 'rgba(161, 164, 165, 0.3)';
      bgColor = 'rgba(161, 164, 165, 0.03)';
      avatarBorder = '1px solid rgba(161,164,165,0.4)';
      avatarBg = 'rgba(161,164,165,0.1)';
      avatarColor = '#a1a4a5';
    } else if (isThird) {
      emoji = '🥉';
      rankText = '3rd';
      badgeColor = '#cd7f32';
      borderColor = 'rgba(205, 127, 50, 0.3)';
      bgColor = 'rgba(205, 127, 50, 0.03)';
      avatarBorder = '1px solid rgba(205, 127, 50, 0.4)';
      avatarBg = 'rgba(205, 127, 50, 0.1)';
      avatarColor = '#cd7f32';
    }

    return (
      <div 
        className={`podium-card ${isFirst ? 'podium-first' : 'podium-shorter'} ${isCurrentUser ? 'current-user-podium' : ''}`}
        style={{ 
          border: borderColor, 
          backgroundColor: bgColor,
          borderColor: isCurrentUser ? 'rgba(59, 158, 255, 0.6)' : borderColor
        }}
      >
        <div className="podium-emoji">{emoji}</div>
        <div className="podium-rank-badge" style={{ color: badgeColor }}>{rankText}</div>
        <div className="podium-avatar" style={{ border: avatarBorder, backgroundColor: avatarBg, color: avatarColor }}>
          {getInitials(entry.displayName)}
        </div>
        <div className="podium-name">{entry.displayName}</div>
        <div className={`podium-return ${entry.returnPercent >= 0 ? 'profit' : 'loss'}`}>
          {formatPercent(entry.returnPercent)}
        </div>
        <div className="podium-trades">{entry.totalTrades} trades</div>
      </div>
    );
  };

  return (
    <div className="leaderboard-container">
      <style>{`
        .leaderboard-container {
          color: #f0f0f0;
          font-family: 'Inter', sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: 40px;
        }

        .commit-mono {
          font-family: 'Commit Mono', monospace;
        }

        /* HEADER */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 28px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 500;
          margin: 0;
          color: #f0f0f0;
        }

        .header-subtitle {
          color: #a1a4a5;
          font-size: 13px;
          margin-top: 4px;
        }

        .period-selector {
          display: flex;
          gap: 8px;
          background: rgba(214, 235, 253, 0.05);
          padding: 4px;
          border-radius: 9999px;
          border: 1px solid rgba(214, 235, 253, 0.1);
        }

        .period-btn {
          padding: 6px 16px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
          background: transparent;
          color: #a1a4a5;
        }

        .period-btn.active {
          background: #ffffff;
          color: #000000;
          border-color: #ffffff;
        }

        .period-btn:not(.active) {
          border: 1px solid rgba(214, 235, 253, 0.1);
        }

        /* MY RANK CARD */
        .my-rank-card {
          width: 100%;
          border: 1px solid rgba(59, 158, 255, 0.25);
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 24px;
          background: rgba(59, 158, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .rank-label {
          font-size: 10px;
          color: #3b9eff;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 4px;
        }

        .rank-value {
          font-family: 'Commit Mono', monospace;
          font-size: 28px;
          font-weight: 400;
          color: #f0f0f0;
        }

        .rank-sub {
          font-size: 12px;
          color: #a1a4a5;
          margin-top: 2px;
        }

        .stats-cluster {
          display: flex;
          gap: 32px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 10px;
          color: #464a4d;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .stat-value {
          font-family: 'Commit Mono', monospace;
          font-size: 18px;
        }

        /* PODIUM */
        .podium-container {
          display: flex;
          gap: 16px;
          margin-bottom: 28px;
          align-items: flex-end;
        }

        .podium-card {
          border-radius: 16px;
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: border-color 0.2s;
        }

        .podium-first {
          padding: 28px 20px;
        }

        .podium-shorter {
          padding: 20px;
        }

        .podium-emoji {
          font-size: 24px;
          margin-bottom: 8px;
        }

        .podium-shorter .podium-emoji {
          font-size: 20px;
        }

        .podium-rank-badge {
          font-family: 'Commit Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .podium-avatar {
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Commit Mono', monospace;
          font-size: 18px;
        }

        .podium-shorter .podium-avatar {
          width: 40px;
          height: 40px;
          font-size: 16px;
        }

        .podium-name {
          font-size: 14px;
          font-weight: 500;
          color: #f0f0f0;
          margin-top: 10px;
        }

        .podium-shorter .podium-name {
          font-size: 13px;
        }

        .podium-return {
          font-family: 'Commit Mono', monospace;
          font-size: 20px;
          margin-top: 6px;
        }

        .podium-shorter .podium-return {
          font-size: 18px;
        }

        .podium-trades {
          font-size: 11px;
          color: #464a4d;
          margin-top: 4px;
        }

        /* TABLE */
        .table-card {
          border: 1px solid rgba(214, 235, 253, 0.19);
          border-radius: 16px;
          padding: 24px;
          background: transparent;
        }

        .table-header {
          display: flex;
          padding: 0 16px;
          margin-bottom: 12px;
        }

        .header-col {
          font-size: 10px;
          color: #464a4d;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .table-row {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          border-radius: 10px;
          transition: background 0.12s;
          border-bottom: 1px solid rgba(214, 235, 253, 0.08);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .table-row.current-user {
          background: rgba(59, 158, 255, 0.04);
          border-left: 3px solid rgba(59, 158, 255, 0.5);
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }

        .col-rank { width: 60px; }
        .col-trader { flex: 2; display: flex; align-items: center; gap: 12px; }
        .col-return { width: 120px; text-align: right; }
        .col-portfolio { width: 140px; text-align: right; }
        .col-trades { width: 80px; text-align: right; }
        .col-winrate { width: 90px; text-align: right; }
        .col-best { width: 120px; text-align: right; }

        .rank-medal { font-size: 16px; }
        .rank-number { font-family: 'Commit Mono', monospace; font-size: 13px; color: #464a4d; }

        .trader-avatar {
          width: 32px;
          height: 32px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(214, 235, 253, 0.19);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Commit Mono', monospace;
          font-size: 12px;
          color: #a1a4a5;
        }

        .trader-name {
          font-size: 13px;
          font-weight: 500;
          color: #f0f0f0;
        }

        .you-pill {
          font-size: 10px;
          color: #3b9eff;
          border: 1px solid rgba(59, 158, 255, 0.3);
          background: rgba(59, 158, 255, 0.1);
          border-radius: 9999px;
          padding: 1px 6px;
          margin-left: 6px;
        }

        .cell-mono { font-family: 'Commit Mono', monospace; font-size: 13px; }
        .cell-secondary { color: #a1a4a5; }
        .cell-warning { color: #ffc53d; }
        .cell-info { color: #3b9eff; }

        .best-trade-symbol { font-family: 'Commit Mono', monospace; font-size: 11px; color: #a1a4a5; }
        .best-trade-pnl { font-family: 'Commit Mono', monospace; font-size: 12px; color: #11ff99; margin-top: 2px; }

        /* COLORS */
        .profit { color: #11ff99; }
        .loss { color: #ff2047; }

        /* SKELETON */
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }

        .skeleton-item {
          height: 16px;
          background: rgba(255, 255, 255, 0.05);
          animation: pulse 1.5s infinite ease-in-out;
          border-radius: 4px;
        }

        .skeleton-row {
          border-bottom: 1px solid rgba(214, 235, 253, 0.05);
        }

        /* STATES */
        .empty-state {
          text-align: center;
          padding: 60px;
          border: 1px solid rgba(214, 235, 253, 0.19);
          border-radius: 16px;
          margin-top: 20px;
        }

        .empty-emoji { font-size: 32px; }
        .empty-title { font-size: 15px; color: #a1a4a5; margin-top: 12px; }
        .empty-sub { font-size: 13px; color: #464a4d; margin-top: 6px; }

        .single-user-hint {
          margin-top: 24px;
          padding: 20px;
          border: 1px solid rgba(214, 235, 253, 0.19);
          border-radius: 12px;
          color: #a1a4a5;
          font-size: 13px;
          text-align: center;
        }
      `}</style>

      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="header-left">
          <h1>Leaderboard</h1>
          <p className="header-subtitle">Ranked by realized return from completed trades</p>
        </div>
        <div className="period-selector">
          {[
            { label: 'This Week', value: 'week' },
            { label: 'This Month', value: 'month' },
            { label: 'All Time', value: 'all' }
          ].map((p) => (
            <button
              key={p.value}
              className={`period-btn ${activePeriod === p.value ? 'active' : ''}`}
              onClick={() => setActivePeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* MY RANK CARD */}
      {!loading && myRank && (
        <div className="my-rank-card">
          <div className="my-rank-left">
            <div className="rank-label">YOUR RANK</div>
            <div className="rank-value">#{myRank.rank}</div>
            <div className="rank-sub">out of {myRank.total} traders</div>
          </div>
          <div className="stats-cluster">
            <div className="stat-item">
              <div className="stat-label">RETURN</div>
              <div className={`stat-value ${currentUserData?.returnPercent >= 0 ? 'profit' : 'loss'}`}>
                {currentUserData ? formatPercent(currentUserData.returnPercent) : '0.00%'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">PORTFOLIO</div>
              <div className="stat-value" style={{ color: '#f0f0f0' }}>
                {currentUserData ? formatCurrency(currentUserData.currentValue) : '$100,000.00'}
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">WIN RATE</div>
              <div className="stat-value" style={{ color: '#ffc53d' }}>
                {currentUserData ? `${currentUserData.winRate}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOP 3 PODIUM */}
      {!loading && leaderboard.length >= 3 && (
        <div className="podium-container">
          <PodiumCard entry={leaderboard[1]} rank={2} />
          <PodiumCard entry={leaderboard[0]} rank={1} />
          <PodiumCard entry={leaderboard[2]} rank={3} />
        </div>
      )}

      {/* FULL RANKINGS TABLE */}
      <div className="table-card">
        <div className="table-header">
          <div className="header-col col-rank">RANK</div>
          <div className="header-col col-trader">TRADER</div>
          <div className="header-col col-return">RETURN</div>
          <div className="header-col col-portfolio">PORTFOLIO VALUE</div>
          <div className="header-col col-trades">TRADES</div>
          <div className="header-col col-winrate">WIN RATE</div>
          <div className="header-col col-best">BEST TRADE</div>
        </div>

        <div className="table-body">
          {loading ? (
            renderSkeletonRows()
          ) : leaderboard.length > 0 ? (
            leaderboard.map((row) => {
              const isCurrentUser = row.userId === user?._id;
              let rankDisplay = <span className="rank-number">{row.rank}</span>;
              if (row.rank === 1) rankDisplay = <span className="rank-medal">🥇</span>;
              if (row.rank === 2) rankDisplay = <span className="rank-medal">🥈</span>;
              if (row.rank === 3) rankDisplay = <span className="rank-medal">🥉</span>;

              return (
                <div key={row.userId} className={`table-row ${isCurrentUser ? 'current-user' : ''}`}>
                  <div className="col-rank">{rankDisplay}</div>
                  <div className="col-trader">
                    <div className="trader-avatar">
                      {getInitials(row.displayName)}
                    </div>
                    <span className="trader-name">{row.displayName}</span>
                    {isCurrentUser && <span className="you-pill">(You)</span>}
                  </div>
                  <div className={`col-return cell-mono ${row.returnPercent >= 0 ? 'profit' : 'loss'}`}>
                    {formatPercent(row.returnPercent)}
                  </div>
                  <div className="col-portfolio cell-mono" style={{ color: '#f0f0f0' }}>
                    {formatCurrency(row.currentValue)}
                  </div>
                  <div className="col-trades cell-mono cell-secondary">
                    {row.totalTrades}
                  </div>
                  <div className="col-winrate cell-mono cell-warning">
                    {row.winRate}%
                  </div>
                  <div className="col-best">
                    {row.bestTrade ? (
                      <>
                        <div className="best-trade-symbol">{row.bestTrade.symbol}</div>
                        <div className="best-trade-pnl">+${row.bestTrade.pnl.toFixed(2)}</div>
                      </>
                    ) : (
                      <span style={{ color: '#464a4d' }}>--</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : null}
        </div>
      </div>

      {/* EMPTY STATE */}
      {!loading && leaderboard.length === 0 && (
        <div className="empty-state">
          <div className="empty-emoji">🏆</div>
          <div className="empty-title">No traders yet.</div>
          <div className="empty-sub">Be the first to make a trade and claim the top spot.</div>
        </div>
      )}

      {/* SINGLE USER STATE */}
      {!loading && leaderboard.length === 1 && (
        <div className="single-user-hint">
          Invite friends to compete! The leaderboard gets interesting with more traders.
        </div>
      )}
    </div>
  );
};

export default Leaderboard;