/** Modèle de données d'une feuille de route issue d'un entretien partenaire. */

export type WorkStatus = 'todo' | 'doing' | 'done';

export interface RoadmapVerbatim {
  /** Horodatage dans l'entretien, ex. « 12:02 » */
  at: string;
  speaker: string;
  quote: string;
  /** Thème de rattachement (id) */
  themeId: string;
}

export interface RoadmapTheme {
  id: string;
  label: string;
  /** Famille pour le graphe de répartition */
  family: 'Fiabilité' | 'Lisibilité' | 'Science' | 'Données' | 'Produit' | 'Rayonnement';
  summary: string;
}

export interface RoadmapTask {
  title: string;
  detail: string;
  /** Ce que ça produit concrètement */
  output: string;
  /** Charge estimée en jours-homme */
  effortDays: number;
  status: WorkStatus;
  themeId?: string;
}

export interface RoadmapPriority {
  /** P0, P1, ... */
  code: string;
  title: string;
  window: string;
  /** Pourquoi ce rang */
  rationale: string;
  tasks: RoadmapTask[];
  /** Position sur la frise, en % de la durée totale */
  startPct: number;
  widthPct: number;
}

export interface RoadmapMilestone {
  date: string;
  label: string;
  detail: string;
}

export interface PartnerRoadmap {
  slug: string;
  /** Date de la revue, format YYYY-MM-DD, utilisée dans l'URL */
  date: string;
  partnerName: string;
  partnerContact: string;
  /** Mots-clés de rattachement à une opportunité CRM (titre, entreprise, sociétés liées) */
  matchers?: string[];
  partnerSite?: string;
  subtitle: string;
  interviewLabel: string;
  intro: string;
  context: string;
  themes: RoadmapTheme[];
  verbatims: RoadmapVerbatim[];
  priorities: RoadmapPriority[];
  milestones: RoadmapMilestone[];
  /** Courbe d'exemple sol / air pour illustrer la restitution capteurs */
  sensorSample: { day: string; air: number; sol10: number; sol30: number; sol60: number }[];
  closing: string;
}
