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

export interface ProprietesFilterValues {
  q: string;
  statut: 'all' | 'actives' | 'archivees';
  region: string;
  dept: string;
  entreprise: string;
  gps: 'all' | 'avec' | 'sans';
  sondes: 'all' | 'avec';
}

export const DEFAULT_FILTERS: ProprietesFilterValues = {
  q: '',
  statut: 'all',
  region: 'all',
  dept: 'all',
  entreprise: 'all',
  gps: 'all',
  sondes: 'all',
};

export const formatSurface = (ha: number | null | undefined): string => {
  if (ha == null) return '—';
  if (ha >= 1) return `${ha.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ha`;
  return `${Math.round(ha * 10000).toLocaleString('fr-FR')} m²`;
};
