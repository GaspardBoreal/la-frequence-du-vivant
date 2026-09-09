import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export interface ModuleStat {
  /** Nombre principal affiché (relevés, tours, sondes…). */
  count: number;
  /** Ligne de contexte secondaire, déjà rédigée. */
  detail: string | null;
  /** Date de la dernière activité connue pour ce module. */
  lastAt: string | null;
}

export interface ProprieteDashboardData {
  observations: ModuleStat;
  sol: ModuleStat;
  flore: ModuleStat;
  palette: ModuleStat;
  atelier: ModuleStat;
  tours: ModuleStat;
  clinique: ModuleStat;
  capteurs: ModuleStat;
}

const EMPTY: ModuleStat = { count: 0, detail: null, lastAt: null };

const countOf = (o: Record<string, unknown> | null | undefined) =>
  o && typeof o === 'object' ? Object.keys(o).length : 0;

const arrLen = (v: unknown) => (Array.isArray(v) ? v.length : 0);

const latest = (dates: (string | null | undefined)[]) =>
  dates.filter((d): d is string => !!d).sort().slice(-1)[0] ?? null;

/**
 * Synthèse lecture seule des modules d'un jardin, pour la fiche admin.
 * Un module jamais utilisé renvoie un compte à zéro : l'écran affiche alors
 * un état vide plutôt qu'un chiffre trompeur.
 */
export const useProprieteDashboard = (proprieteId?: string) =>
  useQuery<ProprieteDashboardData>({
    queryKey: ['propriete-dashboard', proprieteId],
    enabled: !!proprieteId,
    queryFn: async () => {
      const eq = (t: string, cols: string) =>
        sb.from(t).select(cols).eq('propriete_id', proprieteId);

      const [obs, sol, flore, palette, objets, tours, consults, capteurs] = await Promise.all([
        eq('propriete_observations', 'answers, sensorial, completed_at, updated_at'),
        eq('propriete_soil_diagnostics', 'samples, completed_at, updated_at'),
        eq('propriete_flora_diagnostics', 'observed_plants, icg_score, completed_at, updated_at'),
        eq('propriete_palette', 'zones, excluded, completed_at, updated_at'),
        eq('propriete_objets', 'id, created_at'),
        eq('propriete_tours', 'id, date_tour, statut, carnet_edite_at, created_at'),
        eq('propriete_consultations', 'id, status, opened_at, created_at'),
        eq('iot_capteurs', 'id, actif, last_seen_at'),
      ]);

      const rows = <T,>(r: { data: T[] | null }) => r.data ?? [];

      // Observations : une fiche par jardin, on compte les champs réellement remplis.
      const o = rows<any>(obs)[0];
      const observations: ModuleStat = o
        ? {
            count: countOf(o.answers) + countOf(o.sensorial),
            detail: o.completed_at ? 'Carnet d’observation complété' : 'Carnet en cours',
            lastAt: latest([o.completed_at, o.updated_at]),
          }
        : EMPTY;

      const s = rows<any>(sol)[0];
      const solStat: ModuleStat = s
        ? {
            count: arrLen(s.samples),
            detail: arrLen(s.samples) ? 'prélèvements enregistrés' : 'Registre ouvert, sans prélèvement',
            lastAt: latest([s.completed_at, s.updated_at]),
          }
        : EMPTY;

      const f = rows<any>(flore)[0];
      const floreStat: ModuleStat = f
        ? {
            count: arrLen(f.observed_plants),
            detail: f.icg_score != null ? `Indice de concordance : ${f.icg_score}` : 'plantes bio-indicatrices',
            lastAt: latest([f.completed_at, f.updated_at]),
          }
        : EMPTY;

      const p = rows<any>(palette)[0];
      const paletteStat: ModuleStat = p
        ? {
            count: arrLen(p.zones),
            detail: arrLen(p.excluded) ? `${arrLen(p.excluded)} espèce(s) écartée(s)` : 'zones végétalisées',
            lastAt: latest([p.completed_at, p.updated_at]),
          }
        : EMPTY;

      const objetsRows = rows<any>(objets);
      const atelier: ModuleStat = {
        count: objetsRows.length,
        detail: objetsRows.length ? 'objets et ouvrages dessinés' : null,
        lastAt: latest(objetsRows.map((r) => r.created_at)),
      };

      const toursRows = rows<any>(tours);
      const carnets = toursRows.filter((t) => t.carnet_edite_at).length;
      const toursStat: ModuleStat = {
        count: toursRows.length,
        detail: toursRows.length
          ? `${carnets} carnet(s) de terrain édité(s)`
          : null,
        lastAt: latest(toursRows.map((t) => t.date_tour ?? t.created_at)),
      };

      const consultRows = rows<any>(consults);
      const ouvertes = consultRows.filter((c) => c.status && c.status !== 'closed').length;
      const clinique: ModuleStat = {
        count: consultRows.length,
        detail: consultRows.length ? `${ouvertes} consultation(s) en cours` : null,
        lastAt: latest(consultRows.map((c) => c.opened_at ?? c.created_at)),
      };

      const capteursRows = rows<any>(capteurs);
      const actives = capteursRows.filter((c) => c.actif).length;
      const capteursStat: ModuleStat = {
        count: capteursRows.length,
        detail: capteursRows.length ? `${actives} sonde(s) active(s)` : null,
        lastAt: latest(capteursRows.map((c) => c.last_seen_at)),
      };

      return {
        observations,
        sol: solStat,
        flore: floreStat,
        palette: paletteStat,
        atelier,
        tours: toursStat,
        clinique,
        capteurs: capteursStat,
      };
    },
  });
