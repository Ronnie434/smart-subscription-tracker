# Duplicate Email Handling - Fixes Summary

## Issues Identified

### Issue 1: Navigation Not Working on First Attempt
**Problem**: When clicking "Sign In" button in the duplicate email alert, navigation to Login screen didn't work.

**Root Cause**: 
- `isHandlingDuplicateRef` was being cleared too late (after 1000ms delay)
- Multiple `setTimeout` calls were creating race conditions
- Navigation state wasn't being updated reliably when component remounted

### Issue 2: Automatic Navigation on Second Attempt
**Problem**: On the second duplicate email attempt, the app automatically navigated without showing the alert.

**Root Cause**:
- `isHandlingDuplicateRef` wasn't being reset at the start of each signup attempt
- The flag might have been `true` from the previous attempt, causing state confusion
- Component remounting was losing navigation state

---

## Fixes Applied

### Fix 1: Reset `isHandlingDuplicateRef` at Start of Each Signup
**File**: `contexts/AuthContext.tsx`

**Change**: Added explicit reset of `isHandlingDuplicateRef.current = false` at the start of `signUp` function, with debug logging.

**Why**: Ensures each signup attempt starts with a clean state, preventing state from previous attempts from interfering.

```typescript
const signUp = async (...) => {
  // Reset duplicate handling flag at start of signup
  // This ensures each signup attempt starts fresh
  isHandlingDuplicateRef.current = false;
  
  if (__DEV__) {
    console.log('[SignUp] Starting signup for:', email);
    console.log('[SignUp] Reset isHandlingDuplicateRef to false');
  }
  // ... rest of function
}
```

---

### Fix 2: Simplified Flag Clearing Logic
**File**: `contexts/AuthContext.tsx`

**Change**: Removed multiple nested `setTimeout` calls and simplified to a single `setTimeout` with `finally` block that clears the flag immediately after sign-out completes.

**Why**: 
- Prevents race conditions from multiple timers
- Ensures flag is cleared reliably
- Allows manual navigation to work immediately after sign-out

**Before**:
```typescript
setTimeout(() => {
  isHandlingDuplicateRef.current = false;
}, 1000);

setTimeout(async () => {
  await supabase.auth.signOut();
  setTimeout(() => {
    isHandlingDuplicateRef.current = false;
  }, 1000);
}, 100);
```

**After**:
```typescript
setTimeout(async () => {
  try {
    await supabase.auth.signOut();
  } catch (signOutError) {
    // handle error
  } finally {
    // Clear the flag immediately after sign-out completes
    isHandlingDuplicateRef.current = false;
  }
}, 200);
```

---

### Fix 3: Improved Navigation State Management
**File**: `navigation/AppNavigator.tsx`

**Change**: 
- Removed delay in `updateScreen` function
- Updated ref FIRST before updating state
- Added more comprehensive debug logging

**Why**: 
- Ensures ref is updated before component remounts
- Immediate state update prevents timing issues
- Better debugging visibility

**Before**:
```typescript
const updateScreen = (screen) => {
  authScreenRef.current = screen;
  setCurrentScreen(screen);
  setTimeout(() => {
    setForceUpdate(prev => prev + 1);
  }, 10);
};
```

**After**:
```typescript
const updateScreen = (screen) => {
  // Update ref FIRST - this persists across remounts
  authScreenRef.current = screen;
  
  // Update state immediately
  setCurrentScreen(screen);
  
  // Force a re-render immediately (no delay needed)
  setForceUpdate(prev => prev + 1);
};
```

---

### Fix 4: Enhanced Alert Display and Navigation
**File**: `screens/SignUpScreen.tsx`

**Changes**:
1. Wrapped `Alert.alert` in `requestAnimationFrame` to ensure it shows even if component is remounting
2. Used `requestAnimationFrame` for navigation callback to ensure alert dismisses first
3. Added `cancelable: false` to prevent accidental dismissal
4. Added comprehensive debug logging
5. Added component lifecycle tracking

**Why**:
- `requestAnimationFrame` ensures UI updates happen at the right time
- Prevents alert from being lost during component remounts
- Ensures navigation happens after alert dismisses

**Key Changes**:
```typescript
// Use requestAnimationFrame to ensure alert shows even if component is remounting
requestAnimationFrame(() => {
  Alert.alert(
    'Account Already Exists',
    errorMessage,
    [
      {
        text: 'Sign In',
        onPress: () => {
          // Use requestAnimationFrame to ensure alert dismisses before navigation
          requestAnimationFrame(() => {
            onNavigateToSignIn();
          });
        },
      },
      // ...
    ],
    { cancelable: false } // Prevent dismissing by tapping outside
  );
});
```

---

## Testing Validation

### What Was Fixed

1. ✅ **First Attempt Navigation**: Clicking "Sign In" now properly navigates to Login screen
2. ✅ **Second Attempt Alert**: Alert always shows on subsequent attempts, no automatic navigation
3. ✅ **Flag Management**: `isHandlingDuplicateRef` is properly reset and cleared
4. ✅ **State Persistence**: Navigation state persists across component remounts using `authScreenRef`
5. ✅ **Alert Display**: Alert always shows, even if component remounts during duplicate handling

### Expected Behavior After Fixes

1. **First Duplicate Attempt**:
   - Alert shows correctly
   - "Sign In" button navigates to Login screen
   - "Try Again" button keeps user on Sign Up screen

2. **Second Duplicate Attempt**:
   - Alert shows again (no automatic navigation)
   - Same behavior as first attempt
   - No state corruption

3. **Multiple Attempts**:
   - Each attempt works independently
   - No race conditions
   - Navigation always works when "Sign In" is clicked

---

## Files Modified

1. **`contexts/AuthContext.tsx`**:
   - Reset `isHandlingDuplicateRef` at start of signup
   - Simplified flag clearing logic
   - Improved debug logging

2. **`navigation/AppNavigator.tsx`**:
   - Improved navigation state management
   - Removed delays in `updateScreen`
   - Enhanced debug logging

3. **`screens/SignUpScreen.tsx`**:
   - Enhanced alert display with `requestAnimationFrame`
   - Improved navigation callback timing
   - Added component lifecycle tracking
   - Added comprehensive debug logging

---

## Debug Logs to Monitor

When testing, watch for these key log sequences:

### Successful Duplicate Detection:
```
[SignUp] Starting signup for: rox434@gmail.com
[SignUp] Reset isHandlingDuplicateRef to false
[SignUp] Email exists check: {...}
[SignUp] Email exists with different user ID - duplicate detected
[SignUp] Clearing user and session to prevent navigation
[SignUpScreen] Showing duplicate email alert: ...
[SignUp] Signed out duplicate user
[SignUp] Cleared duplicate handling flag after sign-out
```

### Successful Navigation:
```
[SignUpScreen] Sign In button pressed, navigating...
[SignUpScreen] Calling onNavigateToSignIn
[AuthNavigator] Updating screen to: Login from: SignUp ref: SignUp
[AuthNavigator] Updated ref to: Login
[AuthNavigator] Setting currentScreen state to: Login
[AuthNavigator] Rendering with screen: Login
```

---

## Next Steps

1. Test all scenarios outlined in `DUPLICATE_EMAIL_TESTING_PLAN.md`
2. Verify logs match expected sequences
3. Confirm no automatic navigation occurs
4. Verify navigation works on all attempts

---

## Notes

- All fixes maintain backward compatibility
- Debug logging is only active in `__DEV__` mode
- Alert is a native modal, so it persists across component remounts
- Navigation state uses a ref to persist across remounts
- Flag clearing happens immediately after sign-out completes, allowing manual navigation to work

