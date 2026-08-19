import React, { createContext, useContext, useState, useEffect } from 'react';
import { API, setAuthToken, getAuthToken } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    async function loadInitialUser() {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await API.getMe();
          setUser(res.user);
          setActiveRole(res.user.role);
        } catch (err) {
          console.error('Failed to load user session:', err);
          setAuthToken(null);
        }
      }
      setLoading(false);
    }
    loadInitialUser();
  }, []);

  const loginVendor = async (email, password) => {
    const res = await API.loginVendor(email, password);
    setAuthToken(res.token);
    setUser(res.user);
    setActiveRole('vendor');
    return res.user;
  };

  const loginAdmin = async (email, password) => {
    const res = await API.loginAdmin(email, password);
    setAuthToken(res.token);
    setUser(res.user);
    setActiveRole('admin');
    return res.user;
  };

  const registerVendor = async (data) => {
    const res = await API.registerVendor(data);
    setAuthToken(res.token);
    setUser(res.user);
    setActiveRole('vendor');
    return res.user;
  };

  const refreshUser = async () => {
    try {
      const res = await API.getMe();
      setUser(res.user);
      setActiveRole(res.user.role);
      return res.user;
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    setActiveRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: activeRole || user?.role,
        loading,
        loginVendor,
        loginAdmin,
        registerVendor,
        refreshUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
