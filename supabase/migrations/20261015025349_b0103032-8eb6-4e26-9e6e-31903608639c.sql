CREATE OR REPLACE FUNCTION public.sync_propriete_main_walker_access()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.main_walker_id IS DISTINCT FROM NEW.main_walker_id AND OLD.main_walker_id IS NOT NULL THEN
    UPDATE public.propriete_marcheurs SET is_main = false
     WHERE propriete_id = NEW.id AND community_profile_id = OLD.main_walker_id AND is_main = true;
  END IF;
  IF NEW.main_walker_id IS NOT NULL THEN
    UPDATE public.propriete_marcheurs SET is_main = false
     WHERE community_profile_id = NEW.main_walker_id AND propriete_id <> NEW.id AND is_main = true;
    INSERT INTO public.propriete_marcheurs (propriete_id, community_profile_id, role, is_main)
    VALUES (NEW.id, NEW.main_walker_id, 'marcheur_historique'::public.role_propriete, true)
    ON CONFLICT (propriete_id, community_profile_id)
    DO UPDATE SET role = COALESCE(public.propriete_marcheurs.role, 'marcheur_historique'::public.role_propriete), is_main = true;
  END IF;
  RETURN NEW;
END;
$function$;