-- Create table to log every OPUS import run (preview and import)
CREATE TABLE IF NOT EXISTS public.opus_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  mode text NOT NULL CHECK (mode IN ('preview','import')),
  status text NOT NULL CHECK (status IN ('success','error')),
  opus_id uuid NOT NULL,
  marche_id uuid NOT NULL,
  completude_score numeric,
  validation jsonb,
  request_payload jsonb,
  source text,
  error_message text
);

-- Indexes for fast filtering/sorting
CREATE INDEX IF NOT EXISTS idx_opus_import_runs_opus_id ON public.opus_import_runs (opus_id);
CREATE INDEX IF NOT EXISTS idx_opus_import_runs_marche_id ON public.opus_import_runs (marche_id);
CREATE INDEX IF NOT EXISTS idx_opus_import_runs_created_at ON public.opus_import_runs (created_at DESC);

-- Enable RLS and define policies
ALTER TABLE public.opus_import_runs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view history (admin UI is public-read like the rest of the app)
DROP POLICY IF EXISTS "Public can view opus_import_runs" ON public.opus_import_runs;
CREATE POLICY "Public can view opus_import_runs"
ON public.opus_import_runs
FOR SELECT
USING (true);

-- Allow inserts (edge function typically uses service role and bypasses RLS, but keep permissive insert)
DROP POLICY IF EXISTS "Allow insert opus_import_runs" ON public.opus_import_runs;
CREATE POLICY "Allow insert opus_import_runs"
ON public.opus_import_runs
FOR INSERT
WITH CHECK (true);

-- Block updates/deletes by default
DROP POLICY IF EXISTS "Block update opus_import_runs" ON public.opus_import_runs;
CREATE POLICY "Block update opus_import_runs"
ON public.opus_import_runs
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "Block delete opus_import_runs" ON public.opus_import_runs;
CREATE POLICY "Block delete opus_import_runs"
ON public.opus_import_runs
FOR DELETE
USING (false);
