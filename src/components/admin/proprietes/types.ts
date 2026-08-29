export interface ProprieteListRow {
  id: string;
  nom: string;
  slug: string | null;
  is_active: boolean;
  ville: string | null;
  code_postal: string | null;
  departement: string | null;
  region: string | null;
  surface_hectares: number | null;
  latitude: number | null;
  longitude: number | null;
  owner_company_id: string | null;
  main_walker_id: string | null;
  photo_hero_url: string | null;
  created_at: string;
}

export interface ProprietesKpiCounts {
  total: number;
  actives: number;
  archivees: number;
  geolocalisees: number;
  avecSondes: number;
}

export type ProprietesKpiKey = 'actives' | 'archivees' | 'geo' | 'sondes';

export type ProprietesPeriode =
  | 'all'
  | 'aujourdhui'
  | 'hier'
  | '7j'
  | 'mois'
  | 'trimestre'
  | 'annee'
  | 'plage';

export interface ProprietesFilterValues {
  q: string;
  statut: 'all' | 'actives' | 'archivees';
  region: string;
  dept: string;
  entreprise: string;
  gps: 'all' | 'avec' | 'sans';
  sondes: 'all' | 'avec';
  periode: ProprietesPeriode;
  du: string;
  au: string;
}

export const DEFAULT_FILTERS: ProprietesFilterValues = {
  q: '',
  statut: 'all',
  region: 'all',
  dept: 'all',
  entreprise: 'all',
  gps: 'all',
  sondes: 'all',
  periode: 'all',
  du: '',
  au: '',
};

/**
 * Période de création en heure de Paris (mémo « local time first ») :
 * retourne { from, to } ISO inclusifs, ou null pour « tout » / plage incomplète.
 */
export const resolvePeriodeRange = (
  periode: ProprietesPeriode,
  du: string,
  au: string,
): { from: string; to: string } | null => {
  if (periode === 'all') return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = +(parts.find((p) => p.type === 'year')?.value ?? 0);
  const m = +(parts.find((p) => p.type === 'month')?.value ?? 0);
  const d = +(parts.find((p) => p.type === 'day')?.value ?? 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = (yy: number, mm: number, dd: number) => `${yy}-${pad(mm)}-${pad(dd)}`;
  const today = day(y, m, d);
  const shift = (base: Date, days: number) => {
    const b = new Date(base);
    b.setDate(b.getDate() + days);
    return day(b.getFullYear(), b.getMonth() + 1, b.getDate());
  };
  const noon = new Date(Date.UTC(y, m - 1, d, 12)); // évite les bords DST
  let fromDay: string | null = null;
  let toDay: string = today;
  switch (periode) {
    case 'aujourdhui': fromDay = today; break;
    case 'hier': fromDay = shift(noon, -1); toDay = fromDay; break;
    case '7j': fromDay = shift(noon, -6); break;
    case 'mois': fromDay = day(y, m, 1); break;
    case 'trimestre': fromDay = day(y, Math.floor((m - 1) / 3) * 3 + 1, 1); break;
    case 'annee': fromDay = day(y, 1, 1); break;
    case 'plage': {
      if (!du && !au) return null;
      fromDay = du || '1970-01-01';
      toDay = au || today;
      break;
    }
  }
  if (!fromDay) return null;
  // bornes en heure de Paris converties en ISO UTC (inclusives)
  const from = new Date(`${fromDay}T00:00:00+02:00`);
  const to = new Date(`${toDay}T23:59:59.999+02:00`);
  const parisOffset = (dt: Date) => {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
      .formatToParts(dt).find((x) => x.type === 'timeZoneName')?.value ?? 'GMT+2';
    const mm = p.match(/GMT([+-])(\d+)/);
    return mm ? (mm[1] === '+' ? 1 : -1) * +mm[2] : 2;
  };
  const toIso = (dayStr: string, endOfDay: boolean) => {
    const probe = new Date(`${dayStr}T12:00:00Z`);
    const off = parisOffset(probe);
    const local = new Date(`${dayStr}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
    return new Date(local.getTime() - off * 3600_000).toISOString();
  };
  void from; void to;
  return { from: toIso(fromDay, false), to: toIso(toDay, true) };
};

export const formatSurface = (ha: number | null | undefined): string => {
  if (ha == null) return '—';
  if (ha >= 1) return `${ha.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ha`;
  return `${Math.round(ha * 10000).toLocaleString('fr-FR')} m²`;
};
