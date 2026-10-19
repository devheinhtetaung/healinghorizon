import { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './authContext';
import { apiClient, setTokens, clearTokens, getRefreshToken, setRefreshHandler } from '../services/apiClient';
import { authService } from '../services/authService';

function loadStoredRefresh() {
  return getRefreshToken();
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const doRefresh = useCallback(async (refreshToken) => {
    const data = await apiClient.post('/auth/refresh', { refreshToken: refreshToken });
    const newAccess = data.accessToken;
    setTokens(newAccess, null);
    return newAccess;
  }, []);

  // Register the refresh handler so apiClient can auto-retry on 401
  useEffect(() => {
    setRefreshHandler(doRefresh);
  }, [doRefresh]);

  // On app load: attempt silent refresh if a stored refresh token exists
  useEffect(() => {
    const storedRefresh = loadStoredRefresh();
    if (!storedRefresh) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const newAccess = await doRefresh(storedRefresh);
        setTokens(newAccess, null);
        const profile = await apiClient.get('/users/me');
        setUser(profile.user || profile);
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    })();
  }, [doRefresh]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login({ email, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (form) => {
    const data = await authService.register(form);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore — tokens are cleared regardless
    }
    clearTokens();
    setUser(null);
  }, []);

  // Re-fetch the current user (e.g. after an avatar upload) so every surface
  // that reads auth.user — TopNav, dashboard greetings — reflects the change.
  const refreshUser = useCallback(async () => {
    const profile = await apiClient.get('/users/me');
    const nextUser = profile.user || profile;
    setUser(nextUser);
    return nextUser;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    role: user?.role || null,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
