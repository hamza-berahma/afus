import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import LoadingScreen from '../components/LoadingScreen';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingFlowScreen from '../screens/OnboardingFlowScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProductsScreen from '../screens/ProductsScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import WalletScreen from '../screens/WalletScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TransactionDetailScreen from '../screens/TransactionDetailScreen';
import ProducerDashboardScreen from '../screens/ProducerDashboardScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import ProductFormScreen from '../screens/ProductFormScreen';
import CooperativesScreen from '../screens/CooperativesScreen';
import CooperativeDetailScreen from '../screens/CooperativeDetailScreen';
import CooperativesMapScreen from '../screens/CooperativesMapScreen';
import SecuritySettingsScreen from '../screens/SecuritySettingsScreen';
import AppLockScreen from '../screens/AppLockScreen';
import CartScreen from '../screens/CartScreen';
import { useSecurity } from '../context/SecurityContext';
import FloatingCartButton from '../components/FloatingCartButton';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BuyerTabs() {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.gray[200],
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CooperativesTab"
        component={CooperativesScreen}
        options={{
          tabBarLabel: 'Stores',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{
          tabBarLabel: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
        />
      </Tab.Navigator>
      <FloatingCartButton />
    </>
  );
}

function ProducerTabs() {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: {
            backgroundColor: colors.white,
            borderTopColor: colors.gray[200],
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}
      >
      <Tab.Screen
        name="DashboardTab"
        component={ProducerDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProductsTab"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TransactionsTab"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
        />
      </Tab.Navigator>
      <FloatingCartButton />
    </>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const { isAppLocked } = useSecurity();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('onboarding_completed');
      setIsOnboardingComplete(completed === 'true');
    } catch (error) {
      setIsOnboardingComplete(false);
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading || isInitializing) {
    return <LoadingScreen />;
  }

  // Show app lock screen if app is locked
  if (isAppLocked) {
    return <AppLockScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            {!isOnboardingComplete ? (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingFlowScreen} />
              </>
            ) : null}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={user?.role === 'PRODUCER' ? ProducerTabs : BuyerTabs}
            />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: true,
                title: 'Product Details',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              }}
            />
            <Stack.Screen
              name="TransactionDetail"
              component={TransactionDetailScreen}
              options={{
                headerShown: true,
                title: 'Transaction Details',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              }}
            />
            <Stack.Screen
              name="QRScanner"
              component={QRScannerScreen}
              options={{
                headerShown: true,
                title: 'Scan QR Code',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              }}
            />
            <Stack.Screen
              name="ProductForm"
              component={ProductFormScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: route.params?.productId ? 'Edit Product' : 'Add Product',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              })}
            />
            <Stack.Screen
              name="CooperativeDetail"
              component={CooperativeDetailScreen}
              options={{
                headerShown: true,
                title: 'Store',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              }}
            />
            <Stack.Screen
              name="CooperativesMap"
              component={CooperativesMapScreen}
              options={{
                headerShown: true,
                title: 'Find Stores',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              }}
            />
            <Stack.Screen
              name="SecuritySettings"
              component={SecuritySettingsScreen}
              options={{
                headerShown: true,
                title: 'Security Settings',
                headerStyle: { backgroundColor: colors.white },
                headerTintColor: colors.gray[900],
              }}
            />
            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
