// Persona definitions for the "Usages" community dashboard.
// Keep labels short, keep colors HSL-compatible with tokens if possible.

export type PersonaKey =
  | 'sentinelles_actives'
  | 'ambassadeurs_latents'
  | 'nouvelles_graines'
  | 'contributeurs_passifs'
  | 'explorateurs_numeriques'
  | 'endormis'
  | 'observateurs';

export interface PersonaMeta {
  key: PersonaKey;
  label: string;
  tagline: string;
  description: string;
  color: string; // hex/hsl for charts
  emoji: string;
  action: string; // recommandation marketing/animation
}

export const PERSONAS: Record<PersonaKey, PersonaMeta> = {
  sentinelles_actives: {
    key: 'sentinelles_actives',
    label: 'Sentinelles actives',
    tagline: 'Le cœur battant',
    description: 'Connexions récentes, contributions régulières, usage varié des outils. Ambassadeurs naturels.',
    color: '#0D9488',
    emoji: '🌟',
    action: 'Impliquer dans la co-création : témoignages, mentorat, comité éditorial.',
  },
  ambassadeurs_latents: {
    key: 'ambassadeurs_latents',
    label: 'Ambassadeurs latents',
    tagline: 'À réveiller',
    description: 'Ont marché et contribué mais leur activité récente ralentit. Fort potentiel de relance.',
    color: '#F59E0B',
    emoji: '🔥',
    action: 'Campagne « une nouvelle marche pour vous » + reconnaissance publique.',
  },
  nouvelles_graines: {
    key: 'nouvelles_graines',
    label: 'Nouvelles graines',
    tagline: 'À accueillir',
    description: 'Inscrit·e·s récemment, exploration en cours, pas encore de participation validée.',
    color: '#22C55E',
    emoji: '🌱',
    action: 'Onboarding personnalisé + première marche facile + parrainage par une sentinelle.',
  },
  contributeurs_passifs: {
    key: 'contributeurs_passifs',
    label: 'Marcheurs silencieux',
    tagline: 'Consomment mais ne créent pas',
    description: 'Participent aux marches sans déposer photos, sons ou textes.',
    color: '#8B5CF6',
    emoji: '👣',
    action: 'Débloquer la création : tutoriels 30s, badge « première photo », invitation ciblée.',
  },
  explorateurs_numeriques: {
    key: 'explorateurs_numeriques',
    label: 'Explorateurs numériques',
    tagline: 'App +, terrain −',
    description: 'Usage app élevé mais aucune participation validée. Curiosité en attente d\'une marche.',
    color: '#0EA5E9',
    emoji: '💡',
    action: 'Push géolocalisé sur prochaines marches proches + prévisualisation immersive.',
  },
  endormis: {
    key: 'endormis',
    label: 'Endormis',
    tagline: '60 j sans signal',
    description: 'Aucune activité récente. Cible réactivation prioritaire.',
    color: '#6B7280',
    emoji: '💤',
    action: 'Séquence de ré-engagement 3 emails : nouveautés, invitation, ultime relance.',
  },
  observateurs: {
    key: 'observateurs',
    label: 'Observateurs',
    tagline: 'Présence discrète',
    description: 'Activité modérée sans profil marqué. Segment intermédiaire.',
    color: '#94A3B8',
    emoji: '👁️',
    action: 'Nurturing éditorial : newsletter thématique + invitations douces.',
  },
};

export const PERSONA_ORDER: PersonaKey[] = [
  'sentinelles_actives',
  'ambassadeurs_latents',
  'nouvelles_graines',
  'contributeurs_passifs',
  'explorateurs_numeriques',
  'observateurs',
  'endormis',
];

export const getPersona = (key: string): PersonaMeta =>
  PERSONAS[key as PersonaKey] ?? PERSONAS.observateurs;
