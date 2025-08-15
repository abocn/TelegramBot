"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import i18n from "@/lib/i18n";

interface UserData {
  telegramId: string;
  username: string;
  firstName: string;
  lastName: string;
  aiEnabled: boolean;
  showThinking: boolean;
  customAiModel: string;
  customSystemPrompt: string;
  aiTemperature: number;
  aiRequests: number;
  aiCharacters: number;
  disabledCommands: string[];
  disabledAdminCommands: string[];
  isAdmin: boolean;
  languageCode: string;
  timezone: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<number>(0);

  useEffect(() => {
    const storedLang = localStorage.getItem('kowalski-language');
    if (storedLang && ['en', 'pt'].includes(storedLang)) {
      i18n.changeLanguage(storedLang);
    }
  }, []);

  const isAuthenticated = useMemo(() => !!user, [user]);

  const fetchUser = useCallback(async (force = false) => {
    try {
      if (typeof window === 'undefined') {
        setUser(null);
        setLoading(false);
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetch < 30000 && user) {
        setLoading(false);
        return;
      }

      const sessionToken = localStorage.getItem('kowalski-session');

      const response = await fetch('/api/user/profile', {
        headers: sessionToken ? {
          'Authorization': `Bearer ${sessionToken}`
        } : {},
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(prevUser => {
          if (JSON.stringify(prevUser) !== JSON.stringify(userData)) {
            return userData;
          }
          return prevUser;
        });
        setLastFetch(now);

        if (userData.languageCode) {
          const lang = userData.languageCode === 'portuguese' ? 'pt' : userData.languageCode;
          i18n.changeLanguage(lang);
          localStorage.setItem('kowalski-language', lang);
        }
      } else {
        setUser(null);
        if (typeof window !== 'undefined' && sessionToken) {
          localStorage.removeItem('kowalski-session');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [lastFetch, user]);

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const sessionToken = localStorage.getItem('kowalski-session');
        if (sessionToken) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });
        }
        localStorage.removeItem('kowalski-session');
      }
      setUser(null);
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kowalski-session');
      }
      setUser(null);
      window.location.href = '/login';
    }
  };

  const refreshUser = useCallback(async () => {
    await fetchUser(true);
  }, [fetchUser]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const contextValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    logout,
    refreshUser,
  }), [user, loading, isAuthenticated, logout, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
