import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui';
import TransactionConfirmationModal from '../components/TransactionConfirmationModal';
import { CIHLogo } from '../components/CIHLogo';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export default function TransactionDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { id } = route.params as { id: string };
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShipConfirmation, setShowShipConfirmation] = useState(false);
  const [showScanQR, setShowScanQR] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [id]);

  const loadTransaction = async () => {
    try {
      const response = await apiService.getTransaction(id);
      setTransaction(response.data.data?.transaction || response.data.transaction);
    } catch (error) {
      showToast('Failed to load transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async () => {
    if (user?.role !== 'PRODUCER') {
      showToast('Only producers can ship orders', 'error');
      return;
    }

    try {
      await apiService.shipTransaction(id);
      showToast('Transaction marked as shipped', 'success');
      setShowShipConfirmation(false);
      loadTransaction();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Failed to ship', 'error');
    }
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner' as never, { 
      transactionId: id,
      transaction: transaction,
    } as never);
  };

  if (loading || !transaction) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return '#059669';
      case 'ESCROWED':
      case 'SHIPPED':
        return '#f59e0b';
      case 'FAILED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <CIHLogo width={32} height={32} style={styles.headerLogo} />
            <Text style={styles.headerTitle}>Transaction Details</Text>
          </View>
        </View>
        <View style={styles.statusSection}>
          <Text style={styles.statusLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
            <Text style={styles.statusText}>{transaction.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>{transaction.amount} MAD</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fee:</Text>
            <Text style={styles.detailValue}>{transaction.fee} MAD</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={styles.detailValue}>{transaction.totalAmount} MAD</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created:</Text>
            <Text style={styles.detailValue}>
              {new Date(transaction.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {transaction.product && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product</Text>
            <Text style={styles.productName}>{transaction.product.name}</Text>
            {transaction.product.description && (
              <Text style={styles.productDescription}>{transaction.product.description}</Text>
            )}
          </View>
        )}

        {user?.role === 'PRODUCER' && transaction.status === 'ESCROWED' && (
          <Button
            label="Mark as Shipped"
            onPress={() => setShowShipConfirmation(true)}
            icon="send"
            style={styles.actionButton}
          />
        )}

        {user?.role === 'BUYER' && transaction.status === 'SHIPPED' && (
          <Button
            label="Scan QR Code to Confirm Delivery"
            onPress={handleScanQR}
            icon="qr-code"
            style={styles.actionButton}
          />
        )}
      </View>

      {/* Shipping Confirmation Modal */}
      <TransactionConfirmationModal
        visible={showShipConfirmation}
        onConfirm={handleShip}
        onCancel={() => setShowShipConfirmation(false)}
        transactionType="ship"
        amount={transaction.amount}
        details={`Mark transaction #${transaction.id.slice(0, 8)} as shipped`}
        title="Confirm Shipping"
        description="Please confirm that you are shipping this order. The buyer will be notified."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
  },
  statusSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
});

