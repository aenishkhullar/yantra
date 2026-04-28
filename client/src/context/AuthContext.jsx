import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as loginService, register as registerService, getMe as getMeService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('yantra_token');
      if (storedToken) {
        try {
          const data = await getMeService();
          setUser(data.user);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to authenticate stored token:', error);
          localStorage.removeItem('yantra_token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const data = await loginService(email, password);
    localStorage.setItem('yantra_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (displayName, email, password) => {
    const data = await registerService(displayName, email, password);
    localStorage.setItem('yantra_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('yantra_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const data = await getMeService();
      setUser(data.user || data);
    } catch (err) {
      console.error('refreshUser failed:', err);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
