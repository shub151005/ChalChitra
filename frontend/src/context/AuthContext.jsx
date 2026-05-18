import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser, loginUser, signupUser } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const token = localStorage.getItem("chalchitra_token");

  const isAuthenticated = Boolean(token && user);

  const loadUser = async () => {
    const storedToken = localStorage.getItem("chalchitra_token");

    if (!storedToken) {
      setAuthLoading(false);
      return;
    }

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      localStorage.removeItem("chalchitra_token");
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await loginUser(email, password);

    localStorage.setItem("chalchitra_token", data.access_token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    return currentUser;
  };

  const signup = async (payload) => {
    const data = await signupUser(payload);

    localStorage.setItem("chalchitra_token", data.access_token);

    const currentUser = await getCurrentUser();
    setUser(currentUser);

    return currentUser;
  };

  const logout = () => {
    localStorage.removeItem("chalchitra_token");
    setUser(null);
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        isAuthenticated,
        login,
        signup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};