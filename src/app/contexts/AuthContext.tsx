import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
  instansi: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, remember: boolean) => boolean;
  register: (name: string, instansi: string, email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('makesens-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, password: string, remember: boolean) => {
    // Mock login - in production, this would call an API
    // For demo purposes, accept any email/password
    if (email && password) {
      const mockUser: User = {
        name: 'Admin User',
        email: email,
        instansi: 'AIEWS MakeSens',
        role: 'Administrator'
      };
      
      setUser(mockUser);
      if (remember) {
        localStorage.setItem('makesens-user', JSON.stringify(mockUser));
      }
      return true;
    }
    return false;
  };

  const register = (name: string, instansi: string, email: string, password: string) => {
    // Mock registration
    if (name && instansi && email && password) {
      const newUser: User = {
        name,
        email,
        instansi,
        role: 'Petugas Lapangan'
      };
      
      setUser(newUser);
      localStorage.setItem('makesens-user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('makesens-user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}