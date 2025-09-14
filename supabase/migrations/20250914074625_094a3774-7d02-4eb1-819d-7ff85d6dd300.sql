-- Security Fix: Set explicit search_path on database functions
-- This addresses the "Function Search Path Mutable" security warning

-- Update all functions to have explicit search_path for security
ALTER FUNCTION public.update_exploration_page(uuid, text, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.update_admin_users_updated_at() SET search_path = public;
ALTER FUNCTION public.check_is_admin_user(uuid) SET search_path = public;
ALTER FUNCTION public.is_admin_user() SET search_path = public;
ALTER FUNCTION public.delete_exploration_page(uuid) SET search_path = public;
ALTER FUNCTION public.cleanup_collection_data() SET search_path = public;
ALTER FUNCTION public.insert_exploration_page(uuid, text, integer, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.get_current_admin_email_secure() SET search_path = public;
ALTER FUNCTION public.remove_admin_user(uuid) SET search_path = public;
ALTER FUNCTION public.get_admin_count() SET search_path = public;
ALTER FUNCTION public.get_exploration_pages(uuid) SET search_path = public;
ALTER FUNCTION public.update_pages_order(uuid[], integer[]) SET search_path = public;
ALTER FUNCTION public.get_top_species_optimized(integer) SET search_path = public;
ALTER FUNCTION public.initialize_first_admin(uuid, text) SET search_path = public;
ALTER FUNCTION public.initialize_first_admin_direct(text, text) SET search_path = 'public', 'extensions';
ALTER FUNCTION public.validate_exploration_page_limits() SET search_path = public;
ALTER FUNCTION public.auto_order_exploration_pages() SET search_path = public;
ALTER FUNCTION public.get_current_admin_user() SET search_path = public;
ALTER FUNCTION public.confirm_admin_email(text) SET search_path = 'public', 'auth';
ALTER FUNCTION public.get_structured_vocabulary_data(uuid) SET search_path = public;
ALTER FUNCTION public.get_current_admin_email() SET search_path = public;
ALTER FUNCTION public.initialize_first_admin_by_email(text) SET search_path = 'public', 'auth';
ALTER FUNCTION public.get_admin_users_list() SET search_path = public;
ALTER FUNCTION public.get_admin_list_safe() SET search_path = public;
ALTER FUNCTION public.create_admin_user(uuid, text) SET search_path = public;
ALTER FUNCTION public.migrate_vocabulary_categorization() SET search_path = public;
ALTER FUNCTION public.check_system_initialization_safe() SET search_path = public;
ALTER FUNCTION public.is_system_initialized() SET search_path = public;
ALTER FUNCTION public.can_initialize_admin_system() SET search_path = public;
ALTER FUNCTION public.get_admin_list_secure_no_emails() SET search_path = public;
ALTER FUNCTION public.get_my_admin_email_only() SET search_path = public;
ALTER FUNCTION public.get_admin_count_secure() SET search_path = public;
ALTER FUNCTION public.get_current_admin_info() SET search_path = public;
ALTER FUNCTION public.validate_admin_email_access() SET search_path = public;
ALTER FUNCTION public.admin_operation_wrapper(text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Add security documentation
COMMENT ON SCHEMA public IS 'Public schema - all functions secured with explicit search_path for security';

-- Log this security improvement
INSERT INTO admin_audit_log (admin_user_id, action, details)
SELECT 
  au.id,
  'SECURITY_FIX_FUNCTION_PATHS',
  jsonb_build_object(
    'timestamp', now(),
    'action', 'Set explicit search_path on all database functions',
    'security_level', 'CRITICAL',
    'functions_secured', 30
  )
FROM admin_users au
WHERE au.user_id = auth.uid()
LIMIT 1;