import React, { createContext, useContext, useState, useEffect } from 'react';
import { authStorage } from './authStorage';
import { loginUserApi, registerCandidateApi, getCurrentUserApi } from '../api/auth';

const AuthContext = createContext(null);

export const getRoleDashboardPath = (role) => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'INTERVIEW_ENGINEER':
      return '/engineer/dashboard';
    case 'INSTRUCTOR':
      return '/instructor/dashboard';
    case 'CANDIDATE':
      return '/candidate/dashboard';
    default:
      return '/';
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(authStorage.getUser());
  const [token, setToken] = useState(authStorage.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = authStorage.getToken();
      if (storedToken) {
        try {
          const res = await getCurrentUserApi();
          if (res.success && res.data) {
            setUser(res.data);
            authStorage.saveUser(res.data);
          }
        } catch {
          authStorage.clearAuth();
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await loginUserApi({ email, password });
    if (res.success && res.data) {
      const { accessToken, user: userData } = res.data;
      authStorage.saveToken(accessToken);
      authStorage.saveUser(userData);
      setToken(accessToken);
      setUser(userData);
      return { success: true, user: userData };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (fullName, email, password) => {
    const res = await registerCandidateApi({ fullName, email, password });
    return res;
  };

  const logout = () => {
    authStorage.clearAuth();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    register,
    logout,
    getRoleDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
