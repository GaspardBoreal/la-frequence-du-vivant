
-- 1. Backfill external_id for Elsa B's iNat account (numeric user id from iNat).
UPDATE public.community_profile_science_accounts
SET external_id = '10613937',
    display_name = COALESCE(display_name, 'marie Claude mazaud')
WHERE profile_id = '4a280a62-9591-4416-b399-145dfff740f3'
  AND network = 'inaturalist'
  AND username = 'elsab12'
  AND external_id IS NULL;

-- 2. Unique partial index on (profile_id, network, external_id) to prevent dups
--    while allowing multiple username aliases for the same iNat user id.
CREATE UNIQUE INDEX IF NOT EXISTS uq_science_accounts_profile_network_external
ON public.community_profile_science_accounts (profile_id, network, external_id)
WHERE external_id IS NOT NULL;

-- 3. Helper index for fast lookup by (network, external_id)
CREATE INDEX IF NOT EXISTS idx_science_accounts_network_external
ON public.community_profile_science_accounts (network, external_id)
WHERE external_id IS NOT NULL;
