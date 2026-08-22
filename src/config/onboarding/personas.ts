/**
 * Personae Fréquence Jardin.
 * Aucune question n'est posée : la persona se déduit des trois premières réponses
 * (profil, lieu, surface) et se recalcule à chaque modification.
 */

export type Persona =
  | 'URBAIN_BALCON'
  | 'PARTICULIER_PETIT'
  | 'PARTICULIER_GRAND'
  | 'ENTREPRISE_URBAINE'
  | 'ENTREPRISE_TERRAIN'
  | 'COLLECTIVITE';

export const PERSONAS: Persona[] = [
  'URBAIN_BALCON',
  'PARTICULIER_PETIT',
  'PARTICULIER_GRAND',
  'ENTREPRISE_URBAINE',
  'ENTREPRISE_TERRAIN',
  'COLLECTIVITE',
];

export const PERSONA_LABELS: Record<Persona, string> = {
  URBAIN_BALCON: 'Jardin de ville, en balcon',
  PARTICULIER_PETIT: 'Jardin de particulier, moins de 5 000 m²',
  PARTICULIER_GRAND: 'Grand jardin de particulier, plus de 5 000 m²',
  ENTREPRISE_URBAINE: 'Entreprise urbaine, terrasses et bacs',
  ENTREPRISE_TERRAIN: 'Entreprise avec terrain disponible',
  COLLECTIVITE: 'Collectivité, espace ouvert au public',
};

/** Formulation courte réutilisée dans le bilan et par l'IA de Jardin. */
export const PERSONA_VOICE: Record<Persona, { lieu: string; possessif: string; collectif: boolean }> = {
  URBAIN_BALCON: { lieu: 'votre balcon', possessif: 'votre', collectif: false },
  PARTICULIER_PETIT: { lieu: 'votre jardin', possessif: 'votre', collectif: false },
  PARTICULIER_GRAND: { lieu: 'votre terrain', possessif: 'votre', collectif: false },
  ENTREPRISE_URBAINE: { lieu: 'votre site', possessif: 'votre', collectif: true },
  ENTREPRISE_TERRAIN: { lieu: 'votre site', possessif: 'votre', collectif: true },
  COLLECTIVITE: { lieu: 'votre espace public', possessif: 'votre', collectif: true },
};

/**
 * Chaîne de repli : si une persona n'a pas de contenu propre pour une question,
 * on reprend celui de la persona la plus proche, puis le contenu par défaut.
 */
export const PERSONA_FALLBACK: Record<Persona, Persona[]> = {
  URBAIN_BALCON: [],
  PARTICULIER_PETIT: [],
  PARTICULIER_GRAND: ['PARTICULIER_PETIT'],
  ENTREPRISE_URBAINE: ['URBAIN_BALCON'],
  ENTREPRISE_TERRAIN: ['PARTICULIER_GRAND', 'PARTICULIER_PETIT'],
  COLLECTIVITE: ['ENTREPRISE_TERRAIN', 'PARTICULIER_GRAND', 'PARTICULIER_PETIT'],
};

export const SEUIL_GRAND_TERRAIN = 5000;

interface PersonaInput {
  profil?: unknown;
  lieu?: unknown;
  surface_totale?: unknown;
}

/** Déduction de la persona à partir des réponses déjà données. */
export const detectPersona = (answers: PersonaInput): Persona => {
  const profil = typeof answers.profil === 'string' ? answers.profil : 'particulier';
  const lieu = typeof answers.lieu === 'string' ? answers.lieu : '';
  const surface = typeof answers.surface_totale === 'number' ? answers.surface_totale : 0;
  const balcon = lieu === 'balcon';

  if (profil === 'collectivite') return 'COLLECTIVITE';
  if (profil === 'entreprise') return balcon ? 'ENTREPRISE_URBAINE' : 'ENTREPRISE_TERRAIN';
  if (balcon) return 'URBAIN_BALCON';
  return surface >= SEUIL_GRAND_TERRAIN ? 'PARTICULIER_GRAND' : 'PARTICULIER_PETIT';
};

export const isEntreprise = (p: Persona) =>
  p === 'ENTREPRISE_URBAINE' || p === 'ENTREPRISE_TERRAIN' || p === 'COLLECTIVITE';

export const isBalconPersona = (p: Persona) => p === 'URBAIN_BALCON' || p === 'ENTREPRISE_URBAINE';
