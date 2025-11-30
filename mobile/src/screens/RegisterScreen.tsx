import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../context/ToastContext';
import { Input, Button, Card } from '../components/ui';
import { GeometricPattern } from '../components/GeometricPattern';
import { colors } from '../theme/colors';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme/spacing';

const { width } = Dimensions.get('window');
const isTablet = width > 600;
const MAX_CONTENT_WIDTH = 480;

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'BUYER' | 'PRODUCER'>('BUYER');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    password?: string;
  }>({});
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigation = useNavigation();

  const validate = () => {
    const newErrors: { email?: string; phone?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ email, phone, password, role });
      showToast('Account created successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Registration failed', 'error');
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
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={colors.gray[700]} />
              </TouchableOpacity>

              <View style={styles.logoContainer}>
                <Logo width={isTablet ? 100 : 80} height={isTablet ? 100 : 80} />
              </View>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Afus ⴰⴼⵓⵙ today and start your journey</Text>

              <Card style={styles.card}>
                <View style={styles.form}>
                  <Input
                    label="Email"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    error={errors.email}
                    icon="mail-outline"
                    keyboardType="email-address"
                    required
                  />

                  <Input
                    label="Phone"
                    placeholder="+212..."
                    value={phone}
                    onChangeText={setPhone}
                    error={errors.phone}
                    icon="call-outline"
                    keyboardType="phone-pad"
                    required
                  />

                  <Input
                    label="Password"
                    placeholder="Create a password"
                    value={password}
                    onChangeText={setPassword}
                    error={errors.password}
                    secureTextEntry
                    icon="lock-closed-outline"
                    required
                  />

                  <View style={styles.roleSection}>
                    <Text style={styles.roleLabel}>
                      I want to: <Text style={styles.required}>*</Text>
                    </Text>
                    <View style={styles.roleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.roleButton,
                          role === 'BUYER' && styles.roleButtonActive,
                        ]}
                        onPress={() => setRole('BUYER')}
                      >
                        <Ionicons
                          name="cart"
                          size={28}
                          color={role === 'BUYER' ? colors.primary[600] : colors.gray[400]}
                        />
                        <Text
                          style={[
                            styles.roleText,
                            role === 'BUYER' && styles.roleTextActive,
                          ]}
                        >
                          Buy Products
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.roleButton,
                          role === 'PRODUCER' && styles.roleButtonActive,
                        ]}
                        onPress={() => setRole('PRODUCER')}
                      >
                        <Ionicons
                          name="business"
                          size={28}
                          color={role === 'PRODUCER' ? colors.primary[600] : colors.gray[400]}
                        />
                        <Text
                          style={[
                            styles.roleText,
                            role === 'PRODUCER' && styles.roleTextActive,
                          ]}
                        >
                          Sell Products
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Button
                    label="Create Account"
                    onPress={handleRegister}
                    loading={loading}
                    icon="arrow-forward"
                    iconPosition="right"
                    size={isTablet ? 'lg' : 'default'}
                    style={styles.button}
                  />

                  <Button
                    label="Already have an account? Login"
                    onPress={() => navigation.goBack()}
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
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: isTablet ? spacing.xxl : spacing.xl,
    paddingBottom: spacing.xl,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  roleSection: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    fontSize: isTablet ? fontSize.lg : fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  required: {
    color: colors.error[500],
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleButton: {
    flex: 1,
    padding: isTablet ? spacing.xl : spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    alignItems: 'center',
    gap: spacing.sm,
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleButtonActive: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
    shadowColor: colors.primary[600],
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleText: {
    fontSize: isTablet ? fontSize.lg : fontSize.base,
    color: colors.gray[600],
    fontWeight: fontWeight.medium,
  },
  roleTextActive: {
    color: colors.primary[600],
    fontWeight: fontWeight.semibold,
  },
  button: {
    marginTop: spacing.md,
    width: '100%',
  },
});
