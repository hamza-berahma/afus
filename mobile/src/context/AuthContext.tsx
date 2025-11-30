import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { emailOrPhone: string; password: string }) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          await refreshUser();
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.multiRemove(['user', 'token', 'refreshToken']);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { emailOrPhone: string; password: string }) => {
    try {
      const response = await apiService.login(credentials);
      const { accessToken, refreshToken, user: userData } = response.data.data || response.data;
      
      if (!accessToken || !userData) {
        throw new Error('Invalid response from server');
      }
      
      const storageItems: [string, string][] = [
        ['token', accessToken],
        ['user', JSON.stringify(userData)],
      ];
      if (refreshToken) {
        storageItems.push(['refreshToken', refreshToken]);
      }
      await AsyncStorage.multiSet(storageItems);
      
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (data: any) => {
    try {
      const response = await apiService.register(data);
      const { accessToken, refreshToken, user: userData } = response.data.data || response.data;
      
      if (!accessToken || !userData) {
        throw new Error('Invalid response from server');
      }
      
      const storageItems: [string, string][] = [
        ['token', accessToken],
        ['user', JSON.stringify(userData)],
      ];
      if (refreshToken) {
        storageItems.push(['refreshToken', refreshToken]);
      }
      await AsyncStorage.multiSet(storageItems);
      
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await apiService.getCurrentUser();
      const userData = response.data.data?.user || response.data.user;
      if (userData) {
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

