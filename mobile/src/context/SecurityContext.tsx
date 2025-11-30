/**
 * Security Context
 * 
 * Provides security features including:
 * - Password/PIN management
 * - Biometric authentication
 * - Transaction confirmation
 * - Security logging
 * - Rate limiting
 * - Session management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

interface SecurityContextType {
  // Password/PIN
  hasPassword: boolean;
  setPassword: (password: string) => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  
  // Biometric
  isBiometricAvailable: boolean;
  biometricType: string | null;
  enableBiometric: (password: string) => Promise<void>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: boolean;
  authenticateWithBiometric: () => Promise<boolean>;
  
  // Transaction confirmation
  requireTransactionConfirmation: (
    transactionType: 'purchase' | 'delivery' | 'ship' | 'transfer',
    amount?: number,
    details?: string
  ) => Promise<boolean>;
  
  // Security settings
  requirePasswordForTransactions: boolean;
  setRequirePasswordForTransactions: (value: boolean) => Promise<void>;
  requireBiometricForTransactions: boolean;
  setRequireBiometricForTransactions: (value: boolean) => Promise<void>;
  
  // Security logging
  logSecurityEvent: (event: string, details?: any) => void;
  getSecurityLogs: () => Promise<SecurityLog[]>;
  
  // Session
  lockApp: () => Promise<void>;
  isAppLocked: boolean;
  unlockApp: (password: string) => Promise<boolean>;
}

interface SecurityLog {
  id: string;
  event: string;
  timestamp: Date;
  details?: any;
  ipAddress?: string;
  deviceInfo?: string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PASSWORD_HASH: '@security:password_hash',
  BIOMETRIC_ENABLED: '@security:biometric_enabled',
  REQUIRE_PASSWORD: '@security:require_password',
  REQUIRE_BIOMETRIC: '@security:require_biometric',
  SECURITY_LOGS: '@security:logs',
  APP_LOCKED: '@security:app_locked',
  FAILED_ATTEMPTS: '@security:failed_attempts',
  LAST_ACTIVITY: '@security:last_activity',
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes of inactivity

// Simple hash function (in production, use bcrypt or similar)
const hashPassword = async (password: string): Promise<string> => {
  // Using a simple hash for demo - in production, use proper hashing
  try {
    // Try to use crypto.subtle if available (web)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password + 'sou9na_salt_2024');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fall through to simple hash
  }
  // Fallback to simple hash
  return simpleHash(password);
};

// Fallback hash for environments without crypto.subtle
const simpleHash = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
};

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasPassword, setHasPassword] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [requirePasswordForTransactions, setRequirePasswordForTransactionsState] = useState(true);
  const [requireBiometricForTransactions, setRequireBiometricForTransactionsState] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  // Initialize security features
  useEffect(() => {
    initializeSecurity();
  }, []);

  // Check for session timeout
  useEffect(() => {
    const checkSessionTimeout = async () => {
      const lastActivity = await AsyncStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceActivity > SESSION_TIMEOUT) {
          await lockApp();
        }
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const initializeSecurity = async () => {
    // Check if password is set
    const passwordHash = await AsyncStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
    setHasPassword(!!passwordHash);

    // Check biometric availability
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setIsBiometricAvailable(compatible);

    if (compatible) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Touch ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      }
    }

    // Load settings
    const biometricEnabled = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    setIsBiometricEnabled(biometricEnabled === 'true');

    const requirePassword = await AsyncStorage.getItem(STORAGE_KEYS.REQUIRE_PASSWORD);
    setRequirePasswordForTransactionsState(requirePassword !== 'false');

    const requireBiometric = await AsyncStorage.getItem(STORAGE_KEYS.REQUIRE_BIOMETRIC);
    setRequireBiometricForTransactionsState(requireBiometric === 'true');

    // Load security logs
    const logs = await AsyncStorage.getItem(STORAGE_KEYS.SECURITY_LOGS);
    if (logs) {
      setSecurityLogs(JSON.parse(logs));
    }

    // Check if app is locked
    const locked = await AsyncStorage.getItem(STORAGE_KEYS.APP_LOCKED);
    setIsAppLocked(locked === 'true');
  };

  const updateLastActivity = async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  };

  const logSecurityEvent = useCallback((event: string, details?: any) => {
    const log: SecurityLog = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      event,
      timestamp: new Date(),
      details,
    };

    const newLogs = [log, ...securityLogs].slice(0, 100); // Keep last 100 logs
    setSecurityLogs(newLogs);
    AsyncStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(newLogs));
  }, [securityLogs]);

  const setPassword = async (password: string): Promise<void> => {
    if (password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    let hash: string;
    try {
      hash = await hashPassword(password);
    } catch {
      hash = simpleHash(password);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, hash);
    setHasPassword(true);
    logSecurityEvent('PASSWORD_SET');
    await updateLastActivity();
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    // Check for lockout
    const failedAttempts = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    if (failedAttempts) {
      const attempts = JSON.parse(failedAttempts);
      if (attempts.count >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = attempts.lockoutUntil;
        if (lockoutUntil && Date.now() < lockoutUntil) {
          const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / 60000);
          throw new Error(`Too many failed attempts. Try again in ${minutesLeft} minute(s).`);
        } else {
          // Reset after lockout period
          await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
        }
      }
    }

    const storedHash = await AsyncStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
    if (!storedHash) {
      return false;
    }

    let hash: string;
    try {
      hash = await hashPassword(password);
    } catch {
      hash = simpleHash(password);
    }

    const isValid = hash === storedHash;

    if (isValid) {
      await AsyncStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      logSecurityEvent('PASSWORD_VERIFIED');
      await updateLastActivity();
    } else {
      // Track failed attempts
      const failedAttempts = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      let attempts = failedAttempts ? JSON.parse(failedAttempts) : { count: 0 };
      attempts.count += 1;

      if (attempts.count >= MAX_FAILED_ATTEMPTS) {
        attempts.lockoutUntil = Date.now() + LOCKOUT_DURATION;
        logSecurityEvent('ACCOUNT_LOCKED', { reason: 'too_many_failed_attempts' });
      }

      await AsyncStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, JSON.stringify(attempts));
      logSecurityEvent('PASSWORD_VERIFICATION_FAILED', { attempts: attempts.count });
    }

    return isValid;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    const isValid = await verifyPassword(oldPassword);
    if (!isValid) {
      return false;
    }

    if (newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters');
    }

    await setPassword(newPassword);
    logSecurityEvent('PASSWORD_CHANGED');
    return true;
  };

  const enableBiometric = async (password: string): Promise<void> => {
    const isValid = await verifyPassword(password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'true');
    setIsBiometricEnabled(true);
    logSecurityEvent('BIOMETRIC_ENABLED');
  };

  const disableBiometric = async (): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, 'false');
    setIsBiometricEnabled(false);
    logSecurityEvent('BIOMETRIC_DISABLED');
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        logSecurityEvent('BIOMETRIC_VERIFIED');
        await updateLastActivity();
        return true;
      }

      logSecurityEvent('BIOMETRIC_VERIFICATION_FAILED');
      return false;
    } catch (error) {
      logSecurityEvent('BIOMETRIC_ERROR', { error: (error as Error).message });
      return false;
    }
  };

  const requireTransactionConfirmation = async (
    transactionType: 'purchase' | 'delivery' | 'ship' | 'transfer',
    amount?: number,
    details?: string
  ): Promise<boolean> => {
    await updateLastActivity();

    // Check if password is required
    if (requirePasswordForTransactions && hasPassword) {
      // This will be handled by the UI component
      // Return true to indicate confirmation is required
      return true;
    }

    // Check if biometric is required
    if (requireBiometricForTransactions && isBiometricEnabled && isBiometricAvailable) {
      return await authenticateWithBiometric();
    }

    // If no security is required, return true
    return true;
  };

  const setRequirePasswordForTransactions = async (value: boolean): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.REQUIRE_PASSWORD, value.toString());
    setRequirePasswordForTransactionsState(value);
    logSecurityEvent('SECURITY_SETTING_CHANGED', { setting: 'require_password', value });
  };

  const setRequireBiometricForTransactions = async (value: boolean): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.REQUIRE_BIOMETRIC, value.toString());
    setRequireBiometricForTransactionsState(value);
    logSecurityEvent('SECURITY_SETTING_CHANGED', { setting: 'require_biometric', value });
  };

  const lockApp = async (): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'true');
    setIsAppLocked(true);
    logSecurityEvent('APP_LOCKED');
  };

  const unlockApp = async (password: string): Promise<boolean> => {
    const isValid = await verifyPassword(password);
    if (isValid) {
      await AsyncStorage.setItem(STORAGE_KEYS.APP_LOCKED, 'false');
      setIsAppLocked(false);
      logSecurityEvent('APP_UNLOCKED');
      await updateLastActivity();
      return true;
    }
    return false;
  };

  const getSecurityLogs = async (): Promise<SecurityLog[]> => {
    return securityLogs;
  };

  return (
    <SecurityContext.Provider
      value={{
        hasPassword,
        setPassword,
        verifyPassword,
        changePassword,
        isBiometricAvailable,
        biometricType,
        enableBiometric,
        disableBiometric,
        isBiometricEnabled,
        authenticateWithBiometric,
        requireTransactionConfirmation,
        requirePasswordForTransactions,
        setRequirePasswordForTransactions,
        requireBiometricForTransactions,
        setRequireBiometricForTransactions,
        logSecurityEvent,
        getSecurityLogs,
        lockApp,
        isAppLocked,
        unlockApp,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};

