import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '@/api/client.js';
import { useToast } from '@/context/ToastContext.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Check stored token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/login', { email, password });
      const { token, user } = response.data.data;

      // Save token and user
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      setUser(user);
      addToast('Signed in successfully', 'success');

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      addToast(message, 'error');
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      addToast('You signed out', 'info');
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('auth_user');
    }
  };

  const value = { user, login, logout, loading, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);