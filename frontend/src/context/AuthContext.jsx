import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const register = async body => {
    const { user: created } = await api.auth.register(body);
    setUser(created);
    return created;
  };

  const login = async body => {
    const { user: loggedIn } = await api.auth.login(body);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const updateLocalUser = patch => setUser(prev => (prev ? { ...prev, ...patch } : prev));

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout, refresh, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
