/**
 * Lecture stratégique des réponses du parcours d'accueil :
 * personae, boucles d'emails, notifications, indice de réussite.
 * Règles déterministes et affichables : aucune boîte noire.
 */

import {
  optionLabel,
  readBudget,
  readSurface,
  readTempsSemaine,
  type GardenAnswers,
} from './onboardingStats';

// ---------------------------------------------------------------------------
// Ambition et moyens (0 → 100)
// ---------------------------------------------------------------------------

const PRIORITE_AMBITION: Record<string, number> = {
  autonomie: 100,
  agroecologie: 100,
  production_familiale: 80,
  terroir: 70,
  biodiversite: 60,
  legumes_famille: 55,
  fruits_peu_temps: 35,
  beau_jardin: 40,
  climatiser: 30,
  resoudre_probleme: 45,
};

const OBJECTIF_AMBITION: Record<string, number> = {
  premiere_recolte: 45,
  preparer_sol: 40,
  structurer: 70,
  planter_perenne: 75,
  faire_revenir_vivant: 65,
  comprendre: 25,
};

const EXPERIENCE_SCORE: Record<string, number> = {
  debutant: 15,
  tatonne: 40,
  a_laise: 75,
  chevronne: 95,
};

const IRRIGATION_SCORE: Record<string, number> = {
  reseau: 100,
  pompe: 95,
  puits: 60,
  arrosoir: 45,
  inconnu: 35,
  aucune: 10,
};

const EXPOSITION_SCORE: Record<string, number> = {
  plein_soleil: 100,
  mi_ombre: 70,
  ombre: 35,
  inconnu: 50,
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const str = (g: GardenAnswers, k: string) => (typeof g.answers[k] === 'string' ? (g.answers[k] as string) : null);
const list = (g: GardenAnswers, k: string) => (Array.isArray(g.answers[k]) ? (g.answers[k] as string[]) : []);

/** Ce que le jardin veut devenir. */
export const ambitionScore = (g: GardenAnswers): number => {
  const priorite = PRIORITE_AMBITION[str(g, 'priorite') ?? ''] ?? 45;
  const objectif = OBJECTIF_AMBITION[str(g, 'objectif_6_mois') ?? ''] ?? 45;
  const espaces = Math.min(100, list(g, 'amenagements').length * 20);
  const surface = readSurface(g);
  const taille = surface == null ? 40 : Math.min(100, Math.round((Math.log10(Math.max(surface, 1)) / 4) * 100));
  return clamp(priorite * 0.35 + objectif * 0.25 + espaces * 0.25 + taille * 0.15);
};

/** Ce dont le jardin dispose réellement. */
export const moyensScore = (g: GardenAnswers): number => {
  const temps = readTempsSemaine(g);
  const tempsScore = temps == null ? 40 : Math.min(100, Math.round((temps / 10) * 100));
  const budget = readBudget(g);
  const budgetScore = budget == null ? 40 : Math.min(100, Math.round((Math.log10(Math.max(budget, 10)) / 4.3) * 100));
  const eau = IRRIGATION_SCORE[str(g, 'irrigation') ?? ''] ?? 50;
  const soleil = EXPOSITION_SCORE[str(g, 'exposition') ?? ''] ?? 50;
  const exp = EXPERIENCE_SCORE[str(g, 'experience') ?? ''] ?? 40;
  const freins = list(g, 'contraintes').filter((c) => c !== 'aucune').length;
  const malus = Math.min(20, freins * 5);
  return clamp(tempsScore * 0.3 + budgetScore * 0.2 + eau * 0.15 + soleil * 0.1 + exp * 0.25 - malus);
};

export type ReadinessLevel = 'prioritaire' | 'conforter' | 'autonome';

export interface GardenReadiness {
  garden: GardenAnswers;
  ambition: number;
  moyens: number;
  /** Positif = plus d'ambition que de moyens. */
  ecart: number;
  niveau: ReadinessLevel;
  levier: string;
}

const READINESS_LABEL: Record<ReadinessLevel, string> = {
  prioritaire: 'Accompagnement prioritaire',
  conforter: 'À conforter',
  autonome: 'Autonome',
};

export const readinessLabel = (n: ReadinessLevel) => READINESS_LABEL[n];

/** Le geste qui débloque le plus ce jardin, d'après ce qui manque le plus. */
const mainLever = (g: GardenAnswers): string => {
  const temps = readTempsSemaine(g);
  const eau = IRRIGATION_SCORE[str(g, 'irrigation') ?? ''] ?? 50;
  const exp = EXPERIENCE_SCORE[str(g, 'experience') ?? ''] ?? 40;
  const budget = readBudget(g);
  const freins = list(g, 'contraintes').filter((c) => c !== 'aucune');

  if (eau <= 45) return 'Sécuriser l’eau avant toute plantation (récupération, paillage, choix sobres)';
  if (temps != null && temps <= 2) return 'Réduire l’entretien : surfaces plus petites, vivaces, paillage épais';
  if (exp <= 40) return 'Accompagner pas à pas : trois gestes par saison, jamais plus';
  if (budget != null && budget <= 50) return 'Commencer par les gestes gratuits : semis, boutures, compost';
  if (freins.includes('sol_pauvre')) return 'Diagnostiquer le sol puis nourrir avant de planter';
  if (freins.includes('animaux')) return 'Protéger les cultures (clôtures, filets, plantes compagnes)';
  return 'Passer à l’étape suivante du cap fixé à six mois';
};

export const readiness = (gardens: GardenAnswers[]): GardenReadiness[] =>
  gardens
    .map((garden) => {
      const ambition = ambitionScore(garden);
      const moyens = moyensScore(garden);
      const ecart = ambition - moyens;
      const niveau: ReadinessLevel = ecart >= 25 ? 'prioritaire' : ecart >= 8 ? 'conforter' : 'autonome';
      return { garden, ambition, moyens, ecart, niveau, levier: mainLever(garden) };
    })
    .sort((a, b) => b.ecart - a.ecart);

// ---------------------------------------------------------------------------
// Personae
// ---------------------------------------------------------------------------

export interface PersonaGroup {
  key: string;
  nom: string;
  promesse: string;
  regle: string;
  emoji: string;
  gardens: GardenAnswers[];
  part: number;
  surfaceMediane: number | null;
  tempsMedian: number | null;
  freins: { label: string; count: number }[];
  reveDominant: string | null;
  vignette: string | null;
  ambitionMoyenne: number;
  moyensMoyens: number;
}

interface PersonaRule {
  key: string;
  nom: string;
  promesse: string;
  regle: string;
  emoji: string;
  match: (g: GardenAnswers) => boolean;
}

const surfaceOf = (g: GardenAnswers) => readSurface(g) ?? 0;

/** Ordre décisif : le premier motif qui correspond emporte le jardin. */
export const PERSONA_RULES: PersonaRule[] = [
  {
    key: 'site_collectif',
    nom: 'Le site qui rassemble',
    promesse: 'Un lieu partagé, à rendre lisible et mesurable pour des équipes ou des habitants.',
    regle: 'Profil « entreprise » ou « collectivité »',
    emoji: '🏛️',
    match: (g) => ['entreprise', 'collectivite'].includes(str(g, 'profil') ?? ''),
  },
  {
    key: 'balcon_gourmand',
    nom: 'Le balcon gourmand',
    promesse: 'Quelques mètres carrés, une envie de frais à portée de main.',
    regle: 'Lieu « balcon, terrasse »',
    emoji: '🪴',
    match: (g) => str(g, 'lieu') === 'balcon',
  },
  {
    key: 'grand_large',
    nom: 'Le grand large',
    promesse: 'De l’espace, une ambition longue, un système à construire.',
    regle: 'Surface supérieure à 5 000 m²',
    emoji: '🌾',
    match: (g) => surfaceOf(g) >= 5000,
  },
  {
    key: 'page_blanche',
    nom: 'La page blanche',
    promesse: 'Tout reste à dessiner : c’est le moment des bons choix structurants.',
    regle: 'Lieu « terrain nu »',
    emoji: '📐',
    match: (g) => str(g, 'lieu') === 'terrain_nu',
  },
  {
    key: 'jardin_herite',
    nom: 'Le jardin hérité',
    promesse: 'Un jardin déjà là, encore mystérieux : comprendre avant de transformer.',
    regle: 'Jardin déjà en place, expérience « débutant » ou « tâtonne »',
    emoji: '🍃',
    match: (g) =>
      str(g, 'lieu') === 'jardin_existant' && ['debutant', 'tatonne'].includes(str(g, 'experience') ?? ''),
  },
  {
    key: 'main_verte',
    nom: 'La main sûre',
    promesse: 'Une pratique installée : on vise la finesse, pas les bases.',
    regle: 'Jardin déjà en place, expérience « à l’aise » ou « chevronné »',
    emoji: '🌳',
    match: (g) =>
      str(g, 'lieu') === 'jardin_existant' && ['a_laise', 'chevronne'].includes(str(g, 'experience') ?? ''),
  },
  {
    key: 'en_chemin',
    nom: 'En chemin',
    promesse: 'Un projet encore en cours de description : la première question à poser compte.',
    regle: 'Réponses trop partielles pour trancher',
    emoji: '🧭',
    match: () => true,
  },
];

const medianOf = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10;
};

export const buildPersonae = (gardens: GardenAnswers[]): PersonaGroup[] => {
  const byKey = new Map<string, GardenAnswers[]>();
  gardens.forEach((g) => {
    const rule = PERSONA_RULES.find((r) => r.match(g)) ?? PERSONA_RULES[PERSONA_RULES.length - 1];
    byKey.set(rule.key, [...(byKey.get(rule.key) ?? []), g]);
  });

  return PERSONA_RULES.filter((r) => (byKey.get(r.key)?.length ?? 0) > 0).map((rule) => {
    const members = byKey.get(rule.key)!;

    const freinCounts = new Map<string, number>();
    members.forEach((g) =>
      list(g, 'contraintes')
        .filter((c) => c !== 'aucune')
        .forEach((c) => freinCounts.set(c, (freinCounts.get(c) ?? 0) + 1)),
    );

    const reveCounts = new Map<string, number>();
    members.forEach((g) => {
      const s = str(g, 'style');
      if (s) reveCounts.set(s, (reveCounts.get(s) ?? 0) + 1);
    });
    const reve = [...reveCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      key: rule.key,
      nom: rule.nom,
      promesse: rule.promesse,
      regle: rule.regle,
      emoji: rule.emoji,
      gardens: members,
      part: gardens.length > 0 ? Math.round((members.length / gardens.length) * 100) : 0,
      surfaceMediane: medianOf(members.map(readSurface).filter((v): v is number => v != null)),
      tempsMedian: medianOf(members.map(readTempsSemaine).filter((v): v is number => v != null)),
      freins: [...freinCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([value, count]) => ({ label: optionLabel('contraintes', value) ?? value, count })),
      reveDominant: reve ? (optionLabel('style', reve) ?? reve) : null,
      vignette: members.find((m) => m.example?.vignette)?.example?.vignette ?? null,
      ambitionMoyenne: Math.round(members.reduce((s, g) => s + ambitionScore(g), 0) / members.length),
      moyensMoyens: Math.round(members.reduce((s, g) => s + moyensScore(g), 0) / members.length),
    };
  });
};

// ---------------------------------------------------------------------------
// Boucles d'emails
// ---------------------------------------------------------------------------

export interface EmailStep {
  moment: string;
  declencheur: string;
  objet: string;
  angle: string;
  geste: string;
}

export interface EmailLoop {
  personaKey: string;
  personaNom: string;
  emoji: string;
  cadence: string;
  steps: EmailStep[];
}

const OBJECTIF_MOT: Record<string, string> = {
  premiere_recolte: 'votre première récolte',
  preparer_sol: 'un sol vivant',
  structurer: 'des espaces enfin clairs',
  planter_perenne: 'vos premières plantations durables',
  faire_revenir_vivant: 'le retour du vivant',
  comprendre: 'la lecture de votre jardin',
};

const dominant = (members: GardenAnswers[], key: string): string | null => {
  const counts = new Map<string, number>();
  members.forEach((g) => {
    const v = str(g, key);
    if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};

export const buildEmailLoops = (personae: PersonaGroup[]): EmailLoop[] =>
  personae.map((p) => {
    const objectif = dominant(p.gardens, 'objectif_6_mois');
    const cap = OBJECTIF_MOT[objectif ?? ''] ?? 'le cap que vous vous êtes donné';
    const frein = p.freins[0]?.label ?? null;
    const peuDeTemps = (p.tempsMedian ?? 3) <= 2;

    const steps: EmailStep[] = [
      {
        moment: 'J+1 après le parcours d’accueil',
        declencheur: 'Portrait du jardin enregistré',
        objet: `Votre jardin, en une page`,
        angle: `Renvoyer son propre portrait et nommer ${cap}.`,
        geste: 'Ouvrir la fiche du jardin et valider ou corriger une réponse.',
      },
      {
        moment: 'J+7',
        declencheur: 'Aucun tour de jardin enregistré',
        objet: peuDeTemps ? 'Un tour de jardin en 15 minutes' : 'Le premier tour de jardin',
        angle: 'Montrer que l’observation vaut mieux que l’action précipitée.',
        geste: 'Enregistrer un tour de jardin avec trois observations.',
      },
      {
        moment: 'J+21',
        declencheur: frein ? `Frein déclaré : ${frein.toLowerCase()}` : 'Aucun frein déclaré',
        objet: frein ? `Ce qui vous freine : ${frein.toLowerCase()}` : 'Le geste du mois',
        angle: frein
          ? 'Traiter frontalement le frein dominant du groupe, avec un cas réel.'
          : 'Proposer le geste de saison le plus rentable pour ce profil.',
        geste: 'Appliquer un geste et le noter dans le carnet de terrain.',
      },
      {
        moment: 'Chaque changement de saison',
        declencheur: 'Entrée dans une nouvelle saison',
        objet: `Ce que la saison demande à ${p.nom.toLowerCase()}`,
        angle: `Trois gestes maximum, calibrés sur ${p.tempsMedian ?? '—'} h par semaine.`,
        geste: 'Cocher le geste réalisé dans le carnet.',
      },
      {
        moment: 'Mois 6',
        declencheur: 'Fin de la fenêtre de six mois',
        objet: 'Six mois plus tard : ce qui a changé',
        angle: `Mesurer l’écart avec ${cap} et fixer le cap suivant.`,
        geste: 'Choisir le nouvel objectif à six mois.',
      },
    ];

    return {
      personaKey: p.key,
      personaNom: p.nom,
      emoji: p.emoji,
      cadence: peuDeTemps ? 'Deux envois par mois maximum' : 'Un envoi par semaine en saison',
      steps,
    };
  });

// ---------------------------------------------------------------------------
// Notifications dans l'application
// ---------------------------------------------------------------------------

export interface NotificationRule {
  moment: string;
  signal: string;
  donnee: string;
  frequence: string;
  valeur: 'utile' | 'inspirant' | 'rassurant';
  personae: string[];
}

export const buildNotifications = (personae: PersonaGroup[]): NotificationRule[] => {
  const noms = personae.map((p) => p.nom);
  const has = (key: string) => personae.some((p) => p.key === key);
  const rules: NotificationRule[] = [
    {
      moment: 'Épisode de chaleur ou de gel annoncé',
      signal: 'Alerte météo avec le geste de protection adapté au jardin',
      donnee: 'Météo de la propriété',
      frequence: 'Au plus une fois par épisode',
      valeur: 'utile',
      personae: noms,
    },
    {
      moment: 'Sol sec mesuré par une sonde',
      signal: 'Suggestion d’arrosage, calibrée sur la ressource en eau déclarée',
      donnee: 'Sondes IoT de la propriété',
      frequence: 'Au plus une fois par semaine',
      valeur: 'utile',
      personae: personae.filter((p) => p.key !== 'balcon_gourmand').map((p) => p.nom),
    },
    {
      moment: 'Changement de saison',
      signal: 'Les trois gestes de la saison, limités au temps disponible déclaré',
      donnee: 'Réponse « temps par semaine »',
      frequence: 'Quatre fois par an',
      valeur: 'inspirant',
      personae: noms,
    },
    {
      moment: 'Nouvelle espèce observée à proximité',
      signal: 'Le vivant qui revient chez vous, avec la fiche espèce',
      donnee: 'Observations de biodiversité',
      frequence: 'Au plus deux fois par mois',
      valeur: 'inspirant',
      personae: personae.filter((p) => p.key !== 'site_collectif').map((p) => p.nom),
    },
    {
      moment: 'Aucun tour de jardin depuis 30 jours',
      signal: 'Rappel doux, avec la dernière observation enregistrée',
      donnee: 'Tours de jardin',
      frequence: 'Au plus une fois par mois',
      valeur: 'rassurant',
      personae: noms,
    },
    {
      moment: 'Objectif à six mois atteint à moitié',
      signal: 'Jauge d’avancement et prochaine étape',
      donnee: 'Objectif du portrait + carnet de terrain',
      frequence: 'Deux fois sur la période',
      valeur: 'rassurant',
      personae: noms,
    },
  ];

  if (has('site_collectif')) {
    rules.push({
      moment: 'Fin de trimestre',
      signal: 'Bilan partageable avec les équipes ou les habitants',
      donnee: 'Carnet de terrain + biodiversité',
      frequence: 'Quatre fois par an',
      valeur: 'utile',
      personae: ['Le site qui rassemble'],
    });
  }
  return rules;
};

/** Personae exposées à la sur-sollicitation : peu de temps, beaucoup de signaux. */
export const oversolicited = (personae: PersonaGroup[]): string[] =>
  personae.filter((p) => (p.tempsMedian ?? 99) <= 2).map((p) => p.nom);
