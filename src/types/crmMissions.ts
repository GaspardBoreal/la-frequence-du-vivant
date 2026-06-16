export type CrmMissionStatus = 'a_faire' | 'en_cours' | 'realisee' | 'archivee';
export type CrmMissionPriority = 'basse' | 'normale' | 'haute' | 'critique';
export type CrmMissionAssigneeRole = 'owner' | 'collab' | 'watcher';

export interface CrmMission {
  id: string;
  titre: string;
  description_rich: any | null;
  statut: CrmMissionStatus;
  priorite: CrmMissionPriority;
  due_at: string | null;
  start_at: string | null;
  completed_at: string | null;
  estimated_minutes: number | null;
  opportunity_id: string | null;
  company_id: string | null;
  contact_id: string | null;
  marche_event_id: string | null;
  tags: string[];
  color: string | null;
  ai_score: number | null;
  ai_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignees?: CrmMissionAssignee[];
}

export interface CrmMissionAssignee {
  id: string;
  mission_id: string;
  user_id: string;
  role: CrmMissionAssigneeRole;
  notified_at: string | null;
  created_at: string;
}

export interface CrmMissionComment {
  id: string;
  mission_id: string;
  author_id: string | null;
  body_rich: any;
  created_at: string;
  edited_at: string | null;
}

export interface CrmMissionActivity {
  id: string;
  mission_id: string;
  actor_id: string | null;
  type: string;
  payload: any;
  created_at: string;
}

export const MISSION_STATUS_META: Record<CrmMissionStatus, { label: string; hue: string; emoji: string }> = {
  a_faire:  { label: 'À faire',   hue: '210 80% 56%', emoji: '🎯' },
  en_cours: { label: 'En cours',  hue: '38 92% 50%',  emoji: '🌀' },
  realisee: { label: 'Réalisée',  hue: '160 70% 42%', emoji: '✨' },
  archivee: { label: 'Archivée',  hue: '220 10% 50%', emoji: '🗂️' },
};

export const MISSION_PRIORITY_META: Record<CrmMissionPriority, { label: string; hue: string }> = {
  basse:    { label: 'Basse',    hue: '160 50% 50%' },
  normale:  { label: 'Normale',  hue: '210 70% 56%' },
  haute:    { label: 'Haute',    hue: '32 90% 55%' },
  critique: { label: 'Critique', hue: '0 80% 60%' },
};

export const MISSION_STATUSES: CrmMissionStatus[] = ['a_faire', 'en_cours', 'realisee'];
