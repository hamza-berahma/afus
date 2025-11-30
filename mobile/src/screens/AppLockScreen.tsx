/**
 * App Lock Screen
 * 
 * Displayed when the app is locked (session timeout or manual lock)
 * Requires password or biometric to unlock
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { useToast } from '../context/ToastContext';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { GeometricPattern } from '../components/GeometricPattern';

export default function AppLockScreen() {
  const {
    isAppLocked,
    unlockApp,
    isBiometricAvailable,
    isBiometricEnabled,
    biometricType,
    authenticateWithBiometric,
  } = useSecurity();

  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');

  // Auto-attempt biometric on mount
  useEffect(() => {
    if (isAppLocked && isBiometricEnabled && isBiometricAvailable) {
      handleBiometricUnlock();
    }
  }, [isAppLocked]);

  const handleBiometricUnlock = async () => {
    setUnlocking(true);
    setError('');
    try {
      const success = await authenticateWithBiometric();
      if (success) {
        // App will unlock automatically via SecurityContext
        setPassword('');
      } else {
        setError('Biometric authentication failed. Please use password.');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric authentication failed');
    } finally {
      setUnlocking(false);
    }
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setUnlocking(true);
    setError('');
    try {
      const success = await unlockApp(password);
      if (success) {
        setPassword('');
        setError('');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to unlock app');
      setPassword('');
    } finally {
      setUnlocking(false);
    }
  };

  if (!isAppLocked) {
    return null;
  }

  return (
    <View style={styles.container}>
      <GeometricPattern variant="zellij" opacity={0.05} />
      <View style={styles.content}>
        {/* Lock Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.primary[600]} />
        </View>

        {/* Title */}
        <Text style={styles.title}>App Locked</Text>
        <Text style={styles.description}>
          For your security, the app has been locked.{'\n'}
          Please authenticate to continue.
        </Text>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error[600]} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Biometric Option */}
        {isBiometricAvailable && isBiometricEnabled && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricUnlock}
            disabled={unlocking}
          >
            <Ionicons
              name={biometricType === 'Face ID' ? 'face-recognition' : 'finger-print'}
              size={32}
              color={colors.primary[600]}
            />
            <Text style={styles.biometricText}>
              Use {biometricType || 'Biometric'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Password Input */}
        <View style={styles.passwordContainer}>
          <Text style={styles.passwordLabel}>Or enter your password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={colors.gray[400]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!unlocking}
              onSubmitEditing={handlePasswordUnlock}
              autoFocus
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.gray[600]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unlock Button */}
        <TouchableOpacity
          style={[styles.unlockButton, unlocking && styles.unlockButtonDisabled]}
          onPress={handlePasswordUnlock}
          disabled={unlocking || !password.trim()}
        >
          {unlocking ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="lock-open" size={20} color={colors.white} />
              <Text style={styles.unlockButtonText}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={16} color={colors.info[600]} />
          <Text style={styles.securityText}>
            Your data is protected with encryption
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    zIndex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    width: '100%',
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error[700],
    flex: 1,
  },
  biometricButton: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  biometricText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
    marginTop: spacing.sm,
  },
  passwordContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  passwordLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  eyeButton: {
    padding: spacing.md,
  },
  unlockButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  unlockButtonDisabled: {
    opacity: 0.6,
  },
  unlockButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  securityText: {
    fontSize: fontSize.xs,
    color: colors.info[600],
  },
});

