CREATE TABLE public.api_mcp_incidents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  status_at_action text NOT NULL DEFAULT 'unknown',
  action text NOT NULL DEFAULT 'relance',
  outcome text NOT NULL DEFAULT 'success',
  detail text,
  freshness_before timestamptz,
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.api_mcp_incidents TO authenticated;
GRANT ALL ON public.api_mcp_incidents TO service_role;

ALTER TABLE public.api_mcp_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api_mcp_incidents"
  ON public.api_mcp_incidents FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

CREATE INDEX idx_api_mcp_incidents_slug_created ON public.api_mcp_incidents (slug, created_at DESC);