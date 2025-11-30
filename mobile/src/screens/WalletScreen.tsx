import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { WalletBalance, Transaction } from '../types';
import EmptyState from '../components/EmptyState';
import { GeometricPattern } from '../components/GeometricPattern';
import { CIHLogo } from '../components/CIHLogo';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { Button } from '../components/ui';

export default function WalletScreen() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingCash, setProcessingCash] = useState<'refill' | 'withdraw' | 'transfer' | null>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      if (user?.walletId) {
        const [balanceResponse, transactionsResponse] = await Promise.all([
          apiService.getWalletBalance(),
          apiService.getWalletTransactions(),
        ]);
        setBalance(balanceResponse.data.data);
        setTransactions(transactionsResponse.data.data?.transactions || []);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error loading wallet:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleActivateWallet = async () => {
    try {
      await apiService.activateWallet();
      showToast('Wallet activated successfully', 'success');
      loadWalletData();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Failed to activate wallet', 'error');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleRefill = async () => {
    Alert.prompt(
      'Refill Wallet',
      'Enter the amount to refill (MAD)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async (amount) => {
            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
              showToast('Please enter a valid amount', 'error');
              return;
            }

            try {
              setProcessingCash('refill');
              const amountNum = parseFloat(amount);
              
              // Step 1: Simulation
              const simulationResponse = await apiService.cashInSimulation({
                amount: amountNum,
                phoneNumber: user?.phone || '',
              });

              const token = simulationResponse.data.result?.token;
              if (!token) {
                throw new Error('Failed to initiate refill');
              }

              // Step 2: Confirmation
              await apiService.cashInConfirmation({
                amount: amountNum,
                phoneNumber: user?.phone || '',
                token,
              });

              showToast(`Successfully refilled ${amountNum.toFixed(2)} MAD`, 'success');
              loadWalletData();
            } catch (error: any) {
              const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to refill wallet';
              showToast(errorMessage, 'error');
            } finally {
              setProcessingCash(null);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleWithdraw = async () => {
    Alert.prompt(
      'Withdraw from Wallet',
      'Enter the amount to withdraw (MAD)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async (amount) => {
            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
              showToast('Please enter a valid amount', 'error');
              return;
            }

            if (balance && parseFloat(amount) > balance.balance) {
              showToast('Insufficient balance', 'error');
              return;
            }

            try {
              setProcessingCash('withdraw');
              const amountNum = parseFloat(amount);
              
              // Step 1: Simulation
              const simulationResponse = await apiService.cashOutSimulation({
                amount: amountNum,
                phoneNumber: user?.phone || '',
              });

              const token = simulationResponse.data.result?.token;
              if (!token) {
                throw new Error('Failed to initiate withdrawal');
              }

              // Step 2: Request OTP
              await apiService.cashOutOTP({ token });

              // Step 3: Prompt for OTP
              Alert.prompt(
                'Enter OTP',
                'Please enter the OTP sent to your phone',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => setProcessingCash(null),
                  },
                  {
                    text: 'Confirm',
                    onPress: async (otp) => {
                      if (!otp || otp.length !== 6) {
                        showToast('Please enter a valid 6-digit OTP', 'error');
                        setProcessingCash(null);
                        return;
                      }

                      try {
                        // Step 4: Confirmation with OTP
                        await apiService.cashOutConfirmation({
                          amount: amountNum,
                          phoneNumber: user?.phone || '',
                          token,
                          otp,
                        });

                        showToast(`Successfully withdrew ${amountNum.toFixed(2)} MAD`, 'success');
                        loadWalletData();
                      } catch (error: any) {
                        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to withdraw';
                        showToast(errorMessage, 'error');
                      } finally {
                        setProcessingCash(null);
                      }
                    },
                  },
                ],
                'plain-text',
                '',
                'numeric'
              );
            } catch (error: any) {
              const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to withdraw';
              showToast(errorMessage, 'error');
              setProcessingCash(null);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleWalletTransfer = async () => {
    Alert.prompt(
      'Transfer to Another Wallet',
      'Enter recipient phone number',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async (destinationPhone) => {
            if (!destinationPhone || destinationPhone.length < 10) {
              showToast('Please enter a valid phone number', 'error');
              return;
            }

            // Prompt for amount
            Alert.prompt(
              'Transfer Amount',
              'Enter the amount to transfer (MAD)',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => setProcessingCash(null),
                },
                {
                  text: 'Continue',
                  onPress: async (amount) => {
                    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                      showToast('Please enter a valid amount', 'error');
                      setProcessingCash(null);
                      return;
                    }

                    if (balance && parseFloat(amount) > balance.balance) {
                      showToast('Insufficient balance', 'error');
                      setProcessingCash(null);
                      return;
                    }

                    try {
                      setProcessingCash('transfer');
                      const amountNum = parseFloat(amount);
                      
                      // Step 1: Simulation
                      const simulationResponse = await apiService.walletTransferSimulation({
                        contractId: user?.walletId || '',
                        destinationPhone: destinationPhone,
                        amount: amountNum,
                      });

                      const token = simulationResponse.data.result?.token;
                      if (!token) {
                        throw new Error('Failed to initiate transfer');
                      }

                      // Step 2: Request OTP
                      await apiService.walletTransferOTP({ token });

                      // Step 3: Prompt for OTP
                      Alert.prompt(
                        'Enter OTP',
                        'Please enter the OTP sent to your phone',
                        [
                          {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => setProcessingCash(null),
                          },
                          {
                            text: 'Confirm',
                            onPress: async (otp) => {
                              if (!otp || otp.length !== 6) {
                                showToast('Please enter a valid 6-digit OTP', 'error');
                                setProcessingCash(null);
                                return;
                              }

                              try {
                                // Step 4: Confirmation with OTP
                                await apiService.walletTransferConfirmation({
                                  contractId: user?.walletId || '',
                                  destinationPhone: destinationPhone,
                                  amount: amountNum,
                                  token,
                                  otp,
                                });

                                showToast(`Successfully transferred ${amountNum.toFixed(2)} MAD to ${destinationPhone}`, 'success');
                                loadWalletData();
                              } catch (error: any) {
                                const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to transfer';
                                showToast(errorMessage, 'error');
                              } finally {
                                setProcessingCash(null);
                              }
                            },
                          },
                        ],
                        'plain-text',
                        '',
                        'numeric'
                      );
                    } catch (error: any) {
                      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to transfer';
                      showToast(errorMessage, 'error');
                      setProcessingCash(null);
                    }
                  },
                },
              ],
              'plain-text',
              '',
              'numeric'
            );
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return colors.success;
      case 'ESCROWED':
      case 'SHIPPED':
        return colors.warning;
      case 'FAILED':
        return colors.error;
      default:
        return colors.gray[500];
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GeometricPattern variant="circles" opacity={0.03} />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CIHLogo width={40} height={40} style={styles.headerLogo} />
          <View>
            <Text style={styles.title}>Wallet</Text>
            <Text style={styles.subtitle}>Manage your balance</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SecuritySettings' as never)}
            style={styles.securityButton}
          >
            <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {!user?.walletId ? (
          <View style={styles.activateSection}>
            <View style={styles.activateIconContainer}>
              <Ionicons name="wallet-outline" size={64} color={colors.primary[600]} />
            </View>
            <Text style={styles.activateTitle}>Activate Your Wallet</Text>
            <Text style={styles.activateText}>
              Activate your wallet to start making purchases and receiving payments
            </Text>
            <TouchableOpacity style={styles.activateButton} onPress={handleActivateWallet}>
              <Text style={styles.activateButtonText}>Activate Wallet</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : balance ? (
          <>
            <LinearGradient
              colors={[colors.primary[600], colors.primary[400]]}
              style={styles.balanceCard}
            >
              <View style={styles.balanceHeader}>
                <CIHLogo width={48} height={48} style={styles.balanceLogo} />
                <View style={styles.balanceHeaderText}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceSubLabel}>Powered by CIH Bank</Text>
                </View>
              </View>
              <Text style={styles.balanceAmount}>
                {balance.balance.toFixed(2)} {balance.currency}
              </Text>
              <View style={styles.balanceFooter}>
                <View style={styles.balanceInfo}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.white} />
                  <Text style={styles.balanceInfoText}>Wallet Active</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <Button
                label="Refill Wallet"
                onPress={handleRefill}
                icon="add-circle-outline"
                iconPosition="left"
                variant="default"
                size="lg"
                disabled={processingCash !== null}
                loading={processingCash === 'refill'}
                style={[styles.actionButton, styles.refillButton]}
              />
              <Button
                label="Withdraw"
                onPress={handleWithdraw}
                icon="remove-circle-outline"
                iconPosition="left"
                variant="outline"
                size="lg"
                disabled={processingCash !== null}
                loading={processingCash === 'withdraw'}
                style={[styles.actionButton, styles.withdrawButton]}
              />
            </View>
            <View style={styles.actionButtonsContainer}>
              <Button
                label="Transfer to Wallet"
                onPress={handleWalletTransfer}
                icon="swap-horizontal-outline"
                iconPosition="left"
                variant="secondary"
                size="lg"
                disabled={processingCash !== null}
                loading={processingCash === 'transfer'}
                style={[styles.actionButton, styles.transferButton]}
              />
            </View>
          </>
        ) : (
          <View style={styles.center}>
            <Text>Unable to load balance</Text>
          </View>
        )}

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.sectionSubtitle}>{transactions.length} total</Text>
          </View>

          {transactions.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              message="Your transaction history will appear here once you start making purchases or sales"
            />
          ) : (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    {transaction.product && (
                      <Text style={styles.transactionProduct} numberOfLines={1}>
                        {transaction.product.name}
                      </Text>
                    )}
                    <Text style={styles.transactionDate}>
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.transactionAmounts}>
                    <Text style={styles.transactionAmount}>
                      {transaction.totalAmount.toFixed(2)} MAD
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(transaction.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(transaction.status) },
                        ]}
                      >
                        {transaction.status}
                      </Text>
                    </View>
                  </View>
                </View>
                {user?.role === 'BUYER' && transaction.seller && (
                  <View style={styles.transactionFooter}>
                    <Ionicons name="business" size={14} color={colors.gray[400]} />
                    <Text style={styles.transactionFooterText}>
                      {transaction.seller.email}
                    </Text>
                  </View>
                )}
                {user?.role === 'PRODUCER' && transaction.buyer && (
                  <View style={styles.transactionFooter}>
                    <Ionicons name="person" size={14} color={colors.gray[400]} />
                    <Text style={styles.transactionFooterText}>
                      {transaction.buyer.email}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerLogo: {
    marginRight: spacing.xs,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  securityButton: {
    padding: spacing.sm,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  activateSection: {
    margin: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  activateIconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  activateTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  activateText: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  activateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  activateButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  balanceCard: {
    margin: spacing.md,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  balanceLogo: {
    opacity: 0.95,
  },
  balanceHeaderText: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: fontSize.base,
    color: colors.white,
    opacity: 0.9,
    fontWeight: fontWeight.semibold,
  },
  balanceSubLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    opacity: 0.7,
    marginTop: 2,
  },
  balanceAmount: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceInfoText: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  transactionsSection: {
    padding: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  transactionCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionProduct: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  transactionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  transactionFooterText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  refillButton: {
    backgroundColor: colors.primary[600],
  },
  withdrawButton: {
    borderColor: colors.primary[600],
    borderWidth: 2,
  },
  transferButton: {
    backgroundColor: colors.secondary[100],
  },
});
