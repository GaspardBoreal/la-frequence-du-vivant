REVOKE ALL ON FUNCTION public.get_community_usage_dashboard(timestamptz, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_community_usage_dashboard(timestamptz, timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_community_usage_dashboard(timestamptz, timestamptz) TO authenticated;