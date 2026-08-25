"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchCurrentUser } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profileImage?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  experience?: number;
  timezone?: string;
  socialLinks?: { github?: string; linkedin?: string; twitter?: string };
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearStoredSession = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        if (!storedToken) return;

        // Never trust cached profile data as the source of identity.
        // Resolve the current user from the JWT on every app startup.
        const response = await fetchCurrentUser(storedToken);
        const currentUser = response?.user;
        if (!currentUser?.id) throw new Error('Invalid current-user response');

        if (!cancelled) {
          setToken(storedToken);
          setUser(currentUser);
          localStorage.setItem('authUser', JSON.stringify(currentUser));
        }
      } catch {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          clearStoredSession();
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = (newToken: string, newUser: User) => {
    // Replace the complete previous session atomically.
    clearStoredSession();
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredSession();
  };

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
