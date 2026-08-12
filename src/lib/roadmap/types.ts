/** Modèle de la Roadmap vivante : journal hebdomadaire public du projet. */

export type RoadmapAudience = 'marcheur' | 'proprietaire' | 'partenaire';
export type RoadmapNetwork = 'linkedin' | 'instagram' | 'pinterest';
export type RoadmapWeekStatus = 'draft' | 'published';

export interface RoadmapWeek {
  id: string;
  iso_year: number;
  iso_week: number;
  starts_on: string;
  ends_on: string;
  title: string;
  narrative: string | null;
  cover_url: string | null;
  status: RoadmapWeekStatus;
  published_at: string | null;
}

export interface RoadmapMedia {
  id: string;
  storage_path: string;
  public_url: string;
  caption: string | null;
  kind: 'capture' | 'schema' | 'visuel' | string;
  source_route: string | null;
}

export interface RoadmapEntry {
  id: string;
  week_id: string;
  title: string;
  promise: string | null;
  body: string | null;
  domain: string | null;
  audiences: RoadmapAudience[];
  pitch_marcheur: string | null;
  pitch_proprietaire: string | null;
  pitch_partenaire: string | null;
  position: number;
  medias?: RoadmapMedia[];
}

export interface RoadmapSocialPost {
  id: string;
  week_id: string;
  audience: RoadmapAudience;
  network: RoadmapNetwork;
  body: string;
  hashtags: string[];
  visual_media_id: string | null;
  scheduled_for: string | null;
  status: string;
}

export const AUDIENCES: {
  key: RoadmapAudience;
  slug: string;
  label: string;
  short: string;
  baseline: string;
}[] = [
  {
    key: 'marcheur',
    slug: 'marcheurs',
    label: 'Marcheurs',
    short: 'Collecter, reconnaître, apprendre',
    baseline:
      "Ce que la communauté peut désormais observer, nommer et transmettre sur le terrain.",
  },
  {
    key: 'proprietaire',
    slug: 'proprietaires',
    label: 'Propriétaires de sites',
    short: 'Connaître, gérer, prévoir',
    baseline:
      "Ce que les jardins, vignobles et domaines peuvent désormais mesurer, soigner et projeter.",
  },
  {
    key: 'partenaire',
    slug: 'partenaires',
    label: 'Partenaires',
    short: 'La dynamique, semaine après semaine',
    baseline:
      "La cadence de production, les preuves en images et les jalons franchis.",
  },
];

export const NETWORK_LABEL: Record<RoadmapNetwork, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  pinterest: 'Pinterest',
};

export const audienceBySlug = (slug?: string) =>
  AUDIENCES.find((a) => a.slug === slug) ?? null;

export const audienceLabel = (key: RoadmapAudience) =>
  AUDIENCES.find((a) => a.key === key)?.label ?? key;

export const pitchFor = (entry: RoadmapEntry, audience: RoadmapAudience | null) => {
  if (!audience) return entry.promise ?? '';
  const map: Record<RoadmapAudience, string | null> = {
    marcheur: entry.pitch_marcheur,
    proprietaire: entry.pitch_proprietaire,
    partenaire: entry.pitch_partenaire,
  };
  return map[audience] || entry.promise || '';
};

/** Numéro de semaine ISO 8601 et bornes lundi → dimanche. */
export function isoWeekInfo(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  const monday = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() || 7) - 1));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);

  return {
    isoYear: date.getUTCFullYear(),
    isoWeek: week,
    startsOn: monday.toISOString().slice(0, 10),
    endsOn: sunday.toISOString().slice(0, 10),
  };
}

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

export function weekRangeLabel(week: Pick<RoadmapWeek, 'starts_on' | 'ends_on'>) {
  try {
    return `${FR_DATE.format(new Date(week.starts_on))} → ${FR_DATE.format(new Date(week.ends_on))}`;
  } catch {
    return '';
  }
}
