/**
 * Credit Score Card Component (Ma3qoul Score)
 * 
 * Displays the user's trust score with:
 * - Visual gauge/progress bar
 * - Score prominently displayed
 * - Tier information
 * - Conditional CTA button
 * - Financial literacy tip
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { GeometricPattern } from './GeometricPattern';

interface CreditScoreData {
  score: number;
  tier: 'Building Trust' | 'Silver Producer' | 'Gold Partner';
  maxLoanAmount: number;
  nextMilestone: string;
  breakdown: {
    baseScore: number;
    volumePoints: number;
    reliabilityPoints: number;
    stabilityPoints: number;
    penaltyPoints: number;
  };
}

interface CreditScoreCardProps {
  userId?: string;
  style?: any;
}

export default function CreditScoreCard({ userId, style }: CreditScoreCardProps) {
  const { showToast } = useToast();
  const [scoreData, setScoreData] = useState<CreditScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoanModal, setShowLoanModal] = useState(false);

  useEffect(() => {
    loadCreditScore();
  }, [userId]);

  const loadCreditScore = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCreditScore();
      setScoreData(response.data.data);
    } catch (error: any) {
      if (error.response?.status !== 403) {
        // Don't show error if user is not a producer
        showToast('Failed to load credit score', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApplyForLoan = () => {
    if (scoreData && scoreData.score >= 700) {
      setShowLoanModal(true);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Gold Partner':
        return colors.accent[500]; // Gold
      case 'Silver Producer':
        return colors.gray[400]; // Silver
      case 'Building Trust':
        return colors.primary[600]; // Emerald Green
      default:
        return colors.primary[600];
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Gold Partner':
        return 'star';
      case 'Silver Producer':
        return 'star-half';
      case 'Building Trust':
        return 'trending-up';
      default:
        return 'trending-up';
    }
  };

  const getScorePercentage = (score: number) => {
    // Score range: 300-850, so percentage = (score - 300) / (850 - 300) * 100
    return ((score - 300) / 550) * 100;
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Loading credit score...</Text>
        </View>
      </View>
    );
  }

  if (!scoreData) {
    return null; // Don't show card if no score data
  }

  const scorePercentage = getScorePercentage(scoreData.score);
  const tierColor = getTierColor(scoreData.tier);
  const tierIcon = getTierIcon(scoreData.tier);

  return (
    <>
      <View style={[styles.container, style]}>
        <GeometricPattern variant="zellij" opacity={0.03} />
        <LinearGradient
          colors={[colors.primary[600], colors.primary[400]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="shield-checkmark" size={24} color={colors.white} />
              <Text style={styles.title}>Ma3qoul Score</Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Ionicons name={tierIcon} size={16} color={colors.white} />
              <Text style={styles.tierText}>{scoreData.tier}</Text>
            </View>
          </View>

          {/* Score Display */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreValue}>{scoreData.score}</Text>
              <Text style={styles.scoreRange}>/ 850</Text>
            </View>
            <Text style={styles.scoreLabel}>Trust Score</Text>
          </View>

          {/* Progress Gauge */}
          <View style={styles.gaugeContainer}>
            <View style={styles.gaugeBackground}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${scorePercentage}%`,
                    backgroundColor: tierColor,
                  },
                ]}
              />
            </View>
            <View style={styles.gaugeLabels}>
              <Text style={styles.gaugeLabel}>300</Text>
              <Text style={styles.gaugeLabel}>850</Text>
            </View>
          </View>

          {/* Loan Eligibility */}
          {scoreData.maxLoanAmount > 0 ? (
            <View style={styles.loanInfo}>
              <Ionicons name="cash" size={20} color={colors.white} />
              <Text style={styles.loanText}>
                Eligible for up to {scoreData.maxLoanAmount.toLocaleString()} MAD
              </Text>
            </View>
          ) : (
            <View style={styles.loanInfo}>
              <Ionicons name="lock-closed" size={20} color={colors.white} />
              <Text style={styles.loanText}>No loan eligibility yet</Text>
            </View>
          )}

          {/* CTA Button */}
          <TouchableOpacity
            style={[
              styles.ctaButton,
              scoreData.score < 700 && styles.ctaButtonDisabled,
              scoreData.score >= 700 && { backgroundColor: colors.accent[500] },
            ]}
            onPress={handleApplyForLoan}
            disabled={scoreData.score < 700}
          >
            <Ionicons
              name={scoreData.score >= 700 ? 'checkmark-circle' : 'lock-closed'}
              size={20}
              color={colors.white}
            />
            <Text style={styles.ctaButtonText}>
              {scoreData.score >= 700
                ? 'Apply for CIH Micro-Loan'
                : 'Reach 700 to unlock'}
            </Text>
          </TouchableOpacity>

          {/* Financial Literacy Tip */}
          <View style={styles.tipContainer}>
            <Ionicons name="bulb" size={16} color={colors.white} />
            <Text style={styles.tipText}>{scoreData.nextMilestone}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Loan Application Modal */}
      <Modal
        visible={showLoanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <GeometricPattern variant="hexagons" opacity={0.05} />
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success[600]} />
                </View>
                <Text style={styles.modalTitle}>Loan Application</Text>
                <Text style={styles.modalSubtitle}>
                  You're eligible for a CIH Micro-Loan!
                </Text>
              </View>

              {/* Loan Details */}
              <View style={styles.modalDetails}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Your Score:</Text>
                  <Text style={styles.modalDetailValue}>{scoreData.score}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Tier:</Text>
                  <Text style={styles.modalDetailValue}>{scoreData.tier}</Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailLabel}>Max Loan Amount:</Text>
                  <Text style={[styles.modalDetailValue, { color: colors.accent[600] }]}>
                    {scoreData.maxLoanAmount.toLocaleString()} MAD
                  </Text>
                </View>
              </View>

              {/* Info Message */}
              <View style={styles.modalInfo}>
                <Ionicons name="information-circle" size={20} color={colors.info} />
                <Text style={styles.modalInfoText}>
                  Your loan application will be reviewed by CIH Bank. You'll receive a notification
                  once your application is processed.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => setShowLoanModal(false)}
                >
                  <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    showToast('Loan application submitted successfully!', 'success');
                    setShowLoanModal(false);
                  }}
                >
                  <Ionicons name="send" size={20} color={colors.white} />
                  <Text style={styles.modalButtonPrimaryText}>Submit Application</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tierText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    textTransform: 'uppercase',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
    color: colors.white,
    lineHeight: 64,
  },
  scoreRange: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    color: colors.white,
    opacity: 0.8,
    marginLeft: spacing.xs,
  },
  scoreLabel: {
    fontSize: fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
  gaugeContainer: {
    marginBottom: spacing.lg,
  },
  gaugeBackground: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeLabel: {
    fontSize: fontSize.xs,
    color: colors.white,
    opacity: 0.8,
  },
  loanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
  },
  loanText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.gray[400],
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.white,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalScrollContent: {
    padding: spacing.xl,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.success[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
  },
  modalDetails: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalDetailLabel: {
    fontSize: fontSize.base,
    color: colors.gray[600],
  },
  modalDetailValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  modalInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.info + '15',
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  modalInfoText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.info,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: colors.gray[100],
  },
  modalButtonSecondaryText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
  },
  modalButtonPrimary: {
    backgroundColor: colors.accent[500],
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButtonPrimaryText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

