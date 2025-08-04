"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

  const isAuthenticated = !!user;

  const fetchUser = async () => {
    try {
      if (typeof window === 'undefined') {
        setUser(null);
        setLoading(false);
        return;
      }

      const sessionToken = localStorage.getItem('kowalski-session');

      if (!sessionToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kowalski-session');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

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

  const refreshUser = async () => {
    await fetchUser();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        logout,
        refreshUser,
      }}
    >
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
