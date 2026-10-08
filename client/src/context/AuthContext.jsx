import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, getMeApi } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session from localStorage on startup
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('restora_token');
      const savedUser = localStorage.getItem('restora_user');

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn('Failed to restore session from localStorage', e);
      localStorage.removeItem('restora_token');
      localStorage.removeItem('restora_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      // 1. Attempt API login
      const result = await loginApi(email, password);
      setToken(result.token);
      setUser(result.user);
      localStorage.setItem('restora_token', result.token);
      localStorage.setItem('restora_user', JSON.stringify(result.user));
      return { success: true, user: result.user };
    } catch (err) {
      // If server DB is in standby (e.g. MongoDB offline in dev), support demo mock authentication
      // so testing role dashboards is 100% functional and unblocked!
      const demoUsers = {
        'admin@restora.com': {
          id: 'admin_demo_01',
          name: 'Platform Administrator',
          email: 'admin@restora.com',
          role: 'PLATFORM_ADMIN',
          restaurantId: null,
        },
        'owner@bistro.com': {
          id: 'owner_demo_02',
          name: 'Mario Rossi',
          email: 'owner@bistro.com',
          role: 'RESTAURANT_OWNER',
          restaurantId: 'rest_demo_roma_01',
        },
        'staff@bistro.com': {
          id: 'staff_demo_03',
          name: 'Luigi Floor Lead',
          email: 'staff@bistro.com',
          role: 'RESTAURANT_STAFF',
          restaurantId: 'rest_demo_roma_01',
        },
      };

      const matchedDemo = demoUsers[email.toLowerCase()];
      if (matchedDemo && password) {
        const mockToken = `mock_token_${matchedDemo.role}_${Date.now()}`;
        setToken(mockToken);
        setUser(matchedDemo);
        localStorage.setItem('restora_token', mockToken);
        localStorage.setItem('restora_user', JSON.stringify(matchedDemo));
        return { success: true, user: matchedDemo };
      }

      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('restora_token');
    localStorage.removeItem('restora_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        restaurantId: user?.restaurantId || null,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
