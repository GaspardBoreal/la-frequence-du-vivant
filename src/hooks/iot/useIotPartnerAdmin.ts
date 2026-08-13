import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const db = supabase as any;

export interface IotPartnerRow {
  id: string;
  user_id: string;
  fournisseur_id: string;
  fournisseur_nom: string;
  actif: boolean;
  created_at: string | null;
  prenom: string | null;
  nom: string | null;
  ville: string | null;
  avatar_url: string | null;
  role: string | null;
}

/** Liste complète des habilitations partenaires (réservée aux administrateurs). */
export function useIotPartnerRows() {
  return useQuery<IotPartnerRow[]>({
    queryKey: ['iot-partner-rows'],
    queryFn: async () => {
      const { data, error } = await db
        .from('iot_partner_users')
        .select('id, user_id, fournisseur_id, actif, created_at, fournisseur:iot_fournisseurs(id, nom)')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data ?? []) as any[];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
      let profiles: any[] = [];
      if (userIds.length) {
        const { data: p } = await supabase
          .from('community_profiles')
          .select('user_id, prenom, nom, ville, avatar_url, role')
          .in('user_id', userIds);
        profiles = p ?? [];
      }
      const byUser = new Map(profiles.map((p: any) => [p.user_id, p]));

      return rows.map((r) => {
        const p = byUser.get(r.user_id) ?? {};
        return {
          id: r.id,
          user_id: r.user_id,
          fournisseur_id: r.fournisseur_id,
          fournisseur_nom: r.fournisseur?.nom ?? '—',
          actif: !!r.actif,
          created_at: r.created_at ?? null,
          prenom: p.prenom ?? null,
          nom: p.nom ?? null,
          ville: p.ville ?? null,
          avatar_url: p.avatar_url ?? null,
          role: p.role ?? null,
        } as IotPartnerRow;
      });
    },
  });
}

/** Habilitations indexées par user_id — pour les pastilles côté communauté. */
export function useIotPartnerBadges() {
  const { data = [], ...rest } = useIotPartnerRows();
  const byUser = new Map<string, IotPartnerRow[]>();
  for (const r of data) {
    const arr = byUser.get(r.user_id) ?? [];
    arr.push(r);
    byUser.set(r.user_id, arr);
  }
  return { byUser, rows: data, ...rest };
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['iot-partner-rows'] });
    qc.invalidateQueries({ queryKey: ['iot-partner-access'] });
  };
}

export function useAddIotPartner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (v: { user_id: string; fournisseur_id: string; actif: boolean }) => {
      const { error } = await db
        .from('iot_partner_users')
        .upsert({ ...v }, { onConflict: 'user_id,fournisseur_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Habilitation partenaire enregistrée');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec de l’habilitation'),
  });
}

export function useToggleIotPartner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id: string; actif: boolean }) => {
      const { error } = await db.from('iot_partner_users').update({ actif: v.actif }).eq('id', v.id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e: any) => toast.error(e?.message ?? 'Échec de la mise à jour'),
  });
}

export function useRemoveIotPartner() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('iot_partner_users').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Habilitation retirée');
    },
    onError: (e: any) => toast.error(e?.message ?? 'Échec de la suppression'),
  });
}
