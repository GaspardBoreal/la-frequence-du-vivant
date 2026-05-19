CREATE TABLE IF NOT EXISTS public.biodiversity_snapshots_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_snapshot_id uuid,
  marche_id uuid NOT NULL,
  latitude double precision,
  longitude double precision,
  snapshot_date date,
  radius_meters integer,
  total_species integer,
  birds_count integer,
  plants_count integer,
  fungi_count integer,
  others_count integer,
  recent_observations integer,
  species_data jsonb,
  sources_data jsonb,
  methodology jsonb,
  biodiversity_index numeric,
  species_richness integer,
  original_created_at timestamptz,
  archived_at timestamptz NOT NULL DEFAULT now(),
  replaced_by_snapshot_id uuid,
  delta_species jsonb,
  archive_reason text
);

CREATE INDEX IF NOT EXISTS idx_biodiv_snap_hist_marche_archived
  ON public.biodiversity_snapshots_history (marche_id, archived_at DESC);

ALTER TABLE public.biodiversity_snapshots_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read snapshot history"
  ON public.biodiversity_snapshots_history
  FOR SELECT
  TO authenticated
  USING (public.is_admin_user());

ALTER TABLE public.biodiversity_snapshots
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS regression_pct numeric;

CREATE INDEX IF NOT EXISTS idx_biodiv_snap_marche_status
  ON public.biodiversity_snapshots (marche_id, status, created_at DESC);
