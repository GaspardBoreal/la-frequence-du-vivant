ALTER TABLE public.marche_events
  ADD COLUMN IF NOT EXISTS brand_kit_slug TEXT,
  ADD COLUMN IF NOT EXISTS brand_kit_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS brand_kit_enabled BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.marche_events.brand_kit_slug IS 'Identifiant du preset de charte (ex: chateau_boutinet) — résolu côté front via src/lib/brandKits/registry.ts';
COMMENT ON COLUMN public.marche_events.brand_kit_overrides IS 'Surcharges JSON du preset (couleurs, logo, badges, CTA label)';
COMMENT ON COLUMN public.marche_events.brand_kit_enabled IS 'Active l habillage de marque sur la page publique /m/:slug';