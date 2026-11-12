import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import endpoints from '../api/endpoints';

const AuthContext = createContext(null);

/**
 * Decode a JWT payload without a library.
 * Returns the parsed JSON payload or null on failure.
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Extract user info from a JWT token payload.
 */
function extractUserFromToken(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  return {
    id: payload.userId || payload.sub || payload.id,
    email: payload.email || payload.sub,
    username: payload.username || payload.name || payload.email || payload.sub,
    role: payload.role || payload.authorities?.[0] || payload.roles?.[0] || 'ACCOUNT_HOLDER',
    firstName: payload.firstName || '',
    lastName: payload.lastName || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap: check localStorage for an existing session ──
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        // Verify token is not expired
        const payload = decodeJwtPayload(storedToken);
        const isExpired = payload?.exp && payload.exp * 1000 < Date.now();

        if (!isExpired) {
          setToken(storedToken);
          setUser(storedUser ? JSON.parse(storedUser) : extractUserFromToken(storedToken));
        } else {
          // Token expired — clear storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Login ──
  const login = useCallback(async (email, password) => {
    const response = await axiosInstance.post(endpoints.auth.login, { email, password });
    const data = response.data;

    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;

    if (!accessToken) {
      throw new Error('No access token received from server.');
    }

    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }

    const userInfo = data.user || extractUserFromToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userInfo));

    setToken(accessToken);
    setUser(userInfo);

    return userInfo;
  }, []);

  // ── Register with Automatic Session Hydration ──
  const register = useCallback(async (registrationData) => {
    const response = await axiosInstance.post(endpoints.auth.register, registrationData);
    const data = response.data;

    const accessToken = data.accessToken || data.token;
    const refreshToken = data.refreshToken;

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      const userInfo = data.user || extractUserFromToken(accessToken);
      localStorage.setItem('user', JSON.stringify(userInfo));

      setToken(accessToken);
      setUser(userInfo);
      return userInfo;
    }

    return data;
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axiosInstance.post(endpoints.auth.logout, { refreshToken });
    } catch {
      // Swallow — we still clear local state
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  }, []);

  // ── Derived helpers ──
  const isAuthenticated = !!token && !!user;

  const isAdmin = useMemo(
    () => user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN',
    [user]
  );
  const isCustomer = useMemo(
    () => user?.role === 'ACCOUNT_HOLDER' || user?.role === 'ROLE_ACCOUNT_HOLDER' || user?.role === 'CUSTOMER' || user?.role === 'ROLE_CUSTOMER',
    [user]
  );
  const isAuditor = useMemo(
    () => user?.role === 'AUDITOR' || user?.role === 'ROLE_AUDITOR',
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isAdmin,
      isCustomer,
      isAuditor,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, isAuthenticated, isAdmin, isCustomer, isAuditor, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume AuthContext.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
