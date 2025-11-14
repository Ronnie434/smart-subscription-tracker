# Quick Setup: Email Duplicate Detection Function

## ⚠️ IMPORTANT: Run This SQL in Supabase First

The duplicate email detection requires a database function. **You must run this SQL in your Supabase dashboard before it will work.**

## Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste This SQL:**

```sql
-- Function to check if email already exists in auth.users
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS TABLE (
  email_exists BOOLEAN,
  user_id UUID,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_user RECORD;
BEGIN
  -- Query for user with matching email
  SELECT 
    u.id,
    u.email_confirmed_at,
    u.created_at
  INTO found_user
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(check_email)
  LIMIT 1;
  
  -- If user found, return their info
  IF found_user.id IS NOT NULL THEN
    RETURN QUERY SELECT 
      TRUE,
      found_user.id,
      found_user.email_confirmed_at,
      found_user.created_at;
  ELSE
    -- If no user found, return false
    RETURN QUERY SELECT 
      FALSE,
      NULL::UUID,
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ;
  END IF;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.check_email_exists IS 'Checks if an email already exists in auth.users. Returns user info if found, false otherwise.';
```

4. **Click "Run"** (or press Cmd/Ctrl + Enter)

5. **Verify It Worked**
   - You should see "Success. No rows returned" or similar
   - No errors should appear

## Test It:

After running the SQL, try signing up with `rox434@gmail.com` again. You should see in the console:
- `[SignUp] Email exists check:` with results (not an error)
- If duplicate detected: `[SignUp] Email exists with different user ID - duplicate detected`

## Troubleshooting:

**Error: "permission denied"**
- Make sure you're running this as a project owner/admin
- The function uses `SECURITY DEFINER` which requires elevated permissions

**Error: "function already exists"**
- That's fine! The `CREATE OR REPLACE` will update it
- Just run it again

**Still getting "function not found" error**
- Wait a few seconds and try again (schema cache might need to refresh)
- Check that you ran it in the correct project
- Verify the function name is exactly `check_email_exists`

## What This Does:

- Allows the app to check if an email exists in `auth.users` (which clients normally can't access)
- Returns user information if the email exists
- Enables proper duplicate email detection during signup

Without this function, the app will fall back to profile checks, which may not catch all duplicates.

