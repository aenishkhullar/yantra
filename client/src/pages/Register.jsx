import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!displayName.trim() || displayName.trim().length < 2)
      errors.displayName = 'Name must be at least 2 characters';
    if (displayName.trim().length > 30)
      errors.displayName = 'Name cannot exceed 30 characters';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Enter a valid email address';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6)
      errors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword)
      errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const getPasswordStrength = () => {
    if (!password) return { width: '0%', color: 'transparent', label: '' };
    if (password.length < 6) return { width: '33%', color: '#ff2047', label: 'Weak' };
    if (password.length <= 9) return { width: '66%', color: '#ffc53d', label: 'Medium' };
    return { width: '100%', color: '#11ff99', label: 'Strong' };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setLoading(true);
    setError('');
    setFieldErrors({});
    try {
      await register(displayName, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      padding: '40px 0' // to allow scrolling if screen is too small
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bannerIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-input {
          background: #0a0a0a;
          border: 1px solid rgba(214, 235, 253, 0.19);
          border-radius: 8px;
          color: #f0f0f0;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          padding: 12px 16px;
          width: 100%;
          outline: none;
          transition: border-color 0.15s;
        }

        .auth-input:focus {
          border-color: rgba(214, 235, 253, 0.5);
        }

        .auth-input.error {
          border-color: rgba(255, 32, 71, 0.6);
        }

        .auth-input.success {
          border-color: rgba(17, 255, 153, 0.4);
        }
      `}</style>
      
      {/* Background pattern */}
      <div style={{
        backgroundImage: 'radial-gradient(rgba(214, 235, 253, 0.06) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Card */}
      <div style={{
        maxWidth: '440px',
        width: '100%',
        border: '1px solid rgba(214, 235, 253, 0.19)',
        borderRadius: '20px',
        padding: '40px',
        background: 'rgba(255,255,255,0.01)',
        backdropFilter: 'blur(10px)',
        zIndex: 1,
        animation: 'cardIn 0.3s ease forwards',
        margin: '20px',
        marginTop: '60px'
      }}>
        {/* TOP SECTION */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span style={{ 
              fontFamily: 'Inter', 
              fontSize: '22px', 
              fontWeight: 700, 
              color: '#f0f0f0', 
              letterSpacing: '-0.5px' 
            }}>yantra</span>
          </div>
          <h2 style={{ fontFamily: 'Inter', fontSize: '16px', color: '#f0f0f0', fontWeight: 500, margin: '12px 0 0 0' }}>
            Create your account
          </h2>
          <p style={{ fontFamily: 'Inter', fontSize: '13px', color: '#a1a4a5', margin: '4px 0 0 0' }}>
            Start trading with $100,000 virtual capital
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Display Name field */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter',
              fontSize: '10px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: '6px'
            }}>DISPLAY NAME</label>
            <input
              type="text"
              placeholder="How you'll appear on leaderboard"
              className={`auth-input ${fieldErrors.displayName ? 'error' : ''}`}
              value={displayName}
              onChange={(e) => {
                setDisplayName(e.target.value);
                if (fieldErrors.displayName) setFieldErrors({ ...fieldErrors, displayName: null });
              }}
            />
            <div style={{ 
              fontFamily: 'Inter', 
              fontSize: '10px', 
              color: '#464a4d', 
              textAlign: 'right', 
              marginTop: '3px' 
            }}>
              {displayName.length}/30
            </div>
            {fieldErrors.displayName && (
              <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#ff2047', marginTop: '5px' }}>
                ⚠ {fieldErrors.displayName}
              </div>
            )}
          </div>

          {/* Email field */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter',
              fontSize: '10px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: '6px'
            }}>EMAIL</label>
            <input
              type="email"
              className={`auth-input ${fieldErrors.email ? 'error' : ''}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
              }}
            />
            {fieldErrors.email && (
              <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#ff2047', marginTop: '5px' }}>
                ⚠ {fieldErrors.email}
              </div>
            )}
          </div>

          {/* Password field */}
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter',
              fontSize: '10px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: '6px'
            }}>PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#464a4d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#a1a4a5'}
                onMouseOut={(e) => e.currentTarget.style.color = '#464a4d'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* Password strength bar */}
            <div style={{
              height: '3px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '9999px',
              marginTop: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                borderRadius: '9999px',
                transition: 'width 0.3s ease, background-color 0.3s ease',
                width: strength.width,
                backgroundColor: strength.color
              }}></div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontFamily: 'Inter', fontSize: '10px', color: strength.color }}>
                {strength.label}
              </span>
              <span style={{ fontFamily: 'Inter', fontSize: '10px', color: '#464a4d' }}>
                {password.length} chars
              </span>
            </div>

            {fieldErrors.password && (
              <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#ff2047', marginTop: '5px' }}>
                ⚠ {fieldErrors.password}
              </div>
            )}
          </div>

          {/* Confirm Password field */}
          <div style={{ marginBottom: '6px' }}>
            <label style={{
              display: 'block',
              fontFamily: 'Inter',
              fontSize: '10px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: '6px'
            }}>CONFIRM PASSWORD</label>
            <input
              type="password"
              className={`auth-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null });
              }}
            />
            {confirmPassword && (
              <div style={{
                fontFamily: 'Inter',
                fontSize: '11px',
                marginTop: '5px',
                color: confirmPassword === password ? '#11ff99' : '#ff2047'
              }}>
                {confirmPassword === password ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}
            {fieldErrors.confirmPassword && !confirmPassword && (
              <div style={{ fontFamily: 'Inter', fontSize: '11px', color: '#ff2047', marginTop: '5px' }}>
                ⚠ {fieldErrors.confirmPassword}
              </div>
            )}
          </div>

          {/* Benefits strip */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '20px',
            marginTop: '4px'
          }}>
            <span style={{ fontFamily: 'Inter', fontSize: '11px', color: '#a1a4a5' }}>✓ $100k virtual capital</span>
            <span style={{ fontFamily: 'Inter', fontSize: '11px', color: '#a1a4a5' }}>✓ Live market data</span>
            <span style={{ fontFamily: 'Inter', fontSize: '11px', color: '#a1a4a5' }}>✓ Free forever</span>
          </div>

          {/* General error banner */}
          {error && (
            <div style={{
              background: 'rgba(255,32,71,0.08)',
              border: '1px solid rgba(255,32,71,0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              animation: 'bannerIn 200ms ease forwards'
            }}>
              <AlertCircle size={16} color="#ff2047" />
              <span style={{ fontFamily: 'Inter', fontSize: '13px', color: '#ff2047' }}>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#ffffff',
              color: '#000000',
              borderRadius: '9999px',
              padding: '13px',
              fontFamily: 'Inter',
              fontSize: '14px',
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loading ? 0.8 : 1
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: '#000000',
                  borderRadius: '9999px',
                  display: 'inline-block',
                  marginRight: '8px',
                  animation: 'spin 0.6s linear infinite'
                }}></span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1, height: '1px', borderBottom: '1px solid rgba(214, 235, 253, 0.19)' }}></div>
          <span style={{ fontFamily: 'Inter', fontSize: '12px', color: '#464a4d' }}>or</span>
          <div style={{ flex: 1, height: '1px', borderBottom: '1px solid rgba(214, 235, 253, 0.19)' }}></div>
        </div>

        {/* Login link row */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: 'Inter', fontSize: '13px', color: '#a1a4a5' }}>
            Already have an account?
          </span>
          <span
            onClick={() => navigate('/login')}
            style={{ 
              fontFamily: 'Inter', 
              fontSize: '13px', 
              color: '#f0f0f0', 
              fontWeight: 500, 
              cursor: 'pointer', 
              marginLeft: '4px' 
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#3b9eff'}
            onMouseOut={(e) => e.currentTarget.style.color = '#f0f0f0'}
          >
            Sign in →
          </span>
        </div>
      </div>

      {/* BOTTOM */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '0',
        width: '100%',
        textAlign: 'center',
        zIndex: 1
      }}>
        <div style={{
          fontFamily: 'Inter',
          fontSize: '11px',
          color: '#464a4d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Shield size={12} color="#464a4d" />
          Protected by JWT authentication
        </div>
        <div style={{
          fontFamily: 'Inter',
          fontSize: '10px',
          color: '#464a4d',
          marginTop: '8px'
        }}>
          By signing up you agree to our Terms of Service
        </div>
      </div>

    </div>
  );
};

export default Register;
