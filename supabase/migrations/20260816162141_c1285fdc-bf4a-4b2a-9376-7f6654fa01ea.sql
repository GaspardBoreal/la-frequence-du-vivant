-- Défense en profondeur : le rôle anonyme n'a aucune raison d'atteindre
-- les codes d'invitation, même avec RLS active.
REVOKE ALL ON public.propriete_invitations FROM anon;

-- Les utilisateurs connectés n'ont besoin ni de DELETE ni de TRUNCATE :
-- le flux normal passe par les RPC `SECURITY DEFINER`.
REVOKE ALL ON public.propriete_invitations FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.propriete_invitations TO authenticated;