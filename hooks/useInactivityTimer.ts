import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseInactivityTimerOptions {
  /**
   * Timeout duration in milliseconds
   * Default: 5 minutes (300000 ms)
   */
  timeout?: number;
  /**
   * Callback function called when timeout is reached
   */
  onTimeout: () => void;
  /**
   * Whether the timer is enabled
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Default timeout: 5 minutes
 */
const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Hook to track user inactivity and trigger logout after timeout
 * 
 * Features:
 * - Monitors app state (foreground/background)
 * - Tracks last activity timestamp
 * - Automatically calls onTimeout when inactivity period exceeds timeout
 * - Provides reset function to reset timer on user activity
 * 
 * @param options Configuration options
 * @returns Object with reset function to manually reset the timer
 */
export function useInactivityTimer({
  timeout = DEFAULT_TIMEOUT,
  onTimeout,
  enabled = true,
}: UseInactivityTimerOptions) {
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const enabledRef = useRef(enabled);

  // Update enabled ref when prop changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  /**
   * Reset the inactivity timer
   * Call this function whenever user performs an action
   */
  const resetTimer = useCallback(() => {
    if (!enabledRef.current) return;
    lastActivityRef.current = Date.now();
  }, []);

  /**
   * Check if timeout has been reached and trigger logout if needed
   */
  const checkTimeout = useCallback(() => {
    if (!enabledRef.current) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Only check timeout when app is in foreground
    // Timer continues in background for security, but we only log out when app comes to foreground
    if (appStateRef.current === 'active' && timeSinceLastActivity >= timeout) {
      console.log('Inactivity timeout reached, logging out user');
      onTimeout();
    }
  }, [timeout, onTimeout]);

  /**
   * Handle app state changes
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      // When app comes to foreground, check if timeout was reached while in background
      if (previousAppState.match(/inactive|background/) && nextAppState === 'active') {
        if (enabledRef.current) {
          checkTimeout();
          // Reset timer when app comes to foreground (user is back)
          lastActivityRef.current = Date.now();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkTimeout]);

  /**
   * Set up interval to periodically check for timeout
   */
  useEffect(() => {
    if (!enabled) {
      // Clear any existing timeout if disabled
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Initial reset of timer
    lastActivityRef.current = Date.now();

    // Check for timeout every second
    timeoutRef.current = setInterval(() => {
      checkTimeout();
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, checkTimeout]);

  return {
    resetTimer,
  };
}

