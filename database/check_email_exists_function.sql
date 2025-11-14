-- ============================================================================
-- Function to check if an email already exists in auth.users
-- ============================================================================
-- This function allows the client to check if an email is already registered
-- without needing admin access to auth.users
-- ============================================================================

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

