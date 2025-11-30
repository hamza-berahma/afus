/**
 * Security Settings Screen
 * 
 * Allows users to configure security settings:
 * - Set/change password
 * - Enable/disable biometric authentication
 * - Configure transaction security requirements
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSecurity } from '../context/SecurityContext';
import { useToast } from '../context/ToastContext';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { Button, Input } from '../components/ui';
import PasswordPromptModal from '../components/PasswordPromptModal';

export default function SecuritySettingsScreen() {
  const {
    hasPassword,
    setPassword,
    changePassword,
    isBiometricAvailable,
    isBiometricEnabled,
    biometricType,
    enableBiometric,
    disableBiometric,
    requirePasswordForTransactions,
    setRequirePasswordForTransactions,
    requireBiometricForTransactions,
    setRequireBiometricForTransactions,
  } = useSecurity();

  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [enablingBiometric, setEnablingBiometric] = useState(false);

  const handleSetPassword = async () => {
    if (newPassword.length < 4) {
      showToast('Password must be at least 4 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSettingPassword(true);
    try {
      await setPassword(newPassword);
      showToast('Password set successfully', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showToast(error.message || 'Failed to set password', 'error');
    } finally {
      setSettingPassword(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showToast('Please enter your current password', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('New password must be at least 4 characters', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const success = await changePassword(currentPassword, newPassword);
      if (success) {
        showToast('Password changed successfully', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('Current password is incorrect', 'error');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const [showBiometricPasswordModal, setShowBiometricPasswordModal] = useState(false);

  const handleEnableBiometric = () => {
    if (!hasPassword) {
      Alert.alert(
        'Password Required',
        'You must set a password before enabling biometric authentication.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowBiometricPasswordModal(true);
  };

  const handleDisableBiometric = async () => {
    Alert.alert(
      'Disable Biometric Authentication',
      'Are you sure you want to disable biometric authentication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await disableBiometric();
              showToast('Biometric authentication disabled', 'success');
            } catch (error: any) {
              showToast(error.message || 'Failed to disable biometric', 'error');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Password Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={24} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Password Protection</Text>
          </View>

          {!hasPassword ? (
            <View style={styles.passwordForm}>
              <Text style={styles.sectionDescription}>
                Set a password to secure your transactions
              </Text>
              <Input
                label="New Password"
                placeholder="Enter password (min 4 characters)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                icon="lock-closed"
                style={styles.input}
              />
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                icon="lock-closed"
                style={styles.input}
              />
              <Button
                label="Set Password"
                onPress={handleSetPassword}
                loading={settingPassword}
                icon="checkmark-circle"
                iconPosition="right"
              />
            </View>
          ) : (
            <View style={styles.passwordForm}>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                <Text style={styles.statusText}>Password is set</Text>
              </View>
              <Input
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                icon="lock-closed"
                style={styles.input}
              />
              <Input
                label="New Password"
                placeholder="Enter new password (min 4 characters)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                icon="lock-closed"
                style={styles.input}
              />
              <Input
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                icon="lock-closed"
                style={styles.input}
              />
              <Button
                label="Change Password"
                onPress={handleChangePassword}
                loading={changingPassword}
                variant="outline"
                iconPosition="right"
                icon="key"
              />
            </View>
          )}
        </View>

        {/* Biometric Section */}
        {isBiometricAvailable && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name={biometricType === 'Face ID' ? 'face-recognition' : 'finger-print'}
                size={24}
                color={colors.primary[600]}
              />
              <Text style={styles.sectionTitle}>
                {biometricType || 'Biometric'} Authentication
              </Text>
            </View>

            <Text style={styles.sectionDescription}>
              Use {biometricType || 'biometric'} authentication for faster and more secure access
            </Text>

            {isBiometricEnabled ? (
              <View style={styles.biometricStatus}>
                <View style={styles.statusBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success[600]} />
                  <Text style={styles.statusText}>
                    {biometricType || 'Biometric'} is enabled
                  </Text>
                </View>
                <Button
                  label="Disable Biometric"
                  onPress={handleDisableBiometric}
                  variant="outline"
                  icon="close-circle"
                  iconPosition="right"
                />
              </View>
            ) : (
              <Button
                label={`Enable ${biometricType || 'Biometric'}`}
                onPress={handleEnableBiometric}
                loading={enablingBiometric}
                icon="finger-print"
                iconPosition="right"
              />
            )}
          </View>
        )}

        {/* Transaction Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
            <Text style={styles.sectionTitle}>Transaction Security</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Password for Transactions</Text>
              <Text style={styles.settingDescription}>
                All transactions will require password confirmation
              </Text>
            </View>
            <Switch
              value={requirePasswordForTransactions}
              onValueChange={setRequirePasswordForTransactions}
              trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
              thumbColor={requirePasswordForTransactions ? colors.primary[600] : colors.gray[400]}
            />
          </View>

          {isBiometricAvailable && isBiometricEnabled && (
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Require Biometric for Transactions</Text>
                <Text style={styles.settingDescription}>
                  Use {biometricType || 'biometric'} instead of password when available
                </Text>
              </View>
              <Switch
                value={requireBiometricForTransactions}
                onValueChange={setRequireBiometricForTransactions}
                trackColor={{ false: colors.gray[300], true: colors.primary[200] }}
                thumbColor={requireBiometricForTransactions ? colors.primary[600] : colors.gray[400]}
              />
            </View>
          )}
        </View>

        {/* Security Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle" size={20} color={colors.info[600]} />
          <Text style={styles.infoText}>
            Your password is stored securely on your device and is never transmitted to our servers.
            Biometric data is handled by your device's secure enclave.
          </Text>
        </View>
      </View>

      {/* Biometric Password Verification Modal */}
      <PasswordPromptModal
        visible={showBiometricPasswordModal}
        onConfirm={async (password) => {
          setEnablingBiometric(true);
          try {
            await enableBiometric(password);
            showToast(`${biometricType || 'Biometric'} authentication enabled`, 'success');
            setShowBiometricPasswordModal(false);
          } catch (error: any) {
            throw error; // Let the modal handle the error display
          } finally {
            setEnablingBiometric(false);
          }
        }}
        onCancel={() => {
          setShowBiometricPasswordModal(false);
        }}
        title="Enable Biometric Authentication"
        description={`To enable ${biometricType || 'biometric'} authentication, please verify your password.`}
        loading={enablingBiometric}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  passwordForm: {
    gap: spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.success[700],
  },
  biometricStatus: {
    gap: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.info[50],
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.info[700],
    lineHeight: 18,
  },
});

