import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, X, Plus } from 'lucide-react';
import { 
  getJournalEntries, 
  getJournalStats, 
  createJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry 
} from '../services/journalService';

const PRESET_TAGS = [
  'Disciplined', 'FOMO', 'Revenge Trade', 'Good Entry', 
  'Bad Exit', 'Overconfident', 'Cut Loss', 'Followed Plan', 
  'Emotional', 'Patient'
];

const MOODS = [
  { val: 'confident', label: '😤 Confident' },
  { val: 'nervous', label: '😰 Nervous' },
  { val: 'neutral', label: '😐 Neutral' },
  { val: 'excited', label: '🤩 Excited' },
  { val: 'fearful', label: '😨 Fearful' }
];

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    symbol: '',
    side: 'buy',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    entryThought: '',
    exitThought: '',
    tags: [],
    mood: 'neutral'
  });

  const fetchData = async () => {
    try {
      const [entriesData, statsData] = await Promise.all([
        getJournalEntries(),
        getJournalStats()
      ]);
      setEntries(entriesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to fetch journal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'symbol' ? value.toUpperCase() : value
    }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newEntry = await createJournalEntry(formData);
      setEntries([newEntry, ...entries]);
      setShowForm(false);
      resetForm();
      fetchData(); // Refresh stats
    } catch (err) {
      console.error('Failed to create entry', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry._id);
    setFormData({
      symbol: entry.symbol,
      side: entry.side,
      entryPrice: entry.entryPrice || '',
      exitPrice: entry.exitPrice || '',
      quantity: entry.quantity || '',
      entryThought: entry.entryThought || '',
      exitThought: entry.exitThought || '',
      tags: entry.tags || [],
      mood: entry.mood || 'neutral'
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updated = await updateJournalEntry(editingId, formData);
      setEntries(entries.map(ent => ent._id === editingId ? updated : ent));
      setEditingId(null);
      resetForm();
      fetchData(); // Refresh stats
    } catch (err) {
      console.error('Failed to update entry', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteJournalEntry(id);
      setEntries(entries.filter(ent => ent._id !== id));
      fetchData(); // Refresh stats
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: '',
      side: 'buy',
      entryPrice: '',
      exitPrice: '',
      quantity: '',
      entryThought: '',
      exitThought: '',
      tags: [],
      mood: 'neutral'
    });
  };

  const filteredEntries = entries.filter(ent => {
    const matchesSearch = 
      ent.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.entryThought.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ent.exitThought.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === 'All' || ent.tags.includes(activeFilter);
    
    return matchesSearch && matchesFilter;
  });

  const uniqueTags = ['All', ...new Set(entries.flatMap(e => e.tags))];

  const getMoodEmoji = (m) => MOODS.find(mood => mood.val === m)?.label.split(' ')[0] || '😐';

  return (
    <div style={{ padding: '0' }}>
      {/* PAGE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '24px', fontWeight: 500, color: '#f0f0f0', margin: 0 }}>Journal</h1>
          <p style={{ color: '#a1a4a5', fontSize: '13px', marginTop: '4px' }}>Track your thinking. Learn from every trade.</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); resetForm(); }}
          style={{ 
            background: '#ffffff', 
            color: '#000000', 
            border: 'none', 
            borderRadius: '9999px', 
            padding: '8px 20px', 
            fontFamily: "'Inter', sans-serif", 
            fontSize: '13px', 
            fontWeight: 600, 
            cursor: 'pointer' 
          }}
        >
          New Entry +
        </button>
      </div>

      {/* STATS STRIP */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOTAL ENTRIES', val: stats?.totalEntries, color: '#f0f0f0', size: '24px' },
          { label: 'TOP PATTERN', val: stats?.tagBreakdown[0]?.tag || 'None', color: '#ffc53d', size: '18px' },
          { label: 'DOMINANT MOOD', val: Object.entries(stats?.moodBreakdown || {}).sort((a,b) => b[1]-a[1])[0]?.[0]?.toUpperCase() || 'NEUTRAL', color: '#3b9eff', size: '18px' }
        ].map((s, i) => (
          <div key={i} style={{ 
            flex: 1, 
            border: '1px solid rgba(214, 235, 253, 0.19)', 
            borderRadius: '12px', 
            padding: '16px 20px', 
            background: 'transparent' 
          }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>{s.label}</div>
            {loading ? (
              <div className="shimmer" style={{ height: '24px', width: '60%', marginTop: '10px', borderRadius: '4px' }}></div>
            ) : (
              <div style={{ marginTop: '10px', fontFamily: "'Commit Mono', monospace", fontSize: s.size, fontWeight: 400, color: s.color }}>{s.val}</div>
            )}
          </div>
        ))}
      </div>

      {/* FILTER + SEARCH ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Search symbol or notes…" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ 
            maxWidth: '280px', 
            width: '100%',
            background: '#0a0a0a', 
            border: '1px solid rgba(214, 235, 253, 0.19)', 
            borderRadius: '8px', 
            padding: '8px 14px', 
            color: '#f0f0f0', 
            fontFamily: "'Inter', sans-serif", 
            fontSize: '13px', 
            outline: 'none' 
          }}
        />
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {uniqueTags.map(tag => (
            <button 
              key={tag}
              onClick={() => setActiveFilter(tag)}
              style={{ 
                background: activeFilter === tag ? '#ffffff' : 'transparent', 
                color: activeFilter === tag ? '#000000' : '#a1a4a5', 
                border: activeFilter === tag ? 'none' : '1px solid rgba(214, 235, 253, 0.19)', 
                borderRadius: '9999px', 
                padding: '4px 12px', 
                fontFamily: "'Inter', sans-serif", 
                fontSize: '12px', 
                cursor: 'pointer' 
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* NEW ENTRY FORM */}
      {showForm && (
        <div style={{ 
          border: '1px solid rgba(214, 235, 253, 0.19)', 
          borderRadius: '16px', 
          padding: '28px', 
          marginBottom: '24px', 
          background: 'transparent',
          animation: 'slideDown 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#f0f0f0', fontWeight: 500, margin: 0 }}>New Journal Entry</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#a1a4a5', cursor: 'pointer' }}><X size={18} /></button>
          </div>
          
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>SYMBOL</label>
                <input 
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="AAPL"
                  required
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '6px', padding: '10px 14px', color: '#f0f0f0', fontFamily: "'Commit Mono', monospace", fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>SIDE</label>
                <div style={{ display: 'flex', gap: '1px', background: 'rgba(214, 235, 253, 0.1)', borderRadius: '6px', padding: '2px', height: '38px', boxSizing: 'border-box' }}>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, side: 'buy'})}
                    style={{ flex: 1, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, background: formData.side === 'buy' ? 'rgba(17, 255, 153, 0.15)' : 'transparent', color: formData.side === 'buy' ? '#11ff99' : '#a1a4a5' }}
                  >BUY</button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, side: 'sell'})}
                    style={{ flex: 1, border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, background: formData.side === 'sell' ? 'rgba(255, 32, 71, 0.15)' : 'transparent', color: formData.side === 'sell' ? '#ff2047' : '#a1a4a5' }}
                  >SELL</button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>ENTRY PRICE</label>
                <input 
                  type="number"
                  name="entryPrice"
                  value={formData.entryPrice}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="any"
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '6px', padding: '10px 14px', color: '#f0f0f0', fontFamily: "'Commit Mono', monospace", fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>QUANTITY</label>
                <input 
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '6px', padding: '10px 14px', color: '#f0f0f0', fontFamily: "'Commit Mono', monospace", fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>ENTRY THOUGHT — What made you take this trade?</label>
                <textarea 
                  name="entryThought"
                  value={formData.entryThought}
                  onChange={handleInputChange}
                  placeholder="I entered because..."
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '8px', padding: '12px 14px', color: '#f0f0f0', fontFamily: "'Inter', sans-serif", fontSize: '13px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>EXIT THOUGHT — How did it play out?</label>
                <textarea 
                  name="exitThought"
                  value={formData.exitThought}
                  onChange={handleInputChange}
                  placeholder="I exited because..."
                  style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '8px', padding: '12px 14px', color: '#f0f0f0', fontFamily: "'Inter', sans-serif", fontSize: '13px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>TAGS — Select all that apply</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {PRESET_TAGS.map(tag => (
                    <button 
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{ 
                        background: formData.tags.includes(tag) ? '#ffffff' : 'transparent', 
                        color: formData.tags.includes(tag) ? '#000000' : '#a1a4a5', 
                        border: '1px solid rgba(214, 235, 253, 0.19)', 
                        borderRadius: '9999px', 
                        padding: '4px 12px', 
                        fontFamily: "'Inter', sans-serif", 
                        fontSize: '12px', 
                        cursor: 'pointer' 
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>MOOD</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {MOODS.map(m => (
                    <button 
                      key={m.val}
                      type="button"
                      onClick={() => setFormData({...formData, mood: m.val})}
                      style={{ 
                        background: formData.mood === m.val ? '#ffffff' : 'transparent', 
                        color: formData.mood === m.val ? '#000000' : '#a1a4a5', 
                        border: '1px solid rgba(214, 235, 253, 0.19)', 
                        borderRadius: '9999px', 
                        padding: '4px 12px', 
                        fontFamily: "'Inter', sans-serif", 
                        fontSize: '12px', 
                        cursor: 'pointer' 
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button 
              disabled={submitting}
              style={{ 
                width: '100%', 
                background: '#ffffff', 
                color: '#000000', 
                border: 'none', 
                borderRadius: '9999px', 
                padding: '12px', 
                marginTop: '24px', 
                fontFamily: "'Inter', sans-serif", 
                fontSize: '14px', 
                fontWeight: 600, 
                cursor: 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Saving...' : 'Save Entry'}
            </button>
          </form>
        </div>
      )}

      {/* ENTRIES LIST */}
      <div>
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="shimmer" style={{ height: '160px', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', marginBottom: '16px' }}></div>
          ))
        ) : filteredEntries.length === 0 ? (
          <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📓</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#a1a4a5' }}>No journal entries yet.</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#464a4d', marginTop: '6px' }}>Every trade is a lesson. Start documenting.</div>
            <button 
              onClick={() => setShowForm(true)}
              style={{ background: '#ffffff', color: '#000000', border: 'none', borderRadius: '9999px', padding: '8px 20px', marginTop: '16px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              Write First Entry
            </button>
          </div>
        ) : (
          filteredEntries.map(entry => (
            editingId === entry._id ? (
              <div key={entry._id} style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '28px', marginBottom: '16px' }}>
                {/* Inline Edit Form - simplified for reuse */}
                <form onSubmit={handleUpdate}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>SYMBOL</label>
                      <input name="symbol" value={formData.symbol} onChange={handleInputChange} style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '6px', padding: '10px 14px', color: '#f0f0f0', fontFamily: "'Commit Mono', monospace", fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '8px' }}>SIDE</label>
                      <div style={{ display: 'flex', gap: '1px', background: 'rgba(214, 235, 253, 0.1)', borderRadius: '6px', padding: '2px', height: '38px', boxSizing: 'border-box' }}>
                        <button type="button" onClick={() => setFormData({...formData, side: 'buy'})} style={{ flex: 1, border: 'none', borderRadius: '4px', cursor: 'pointer', background: formData.side === 'buy' ? 'rgba(17, 255, 153, 0.15)' : 'transparent', color: formData.side === 'buy' ? '#11ff99' : '#a1a4a5' }}>BUY</button>
                        <button type="button" onClick={() => setFormData({...formData, side: 'sell'})} style={{ flex: 1, border: 'none', borderRadius: '4px', cursor: 'pointer', background: formData.side === 'sell' ? 'rgba(255, 32, 71, 0.15)' : 'transparent', color: formData.side === 'sell' ? '#ff2047' : '#a1a4a5' }}>SELL</button>
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <textarea name="entryThought" value={formData.entryThought} onChange={handleInputChange} style={{ width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '8px', padding: '12px 14px', color: '#f0f0f0', fontFamily: "'Inter', sans-serif", fontSize: '13px', minHeight: '80px', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="submit" style={{ flex: 1, background: '#ffffff', color: '#000000', border: 'none', borderRadius: '9999px', padding: '10px', fontWeight: 600 }}>Save Changes</button>
                    <button type="button" onClick={() => setEditingId(null)} style={{ flex: 1, background: 'transparent', color: '#f0f0f0', border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '9999px', padding: '10px' }}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div key={entry._id} style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      background: entry.side === 'buy' ? 'rgba(17,255,153,0.1)' : 'rgba(255,32,71,0.1)', 
                      color: entry.side === 'buy' ? '#11ff99' : '#ff2047',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      textTransform: 'uppercase'
                    }}>{entry.side}</span>
                    <span style={{ fontFamily: "'Commit Mono', monospace", fontSize: '16px', color: '#f0f0f0', fontWeight: 500, marginLeft: '10px' }}>{entry.symbol}</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#464a4d', marginLeft: '12px' }}>{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {entry.realisedPnL !== null && (
                      <span style={{ 
                        fontFamily: "'Commit Mono', monospace", 
                        fontSize: '12px', 
                        color: entry.realisedPnL >= 0 ? '#11ff99' : '#ff2047' 
                      }}>{entry.realisedPnL >= 0 ? '+' : ''}{entry.realisedPnL.toFixed(2)}</span>
                    )}
                    <button onClick={() => handleEdit(entry)} style={{ background: 'none', border: 'none', color: '#a1a4a5', cursor: 'pointer' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(entry._id)} style={{ background: 'none', border: 'none', color: '#a1a4a5', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(214, 235, 253, 0.1)' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#464a4d', textTransform: 'uppercase' }}>ENTRY PRICE</div>
                    <div style={{ fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#f0f0f0', marginTop: '4px' }}>${entry.entryPrice?.toFixed(2) || '--'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#464a4d', textTransform: 'uppercase' }}>QUANTITY</div>
                    <div style={{ fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#f0f0f0', marginTop: '4px' }}>{entry.quantity || '--'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#464a4d', textTransform: 'uppercase' }}>MOOD</div>
                    <div style={{ fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#f0f0f0', marginTop: '4px' }}>{getMoodEmoji(entry.mood)} {entry.mood?.charAt(0).toUpperCase() + entry.mood?.slice(1)}</div>
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  {entry.entryThought ? (
                    <div>
                      <div style={{ fontSize: '9px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>ENTRY</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#f0f0f0', lineHeight: 1.6, marginTop: '4px' }}>{entry.entryThought}</div>
                    </div>
                  ) : !entry.exitThought && (
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#464a4d', fontStyle: 'italic' }}>No notes added.</div>
                  )}
                  
                  {entry.exitThought && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '9px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em' }}>EXIT</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#a1a4a5', lineHeight: 1.6, marginTop: '4px' }}>{entry.exitThought}</div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '14px' }}>
                  {entry.tags.map(tag => (
                    <span key={tag} style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '9999px', padding: '2px 8px', fontSize: '10px', color: '#a1a4a5', fontFamily: "'Inter', sans-serif" }}>{tag}</span>
                  ))}
                </div>
              </div>
            )
          ))
        )}
      </div>

      {/* TAG INSIGHTS PANEL */}
      <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', marginTop: '24px' }}>
        <div style={{ fontSize: '10px', color: '#a1a4a5', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '16px' }}>Pattern Insights</div>
        <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -24px 16px -24px' }}></div>
        
        {!loading && stats?.tagBreakdown.length > 0 ? (
          <div>
            {stats.tagBreakdown.slice(0, 6).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ width: '140px', fontSize: '12px', color: '#a1a4a5', fontFamily: "'Inter', sans-serif" }}>{item.tag}</span>
                <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${(item.count / stats.tagBreakdown[0].count) * 100}%`, 
                    height: '100%', 
                    background: '#3b9eff', 
                    borderRadius: '9999px' 
                  }}></div>
                </div>
                <span style={{ marginLeft: '8px', fontFamily: "'Commit Mono', monospace", fontSize: '11px', color: '#464a4d' }}>{item.count}</span>
              </div>
            ))}
            
            <div style={{ marginTop: '16px', fontSize: '12px' }}>
              {stats.tagBreakdown[0].tag === 'FOMO' ? (
                <span style={{ color: '#ffc53d' }}>⚠ FOMO is your most common pattern. Consider waiting for confirmed setups.</span>
              ) : stats.tagBreakdown[0].tag === 'Disciplined' ? (
                <span style={{ color: '#11ff99' }}>✓ Discipline is your strongest trait. Keep it up.</span>
              ) : (
                <span style={{ color: '#464a4d' }}>Keep journaling to reveal your trading patterns.</span>
              )}
            </div>
          </div>
        ) : !loading && (
          <div style={{ color: '#464a4d', fontSize: '13px' }}>Tag your entries to see pattern insights.</div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, #111 0%, #1a1a1a 50%, #111 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite linear;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Journal;