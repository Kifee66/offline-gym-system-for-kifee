import { useState, useEffect, createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

// Hardcoded credentials
const HARDCODED_USERS = [
  { 
    id: '1', 
    email: 'muturimichael66@gmail.com', 
    password: 'Michael2024!', 
    name: 'Michael Muturi' 
  },
  { 
    id: '2', 
    email: 'jasongitau06@gmail.com', 
    password: 'Jason2024!', 
    name: 'Jason Gitau' 
  },
  { 
    id: '3', 
    email: 'admin@gymapp.com', 
    password: 'Admin2024!', 
    name: 'Admin User' 
  }
];

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);

    // Listen for storage changes (for session sync across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (error) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const foundUser = HARDCODED_USERS.find(
        u => u.email === email && u.password === password
      );

      if (foundUser) {
        const authUser: User = {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name
        };
        setUser(authUser);
        localStorage.setItem('auth_user', JSON.stringify(authUser));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };
}