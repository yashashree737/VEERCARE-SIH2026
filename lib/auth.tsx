"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthUser, LoginResponse } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  loginQuick: (preset: "admin" | "welfare" | "commander-u012" | "commander-u046" | "soldier-p0013" | "soldier-p0024") => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Read and validate session on mount
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem("veercare_token");
        if (savedToken) {
          setToken(savedToken);
          // Validate with backend
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem("veercare_user", JSON.stringify(profile));
        }
      } catch {
        // Token invalid or expired
        setToken(null);
        setUser(null);
        localStorage.removeItem("veercare_token");
        localStorage.removeItem("veercare_user");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveSession = (authData: LoginResponse) => {
    setToken(authData.token);
    setUser(authData.user);
    localStorage.setItem("veercare_token", authData.token);
    localStorage.setItem("veercare_user", JSON.stringify(authData.user));
  };

  const login = async (personnel_id: string, password: string): Promise<AuthUser> => {
    const res = await api.login(personnel_id, password);
    saveSession(res);
    return res.user;
  };

  const loginQuick = async (
    preset: "admin" | "welfare" | "commander" | "soldier" | "commander-u012" | "commander-u046" | "soldier-p0013" | "soldier-p0024"
  ): Promise<AuthUser> => {
    let id = "W1001";
    let pwd = "password123";

    if (preset === "admin") {
      id = "HR-001";
      pwd = "securepassword123";
    } else if (preset === "commander" || preset === "commander-u012" || preset === "commander-u046") {
      id = "C1001";
      pwd = "password123";
    } else if (preset === "soldier" || preset === "soldier-p0013" || preset === "soldier-p0024") {
      id = "P1001";
      pwd = "password123";
    }

    return login(id, pwd);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("veercare_token");
    localStorage.removeItem("veercare_user");
    api.logout().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        loginQuick,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
