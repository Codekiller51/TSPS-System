/*
  # Temporary Admin System Tables

  1. New Tables
    - `temp_admins` - Temporary administrator accounts
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `expires_at` (timestamptz)
      - `permissions` (text array)
      - `created_by` (uuid, references auth.users)
      - `reason` (text)
      - `is_active` (boolean)
      - `last_used` (timestamptz)
      - `revoked_at` (timestamptz)
      - `revoked_by` (uuid, references auth.users)
      - `revoke_reason` (text)
      - `created_at` (timestamptz)

    - `temp_admin_audit_log` - Audit log for temporary admin actions
      - `id` (uuid, primary key)
      - `action` (text)
      - `temp_admin_id` (uuid, references temp_admins)
      - `performed_by` (uuid, references auth.users)
      - `details` (jsonb)
      - `timestamp` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for admin-only access
*/

-- Create temp_admins table
CREATE TABLE IF NOT EXISTS temp_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_used timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create temp_admin_audit_log table
CREATE TABLE IF NOT EXISTS temp_admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  temp_admin_id uuid NOT NULL REFERENCES temp_admins(id) ON DELETE CASCADE,
  performed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  details jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_temp_admins_email ON temp_admins(email);
CREATE INDEX IF NOT EXISTS idx_temp_admins_expires_at ON temp_admins(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_admins_is_active ON temp_admins(is_active);
CREATE INDEX IF NOT EXISTS idx_temp_admins_created_by ON temp_admins(created_by);
CREATE INDEX IF NOT EXISTS idx_temp_admin_audit_log_temp_admin_id ON temp_admin_audit_log(temp_admin_id);
CREATE INDEX IF NOT EXISTS idx_temp_admin_audit_log_timestamp ON temp_admin_audit_log(timestamp);

-- Enable Row Level Security
ALTER TABLE temp_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for temp_admins table
CREATE POLICY "Only main admins can view temp admins"
  ON temp_admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  );

CREATE POLICY "Only main admins can insert temp admins"
  ON temp_admins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  );

CREATE POLICY "Only main admins can update temp admins"
  ON temp_admins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  );

CREATE POLICY "Only main admins can delete temp admins"
  ON temp_admins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  );

-- RLS Policies for temp_admin_audit_log table
CREATE POLICY "Only main admins can view audit log"
  ON temp_admin_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  );

CREATE POLICY "Only main admins can insert audit log"
  ON temp_admin_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
      AND (auth.users.raw_user_meta_data->>'temp_admin')::boolean IS NOT TRUE
    )
  );

-- Function to automatically revoke expired temp admins
CREATE OR REPLACE FUNCTION revoke_expired_temp_admins()
RETURNS void AS $$
BEGIN
  UPDATE temp_admins
  SET 
    is_active = false,
    revoked_at = now(),
    revoked_by = NULL,
    revoke_reason = 'Expired - Auto cleanup'
  WHERE 
    is_active = true 
    AND expires_at <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update last_used when temp admin is validated
CREATE OR REPLACE FUNCTION update_temp_admin_last_used()
RETURNS trigger AS $$
BEGIN
  NEW.last_used = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The trigger would be created on a validation table or through application logic
-- since we don't want to update last_used on every SELECT