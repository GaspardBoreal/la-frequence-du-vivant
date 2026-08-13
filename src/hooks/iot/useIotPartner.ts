import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export interface IotPartnerAccess {
  userId: string | null;
  isAdmin: boolean;
  /** Fournisseurs dont l'utilisateur connecté est partenaire. */
  fournisseurs: { id: string; nom: string }[];
}

/**
 * Droits IoT du compte connecté : administrateur du parc, ou partenaire
 * rattaché à un ou plusieurs fabricants de sondes.
 */
export function useIotPartnerAccess() {
  return useQuery<IotPartnerAccess>({
    queryKey: ['iot-partner-access'],
    staleTime: 60_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user ?? null;
      if (!user) return { userId: null, isAdmin: false, fournisseurs: [] };

      const [{ data: isAdmin }, { data: rows }] = await Promise.all([
        supabase.rpc('check_is_admin_user' as never, { check_user_id: user.id } as never),
        db
          .from('iot_partner_users')
          .select('fournisseur_id, actif, fournisseur:iot_fournisseurs(id, nom)')
          .eq('user_id', user.id)
          .eq('actif', true),
      ]);

      return {
        userId: user.id,
        isAdmin: !!isAdmin,
        fournisseurs: (rows ?? [])
          .map((r: any) => r.fournisseur)
          .filter(Boolean)
          .map((f: any) => ({ id: f.id, nom: f.nom })),
      };
    },
  });
}

/** Accès à la console d'un fournisseur donné (partenaire de ce fournisseur, ou admin). */
export function useCanOpenIotConsole(fournisseurId?: string | null) {
  const { data, isLoading } = useIotPartnerAccess();
  const allowed =
    !!data &&
    (data.isAdmin || (!!fournisseurId && data.fournisseurs.some((f) => f.id === fournisseurId)));
  return { allowed, isLoading, access: data ?? null };
}
