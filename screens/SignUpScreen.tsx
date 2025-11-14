import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import AuthInput from '../components/AuthInput';
import { useAuth } from '../contexts/AuthContext';

interface SignUpScreenProps {
  // Props are optional now since we use useNavigation
  onNavigateToSignIn?: () => void;
}

// Helper functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (strengthScore >= 3) return 'strong';
  return 'medium';
};

export default function SignUpScreen({ onNavigateToSignIn }: SignUpScreenProps) {
  const { theme } = useTheme();
  const { signUp, loading: authLoading, isHandlingDuplicate, clearDuplicateFlag } = useAuth();
  const navigation = useNavigation<any>();
  
  // Use React Navigation's navigate function, fallback to prop if provided
  const navigateToSignIn = () => {
    if (__DEV__) {
      console.log('[SignUpScreen] navigateToSignIn called');
    }
    try {
      // Clear duplicate handling flag before navigating
      // This allows the auth state to update naturally and clears user/session
      if (isHandlingDuplicate) {
        if (__DEV__) {
          console.log('[SignUpScreen] Clearing duplicate handling flag before navigation');
        }
        clearDuplicateFlag();
      }
      
      if (navigation?.navigate) {
        if (__DEV__) {
          console.log('[SignUpScreen] Using React Navigation to navigate to Login');
        }
        navigation.navigate('Login');
      } else if (onNavigateToSignIn) {
        if (__DEV__) {
          console.log('[SignUpScreen] Using prop callback to navigate');
        }
        onNavigateToSignIn();
      } else {
        if (__DEV__) {
          console.error('[SignUpScreen] No navigation method available!');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[SignUpScreen] Navigation error:', error);
      }
    }
  };
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Debug: Track component lifecycle
  React.useEffect(() => {
    if (__DEV__) {
      console.log('[SignUpScreen] Component mounted');
    }
    return () => {
      if (__DEV__) {
        console.log('[SignUpScreen] Component unmounted');
      }
    };
  }, []);

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const getStrengthColor = () => {
    if (!passwordStrength) return theme.colors.border;
    switch (passwordStrength) {
      case 'weak':
        return theme.colors.error;
      case 'medium':
        return '#FFA500';
      case 'strong':
        return '#00C853';
      default:
        return theme.colors.border;
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    }

    return isValid;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await signUp(email.trim(), password, name.trim());

      if (__DEV__) {
        console.log('[SignUpScreen] Response:', { success: response.success, message: response.message });
      }

      if (response.success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        // Check if email confirmation is required
        if (response.message?.includes('email')) {
          Alert.alert(
            'Account Created',
            response.message,
            [{ text: 'OK', onPress: onNavigateToSignIn }]
          );
        } else {
          // Auto-signed in, navigation handled by AuthContext
        }
      } else {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        
        // Check if it's a duplicate email error
        const errorMessage = response.message || '';
        const errorLower = errorMessage.toLowerCase();
        const isDuplicateEmail = 
          errorLower.includes('already exists') ||
          errorLower.includes('already registered') ||
          errorLower.includes('duplicate') ||
          errorLower.includes('please sign in instead');
        
        if (__DEV__) {
          console.log('[SignUpScreen] Error detected:', { errorMessage, isDuplicateEmail });
        }
        
        if (isDuplicateEmail) {
          // Show alert for duplicate email since component state may be lost during re-renders
          if (__DEV__) {
            console.log('[SignUpScreen] Showing duplicate email alert:', errorMessage);
          }
          
          // Use requestAnimationFrame to ensure alert shows even if component is remounting
          requestAnimationFrame(() => {
            Alert.alert(
              'Account Already Exists',
              errorMessage,
              [
                {
                  text: 'Sign In',
                  onPress: () => {
                    if (__DEV__) {
                      console.log('[SignUpScreen] Sign In button pressed');
                      console.log('[SignUpScreen] onNavigateToSignIn function exists:', !!onNavigateToSignIn);
                      console.log('[SignUpScreen] Calling onNavigateToSignIn now...');
                    }
                    // Use the navigation function
                    navigateToSignIn();
                  },
                },
              ],
              { cancelable: false } // Prevent dismissing by tapping outside
            );
          });
        } else {
          // For other errors, show alert
          Alert.alert('Sign Up Failed', errorMessage || 'Please try again.');
        }
      }
    } catch (error) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isProcessing = isLoading || authLoading;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: 120,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxl,
    },
    logoContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    logoImage: {
      width: 120,
      height: 120,
      borderRadius: 21.5,
      resizeMode: 'contain' as const,
    },
    appName: {
      fontSize: 36,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    tagline: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    formContainer: {
      flex: 1,
      paddingTop: theme.spacing.lg,
    },
    strengthContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
      marginTop: -theme.spacing.xs,
    },
    strengthBars: {
      flexDirection: 'row',
      gap: 4,
      marginRight: theme.spacing.md,
    },
    strengthBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
    },
    strengthText: {
      fontSize: 12,
      fontWeight: '600',
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.xl,
    },
    footerText: {
      color: theme.colors.text,
      fontSize: 16,
    },
    signInLink: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {/* Logo and Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/app-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Subscribely</Text>
          <Text style={styles.tagline}>Track your subscriptions smartly</Text>
        </View>

        {/* Sign Up Form */}
        <View style={styles.formContainer}>
          <AuthInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setNameError('');
            }}
            placeholder="Name"
            autoCapitalize="words"
            autoComplete="name"
            error={nameError}
            editable={!isProcessing}
          />

          <AuthInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={emailError}
            editable={!isProcessing}
          />

          <AuthInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            placeholder="Password"
            secureTextEntry
            autoComplete="password"
            error={passwordError}
            editable={!isProcessing}
          />

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                <View
                  style={[
                    styles.strengthBar,
                    { backgroundColor: getStrengthColor() },
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    passwordStrength === 'medium' || passwordStrength === 'strong'
                      ? { backgroundColor: getStrengthColor() }
                      : { backgroundColor: theme.colors.border },
                  ]}
                />
                <View
                  style={[
                    styles.strengthBar,
                    passwordStrength === 'strong'
                      ? { backgroundColor: getStrengthColor() }
                      : { backgroundColor: theme.colors.border },
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
                {passwordStrength === 'weak' && 'Weak'}
                {passwordStrength === 'medium' && 'Medium'}
                {passwordStrength === 'strong' && 'Strong'}
              </Text>
            </View>
          )}

          <AuthInput
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setConfirmPasswordError('');
            }}
            placeholder="Confirm Password"
            secureTextEntry
            autoComplete="password"
            error={confirmPasswordError}
            editable={!isProcessing}
          />

          <TouchableOpacity
            style={[styles.createButton, isProcessing && styles.createButtonDisabled]}
            onPress={handleSignUp}
            disabled={isProcessing}
            activeOpacity={0.8}>
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={navigateToSignIn}
              disabled={isProcessing}
              activeOpacity={0.7}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}