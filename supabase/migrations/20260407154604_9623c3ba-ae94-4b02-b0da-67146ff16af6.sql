CREATE OR REPLACE FUNCTION public.create_community_profile(
  _user_id UUID,
  _prenom TEXT,
  _nom TEXT,
  _ville TEXT DEFAULT NULL,
  _telephone TEXT DEFAULT NULL,
  _date_naissance TEXT DEFAULT NULL,
  _motivation TEXT DEFAULT NULL,
  _kigo_accueil TEXT DEFAULT NULL,
  _superpouvoir_sensoriel TEXT DEFAULT NULL,
  _niveau_intimite_vivant TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  INSERT INTO public.community_profiles (
    user_id, prenom, nom, ville, telephone,
    date_naissance, motivation, kigo_accueil,
    superpouvoir_sensoriel, niveau_intimite_vivant
  ) VALUES (
    _user_id, _prenom, _nom, _ville, _telephone,
    _date_naissance, _motivation, _kigo_accueil,
    _superpouvoir_sensoriel, _niveau_intimite_vivant
  );
END;
$$;