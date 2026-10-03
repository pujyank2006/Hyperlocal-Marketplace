import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, userService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('isLoggedIn') === 'true'
  );
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Verify auth session on app initialization
  const verifyAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const data = await userService.getProfile();
      if (data && data.user) {
        setUser(data.user);
        setIsLoggedIn(true);
        localStorage.setItem('isLoggedIn', 'true');
      } else {
        setUser(null);
        setIsLoggedIn(false);
        localStorage.removeItem('isLoggedIn');
      }
    } catch (err) {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn');
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.success) {
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      await verifyAuth();
    }
    return data;
  };

  const signup = async (userData) => {
    const data = await authService.signup(userData);
    if (data.success) {
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoggedIn(true);
      await verifyAuth();
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('isLoggedIn');
    }
  };

  const updateUserState = (updatedFields) => {
    setUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoadingAuth,
        login,
        signup,
        logout,
        updateUserState,
        verifyAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
