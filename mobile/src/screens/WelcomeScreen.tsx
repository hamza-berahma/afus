import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { GeometricPattern } from '../components/GeometricPattern';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';
import { Logo } from '../components/Logo';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary[600], colors.primary[400]]}
        style={styles.gradient}
      >
        <GeometricPattern variant="zellij" opacity={0.08} />
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <Logo width={100} height={100} />
          </View>

          <Text style={styles.title}>Afus ⴰⴼⵓⵙ</Text>
          <Text style={styles.subtitle}>
            Fresh Agricultural Products{'\n'}Direct from Producers
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="shield-checkmark" size={24} color={colors.white} />
              <Text style={styles.featureText}>Secure Payments</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="qr-code" size={24} color={colors.white} />
              <Text style={styles.featureText}>QR Verification</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="business" size={24} color={colors.white} />
              <Text style={styles.featureText}>Direct from Farms</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Onboarding' as never)}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    zIndex: 1,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    padding: spacing.sm,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: spacing.xxl,
    lineHeight: 32,
  },
  features: {
    width: '100%',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
  },
  featureText: {
    fontSize: fontSize.lg,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: fontSize.base,
    color: colors.white,
    opacity: 0.9,
  },
});

