import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/endpoints";
import { setTokens, clearTokens, setOnAuthFailure } from "../api/client";

const AuthContext = createContext(null);

const STORAGE_KEY = "task_inventory_refresh_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthFailure(logout);
  }, [logout]);

  // Attempt silent session restore using a persisted refresh token.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setInitializing(false);
      return;
    }
    setTokens({ refresh: stored });

    (async () => {
      try {
        const meResponse = await authApi.me();
        setUser(meResponse.data);
      } catch {
        clearTokens();
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  function applySession(data, remember = true) {
    setTokens({ access: data.access_token, refresh: data.refresh_token });
    if (remember) {
      localStorage.setItem(STORAGE_KEY, data.refresh_token);
    }
    setUser(data.user);
  }

  async function login(email, password) {
    const { data } = await authApi.login({ email, password });
    applySession(data);
    return data.user;
  }

  async function register(name, email, password, role = "user") {
    const { data } = await authApi.register({ name, email, password, role });
    applySession(data);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
