import { Leaf, Bird, Database, Sprout, Binoculars, Link as LinkIcon, type LucideIcon } from 'lucide-react';

export type ScienceNetwork =
  | 'inaturalist'
  | 'ebird'
  | 'gbif'
  | 'plantnet'
  | 'faune_france'
  | 'other';

export interface ScienceAccount {
  id: string;
  profile_id: string;
  network: ScienceNetwork;
  username: string;
  display_name: string | null;
  profile_url: string | null;
  external_id: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface NetworkMeta {
  key: ScienceNetwork;
  label: string;
  short: string;
  initials: string;
  icon: LucideIcon;
  /** Tailwind classes (HSL semantic tokens où dispo, sinon couleurs encodées) */
  badgeBg: string;
  badgeRing: string;
  badgeText: string;
  dotBg: string;
  urlTemplate: (username: string) => string;
}

export const NETWORK_META: Record<ScienceNetwork, NetworkMeta> = {
  inaturalist: {
    key: 'inaturalist',
    label: 'iNaturalist',
    short: 'iNat',
    initials: 'iN',
    icon: Leaf,
    badgeBg: 'bg-emerald-500/15',
    badgeRing: 'ring-emerald-500/40',
    badgeText: 'text-emerald-600 dark:text-emerald-300',
    dotBg: 'bg-emerald-500',
    urlTemplate: (u) => `https://www.inaturalist.org/people/${encodeURIComponent(u)}`,
  },
  ebird: {
    key: 'ebird',
    label: 'eBird',
    short: 'eBird',
    initials: 'eB',
    icon: Bird,
    badgeBg: 'bg-sky-500/15',
    badgeRing: 'ring-sky-500/40',
    badgeText: 'text-sky-600 dark:text-sky-300',
    dotBg: 'bg-sky-500',
    urlTemplate: (u) => `https://ebird.org/profile/${encodeURIComponent(u)}`,
  },
  gbif: {
    key: 'gbif',
    label: 'GBIF',
    short: 'GBIF',
    initials: 'G',
    icon: Database,
    badgeBg: 'bg-violet-500/15',
    badgeRing: 'ring-violet-500/40',
    badgeText: 'text-violet-600 dark:text-violet-300',
    dotBg: 'bg-violet-500',
    urlTemplate: (u) => `https://www.gbif.org/user/${encodeURIComponent(u)}`,
  },
  plantnet: {
    key: 'plantnet',
    label: 'Pl@ntNet',
    short: 'Pl@ntNet',
    initials: 'P@',
    icon: Sprout,
    badgeBg: 'bg-lime-500/15',
    badgeRing: 'ring-lime-500/40',
    badgeText: 'text-lime-700 dark:text-lime-300',
    dotBg: 'bg-lime-500',
    urlTemplate: (u) => `https://identify.plantnet.org/users/${encodeURIComponent(u)}`,
  },
  faune_france: {
    key: 'faune_france',
    label: 'Faune-France',
    short: 'Faune-FR',
    initials: 'FF',
    icon: Binoculars,
    badgeBg: 'bg-amber-500/15',
    badgeRing: 'ring-amber-500/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    dotBg: 'bg-amber-500',
    urlTemplate: (u) => `https://www.faune-france.org/index.php?m_id=1&user=${encodeURIComponent(u)}`,
  },
  other: {
    key: 'other',
    label: 'Autre réseau',
    short: 'Autre',
    initials: '•',
    icon: LinkIcon,
    badgeBg: 'bg-slate-500/15',
    badgeRing: 'ring-slate-500/40',
    badgeText: 'text-slate-600 dark:text-slate-300',
    dotBg: 'bg-slate-500',
    urlTemplate: (u) => u, // si "Autre", on attend une URL en clair
  },
};

export const NETWORK_ORDER: ScienceNetwork[] = [
  'inaturalist', 'ebird', 'gbif', 'plantnet', 'faune_france', 'other',
];

export const buildProfileUrl = (network: ScienceNetwork, username: string, override?: string | null) => {
  if (override && override.trim()) return override.trim();
  if (!username) return null;
  return NETWORK_META[network].urlTemplate(username.trim());
};
