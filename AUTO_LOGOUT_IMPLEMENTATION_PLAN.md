# Auto-Logout Implementation Plan

## Overview
Implement automatic logout functionality that logs users out after a period of inactivity to enhance security and protect user data.

## Requirements

### Core Features
1. **Inactivity Timer**: Track user inactivity and automatically log out after a configurable timeout period
2. **App State Monitoring**: Detect when app goes to background/foreground
3. **Activity Tracking**: Reset timer on user interactions (screen touches, navigation, etc.)
4. **Automatic Logout**: Sign out user and redirect to login screen when timeout is reached
5. **Configurable Timeout**: Allow timeout duration to be configured (default: 15 minutes)

### Technical Approach

#### 1. Inactivity Timer Hook (`useInactivityTimer`)
- Monitor app state using React Native's `AppState` API
- Track last activity timestamp
- Set up interval to check inactivity
- Call logout callback when timeout is reached
- Reset timer on activity

#### 2. Activity Tracking
- Track navigation events
- Track screen focus/blur events
- Track user interactions (touches, scrolls, etc.)
- Reset inactivity timer on any activity

#### 3. Integration Points
- **AuthContext**: Integrate inactivity timer, call `signOut()` on timeout
- **AppNavigator**: Track navigation events to reset timer
- **Storage**: Store timeout configuration (optional: make it user-configurable)

### Implementation Steps

1. ✅ Create `useInactivityTimer` hook in `hooks/` directory
2. ✅ Add timeout configuration constants
3. ✅ Integrate hook into `AuthContext`
4. ✅ Add activity tracking to `AppNavigator`
5. ✅ Test auto-logout functionality

### Configuration

**Default Timeout**: 15 minutes (900,000 ms)
- Can be adjusted based on security requirements
- Future enhancement: Make it user-configurable in Settings

### Edge Cases to Handle

1. **App goes to background**: Timer should pause or continue based on security policy
   - **Decision**: Continue timer even in background for better security
2. **User actively using app**: Timer should reset on any interaction
3. **Multiple rapid interactions**: Debounce timer resets to avoid performance issues
4. **Login screen**: Timer should not run on auth screens
5. **Onboarding**: Timer should not run during onboarding

### Security Considerations

- Timer continues even when app is in background (prevents unauthorized access if device is unlocked)
- Clear session data on logout
- Redirect to login screen immediately on timeout
- No sensitive data should remain in memory after logout

## Implementation Details

### File Structure
```
hooks/
  └── useInactivityTimer.ts (new)
contexts/
  └── AuthContext.tsx (modified)
navigation/
  └── AppNavigator.tsx (modified)
utils/
  └── storage.ts (optional: add timeout config storage)
```

### Hook API
```typescript
useInactivityTimer({
  timeout: number, // milliseconds
  onTimeout: () => void,
  enabled: boolean, // whether timer is active
})
```

### Flow Diagram
```
User Activity → Reset Timer
     ↓
App State Change → Check if background/foreground
     ↓
Timer Check (every 1 second) → Compare last activity with timeout
     ↓
Timeout Reached → Call onTimeout (signOut)
     ↓
Redirect to Login Screen
```

## Testing Checklist

- [ ] Timer resets on navigation
- [ ] Timer resets on screen focus
- [ ] Timer resets on user touch/interaction
- [ ] Logout occurs after timeout period
- [ ] User is redirected to login screen
- [ ] Timer doesn't run on login/onboarding screens
- [ ] Timer pauses/resumes correctly on app state changes
- [ ] Multiple rapid interactions don't cause performance issues

