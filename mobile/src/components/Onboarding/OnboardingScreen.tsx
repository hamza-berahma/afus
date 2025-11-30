import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../../theme/spacing';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  image?: string;
  onNext: () => void;
  onSkip: () => void;
  isLast?: boolean;
}

export default function OnboardingScreen({
  title,
  description,
  icon,
  onNext,
  onSkip,
  isLast = false,
}: OnboardingScreenProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={80} color={colors.primary[600]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLast && styles.buttonPrimary]}
          onPress={onNext}
        >
          <Text style={[styles.buttonText, isLast && styles.buttonTextPrimary]}>
            {isLast ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color={isLast ? colors.white : colors.primary[600]}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: spacing.xl,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: spacing.md,
    paddingRight: spacing.lg,
  },
  skipText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    fontWeight: fontWeight.medium,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.lg,
    color: colors.gray[600],
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: spacing.md,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  buttonPrimary: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  buttonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary[600],
    marginRight: spacing.sm,
  },
  buttonTextPrimary: {
    color: colors.white,
  },
  buttonIcon: {
    marginLeft: spacing.xs,
  },
});

