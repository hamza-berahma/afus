import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../context/ToastContext';
import { Input, Button, Card, Separator } from '../components/ui';
import { GeometricPattern } from '../components/GeometricPattern';
import { Logo } from '../components/Logo';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width } = Dimensions.get('window');
const isTablet = width > 600;
const MAX_CONTENT_WIDTH = 480;

export default function LoginScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string }>({});
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();

  const validate = () => {
    const newErrors: { emailOrPhone?: string; password?: string } = {};
    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await login({ emailOrPhone, password });
      showToast('Welcome back!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.primary[50], colors.white]}
      style={styles.container}
    >
      <GeometricPattern variant="zellij" opacity={0.03} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.contentWrapper}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Logo width={isTablet ? 100 : 80} height={isTablet ? 100 : 80} />
              </View>

              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue to your account</Text>

              <Card style={styles.card}>
                <View style={styles.form}>
                  <Input
                    label="Email or Phone"
                    placeholder="Enter your email or phone"
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    error={errors.emailOrPhone}
                    icon="mail-outline"
                    keyboardType="email-address"
                    required
                  />

                  <Input
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    error={errors.password}
                    secureTextEntry
                    icon="lock-closed-outline"
                    required
                  />

                  <Button
                    label="Login"
                    onPress={handleLogin}
                    loading={loading}
                    icon="arrow-forward"
                    iconPosition="right"
                    size={isTablet ? 'lg' : 'default'}
                    style={styles.button}
                  />

                  <View style={styles.divider}>
                    <Separator />
                    <Text style={styles.dividerText}>OR</Text>
                    <Separator />
                  </View>

                  <Button
                    label="Don't have an account? Sign Up"
                    onPress={() => navigation.navigate('Register' as never)}
                    variant="ghost"
                    size={isTablet ? 'lg' : 'default'}
                  />
                </View>
              </Card>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingVertical: isTablet ? spacing.xxl : spacing.xl,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  logoContainer: {
    alignSelf: 'center',
    width: isTablet ? 120 : 100,
    height: isTablet ? 120 : 100,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
    shadowColor: colors.primary[600],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: isTablet ? fontSize['4xl'] : fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: isTablet ? fontSize.lg : fontSize.base,
    color: colors.gray[600],
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: isTablet ? 28 : 24,
  },
  card: {
    padding: isTablet ? spacing.xxl : spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: spacing.md,
    width: '100%',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: spacing.md,
  },
  dividerText: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

