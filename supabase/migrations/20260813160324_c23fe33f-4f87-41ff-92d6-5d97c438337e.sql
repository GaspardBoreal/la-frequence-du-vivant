ALTER TABLE public.iot_partner_users
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_quota integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_period_start date NOT NULL DEFAULT date_trunc('month', now())::date;

CREATE OR REPLACE FUNCTION public.get_iot_ai_credit(_fournisseur_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.iot_partner_users%ROWTYPE;
        used integer;
BEGIN
  IF public.check_is_admin_user(auth.uid()) THEN
    RETURN jsonb_build_object('enabled', true, 'quota', -1, 'used', 0, 'remaining', -1, 'admin', true);
  END IF;

  SELECT * INTO r FROM public.iot_partner_users
   WHERE user_id = auth.uid() AND fournisseur_id = _fournisseur_id AND actif = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('enabled', false, 'quota', 0, 'used', 0, 'remaining', 0, 'admin', false);
  END IF;

  used := CASE WHEN r.ai_period_start < date_trunc('month', now())::date THEN 0 ELSE r.ai_used END;

  RETURN jsonb_build_object(
    'enabled', r.ai_enabled,
    'quota', r.ai_quota,
    'used', used,
    'remaining', CASE WHEN r.ai_quota < 0 THEN -1 ELSE GREATEST(r.ai_quota - used, 0) END,
    'admin', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_iot_ai_credit(_fournisseur_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE r public.iot_partner_users%ROWTYPE;
        used integer;
BEGIN
  IF public.check_is_admin_user(auth.uid()) THEN
    RETURN jsonb_build_object('allowed', true, 'quota', -1, 'used', 0, 'remaining', -1, 'admin', true);
  END IF;

  SELECT * INTO r FROM public.iot_partner_users
   WHERE user_id = auth.uid() AND fournisseur_id = _fournisseur_id AND actif = true
   FOR UPDATE;

  IF NOT FOUND OR NOT r.ai_enabled THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'disabled', 'quota', 0, 'used', 0, 'remaining', 0);
  END IF;

  used := CASE WHEN r.ai_period_start < date_trunc('month', now())::date THEN 0 ELSE r.ai_used END;

  IF r.ai_quota >= 0 AND used >= r.ai_quota THEN
    UPDATE public.iot_partner_users
       SET ai_used = used, ai_period_start = date_trunc('month', now())::date
     WHERE id = r.id;
    RETURN jsonb_build_object('allowed', false, 'reason', 'exhausted', 'quota', r.ai_quota, 'used', used, 'remaining', 0);
  END IF;

  UPDATE public.iot_partner_users
     SET ai_used = used + 1, ai_period_start = date_trunc('month', now())::date
   WHERE id = r.id;

  RETURN jsonb_build_object(
    'allowed', true,
    'quota', r.ai_quota,
    'used', used + 1,
    'remaining', CASE WHEN r.ai_quota < 0 THEN -1 ELSE GREATEST(r.ai_quota - used - 1, 0) END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_iot_ai_credit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_iot_ai_credit(uuid) TO authenticated;