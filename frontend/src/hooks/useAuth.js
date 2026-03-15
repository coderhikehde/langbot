import { createContext, useContext, useState, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (username, password) => {
    const response = await authApi.login(username, password);
    const { token, userId, username: uname } = response.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ userId, username: uname }));
    setUser({ userId, username: uname });
    return response.data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const response = await authApi.register(username, email, password);
    const { token, userId, username: uname } = response.data;
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ userId, username: uname }));
    setUser({ userId, username: uname });
    return response.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
