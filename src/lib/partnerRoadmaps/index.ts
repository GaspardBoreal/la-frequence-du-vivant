import type { PartnerRoadmap } from './types';
import { vdtpRoadmap } from './vdtpRoadmap';

export type {
  PartnerRoadmap,
  RoadmapPriority,
  RoadmapTask,
  RoadmapTheme,
  RoadmapVerbatim,
  RoadmapMilestone,
  WorkStatus,
} from './types';

export const PARTNER_ROADMAPS: PartnerRoadmap[] = [vdtpRoadmap];

export function getPartnerRoadmap(
  slug: string | undefined,
  date: string | undefined,
): PartnerRoadmap | null {
  if (!slug || !date) return null;
  return PARTNER_ROADMAPS.find((r) => r.slug === slug && r.date === date) ?? null;
}

export const STATUS_LABEL: Record<string, string> = {
  todo: 'À faire',
  doing: 'En cours',
  done: 'Livré',
};

/** Total de charge (jours-homme) d'une priorité. */
export function priorityEffort(tasks: { effortDays: number }[]): number {
  return Math.round(tasks.reduce((s, t) => s + t.effortDays, 0) * 10) / 10;
}
