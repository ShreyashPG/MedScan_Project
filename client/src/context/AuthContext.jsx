import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('medscan_token');
    const savedUser = localStorage.getItem('medscan_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('medscan_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('medscan_token', token);
    localStorage.setItem('medscan_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('medscan_token');
    localStorage.removeItem('medscan_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedData) => {
    const newUser = { ...user, ...updatedData };
    localStorage.setItem('medscan_user', JSON.stringify(newUser));
    setUser(newUser);
  }, [user]);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
