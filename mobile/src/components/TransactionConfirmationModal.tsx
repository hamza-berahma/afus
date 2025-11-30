/**
 * Transaction Confirmation Modal
 * 
 * Secure modal for confirming transactions with password/biometric authentication
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import Button from './Button';

interface TransactionConfirmationModalProps {
  visible: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  transactionType: 'purchase' | 'delivery' | 'ship' | 'transfer';
  amount?: number;
  details?: string;
  title?: string;
  description?: string;
}

export default function TransactionConfirmationModal({
  visible,
  onConfirm,
  onCancel,
  transactionType,
  amount,
  details,
  title,
  description,
}: TransactionConfirmationModalProps) {
  const {
    hasPassword,
    isBiometricAvailable,
    isBiometricEnabled,
    biometricType,
    authenticateWithBiometric,
    verifyPassword,
    requirePasswordForTransactions,
    requireBiometricForTransactions,
    logSecurityEvent,
  } = useSecurity();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptingBiometric, setAttemptingBiometric] = useState(false);

  // Auto-attempt biometric if enabled
  useEffect(() => {
    if (visible && requireBiometricForTransactions && isBiometricEnabled && isBiometricAvailable && !attemptingBiometric) {
      handleBiometricAuth();
    }
  }, [visible]);

  const handleBiometricAuth = async () => {
    setAttemptingBiometric(true);
    setError('');
    setLoading(true);

    try {
      const success = await authenticateWithBiometric();
      if (success) {
        logSecurityEvent('TRANSACTION_CONFIRMED', {
          type: transactionType,
          method: 'biometric',
          amount,
        });
        await onConfirm();
        setPassword('');
        setError('');
      } else {
        setError('Biometric authentication failed. Please use password.');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric authentication failed');
    } finally {
      setLoading(false);
      setAttemptingBiometric(false);
    }
  };

  const handlePasswordConfirm = async () => {
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        logSecurityEvent('TRANSACTION_CONFIRMED', {
          type: transactionType,
          method: 'password',
          amount,
        });
        await onConfirm();
        setPassword('');
        setError('');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Password verification failed');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = () => {
    switch (transactionType) {
      case 'purchase':
        return 'cart';
      case 'delivery':
        return 'checkmark-circle';
      case 'ship':
        return 'send';
      case 'transfer':
        return 'swap-horizontal';
      default:
        return 'lock-closed';
    }
  };

  const getTransactionTitle = () => {
    if (title) return title;
    switch (transactionType) {
      case 'purchase':
        return 'Confirm Purchase';
      case 'delivery':
        return 'Confirm Delivery';
      case 'ship':
        return 'Confirm Shipping';
      case 'transfer':
        return 'Confirm Transfer';
      default:
        return 'Confirm Transaction';
    }
  };

  const getTransactionDescription = () => {
    if (description) return description;
    switch (transactionType) {
      case 'purchase':
        return `Please confirm your purchase of ${amount ? `${amount} MAD` : 'this item'}`;
      case 'delivery':
        return 'Please confirm that you have received the delivery';
      case 'ship':
        return 'Please confirm that you are shipping this order';
      case 'transfer':
        return `Please confirm transfer of ${amount ? `${amount} MAD` : 'funds'}`;
      default:
        return 'Please confirm this transaction';
    }
  };

  const requiresPassword = requirePasswordForTransactions && hasPassword;
  const canUseBiometric = requireBiometricForTransactions && isBiometricEnabled && isBiometricAvailable;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.overlay} />
        <View style={styles.modalContainer}>
          <ScrollView
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name={getTransactionIcon()} size={48} color={colors.primary[600]} />
              </View>
              <Text style={styles.title}>{getTransactionTitle()}</Text>
              <Text style={styles.description}>{getTransactionDescription()}</Text>
            </View>

            {/* Transaction Details */}
            {(amount || details) && (
              <View style={styles.detailsContainer}>
                {amount && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount:</Text>
                    <Text style={styles.detailValue}>{amount.toFixed(2)} MAD</Text>
                  </View>
                )}
                {details && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Details:</Text>
                    <Text style={styles.detailValue}>{details}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Ionicons name="shield-checkmark" size={20} color={colors.info[600]} />
              <Text style={styles.securityText}>
                This transaction requires authentication for your security
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error[600]} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Biometric Option */}
            {canUseBiometric && !loading && !attemptingBiometric && (
              <Button
                title={`Use ${biometricType || 'Biometric'}`}
                onPress={handleBiometricAuth}
                icon="finger-print"
                fullWidth
                style={styles.biometricButton}
                variant="outline"
              />
            )}

            {/* Password Input */}
            {requiresPassword && (
              <View style={styles.passwordContainer}>
                <Text style={styles.passwordLabel}>Enter your password</Text>
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
                    editable={!loading}
                    onSubmitEditing={handlePasswordConfirm}
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
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={onCancel}
                variant="outline"
                fullWidth
                style={styles.cancelButton}
                disabled={loading}
              />
              <Button
                title={loading ? 'Confirming...' : 'Confirm'}
                onPress={requiresPassword ? handlePasswordConfirm : onConfirm}
                icon="checkmark-circle"
                fullWidth
                style={styles.confirmButton}
                loading={loading}
                disabled={loading || (requiresPassword && !password.trim())}
              />
            </View>

            {/* Loading Overlay */}
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary[600]} />
                <Text style={styles.loadingText}>
                  {attemptingBiometric ? 'Authenticating...' : 'Verifying...'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    maxHeight: '90%',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  detailValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.info[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  securityText: {
    fontSize: fontSize.sm,
    color: colors.info[700],
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error[700],
    flex: 1,
  },
  biometricButton: {
    marginBottom: spacing.md,
  },
  passwordContainer: {
    marginBottom: spacing.md,
  },
  passwordLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
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
  buttonContainer: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    marginBottom: 0,
  },
  confirmButton: {
    marginBottom: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
});

