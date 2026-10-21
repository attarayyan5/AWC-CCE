import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service.js';
import { setAccessToken, clearAccessToken } from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authService.getMe();
      setUser(data.data.user);
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      clearAccessToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try to restore session via refresh token cookie
    const initAuth = async () => {
      try {
        const { data } = await authService.refresh();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await authService.login({ email, password });
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    setIsAuthenticated(true);
    return data.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  const logoutAll = async () => {
    try {
      await authService.logoutAll();
    } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout, logoutAll, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}
