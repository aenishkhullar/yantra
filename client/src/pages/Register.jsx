import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Register = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await register(displayName, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: '#000000',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: 'transparent',
        border: '1px solid rgba(214,235,253,0.19)',
        borderRadius: '16px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '28px',
          color: '#f0f0f0',
          letterSpacing: '-0.5px',
          marginBottom: '32px',
          textAlign: 'center',
          fontWeight: 'normal',
          margin: '0 0 32px 0'
        }}>
          yantra
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '8px'
            }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(214,235,253,0.19)',
                borderRadius: '4px',
                color: '#f0f0f0',
                padding: '10px 14px',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '8px'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(214,235,253,0.19)',
                borderRadius: '4px',
                color: '#f0f0f0',
                padding: '10px 14px',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#a1a4a5',
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              marginBottom: '8px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(214,235,253,0.19)',
                borderRadius: '4px',
                color: '#f0f0f0',
                padding: '10px 14px',
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              borderRadius: '9999px',
              padding: '10px 24px',
              width: '100%',
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              border: 'none',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginTop: '8px',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Loading...' : 'Sign Up'}
          </button>
        </form>

        {error && (
          <div style={{
            color: '#ff2047',
            fontSize: '13px',
            marginTop: '12px',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
