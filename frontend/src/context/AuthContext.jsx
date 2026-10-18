import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Only the very first session check drives isLoading. Later refreshes (after
  // completing a quest, to pick up new XP) must stay silent: App swaps the
  // whole tree for a full-screen loader while isLoading is true, which used to
  // blank the screen every time a task was marked Done.
  const loadSession = useCallback(async () => {
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await api.auth.me();
      setUser(me);
    } catch (err) {
      if (err.status === 401) setUser(null);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

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

  // Server deletes everything in one transaction and clears the session
  // cookie; local state is only dropped once that has succeeded.
  const deleteAccount = async body => {
    await api.auth.deleteAccount(body);
    setUser(null);
  };

  const updateLocalUser = patch => setUser(prev => (prev ? { ...prev, ...patch } : prev));

  return (
    <AuthContext.Provider value={{ user, isLoading, register, login, logout, deleteAccount, refresh, updateLocalUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
