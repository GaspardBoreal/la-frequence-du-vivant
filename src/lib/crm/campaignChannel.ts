import type {
  CampaignCanal,
  CampaignEmailTemplate,
  CrmCampaign,
  CrmCampaignMember,
} from '@/types/crmCampaign';

/* ------------------------------------------------------------------ */
/* Canal                                                               */
/* ------------------------------------------------------------------ */

export interface CanalMeta {
  value: CampaignCanal;
  label: string;
  /** Verbe d'action, pour les boutons. */
  verbe: string;
  /** Nom de l'espace de travail. */
  atelier: string;
  hue: string;
  description: string;
}

export const CANAL_META: Record<CampaignCanal, CanalMeta> = {
  telephone: {
    value: 'telephone',
    label: 'Téléphone',
    verbe: 'Appeler',
    atelier: "Salle d'appels",
    hue: '210 90% 56%',
    description: 'On décroche, on parle, on note l’issue en un clic.',
  },
  email: {
    value: 'email',
    label: 'Email',
    verbe: 'Écrire',
    atelier: "Table d'envoi",
    hue: '270 65% 60%',
    description: 'On écrit à la chaîne depuis un modèle, on suit les réponses.',
  },
  mixte: {
    value: 'mixte',
    label: 'Mixte',
    verbe: 'Traiter',
    atelier: 'Piste unifiée',
    hue: '160 60% 45%',
    description: 'Chaque prospect affiche sa prochaine action : écrire ou appeler.',
  },
};

export const CANAL_OPTIONS: CanalMeta[] = [
  CANAL_META.telephone,
  CANAL_META.email,
  CANAL_META.mixte,
];

export const canalOf = (c?: Pick<CrmCampaign, 'canal'> | null): CampaignCanal => {
  const v = (c?.canal ?? 'telephone') as CampaignCanal;
  return v === 'email' || v === 'mixte' ? v : 'telephone';
};

export const usesPhone = (c?: Pick<CrmCampaign, 'canal'> | null) => canalOf(c) !== 'email';
export const usesEmail = (c?: Pick<CrmCampaign, 'canal'> | null) => canalOf(c) !== 'telephone';

/* ------------------------------------------------------------------ */
/* Statut d'engagement consolidé (calculé, jamais stocké)              */
/* ------------------------------------------------------------------ */

export type EngagementStatus = 'a_traiter' | 'en_cours' | 'joint' | 'refus' | 'gagne';

export const ENGAGEMENT_META: Record<
  EngagementStatus,
  { label: string; hue: string }
> = {
  a_traiter: { label: 'À traiter', hue: '210 90% 56%' },
  en_cours: { label: 'En cours', hue: '38 92% 55%' },
  joint: { label: 'Joint', hue: '190 70% 45%' },
  refus: { label: 'Refus', hue: '0 75% 58%' },
  gagne: { label: 'Intérêt', hue: '150 65% 45%' },
};

export function engagementOf(m: CrmCampaignMember): EngagementStatus {
  /* Un refus prime toujours : une réponse par email peut être négative. */
  if (m.call_status === 'refus' || m.email_status === 'desabonne') return 'refus';
  if (m.call_status === 'interesse' || m.email_status === 'repondu') return 'gagne';
  if (m.call_status === 'joint') return 'joint';
  if (
    (m.attempts ?? 0) > 0 ||
    (m.emails_sent ?? 0) > 0 ||
    m.call_status === 'a_rappeler' ||
    m.call_status === 'injoignable' ||
    ['envoye', 'ouvert', 'bounce'].includes(m.email_status as string)
  ) {
    return 'en_cours';
  }
  return 'a_traiter';
}

/** Par quel canal le contact a-t-il réellement abouti ? */
export function canalAbouti(m: CrmCampaignMember): CampaignCanal | null {
  if (m.call_status === 'refus') return null;
  if (m.call_status === 'interesse') return 'telephone';
  if (m.email_status === 'repondu') return 'email';
  return null;
}

/* ------------------------------------------------------------------ */
/* Prochaine action                                                    */
/* ------------------------------------------------------------------ */

export interface NextAction {
  canal: 'telephone' | 'email';
  label: string;
  /** Échéance si planifiée. */
  at: string | null;
  /** true si l'échéance est passée ou absente : à faire maintenant. */
  due: boolean;
}

/**
 * La cadence mixte : email d'accroche → relance téléphone → email de clôture.
 * On ne propose jamais une action sur un prospect clos (refus / intérêt).
 */
export function nextActionOf(
  m: CrmCampaignMember,
  canal: CampaignCanal,
): NextAction | null {
  const eng = engagementOf(m);
  if (eng === 'refus' || eng === 'gagne') return null;

  const explicit = m.next_action_canal;
  const at = m.next_action_at ?? (explicit === 'email' ? m.last_email_at : m.next_call_at) ?? null;
  const due = !at || new Date(at).getTime() <= Date.now();

  if (canal === 'telephone') {
    return {
      canal: 'telephone',
      label: (m.attempts ?? 0) > 0 ? 'Rappeler' : 'Appeler',
      at: m.next_call_at ?? m.next_action_at ?? null,
      due: !m.next_call_at || new Date(m.next_call_at).getTime() <= Date.now(),
    };
  }

  if (canal === 'email') {
    return {
      canal: 'email',
      label: (m.emails_sent ?? 0) > 0 ? 'Relancer par email' : 'Écrire',
      at: m.next_action_at ?? null,
      due,
    };
  }

  // Mixte : cadence
  if (explicit === 'telephone' || explicit === 'email') {
    return {
      canal: explicit,
      label: explicit === 'email' ? 'Écrire' : 'Appeler',
      at,
      due,
    };
  }
  if ((m.emails_sent ?? 0) === 0) {
    return { canal: 'email', label: 'Email d’accroche', at: null, due: true };
  }
  if ((m.attempts ?? 0) === 0) {
    return { canal: 'telephone', label: 'Relance téléphone', at: m.next_call_at, due };
  }
  return { canal: 'email', label: 'Email de clôture', at, due };
}

/** File de travail triée : ce qui est dû d'abord, puis par priorité. */
export function workQueue(
  members: CrmCampaignMember[],
  canal: CampaignCanal,
): Array<CrmCampaignMember & { __next: NextAction }> {
  return members
    .map((m) => ({ m, next: nextActionOf(m, canal) }))
    .filter((x): x is { m: CrmCampaignMember; next: NextAction } => !!x.next)
    .sort((a, b) => {
      if (a.next.due !== b.next.due) return a.next.due ? -1 : 1;
      const pa = a.m.priorite ?? 0;
      const pb = b.m.priorite ?? 0;
      if (pa !== pb) return pb - pa;
      const ta = a.next.at ? new Date(a.next.at).getTime() : 0;
      const tb = b.next.at ? new Date(b.next.at).getTime() : 0;
      return ta - tb;
    })
    .map(({ m, next }) => Object.assign({}, m, { __next: next }));
}

/* ------------------------------------------------------------------ */
/* Modèles d'email                                                     */
/* ------------------------------------------------------------------ */

export const DEFAULT_EMAIL_TEMPLATE: CampaignEmailTemplate = {
  id: 'accroche',
  nom: 'Accroche',
  objet: 'Le vivant de {{société}}, cartographié avec vos équipes',
  corps:
    'Bonjour {{contact}},\n\n' +
    'Nous cartographions le vivant des territoires avec les habitants et les entreprises.\n\n' +
    'Seriez-vous disponible 20 minutes pour en parler ?\n\n' +
    'Bien à vous,\n{{pilote}}',
};

export function templatesOf(campaign: CrmCampaign): CampaignEmailTemplate[] {
  const list = campaign.script?.email_templates;
  return Array.isArray(list) && list.length > 0 ? list : [DEFAULT_EMAIL_TEMPLATE];
}

export function renderTemplate(
  text: string,
  vars: { societe?: string | null; contact?: string | null; pilote?: string | null },
): string {
  return text
    .replace(/\{\{\s*(société|societe)\s*\}\}/gi, vars.societe ?? 'votre organisation')
    .replace(/\{\{\s*contact\s*\}\}/gi, vars.contact ?? 'Madame, Monsieur')
    .replace(/\{\{\s*pilote\s*\}\}/gi, vars.pilote ?? '');
}

/* ------------------------------------------------------------------ */
/* Statistiques par canal                                              */
/* ------------------------------------------------------------------ */

export interface EmailStats {
  envoyes: number;
  ouverts: number;
  repondus: number;
  bounces: number;
  a_ecrire: number;
  taux_reponse: number;
}

export function emailStatsOf(members: CrmCampaignMember[]): EmailStats {
  const envoyes = members.filter((m) => (m.emails_sent ?? 0) > 0).length;
  const ouverts = members.filter((m) =>
    ['ouvert', 'repondu'].includes(m.email_status as string),
  ).length;
  /* Une réponse est une réponse, quel que soit le canal qui l'a portée :
     réponse écrite, intérêt déclaré au téléphone ou refus explicite. */
  const repondus = members.filter(
    (m) =>
      m.email_status === 'repondu' ||
      m.call_status === 'interesse' ||
      m.call_status === 'refus',
  ).length;
  const bounces = members.filter((m) => m.email_status === 'bounce').length;
  const a_ecrire = members.filter(
    (m) => (m.emails_sent ?? 0) === 0 && engagementOf(m) === 'a_traiter',
  ).length;
  return {
    envoyes,
    ouverts,
    repondus,
    bounces,
    a_ecrire,
    taux_reponse: envoyes ? (repondus / envoyes) * 100 : 0,
  };
}

/** Répartition du premier canal ayant déclenché la réponse. */
export function canalDeclencheur(members: CrmCampaignMember[]): { telephone: number; email: number } {
  let telephone = 0;
  let email = 0;
  members.forEach((m) => {
    const c = canalAbouti(m);
    if (c === 'telephone') telephone += 1;
    if (c === 'email') email += 1;
  });
  return { telephone, email };
}

/* ------------------------------------------------------------------ */
/* Taux de détection d'intérêt — insensible au canal                   */
/* ------------------------------------------------------------------ */

export interface InterestRate {
  /** Prospects réellement touchés (joints au tél ∪ destinataires d'un email tracé). */
  touches: number;
  /** Prospects aboutis (intéressé au tél ∪ réponse email). */
  succes: number;
  taux: number;
}

/**
 * Un seul indicateur roi pour toutes les campagnes : un canal sans aucun
 * contact tracé n'entre jamais au dénominateur, donc il ne peut pas écraser
 * le résultat obtenu sur l'autre canal.
 * Si `members` est fourni, le calcul dédoublonne par prospect.
 */
export function interestRateOf(
  counts: { joints?: number | null; interesses?: number | null; emails_envoyes?: number | null; reponses?: number | null } | null | undefined,
  members?: CrmCampaignMember[],
): InterestRate {
  if (members && members.length > 0) {
    const touches = members.filter(
      (m) =>
        (m.emails_sent ?? 0) > 0 ||
        ['joint', 'interesse', 'refus'].includes(m.call_status as string),
    ).length;
    const succes = members.filter((m) => engagementOf(m) === 'gagne').length;
    return { touches, succes, taux: touches ? (succes / touches) * 100 : 0 };
  }
  const joints = counts?.joints ?? 0;
  const emails = counts?.emails_envoyes ?? 0;
  const touches = Math.max(joints, emails);
  const succes = (counts?.interesses ?? 0) + (counts?.reponses ?? 0);
  return { touches, succes, taux: touches ? (succes / touches) * 100 : 0 };
}
