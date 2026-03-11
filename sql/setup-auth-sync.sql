
-- Create or replace the sync function
CREATE OR REPLACE FUNCTION public.sync_admin_users_to_auth_users()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- We assume public.admin_users.id should match auth.users.id
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.password_hash, -- Make sure this is compatible with what Supabase/GoTrue expects
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', NEW.name),
    'authenticated',
    'authenticated'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_admin ON public.admin_users;
CREATE TRIGGER trigger_sync_admin
AFTER INSERT OR UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.sync_admin_users_to_auth_users();

-- Force sync current users to auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
SELECT 
  id, 
  email, 
  password_hash, 
  NOW(), 
  '{"provider":"email","providers":["email"]}', 
  jsonb_build_object('name', name), 
  'authenticated', 
  'authenticated'
FROM public.admin_users
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

