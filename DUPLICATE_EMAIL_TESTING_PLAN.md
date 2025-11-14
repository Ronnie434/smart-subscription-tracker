# Duplicate Email Handling - Comprehensive Testing Plan

## Overview
This document outlines the testing plan for duplicate email detection and handling during user signup.

## Test Scenarios

### Scenario 1: First Attempt - Duplicate Email Detection
**Objective**: Verify that duplicate email is detected and alert is shown correctly.

**Steps**:
1. Ensure an account with email `rox434@gmail.com` already exists in the system
2. Navigate to Sign Up screen
3. Enter the following:
   - Name: `Test User`
   - Email: `rox434@gmail.com`
   - Password: `TestPassword123!`
   - Confirm Password: `TestPassword123!`
4. Click "Create Account" button

**Expected Behavior**:
- ✅ Loading indicator shows while processing
- ✅ Duplicate email is detected (check logs for `[SignUp] Email exists with different user ID - duplicate detected`)
- ✅ User and session are cleared immediately (check logs for `[SignUp] Clearing user and session to prevent navigation`)
- ✅ Alert modal appears with title "Account Already Exists"
- ✅ Alert message: "An account with this email already exists. Please sign in instead."
- ✅ Alert shows two buttons: "Sign In" and "Try Again"
- ✅ User remains on Sign Up screen (no automatic navigation to main app)
- ✅ `isHandlingDuplicateRef` is set to `true` initially, then cleared after sign-out completes

**Logs to Verify**:
```
[SignUp] Starting signup for: rox434@gmail.com
[SignUp] Reset isHandlingDuplicateRef to false
[SignUp] Email exists check: {...}
[SignUp] Email exists with different user ID - duplicate detected
[SignUp] Clearing user and session to prevent navigation
[SignUpScreen] Response: {success: false, message: "..."}
[SignUpScreen] Error detected: {isDuplicateEmail: true}
[SignUpScreen] Showing duplicate email alert: ...
[SignUp] Signed out duplicate user
[SignUp] Cleared duplicate handling flag after sign-out
```

---

### Scenario 2: First Attempt - Click "Sign In" Button
**Objective**: Verify that clicking "Sign In" button in alert navigates to Login screen.

**Prerequisites**: Complete Scenario 1 first

**Steps**:
1. After alert appears (from Scenario 1), click "Sign In" button

**Expected Behavior**:
- ✅ Alert dismisses
- ✅ Navigation to Login screen occurs
- ✅ Login screen is displayed correctly
- ✅ User can enter credentials and sign in

**Logs to Verify**:
```
[SignUpScreen] Sign In button pressed, navigating...
[SignUpScreen] Calling onNavigateToSignIn
[AuthNavigator] Updating screen to: Login from: SignUp ref: SignUp
[AuthNavigator] Updated ref to: Login
[AuthNavigator] Setting currentScreen state to: Login
[AuthNavigator] ForceUpdate: X -> X+1
[AuthNavigator] Rendering with screen: Login
[AuthNavigator] Initial state from ref: Login (if component remounts)
```

---

### Scenario 3: First Attempt - Click "Try Again" Button
**Objective**: Verify that clicking "Try Again" keeps user on Sign Up screen.

**Prerequisites**: Complete Scenario 1 first

**Steps**:
1. After alert appears (from Scenario 1), click "Try Again" button

**Expected Behavior**:
- ✅ Alert dismisses
- ✅ User remains on Sign Up screen
- ✅ Form fields are still populated (or can be edited)
- ✅ User can modify email and try again

**Logs to Verify**:
```
[SignUpScreen] Try Again button pressed
```

---

### Scenario 4: Second Attempt - Duplicate Email Detection
**Objective**: Verify that duplicate email detection works correctly on subsequent attempts.

**Prerequisites**: Complete Scenario 3 (clicked "Try Again")

**Steps**:
1. On Sign Up screen (after clicking "Try Again" in Scenario 3)
2. Ensure email field still has `rox434@gmail.com` (or re-enter it)
3. Ensure password fields are filled
4. Click "Create Account" button again

**Expected Behavior**:
- ✅ `isHandlingDuplicateRef` is reset to `false` at start of signup (check logs)
- ✅ Duplicate email is detected again
- ✅ Alert modal appears again (same as Scenario 1)
- ✅ No automatic navigation occurs
- ✅ User can choose "Sign In" or "Try Again" again

**Logs to Verify**:
```
[SignUp] Starting signup for: rox434@gmail.com
[SignUp] Reset isHandlingDuplicateRef to false
[SignUp] Email exists check: {...}
[SignUp] Email exists with different user ID - duplicate detected
[SignUpScreen] Showing duplicate email alert: ...
```

**Critical Check**: 
- ❌ **MUST NOT** see automatic navigation to Login screen
- ❌ **MUST NOT** see "Account Created" message
- ❌ **MUST NOT** see navigation to main app

---

### Scenario 5: Multiple Rapid Attempts
**Objective**: Verify that rapid signup attempts don't cause race conditions.

**Steps**:
1. On Sign Up screen, enter duplicate email
2. Click "Create Account" button
3. Immediately after alert appears, click "Try Again"
4. Immediately click "Create Account" again (without changing anything)
5. Repeat steps 3-4 two more times

**Expected Behavior**:
- ✅ Each attempt shows the alert correctly
- ✅ No state corruption or navigation issues
- ✅ `isHandlingDuplicateRef` is properly reset between attempts
- ✅ No console errors or warnings

---

### Scenario 6: Navigation After Multiple Attempts
**Objective**: Verify that navigation works after multiple duplicate attempts.

**Prerequisites**: Complete Scenario 5

**Steps**:
1. After multiple duplicate attempts, click "Sign In" in the alert

**Expected Behavior**:
- ✅ Navigation to Login screen works correctly
- ✅ Login screen displays properly
- ✅ No errors or warnings

---

## Edge Cases to Test

### Edge Case 1: Component Remounting
**Test**: Verify that alert and navigation work even if `SignUpScreen` component remounts during duplicate handling.

**Expected**: Alert should persist (it's a native modal) and navigation callback should still work.

### Edge Case 2: Network Delay
**Test**: Simulate slow network and verify duplicate detection still works.

**Expected**: Duplicate detection should work regardless of network speed.

### Edge Case 3: Supabase Session Creation
**Test**: Verify that even if Supabase creates a session for duplicate user, it's properly cleared.

**Expected**: Session should be cleared immediately, preventing navigation.

---

## Validation Checklist

Before marking as complete, verify:

- [ ] ✅ First duplicate attempt shows alert correctly
- [ ] ✅ "Sign In" button navigates to Login screen
- [ ] ✅ "Try Again" button keeps user on Sign Up screen
- [ ] ✅ Second duplicate attempt shows alert again (no automatic navigation)
- [ ] ✅ Multiple rapid attempts don't cause issues
- [ ] ✅ Navigation works after multiple attempts
- [ ] ✅ No console errors or warnings
- [ ] ✅ `isHandlingDuplicateRef` is properly managed
- [ ] ✅ User and session are cleared immediately on duplicate detection
- [ ] ✅ No automatic navigation to main app occurs

---

## Debugging Tips

### If Alert Doesn't Show:
1. Check logs for `[SignUpScreen] Showing duplicate email alert`
2. Verify `isDuplicateEmail` is `true` in logs
3. Check if component is unmounting before alert shows

### If Navigation Doesn't Work:
1. Check logs for `[SignUpScreen] Sign In button pressed`
2. Verify `[AuthNavigator] Updating screen to: Login` appears
3. Check if `authScreenRef.current` is updated correctly
4. Verify `currentScreen` state is updated

### If Automatic Navigation Occurs:
1. Check if `isHandlingDuplicateRef.current` is `true` when it should be
2. Verify `setUser(null)` and `setSession(null)` are called
3. Check `onAuthStateChange` listener logs
4. Verify duplicate user is signed out properly

---

## Test Email
- **Email**: `rox434@gmail.com`
- **Password**: Use any valid password (won't be used for duplicate detection)

---

## Notes
- All tests should be performed with `__DEV__` mode enabled to see debug logs
- Check React Native debugger console for all log messages
- Alert is a native modal, so it persists even if component remounts
- Navigation uses a ref (`authScreenRef`) to persist across remounts

