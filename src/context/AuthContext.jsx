import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setWorkerProfile(data.workerProfile || null);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setWorkerProfile(data.workerProfile || null);
    return data;
  };

  const register = async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const registerWorker = async (formData) => {
    const { data } = await api.post('/auth/register-worker', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setWorkerProfile(data.workerProfile || data.worker || null);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setWorkerProfile(null);
    toast.success('Logged out successfully.');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const updateWorkerProfile = (updatedWorkerProfile) => {
    setWorkerProfile(updatedWorkerProfile);
  };

  return (
    <AuthContext.Provider
      value={{ user, workerProfile, loading, login, register, registerWorker, logout, updateUser, updateWorkerProfile, loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
