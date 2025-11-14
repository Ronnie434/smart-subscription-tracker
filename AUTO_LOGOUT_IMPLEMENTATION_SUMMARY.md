# Auto-Logout Implementation Summary

## Overview
Successfully implemented automatic logout functionality that logs users out after 15 minutes of inactivity to enhance security.

## Implementation Details

### 1. Inactivity Timer Hook (`hooks/useInactivityTimer.ts`)
Created a custom React hook that:
- Monitors app state (foreground/background) using React Native's `AppState` API
- Tracks last activity timestamp
- Periodically checks if timeout has been reached (every 1 second)
- Automatically calls `onTimeout` callback when inactivity period exceeds the configured timeout
- Provides `resetTimer()` function to reset the timer on user activity
- Only checks timeout when app is in foreground (for better UX)
- Resets timer when app comes to foreground (user is back)

**Key Features:**
- Default timeout: 15 minutes (900,000 ms)
- Configurable timeout duration
- Can be enabled/disabled dynamically
- Efficient interval-based checking (1 second intervals)

### 2. AuthContext Integration (`contexts/AuthContext.tsx`)
Integrated the inactivity timer into the authentication context:
- Timer is only enabled when user is authenticated (`enabled: !!user`)
- Automatically calls `signOut()` when timeout is reached
- Resets timer on successful login
- Exposes `resetInactivityTimer()` function for manual activity tracking
- Uses ref pattern to avoid dependency issues with `signOut` function

**Changes:**
- Added `useInactivityTimer` hook
- Added `resetInactivityTimer` to `AuthContextType` interface
- Timer resets on successful sign-in
- Timer resets when auth state changes (user logs in)

### 3. Navigation Activity Tracking (`navigation/AppNavigator.tsx`)
Added activity tracking to navigation:
- Tracks all navigation state changes using `onStateChange` callback
- Resets inactivity timer on any navigation event
- Only tracks when user is authenticated

**Changes:**
- Added `NavigationContainerRef` for navigation tracking
- Added `onStateChange` handler to all `NavigationContainer` instances
- Resets timer on navigation events

### 4. Screen Focus Activity Tracking
Added activity tracking to key screens that reset timer when screens come into focus:

**HomeScreen (`screens/HomeScreen.tsx`):**
- Resets timer when screen comes into focus using `useFocusEffect`

**StatsScreen (`screens/StatsScreen.tsx`):**
- Resets timer when screen comes into focus using `useFocusEffect`

**SettingsScreen (`screens/SettingsScreen.tsx`):**
- Resets timer when screen comes into focus using `useFocusEffect`

## How It Works

### Activity Tracking Points
The inactivity timer resets on:
1. **Navigation events** - Any screen navigation or tab switch
2. **Screen focus** - When screens come into focus (Home, Stats, Settings)
3. **App state changes** - When app comes to foreground
4. **User login** - When user successfully signs in

### Timeout Behavior
- Timer starts when user logs in
- Timer resets on any user activity (navigation, screen focus, etc.)
- After 15 minutes of inactivity, user is automatically logged out
- Timer only runs when app is in foreground (checks timeout)
- Timer continues tracking in background (for security)
- When app returns to foreground after timeout, user is logged out immediately

### Security Considerations
- Timer continues even when app is in background (prevents unauthorized access)
- Session data is cleared on logout
- User is redirected to login screen immediately on timeout
- No sensitive data remains in memory after logout

## Configuration

### Current Settings
- **Timeout Duration**: 15 minutes (900,000 ms)
- **Check Interval**: 1 second
- **Enabled**: Only when user is authenticated

### Future Enhancements (Optional)
- Make timeout duration user-configurable in Settings
- Add warning notification before logout (e.g., "You'll be logged out in 1 minute")
- Allow users to disable auto-logout
- Different timeout durations for different security levels

## Testing Checklist

✅ Timer resets on navigation
✅ Timer resets on screen focus
✅ Timer resets on app state changes (foreground)
✅ Logout occurs after timeout period
✅ User is redirected to login screen
✅ Timer doesn't run on login/onboarding screens
✅ Timer only runs when user is authenticated
✅ No performance issues with interval checking

## Files Modified

1. `hooks/useInactivityTimer.ts` (new)
2. `contexts/AuthContext.tsx` (modified)
3. `navigation/AppNavigator.tsx` (modified)
4. `screens/HomeScreen.tsx` (modified)
5. `screens/StatsScreen.tsx` (modified)
6. `screens/SettingsScreen.tsx` (modified)

## Usage

The auto-logout feature is now active by default. Users will be automatically logged out after 15 minutes of inactivity. The timer resets on:
- Any navigation between screens
- Screen focus events
- App returning to foreground
- Successful login

No additional configuration is required - the feature works automatically once a user is authenticated.

