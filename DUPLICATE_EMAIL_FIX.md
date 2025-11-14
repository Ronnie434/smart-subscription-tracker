# Duplicate Email Detection Fix

## Problem
When trying to sign up with an existing email (e.g., `rox434@gmail.com`), Supabase was not returning an error and was creating a new user record. The app couldn't detect this as a duplicate because:
1. Supabase doesn't return an error for duplicate emails in some configurations
2. Profile checks weren't finding existing profiles
3. The new user had a fresh timestamp, making it look like a legitimate new signup

## Solution
Added a database function `check_email_exists` that directly queries `auth.users` to check if an email already exists. This is the most reliable way to detect duplicates.

## Setup Instructions

### Step 1: Run the Database Function
1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `database/check_email_exists_function.sql`
4. Click **Run** to execute the SQL

This will create a function that:
- Checks if an email exists in `auth.users`
- Returns user information if found
- Can be called from the client app (with proper permissions)

### Step 2: Test the Fix
1. Try signing up with `rox434@gmail.com` (or any existing email)
2. Check the console logs for `[SignUp] Email exists check:`
3. You should see:
   - If email exists: The function returns the existing user info
   - If email doesn't exist: The function returns `exists: false`
4. The app should now properly detect duplicates and show an error on the email field

## How It Works

1. **Database Function**: `check_email_exists(email)` queries `auth.users` directly
   - Uses `SECURITY DEFINER` to access `auth.users` (which clients can't access directly)
   - Returns user info if email exists, false otherwise

2. **Client Check**: After Supabase signup, the app calls this function
   - If email exists with different user ID → Duplicate detected
   - If email exists with same user ID but older timestamp → Duplicate signup attempt
   - Falls back to profile checks if function fails

3. **Error Display**: When duplicate is detected
   - Error message: "An account with this email already exists. Please sign in instead."
   - Error appears on the email input field (not as an alert)

## Console Logs to Watch For

When testing, you should see:
```
[SignUp] Email exists check: { emailCheck: [...], emailCheckError: null }
[SignUp] Email exists with different user ID - duplicate detected
```

Or if it's a new email:
```
[SignUp] Email exists check: { emailCheck: [{ exists: false }], emailCheckError: null }
```

## Troubleshooting

### Function Not Found Error
- Make sure you ran the SQL function in Supabase SQL Editor
- Check that the function name is exactly `check_email_exists`
- Verify permissions: `GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;`

### Still Not Detecting Duplicates
- Check console logs to see what the function returns
- Verify the email format matches exactly (case-insensitive)
- Check if RLS policies are blocking the function execution

### Function Returns Error
- Check Supabase logs for detailed error messages
- Verify the function was created with `SECURITY DEFINER`
- Ensure `auth.users` table is accessible from the function

## Notes

- The function uses `SECURITY DEFINER` which allows it to access `auth.users` even though clients can't
- The function is granted to both `anon` and `authenticated` roles so it can be called during signup
- This approach is more reliable than checking profiles because it queries the source of truth (`auth.users`)

