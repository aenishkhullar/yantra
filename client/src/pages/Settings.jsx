import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateDisplayName, changePassword } from '../services/userService';

const Settings = () => {
  const { user, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Display name form
  const [displayName, setDisplayName] = useState('');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    getProfile()
      .then(data => {
        setProfileData(data);
        setDisplayName(data.user.displayName || '');
      })
      .catch(err => console.error('Failed to fetch profile:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (nameSuccess) {
      const timer = setTimeout(() => setNameSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [nameSuccess]);

  const handleNameUpdate = async () => {
    if (!displayName || displayName === user.displayName) return;
    setNameLoading(true);
    setNameError('');
    setNameSuccess('');
    try {
      await updateDisplayName(displayName);
      setNameSuccess('Display name updated');
      await refreshUser();
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6) return;
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { width: '0%', color: 'transparent', label: '' };
    if (pwd.length < 6) return { width: '33%', color: '#ff2047', label: 'Weak' };
    if (pwd.length < 10) return { width: '66%', color: '#ffc53d', label: 'Medium' };
    return { width: '100%', color: '#11ff99', label: 'Strong' };
  };

  const strength = getPasswordStrength(newPassword);

  const formatVolume = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  const Shimmer = () => (
    <div style={{
      height: '400px',
      borderRadius: '16px',
      border: '1px solid rgba(214, 235, 253, 0.19)',
      background: 'linear-gradient(90deg, #050505 0%, #111 50%, #050505 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s infinite linear'
    }}></div>
  );

  return (
    <div style={{ color: '#f0f0f0', fontFamily: 'Inter, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 500, color: '#f0f0f0', marginBottom: '28px' }}>Settings</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN - Profile Card */}
        <div>
          {loading ? (
            <Shimmer />
          ) : (
            <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '28px', textAlign: 'center', background: 'transparent' }}>
              <div style={{ 
                width: '72px', height: '72px', borderRadius: '9999px', margin: '0 auto 16px',
                background: 'rgba(59,158,255,0.1)', border: '2px solid rgba(59,158,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontFamily: 'Commit Mono, monospace', fontSize: '28px', color: '#3b9eff' }}>
                  {profileData?.user.displayName?.[0].toUpperCase()}
                </span>
              </div>
              
              <div style={{ fontSize: '18px', fontWeight: 500, color: '#f0f0f0', marginBottom: '4px' }}>{profileData?.user.displayName}</div>
              <div style={{ fontSize: '12px', color: '#a1a4a5', marginBottom: '20px' }}>{profileData?.user.email}</div>

              <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '0 -28px' }}></div>

              <div style={{ marginTop: '20px', textAlign: 'left' }}>
                {[
                  { label: 'Member Since', value: new Date(profileData.stats.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), mono: true },
                  { label: 'Total Trades', value: profileData.stats.totalTrades, mono: true },
                  { label: 'Open Positions', value: profileData.stats.openPositions, color: '#3b9eff', mono: true },
                  { label: 'Total Volume', value: formatVolume(profileData.stats.totalVolume), mono: true },
                  { 
                    label: 'Return', 
                    value: `${profileData.stats.returnPercent >= 0 ? '+' : ''}${profileData.stats.returnPercent}%`, 
                    color: profileData.stats.returnPercent >= 0 ? '#11ff99' : '#ff2047',
                    mono: true 
                  },
                  { label: 'Portfolio Value', value: `$${profileData.stats.currentPortfolioValue.toLocaleString()}`, mono: true }
                ].map((stat, i, arr) => (
                  <div key={stat.label} style={{ 
                    display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                    borderBottom: i === arr.length - 1 ? 'none' : '1px solid rgba(214, 235, 253, 0.08)'
                  }}>
                    <span style={{ fontSize: '12px', color: '#a1a4a5' }}>{stat.label}</span>
                    <span style={{ 
                      fontSize: '12px', 
                      fontFamily: stat.mono ? 'Commit Mono, monospace' : 'Inter, sans-serif',
                      color: stat.color || '#f0f0f0'
                    }}>{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Subscription Badge */}
              <div style={{ 
                marginTop: '16px', background: 'rgba(255,197,61,0.04)', border: '1px solid rgba(255,197,61,0.2)',
                borderRadius: '10px', padding: '14px', textAlign: 'left'
              }}>
                <div style={{ fontSize: '12px', color: '#ffc53d', fontWeight: 500 }}>⭐ Free Plan</div>
                <div style={{ fontSize: '11px', color: '#a1a4a5', marginTop: '4px' }}>Balance reset is a Pro feature.</div>
                <div 
                  style={{ fontSize: '11px', color: '#ffc53d', marginTop: '8px', cursor: 'pointer' }}
                  onClick={() => alert('Pro features coming soon!')}
                >
                  Upgrade to Pro →
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Settings Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Section 1: Account Information */}
          <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
            <div style={{ fontSize: '15px', color: '#f0f0f0', fontWeight: 500 }}>Account Information</div>
            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '16px -24px 20px -24px' }}></div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '6px' }}>EMAIL ADDRESS</label>
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(214, 235, 253, 0.19)', 
                  borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#464a4d', cursor: 'not-allowed'
                }}>
                  {user?.email}
                </div>
                <div style={{ fontSize: '10px', color: '#464a4d', marginTop: '4px' }}>Email cannot be changed</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '6px' }}>ACCOUNT TYPE</label>
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(214, 235, 253, 0.19)', 
                  borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#464a4d', cursor: 'not-allowed'
                }}>
                  Free Simulator
                </div>
                <div style={{ fontSize: '10px', color: '#464a4d', marginTop: '4px' }}>Virtual trading only</div>
              </div>
            </div>
          </div>

          {/* Section 2: Display Name */}
          <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
            <div style={{ fontSize: '15px', color: '#f0f0f0', fontWeight: 500 }}>Display Name</div>
            <p style={{ fontSize: '13px', color: '#a1a4a5', marginTop: '4px', margin: '4px 0 0 0' }}>This name appears on the leaderboard and throughout the app.</p>
            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '16px -24px 20px -24px' }}></div>
            
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '6px' }}>DISPLAY NAME</label>
              <input 
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                style={{
                  width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)',
                  borderRadius: '6px', padding: '10px 14px', fontSize: '14px', color: '#f0f0f0', outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(214,235,253,0.5)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(214, 235, 253, 0.19)'}
              />
              <div style={{ position: 'absolute', right: '0', bottom: '-18px', fontSize: '10px', color: '#464a4d' }}>
                {displayName.length}/30
              </div>
            </div>

            {nameSuccess && <div style={{ fontSize: '12px', color: '#11ff99', marginTop: '24px' }}>✓ {nameSuccess}</div>}
            {nameError && <div style={{ fontSize: '12px', color: '#ff2047', marginTop: '24px' }}>{nameError}</div>}

            <button 
              onClick={handleNameUpdate}
              disabled={nameLoading || displayName === user?.displayName || displayName.length < 2}
              style={{
                marginTop: '24px', background: '#f0f0f0', color: '#000', border: 'none', borderRadius: '9999px',
                padding: '8px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                opacity: (nameLoading || displayName === user?.displayName || displayName.length < 2) ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {nameLoading ? 'Saving...' : 'Save Name'}
            </button>
          </div>

          {/* Section 3: Change Password */}
          <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '16px', padding: '24px', background: 'transparent' }}>
            <div style={{ fontSize: '15px', color: '#f0f0f0', fontWeight: 500 }}>Change Password</div>
            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '16px -24px 20px -24px' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '6px' }}>CURRENT PASSWORD</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  style={{
                    width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)',
                    borderRadius: '6px', padding: '10px 14px', fontSize: '14px', color: '#f0f0f0', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '6px' }}>NEW PASSWORD</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)',
                    borderRadius: '6px', padding: '10px 14px', fontSize: '14px', color: '#f0f0f0', outline: 'none'
                  }}
                />
                <div style={{ height: '3px', borderRadius: '9999px', background: 'rgba(255,255,255,0.05)', marginTop: '8px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', width: strength.width, background: strength.color, 
                    transition: 'width 0.3s ease, background-color 0.3s ease' 
                  }}></div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#a1a4a5', letterSpacing: '0.12em', marginBottom: '6px' }}>CONFIRM NEW PASSWORD</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%', background: '#0a0a0a', border: '1px solid rgba(214, 235, 253, 0.19)',
                    borderRadius: '6px', padding: '10px 14px', fontSize: '14px', color: '#f0f0f0', outline: 'none'
                  }}
                />
                {newPassword && confirmPassword && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: newPassword === confirmPassword ? '#11ff99' : '#ff2047' }}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>
            </div>

            {passwordSuccess && <div style={{ fontSize: '12px', color: '#11ff99', marginTop: '16px' }}>✓ {passwordSuccess}</div>}
            {passwordError && <div style={{ fontSize: '12px', color: '#ff2047', marginTop: '16px' }}>{passwordError}</div>}

            <button 
              onClick={handlePasswordChange}
              disabled={passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
              style={{
                marginTop: '16px', background: '#f0f0f0', color: '#000', border: 'none', borderRadius: '9999px',
                padding: '8px 24px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                opacity: (passwordLoading || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6) ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>

          {/* Section 4: Danger Zone */}
          <div style={{ border: '1px solid rgba(255, 32, 71, 0.2)', borderRadius: '16px', padding: '24px', background: 'rgba(255, 32, 71, 0.02)' }}>
            <div style={{ fontSize: '15px', color: '#ff2047', fontWeight: 500 }}>Danger Zone</div>
            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.19)', margin: '16px -24px 20px -24px' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 500 }}>Reset Virtual Balance</div>
                <div style={{ fontSize: '12px', color: '#a1a4a5', marginTop: '3px' }}>Start fresh with $100,000. All positions and history cleared.</div>
              </div>
              <div 
                title="Upgrade to Pro to unlock"
                style={{ 
                  background: 'rgba(255,197,61,0.1)', border: '1px solid rgba(255,197,61,0.3)', color: '#ffc53d',
                  borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', fontWeight: 500, cursor: 'default'
                }}
              >
                Pro Feature
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(214, 235, 253, 0.1)', margin: '16px 0' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#f0f0f0', fontWeight: 500 }}>Delete Account</div>
                <div style={{ fontSize: '12px', color: '#a1a4a5', marginTop: '3px' }}>Permanently delete your account and all data.</div>
              </div>
              <div style={{ border: '1px solid rgba(214, 235, 253, 0.19)', borderRadius: '9999px', padding: '4px 12px', fontSize: '11px', color: '#464a4d', cursor: 'default' }}>
                Coming Soon
              </div>
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

export default Settings;