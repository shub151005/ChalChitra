import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getCurrentUser, loginUser, signupUser } from "../api/authApi";

const AuthContext = createContext(null);

const TOKEN_KEY = "chalchitra_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const saveToken = (newToken) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const loadUser = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      setAuthLoading(false);
      return;
    }

    try {
      setAuthLoading(true);

      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      clearToken();
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await loginUser(email, password);

    const accessToken = data.access_token || data.token;

    if (!accessToken) {
      throw new Error("Login response did not include access token.");
    }

    saveToken(accessToken);

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    return currentUser;
  };

  const signup = async (userData) => {
    await signupUser(userData);

    const currentUser = await login(userData.email, userData.password);

    return currentUser;
  };

  const logout = () => {
    clearToken();
  };

  useEffect(() => {
    loadUser();
  }, []);

  const value = useMemo(() => {
    return {
      token,
      user,
      authLoading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
      loadUser
    };
  }, [token, user, authLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};