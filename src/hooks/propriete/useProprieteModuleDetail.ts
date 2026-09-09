import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PropertySoilState, SoilSample } from '@/hooks/propriete/usePropertySoil';

const sb = supabase as any;

export type ModuleKey =
  | 'observations' | 'sol' | 'flore' | 'palette'
  | 'atelier' | 'tours' | 'clinique' | 'capteurs';

/** Une ligne de détail affichée dans la fenêtre : un titre, deux contextes. */
export interface DetailRow {
  id: string;
  titre: string;
  contexte?: string | null;
  meta?: string | null;
}

export interface ModuleDetail {
  rows: DetailRow[];
  /** Phrase de synthèse au-dessus de la liste. */
  resume: string | null;
  /** Registre complet, réservé à la vue spécialisée « Analyse du sol ». */
  soil?: PropertySoilState;
}

const str = (v: unknown): string | null => {
  if (v == null) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(', ') || null;
  return null;
};

/** Cherche le libellé le plus parlant dans un objet de forme libre. */
const labelOf = (o: any, fallback: string): string => {
  if (!o || typeof o !== 'object') return str(o) ?? fallback;
  const keys = ['nom', 'name', 'label', 'titre', 'title', 'species', 'scientific_name', 'scientificName', 'commonName', 'zone', 'repere', 'code'];
  for (const k of keys) {
    const v = str(o[k]);
    if (v) return v;
  }
  return fallback;
};

const dateFr = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR');
};

/**
 * Détail d'un module d'un jardin, chargé seulement à l'ouverture de la
 * fenêtre. Lecture seule, aucune donnée inventée : une liste vide reste vide.
 */
export const useProprieteModuleDetail = (proprieteId?: string, moduleKey?: ModuleKey | null) =>
  useQuery<ModuleDetail>({
    queryKey: ['propriete-module-detail', proprieteId, moduleKey],
    enabled: !!proprieteId && !!moduleKey,
    queryFn: async (): Promise<ModuleDetail> => {
      const one = async (table: string, cols: string) => {
        const { data, error } = await sb.from(table).select(cols).eq('propriete_id', proprieteId).limit(1);
        if (error) throw error;
        return (data || [])[0] ?? null;
      };
      const many = async (table: string, cols: string) => {
        const { data, error } = await sb.from(table).select(cols).eq('propriete_id', proprieteId);
        if (error) throw error;
        return (data || []) as any[];
      };

      switch (moduleKey) {
        case 'observations': {
          const o = await one('propriete_observations', 'answers, sensorial, notes, completed_at, updated_at');
          if (!o) return { rows: [], resume: null };
          const rows: DetailRow[] = [];
          Object.entries((o.answers || {}) as Record<string, unknown>).forEach(([k, v]) => {
            const val = str(v);
            if (val) rows.push({ id: `a-${k}`, titre: k, contexte: val, meta: 'Question' });
          });
          Object.entries((o.sensorial || {}) as Record<string, unknown>).forEach(([k, v]) => {
            const val = str(v);
            if (val) rows.push({ id: `s-${k}`, titre: k, contexte: val, meta: 'Ressenti' });
          });
          return {
            rows,
            resume: o.completed_at
              ? `Carnet d’observation complété le ${dateFr(o.completed_at)}`
              : `Carnet en cours, dernière saisie ${dateFr(o.updated_at) ?? 'inconnue'}`,
          };
        }

        case 'sol': {
          const s = await one('propriete_soil_diagnostics', 'terrain_status, samples, synthesis, structure, texture, boudin_shape, ph, life_signs, completed_at, updated_at');
          if (!s) return { rows: [], resume: null };
          const samples: SoilSample[] = Array.isArray(s.samples) ? s.samples : [];
          return {
            rows: [],
            resume: s.completed_at
              ? `Registre de sol clos le ${dateFr(s.completed_at)}`
              : 'Registre de sol ouvert',
            soil: {
              terrain_status: s.terrain_status ?? null,
              samples,
              structure: s.structure ?? null,
              texture: s.texture ?? null,
              boudin_shape: s.boudin_shape ?? null,
              ph: s.ph ?? null,
              life_signs: Array.isArray(s.life_signs) ? s.life_signs : [],
              synthesis: s.synthesis ?? '',
              completed_at: s.completed_at ?? null,
              updated_at: s.updated_at ?? null,
            },
          };
        }

        case 'flore': {
          const f = await one('propriete_flora_diagnostics', 'observed_plants, icg_score, concordance, flora_conclusion, completed_at');
          if (!f) return { rows: [], resume: null };
          const plants: any[] = Array.isArray(f.observed_plants) ? f.observed_plants : [];
          return {
            rows: plants.map((p, i) => ({
              id: `plant-${i}`,
              titre: labelOf(p, `Plante ${i + 1}`),
              contexte: str(p?.abondance) || str(p?.strate) || null,
              meta: str(p?.scientific_name) || str(p?.scientificName) || null,
            })),
            resume: [
              f.icg_score != null ? `Indice de concordance : ${f.icg_score}` : null,
              str(f.flora_conclusion),
            ].filter(Boolean).join(' — ') || null,
          };
        }

        case 'palette': {
          const p = await one('propriete_palette', 'zones, excluded, site_rule, completed_at');
          if (!p) return { rows: [], resume: null };
          const zones: any[] = Array.isArray(p.zones) ? p.zones : [];
          const excluded: any[] = Array.isArray(p.excluded) ? p.excluded : [];
          const rows: DetailRow[] = zones.map((z, i) => ({
            id: `zone-${i}`,
            titre: labelOf(z, `Zone ${i + 1}`),
            contexte: Array.isArray(z?.species)
              ? `${z.species.length} espèce(s) retenue(s)`
              : str(z?.description),
            meta: 'Zone composée',
          }));
          excluded.slice(0, 20).forEach((e, i) => {
            rows.push({ id: `ex-${i}`, titre: labelOf(e, 'Espèce écartée'), contexte: str(e?.reason), meta: 'Écartée' });
          });
          return { rows, resume: str(p.site_rule) };
        }

        case 'atelier': {
          const rows = await many('propriete_objets', 'id, nom, outil_key, created_at');
          return {
            rows: rows.map((o) => ({
              id: o.id,
              titre: str(o.nom) || 'Ouvrage sans nom',
              contexte: str(o.outil_key),
              meta: dateFr(o.created_at),
            })),
            resume: null,
          };
        }

        case 'tours': {
          const rows = await many('propriete_tours', 'id, titre, date_tour, heure_tour, statut, carnet_edite_at, created_at');
          rows.sort((a, b) => String(b.date_tour ?? b.created_at).localeCompare(String(a.date_tour ?? a.created_at)));
          return {
            rows: rows.map((t) => ({
              id: t.id,
              titre: str(t.titre) || 'Tour de jardin',
              contexte: [dateFr(t.date_tour) ?? dateFr(t.created_at), str(t.heure_tour)].filter(Boolean).join(' à ') || null,
              meta: t.carnet_edite_at ? 'Carnet de terrain édité' : str(t.statut),
            })),
            resume: null,
          };
        }

        case 'clinique': {
          const rows = await many('propriete_consultations', 'id, subject_label, subject_scientific_name, organ, severity, status, opened_at, created_at');
          rows.sort((a, b) => String(b.opened_at ?? b.created_at).localeCompare(String(a.opened_at ?? a.created_at)));
          return {
            rows: rows.map((c) => ({
              id: c.id,
              titre: str(c.subject_label) || str(c.subject_scientific_name) || 'Consultation',
              contexte: [str(c.organ), str(c.severity)].filter(Boolean).join(' · ') || null,
              meta: [c.status === 'closed' ? 'Close' : 'En cours', dateFr(c.opened_at ?? c.created_at)].filter(Boolean).join(' · '),
            })),
            resume: null,
          };
        }

        case 'capteurs': {
          const rows = await many('iot_capteurs', 'id, nom, emplacement, actif, battery_pct, last_seen_at');
          return {
            rows: rows.map((c) => ({
              id: c.id,
              titre: str(c.nom) || 'Sonde',
              contexte: [str(c.emplacement), c.battery_pct != null ? `batterie ${c.battery_pct} %` : null]
                .filter(Boolean).join(' · ') || null,
              meta: [c.actif ? 'Active' : 'Inactive', c.last_seen_at ? `vue le ${dateFr(c.last_seen_at)}` : 'jamais vue']
                .filter(Boolean).join(' · '),
            })),
            resume: null,
          };
        }

        default:
          return { rows: [], resume: null };
      }
    },
  });

/** Marches rattachées au jardin, pour le détail biodiversité. */
export const useProprieteEvenements = (proprieteId?: string, enabled = false) =>
  useQuery({
    queryKey: ['propriete-evenements-detail', proprieteId],
    enabled: !!proprieteId && enabled,
    queryFn: async () => {
      const { data, error } = await sb
        .from('propriete_marche_events')
        .select('marche_events!inner(id, title, date_marche, lieu, exploration_id)')
        .eq('propriete_id', proprieteId);
      if (error) throw error;
      return (data || [])
        .map((r: any) => r.marche_events)
        .filter(Boolean) as Array<{
          id: string; title: string | null; date_marche: string | null;
          lieu: string | null; exploration_id: string | null;
        }>;
    },
  });
