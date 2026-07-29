import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { baseRecoFor, hasSpecificReco, type OuvrageReco } from '@/lib/ouvrageRecoKb';

export interface OuvrageRecoResolved extends OuvrageReco {
  /** true quand la fiche a été enrichie par un administrateur en base */
  enriched: boolean;
  /** true quand le socle code contient une fiche rédigée pour ce type précis */
  specific: boolean;
  updatedAt?: string | null;
}

interface KbRow {
  outil_key: string;
  mise_en_oeuvre: string[] | null;
  calendrier: string | null;
  entretien: { an0?: string; an1?: string; an3?: string } | null;
  especes: string[] | null;
  vigilance: string[] | null;
  sources: string[] | null;
  updated_at: string | null;
}

/**
 * Fusion « socle code ↔ surcharge en base » des fiches de recommandation
 * par type d'ouvrage. La base `propriete_ouvrage_kb` est commune à tous les
 * sites et n'est modifiable que par les administrateurs (RLS).
 */
export function useOuvrageRecoKb() {
  const qc = useQueryClient();

  const query = useQuery<Record<string, KbRow>>({
    queryKey: ['propriete-ouvrage-kb'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('propriete_ouvrage_kb')
        .select('*');
      if (error) throw error;
      const map: Record<string, KbRow> = {};
      for (const r of (data as KbRow[]) || []) map[r.outil_key] = r;
      return map;
    },
  });

  const overrides = query.data ?? {};

  const resolve = useCallback(
    (outilKey: string): OuvrageRecoResolved => {
      const base = baseRecoFor(outilKey);
      const row = overrides[outilKey];
      if (!row) {
        return { ...base, enriched: false, specific: hasSpecificReco(outilKey) };
      }
      const nonEmpty = (a?: string[] | null) => (a && a.length ? a : null);
      return {
        miseEnOeuvre: nonEmpty(row.mise_en_oeuvre) ?? base.miseEnOeuvre,
        calendrier: row.calendrier?.trim() || base.calendrier,
        entretien: {
          an0: row.entretien?.an0?.trim() || base.entretien.an0,
          an1: row.entretien?.an1?.trim() || base.entretien.an1,
          an3: row.entretien?.an3?.trim() || base.entretien.an3,
        },
        especes: nonEmpty(row.especes) ?? base.especes,
        vigilance: nonEmpty(row.vigilance) ?? base.vigilance,
        sources: nonEmpty(row.sources) ?? base.sources,
        enriched: true,
        specific: hasSpecificReco(outilKey),
        updatedAt: row.updated_at,
      };
    },
    [overrides],
  );

  const saveReco = useCallback(
    async (outilKey: string, reco: OuvrageReco) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from('propriete_ouvrage_kb').upsert(
        {
          outil_key: outilKey,
          mise_en_oeuvre: reco.miseEnOeuvre,
          calendrier: reco.calendrier,
          entretien: reco.entretien,
          especes: reco.especes,
          vigilance: reco.vigilance,
          sources: reco.sources,
          updated_by: auth?.user?.id ?? null,
        },
        { onConflict: 'outil_key' },
      );
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['propriete-ouvrage-kb'] });
    },
    [qc],
  );

  const resetReco = useCallback(
    async (outilKey: string) => {
      const { error } = await (supabase as any)
        .from('propriete_ouvrage_kb')
        .delete()
        .eq('outil_key', outilKey);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['propriete-ouvrage-kb'] });
    },
    [qc],
  );

  return { resolve, saveReco, resetReco, loading: query.isLoading };
}

/** Seuls les administrateurs peuvent enrichir la base commune (imposé par la RLS). */
export function useCanEditOuvrageKb() {
  const { data } = useQuery({
    queryKey: ['can-edit-ouvrage-kb'],
    staleTime: 60_000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data: isAdmin } = await supabase.rpc('check_is_admin_user', {
        check_user_id: user.id,
      });
      return !!isAdmin;
    },
  });
  return !!data;
}
