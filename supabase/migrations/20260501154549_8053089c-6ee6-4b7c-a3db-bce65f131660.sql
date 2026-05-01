-- 1) Fix the trigger: never demote, only promote
CREATE OR REPLACE FUNCTION public.update_community_role_on_participation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  validated_count INTEGER;
  current_formation BOOLEAN;
  current_certification BOOLEAN;
  current_role community_role;
  computed_role community_role;
  final_role community_role;
  role_rank_current INTEGER;
  role_rank_computed INTEGER;
BEGIN
  IF NEW.validated_at IS NOT NULL AND (OLD.validated_at IS NULL OR TG_OP = 'INSERT') THEN
    SELECT COUNT(*) INTO validated_count
    FROM marche_participations
    WHERE user_id = NEW.user_id AND validated_at IS NOT NULL;

    SELECT formation_validee, certification_validee, role
    INTO current_formation, current_certification, current_role
    FROM community_profiles
    WHERE user_id = NEW.user_id;

    IF validated_count >= 20 AND current_certification THEN
      computed_role := 'sentinelle';
    ELSIF validated_count >= 10 AND current_formation THEN
      computed_role := 'ambassadeur';
    ELSIF validated_count >= 5 THEN
      computed_role := 'eclaireur';
    ELSIF validated_count >= 1 THEN
      computed_role := 'marcheur';
    ELSE
      computed_role := 'marcheur_en_devenir';
    END IF;

    -- Rank roles to enforce promotion-only behavior (preserve admin overrides)
    role_rank_current := CASE COALESCE(current_role::text, 'marcheur_en_devenir')
      WHEN 'marcheur_en_devenir' THEN 0
      WHEN 'marcheur' THEN 1
      WHEN 'eclaireur' THEN 2
      WHEN 'ambassadeur' THEN 3
      WHEN 'sentinelle' THEN 4
      ELSE 0
    END;

    role_rank_computed := CASE computed_role::text
      WHEN 'marcheur_en_devenir' THEN 0
      WHEN 'marcheur' THEN 1
      WHEN 'eclaireur' THEN 2
      WHEN 'ambassadeur' THEN 3
      WHEN 'sentinelle' THEN 4
      ELSE 0
    END;

    -- Only promote, never demote
    IF role_rank_computed > role_rank_current THEN
      final_role := computed_role;
    ELSE
      final_role := current_role;
    END IF;

    UPDATE community_profiles
    SET role = final_role,
        marches_count = validated_count,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Restore Gaspard Boréal to Sentinelle
UPDATE public.community_profiles
SET role = 'sentinelle', updated_at = now()
WHERE user_id = 'b821bb9c-2fa5-4cbe-b166-800b56087039';