# Duplicate Email Testing Guide

This document provides instructions for testing the duplicate email error handling when signing up with an existing email address.

## Test Scenario: rox434@gmail.com

### Prerequisites
1. Ensure you have an account with `rox434@gmail.com` already created in Supabase
2. Have the app running in development mode (to see debug logs)
3. Open the React Native debugger or Metro bundler console to view logs

### Testing Steps

1. **Open the Sign Up Screen**
   - Navigate to the sign-up screen in the app

2. **Attempt to Sign Up with Existing Email**
   - Enter email: `rox434@gmail.com`
   - Enter any password (minimum 8 characters)
   - Enter a name
   - Click "Create Account"

3. **Expected Behavior**

   **If Supabase Returns an Error:**
   - ❌ You should NOT see "Account Created" alert
   - ✅ You should see an error message on the email input field
   - ✅ Error message: "An account with this email already exists. Please sign in instead."
   - ✅ Check console logs for `[SignUp]` debug messages

   **If Supabase Returns User Without Error:**
   - The app will check if the user already has a confirmed email
   - If user was created more than 10 seconds ago, it will be detected as duplicate
   - Error will be shown on the email field

4. **Check Console Logs**

   Look for these debug messages in the console:
   ```
   [SignUp] Email: rox434@gmail.com
   [SignUp] Error: <error object or null>
   [SignUp] Data: { hasUser: true/false, hasSession: true/false, ... }
   [SignUp] Is duplicate email: true/false
   [SignUp] User created: <timestamp>
   [SignUp] Seconds since creation: <number>
   ```

5. **Verify Error Display**
   - The error should appear directly under the email input field
   - The error text should be red
   - No alert dialog should appear for duplicate email errors

### What to Look For

✅ **Correct Behavior:**
- Error message appears on email field
- Message: "An account with this email already exists. Please sign in instead."
- No "Account Created" alert
- Console shows duplicate email detection

❌ **Incorrect Behavior:**
- "Account Created" alert appears
- Generic error alert instead of field-specific error
- No error shown at all
- User is redirected to login screen

### Debugging

If the error is not detected properly:

1. **Check Console Logs**
   - Look at the `[SignUp]` logs to see what Supabase returned
   - Check the error message format
   - Verify the duplicate detection logic

2. **Common Issues:**
   - Supabase might return a different error message format
   - User might be created but not confirmed (check `email_confirmed_at`)
   - Network delay might affect timestamp checking

3. **If Error Still Not Caught:**
   - Check the actual error message in console logs
   - Update `getReadableErrorMessage` function with the actual error format
   - Adjust the duplicate detection logic if needed

### Test Cases to Verify

1. ✅ Sign up with existing confirmed email → Should show error
2. ✅ Sign up with existing unconfirmed email → Should show error (if created >10s ago)
3. ✅ Sign up with new email → Should work normally
4. ✅ Sign up with new email (email confirmation required) → Should show confirmation message

### Notes

- Debug logs are only shown in development mode (`__DEV__ === true`)
- The 10-second threshold for detecting old users accounts for network delays
- If email confirmation is disabled in Supabase, the behavior may differ

