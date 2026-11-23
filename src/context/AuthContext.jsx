import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authApi,
  getStoredToken,
  setStoredToken,
  removeStoredToken,
} from '../api/client';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const storedToken = await getStoredToken();
      if (storedToken) {
        setToken(storedToken);
        const res = await authApi.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          await removeStoredToken();
          setToken(null);
        }
      }
    } catch (err) {
      console.log('Error initializing auth:', err);
      await removeStoredToken();
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, pass) => {
    try {
      const res = await authApi.login(email, pass);
      if (res.success && res.token && res.user) {
        await setStoredToken(res.token);
        setToken(res.token);
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Error during sign in' };
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      await removeStoredToken();
    } catch (err) {
      console.error('Logout error:', err);
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const can = (permission) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'admin') return true;
    return Boolean(user.permissions?.[permission]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        updateUser,
        hasRole,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
