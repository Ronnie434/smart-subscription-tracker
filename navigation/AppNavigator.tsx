import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Subscription } from '../types';
import { hasSeenOnboarding } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import AddSubscriptionScreen from '../screens/AddSubscriptionScreen';
import EditSubscriptionScreen from '../screens/EditSubscriptionScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Type definitions for navigation
type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

type SubscriptionsStackParamList = {
  Home: undefined;
  AddSubscription: { subscription?: Subscription };
  EditSubscription: { subscription: Subscription };
};

type StatsStackParamList = {
  StatsHome: undefined;
};

type SettingsStackParamList = {
  SettingsHome: undefined;
};

type RootTabParamList = {
  Subscriptions: undefined;
  Stats: undefined;
  Settings: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const SubscriptionsStack = createStackNavigator<SubscriptionsStackParamList>();
const StatsStack = createStackNavigator<StatsStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'SignUp' | 'ForgotPassword'>('Login');

  return (
    <View style={{ flex: 1 }}>
      {currentScreen === 'Login' ? (
        <LoginScreen
          onNavigateToSignUp={() => setCurrentScreen('SignUp')}
          onNavigateToForgotPassword={() => setCurrentScreen('ForgotPassword')}
        />
      ) : currentScreen === 'SignUp' ? (
        <SignUpScreen
          onNavigateToSignIn={() => setCurrentScreen('Login')}
        />
      ) : (
        <ForgotPasswordScreen
          onNavigateToSignIn={() => setCurrentScreen('Login')}
        />
      )}
    </View>
  );
}

function SubscriptionsNavigator() {
  const { theme } = useTheme();
  
  return (
    <SubscriptionsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <SubscriptionsStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Subscriptions',
        }}
      />
      <SubscriptionsStack.Screen
        name="AddSubscription"
        component={AddSubscriptionScreen}
        options={{
          title: 'Add Subscription',
          headerShown: true,
        }}
      />
      <SubscriptionsStack.Screen
        name="EditSubscription"
        component={EditSubscriptionScreen}
        options={{
          title: 'Edit Subscription',
          headerShown: true,
        }}
      />
    </SubscriptionsStack.Navigator>
  );
}

function StatsNavigator() {
  const { theme } = useTheme();
  
  return (
    <StatsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <StatsStack.Screen
        name="StatsHome"
        component={StatsScreen}
        options={{
          title: 'Statistics',
        }}
      />
    </StatsStack.Navigator>
  );
}

function SettingsNavigator() {
  const { theme } = useTheme();
  
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}>
      <SettingsStack.Screen
        name="SettingsHome"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </SettingsStack.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, resetInactivityTimer, error, clearError } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Clear errors when user is logged out (on login screen)
  useEffect(() => {
    if (!user && error) {
      // Clear any errors when showing login screen
      clearError();
    }
  }, [user, error, clearError]);

  // Handle navigation state changes to reset inactivity timer
  const handleNavigationStateChange = () => {
    if (user) {
      // Reset inactivity timer on any navigation event when user is authenticated
      resetInactivityTimer();
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const hasCompleted = await hasSeenOnboarding();
      setShowOnboarding(!hasCompleted);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show loading indicator while checking auth or onboarding status
  if (isCheckingOnboarding || authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show onboarding if user hasn't seen it
  if (showOnboarding) {
    return (
      <NavigationContainer ref={navigationRef} onStateChange={handleNavigationStateChange}>
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      </NavigationContainer>
    );
  }

  // Show auth screens if user is not authenticated
  if (!user) {
    return (
      <NavigationContainer ref={navigationRef} onStateChange={handleNavigationStateChange}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  // Show main app if user is authenticated
  return (
    <NavigationContainer ref={navigationRef} onStateChange={handleNavigationStateChange}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Subscriptions') {
              iconName = 'list';
            } else if (route.name === 'Stats') {
              iconName = 'stats-chart';
            } else if (route.name === 'Settings') {
              iconName = 'settings';
            } else {
              iconName = 'help';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
            paddingTop: 8,
            height: 60 + (insets.bottom > 0 ? insets.bottom : 8),
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerShown: false,
        })}>
        <Tab.Screen
          name="Subscriptions"
          component={SubscriptionsNavigator}
          options={{
            tabBarLabel: 'Subscriptions',
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              // Reset to Home screen when tab is pressed
              navigation.navigate('Subscriptions', { screen: 'Home' });
            },
          })}
        />
        <Tab.Screen
          name="Stats"
          component={StatsNavigator}
          options={{
            tabBarLabel: 'Stats',
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsNavigator}
          options={{
            tabBarLabel: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}