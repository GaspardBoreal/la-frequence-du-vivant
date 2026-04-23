import type { CommunityRoleKey } from '@/hooks/useCommunityProfile';
import type { MarcheEventType } from '@/lib/marcheEventTypes';

export type LivingPillarKey = 'oeil' | 'main' | 'coeur' | 'palais' | 'oreille';
export type LivingTimeframeKey = 'avant' | 'pendant' | 'apres';
export type LivingMaturityKey = 'pragmatique' | 'innovant' | 'disruptif';
export type ActivityFamilyKey = 'pratiques' | 'especes' | 'textes' | 'lieux' | 'bioacoustique';

export interface LivingPillar {
  key: LivingPillarKey;
  label: string;
  verb: string;
  icon: string;
  activityFamilies: ActivityFamilyKey[];
  description: string;
  signals: string[];
}

export const LIVING_PILLARS: LivingPillar[] = [
  {
    key: 'oeil',
    label: "L’Œil",
    verb: 'Observer',
    icon: 'Eye',
    activityFamilies: ['especes', 'lieux'],
    description: 'Lire les paysages, reconnaître les espèces, repérer les traces et les continuités écologiques.',
    signals: ['espèces', 'haie', 'étang', 'corridor', 'trame verte', 'trame bleue', 'paysage', 'trace'],
  },
  {
    key: 'main',
    label: 'La Main',
    verb: 'Expérimenter',
    icon: 'Hand',
    activityFamilies: ['pratiques'],
    description: 'Mesurer, tester, manipuler et documenter les pratiques agroécologiques de terrain.',
    signals: ['sol', 'test', 'bêche', 'oab', 'culture', 'jachère', 'régulation', 'agroécologique', 'apiculteur'],
  },
  {
    key: 'coeur',
    label: 'Le Cœur',
    verb: 'Ressentir',
    icon: 'Heart',
    activityFamilies: ['textes'],
    description: 'Transformer l’expérience en récits, haïkus, senryus, haïbuns et traces sensibles.',
    signals: ['haïku', 'senryu', 'haïbun', 'texte', 'poème', 'récit', 'écriture', 'sensible'],
  },
  {
    key: 'palais',
    label: 'Le Palais',
    verb: 'Goûter',
    icon: 'Apple',
    activityFamilies: ['lieux', 'pratiques'],
    description: 'Relier terroir, alimentation, production, sol, biodiversité et histoire locale.',
    signals: ['goût', 'terroir', 'dégustation', 'produit', 'aliment', 'miel', 'vigne', 'verger'],
  },
  {
    key: 'oreille',
    label: "L’Oreille",
    verb: 'Écouter',
    icon: 'Headphones',
    activityFamilies: ['bioacoustique', 'especes', 'textes'],
    description: 'Écouter, reconnaître les oiseaux, enregistrer les sons originaux et révéler le paysage sonore.',
    signals: ['son', 'écoute', 'oiseau', 'chant', 'bioacoustique', 'enregistrement', 'silence', 'abeille', 'bruissement'],
  },
];

export const LIVING_TIMEFRAMES: Record<LivingTimeframeKey, { label: string; description: string }> = {
  avant: { label: 'Avant', description: 'Préparer les points, consignes, rôles, matériels et intentions de restitution.' },
  pendant: { label: 'Pendant', description: 'Guider les observations, écoutes, expérimentations, textes et contributions.' },
  apres: { label: 'Après', description: 'Trier, relier, restituer, valoriser et transformer les traces en preuve sensible.' },
};

export const LIVING_MATURITY_LEVELS: Record<LivingMaturityKey, { label: string; description: string }> = {
  pragmatique: { label: 'Efficace', description: 'Cadre visible, missions simples, fiches et synthèses rapides.' },
  innovant: { label: 'Innovant', description: 'Modules d’expérience, équilibre des piliers et parcours composable.' },
  disruptif: { label: 'Disruptif', description: 'Partition vivante, indice de résonance et jumeau territorial sensible.' },
};

export const ROLE_MISSIONS: Record<CommunityRoleKey, string[]> = {
  marcheur_en_devenir: ['Découvrir le point de marche', 'Noter une observation simple', 'Exprimer un ressenti'],
  marcheur: ['Identifier 3 sons ou signes du vivant', 'Déposer une photo, un texte ou une écoute', 'Relier un point à un pilier'],
  eclaireur: ['Documenter lieu, heure, météo et habitat', 'Comparer deux points de marche', 'Proposer une hypothèse écologique ou sonore'],
  ambassadeur: ['Animer une pause collective', 'Raconter le lien entre pratique agricole et vivant', 'Aider les nouveaux marcheurs à contribuer'],
  sentinelle: ['Qualifier la cohérence des observations', 'Valider les indices sensibles et scientifiques', 'Préparer une restitution partenaire'],
};

export const EVENT_TYPE_PILLAR_PRIORITIES: Record<MarcheEventType, LivingPillarKey[]> = {
  agroecologique: ['main', 'oeil', 'oreille', 'coeur'],
  eco_poetique: ['coeur', 'oreille', 'oeil', 'main'],
  eco_tourisme: ['oeil', 'palais', 'oreille', 'coeur'],
};

export function getLivingPillar(key: LivingPillarKey) {
  return LIVING_PILLARS.find((pillar) => pillar.key === key)!;
}

export function inferPillarsFromText(text: string | null | undefined, eventType?: MarcheEventType | string | null): LivingPillarKey[] {
  const source = `${text || ''} ${eventType || ''}`.toLowerCase();
  const inferred = new Set<LivingPillarKey>();

  LIVING_PILLARS.forEach((pillar) => {
    if (pillar.signals.some((signal) => source.includes(signal.toLowerCase()))) {
      inferred.add(pillar.key);
    }
  });

  const priorities = eventType && eventType in EVENT_TYPE_PILLAR_PRIORITIES
    ? EVENT_TYPE_PILLAR_PRIORITIES[eventType as MarcheEventType]
    : [];
  priorities.slice(0, 2).forEach((pillar) => inferred.add(pillar));

  return LIVING_PILLARS.map((pillar) => pillar.key).filter((key) => inferred.has(key));
}

export function getMissingPillars(active: LivingPillarKey[]) {
  const activeSet = new Set(active);
  return LIVING_PILLARS.filter((pillar) => !activeSet.has(pillar.key));
}

export function getPillarSuggestions(missing: LivingPillarKey[]): string[] {
  const suggestions: Record<LivingPillarKey, string> = {
    oeil: 'Ajouter une lecture de paysage ou une reconnaissance d’espèces sur un point clé.',
    main: 'Prévoir un geste terrain simple : test bêche, observation du sol, relevé ou protocole OAB.',
    coeur: 'Inviter les marcheurs à écrire un haïku, senryu ou récit court après une observation.',
    palais: 'Relier le parcours à un produit, un terroir, une dégustation consciente ou une histoire agricole locale.',
    oreille: 'Installer une pause d’écoute bioacoustique avec reconnaissance d’oiseaux ou enregistrement court du lieu.',
  };
  return missing.map((key) => suggestions[key]);
}