-- Critical Security Fix: Restrict System Data Access to Admins Only
-- This migration secures data_collection_logs and opus_import_runs tables

-- Drop existing public policies for data_collection_logs
DROP POLICY IF EXISTS "Public can view data_collection_logs" ON data_collection_logs;
DROP POLICY IF EXISTS "Allow insert data_collection_logs" ON data_collection_logs;

-- Create secure policies for data_collection_logs - admin access only
CREATE POLICY "Admins can view data_collection_logs"
ON data_collection_logs
FOR SELECT
TO authenticated
USING (check_is_admin_user(auth.uid()));

CREATE POLICY "Admins can manage data_collection_logs"
ON data_collection_logs
FOR ALL
TO authenticated
USING (check_is_admin_user(auth.uid()))
WITH CHECK (check_is_admin_user(auth.uid()));

-- Drop existing public policy for opus_import_runs
DROP POLICY IF EXISTS "Public can view opus_import_runs" ON opus_import_runs;

-- Create secure policy for opus_import_runs - admin access only
CREATE POLICY "Admins can view opus_import_runs"
ON opus_import_runs
FOR SELECT
TO authenticated
USING (check_is_admin_user(auth.uid()));

-- Verify exploration_feedbacks and exploration_clicks are already secured
-- These tables already have restrictive SELECT policies (Using Expression: false)
-- which is correct - no changes needed

-- Add security comment to document the protection
COMMENT ON TABLE data_collection_logs IS 'System operation logs - restricted to administrators only for security';
COMMENT ON TABLE opus_import_runs IS 'AI import operation logs - restricted to administrators only for security';

-- Log this security improvement
INSERT INTO admin_audit_log (admin_user_id, action, details)
SELECT 
  au.id,
  'SECURITY_FIX_DATA_ACCESS',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'Restricted system data access to admins only',
    'tables_secured', ARRAY['data_collection_logs', 'opus_import_runs'],
    'security_level', 'CRITICAL'
  )
FROM admin_users au
WHERE au.user_id = auth.uid()
LIMIT 1;