import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateLocalSubscriptions } from '../services/subscriptionService';
import { useInactivityTimer } from '../hooks/useInactivityTimer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  resetInactivityTimer: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to store signOut function for inactivity timer
  const signOutRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    // Check for existing session on mount
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Reset inactivity timer when user logs in
      if (session?.user) {
        resetTimer();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [resetTimer]);

  const initializeAuth = async () => {
    try {
      // Get the current session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        // Only log errors, don't show to user during initialization
        // Most auth errors during init are expected (no session, expired session, etc.)
        console.error('Error getting session:', error);
        // Don't set error state - these are usually expected scenarios
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Trigger migration if user is authenticated
        if (session?.user) {
          performMigration();
        }
      }
    } catch (err) {
      // Only log initialization errors, don't show to user
      // These are usually network issues or setup problems that shouldn't block the app
      console.error('Error initializing auth:', err);
      // Don't set error state - let user try to sign in
    } finally {
      setLoading(false);
    }
  };

  /**
   * Perform one-time migration of local subscriptions to Supabase
   * Runs in the background without blocking the UI
   */
  const performMigration = async () => {
    try {
      const result = await migrateLocalSubscriptions();
      
      if (result.success && result.migratedCount > 0) {
        console.log(`Successfully migrated ${result.migratedCount} subscriptions to Supabase`);
      } else if (result.error) {
        console.error('Migration error:', result.error);
      }
    } catch (err) {
      console.error('Error during migration:', err);
      // Don't block user experience if migration fails
    }
  };

  const signUp = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      setLoading(true);

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
          },
        },
      });

      if (error) {
        setError(error.message);
        return { 
          success: false, 
          message: getReadableErrorMessage(error)
        };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return {
          success: true,
          message: 'Please check your email to confirm your account.',
        };
      }

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return {
          success: false,
          message: getReadableErrorMessage(error)
        };
      }

      if (!data.session) {
        return {
          success: false,
          message: 'Failed to create session. Please try again.'
        };
      }

      // Trigger migration after successful sign in
      performMigration();

      // Reset inactivity timer on successful login
      resetTimer();

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = useCallback(async (silent: boolean = false): Promise<void> => {
    try {
      // Clear error state unless it's a silent logout (auto-logout)
      if (!silent) {
        setError(null);
      }
      setLoading(true);

      // Clear local subscription data
      await AsyncStorage.removeItem('subscriptions');

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Only set error if it's not a silent logout and not an expected auth error
        // AuthSessionMissingError is expected during auto-logout when session is already expired
        const isExpectedAuthError = error.message.includes('AuthSessionMissingError') || 
                                     error.message.includes('session');
        
        if (!silent && !isExpectedAuthError) {
          setError(error.message);
        }
        // Always log errors for debugging, but don't show to user during auto-logout
        console.error('Error signing out:', error);
      }

      // Reset state
      setUser(null);
      setSession(null);
      
      // Clear error on successful logout (even if there was an error, user is logged out)
      setError(null);
    } catch (err) {
      // Only set error if it's not a silent logout
      if (!silent) {
        const message = err instanceof Error ? err.message : 'Failed to sign out';
        setError(message);
      }
      console.error('Error signing out:', err);
      
      // Reset state even if there was an error
      setUser(null);
      setSession(null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Store signOut in ref for inactivity timer
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  // Set up inactivity timer for auto-logout
  // Only enabled when user is authenticated
  const { resetTimer } = useInactivityTimer({
    timeout: 5 * 60 * 1000, // 5 minutes
    onTimeout: async () => {
      console.log('Auto-logout triggered due to inactivity');
      if (signOutRef.current) {
        // Use silent logout to prevent error messages from showing
        await signOutRef.current(true);
      }
    },
    enabled: !!user, // Only enable when user is logged in
  });

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'subscribely://reset-password',
      });

      if (error) {
        setError(error.message);
        return { 
          success: false, 
          message: getReadableErrorMessage(error)
        };
      }

      return { 
        success: true, 
        message: 'Password reset email sent. Please check your inbox.' 
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    clearError,
    // Expose resetTimer for manual activity tracking
    resetInactivityTimer: resetTimer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Convert Supabase auth errors to user-friendly messages
 */
function getReadableErrorMessage(error: AuthError): string {
  const errorMessage = error.message.toLowerCase();

  if (errorMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  
  if (errorMessage.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  
  if (errorMessage.includes('user already registered')) {
    return 'An account with this email already exists.';
  }
  
  if (errorMessage.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  
  if (errorMessage.includes('password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (errorMessage.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Return original message if no specific mapping found
  return error.message;
}