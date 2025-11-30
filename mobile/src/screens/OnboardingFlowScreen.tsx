import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingScreen from '../components/Onboarding/OnboardingScreen';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Welcome to Afus ⴰⴼⵓⵙ',
    description: 'Your trusted marketplace connecting buyers with agricultural producers across Morocco.',
    icon: 'leaf-outline' as const,
  },
  {
    title: 'Secure Escrow Payments',
    description: 'Your payments are held safely until you confirm delivery. No risk, guaranteed satisfaction.',
    icon: 'shield-checkmark-outline' as const,
  },
  {
    title: 'QR Code Verification',
    description: 'Simply scan the QR code when your order arrives to confirm delivery and release payment.',
    icon: 'qr-code-outline' as const,
  },
  {
    title: 'Direct from Producers',
    description: 'Buy fresh agricultural products directly from cooperatives. Support local farmers!',
    icon: 'business-outline' as const,
  },
];

export default function OnboardingFlowScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = async () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Mark onboarding as completed
      await AsyncStorage.setItem('onboarding_completed', 'true');
      navigation.navigate('Login' as never);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_completed', 'true');
    navigation.navigate('Login' as never);
  };

  const currentScreen = onboardingData[currentIndex];

  return (
    <View style={styles.container}>
      <OnboardingScreen
        title={currentScreen.title}
        description={currentScreen.description}
        icon={currentScreen.icon}
        onNext={handleNext}
        onSkip={handleSkip}
        isLast={currentIndex === onboardingData.length - 1}
      />
      
      {/* Progress Indicators */}
      <View style={styles.progressContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 32,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary[600],
  },
});

