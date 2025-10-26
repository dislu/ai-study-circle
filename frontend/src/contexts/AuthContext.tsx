'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/features',
  '/how-it-works', 
  '/about',
  '/examples'
];

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Redirect to auth if trying to access protected route without authentication
    if (!isLoading && !user && !isPublicRoute) {
      router.push('/auth?mode=signin&redirect=' + encodeURIComponent(pathname));
    }
  }, [user, isLoading, pathname, isPublicRoute, router]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        // In a real app, you'd validate the token with your backend
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock login - in real app, call your backend API
      if (email && password) {
        const mockUser: User = {
          id: '1',
          name: email.split('@')[0],
          email: email,
          avatar: '👨‍💻'
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Mock signup - in real app, call your backend API
      if (name && email && password) {
        const mockUser: User = {
          id: Date.now().toString(),
          name: name,
          email: email,
          avatar: '👨‍💻'
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    signup
  };

  // Show loading spinner while checking authentication for protected routes
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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