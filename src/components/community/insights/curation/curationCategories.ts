/**
 * Référentiel de catégorisation des espèces — La Fréquence du Vivant.
 *
 * 6 catégories opérationnelles, sourçables et auditables.
 * Chaque catégorie a une définition mesurable et un référentiel de validation
 * (voir src/data/species-knowledge-base.json pour les évidences).
 */

export type CategoryValue =
  | 'indigene'
  | 'bioindicatrice'
  | 'auxiliaire'
  | 'ravageur'
  | 'eee'
  | 'patrimoniale';

export interface CurationCategory {
  value: CategoryValue;
  label: string;
  shortLabel: string;
  /** Définition opérationnelle : critère mesurable de classification */
  definition: string;
  /** Sources/référentiels d'autorité pour valider l'appartenance */
  reference_sources: string[];
  /** Exemples canoniques pour pédagogie */
  examples: string[];
  /** Tailwind classes (text + bg + border) — works in both light & dark themes */
  color: string;
  /** Emoji affiché en page publique (sobre, pas dans l'UI admin) */
  icon: string;
}

export const CATEGORIES: CurationCategory[] = [
  {
    value: 'indigene',
    label: 'Indigène',
    shortLabel: 'Indigène',
    definition:
      "Espèce naturellement présente en France métropolitaine (statut INPN « indigène » ou « cryptogène »). Le socle ordinaire du vivant local.",
    reference_sources: ['INPN TAXREF', 'GBIF establishmentMeans'],
    examples: ['Chêne pédonculé', 'Merle noir', 'Mésange charbonnière'],
    color: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30',
    icon: '🌿',
  },
  {
    value: 'bioindicatrice',
    label: 'Bio-indicatrice',
    shortLabel: 'Bio-ind.',
    definition:
      "Sa présence ou son absence renseigne sur un facteur écologique mesurable : qualité du sol, de l'eau, de l'air.",
    reference_sources: ['Indices Ellenberg (flore)', 'IBGN macroinvertébrés', 'IBD diatomées', 'Lichens AFL'],
    examples: ['Pissenlit (sols azotés)', 'Lichens (qualité air)', 'Salamandre (forêt humide mature)'],
    color: 'text-orange-700 bg-orange-500/10 border-orange-500/30',
    icon: '🪲',
  },
  {
    value: 'auxiliaire',
    label: 'Auxiliaire',
    shortLabel: 'Auxiliaire',
    definition:
      "Rend un service écosystémique direct mesurable : pollinisation, prédation de ravageurs, décomposition.",
    reference_sources: ['INRAE Auxiliaires', 'OPIE', 'ITSAP', 'LPO'],
    examples: ['Abeille', 'Ver de terre', 'Hérisson', 'Coccinelle'],
    color: 'text-sky-700 bg-sky-500/10 border-sky-500/30',
    icon: '🐝',
  },
  {
    value: 'ravageur',
    label: 'Ravageur',
    shortLabel: 'Ravageur',
    definition:
      "Cause des dégâts économiques significatifs aux cultures (référencé EPPO, Ephytia INRAE, ITSAP).",
    reference_sources: ['EPPO Global Database', 'INRAE Ephytia', 'ITSAP'],
    examples: ['Puceron noir', 'Carpocapse', 'Drosophila suzukii'],
    color: 'text-yellow-700 bg-yellow-500/10 border-yellow-500/30',
    icon: '🌾',
  },
  {
    value: 'eee',
    label: 'EEE',
    shortLabel: 'EEE',
    definition:
      "Espèce Exotique Envahissante avérée — Liste UE 1143/2014 OU INPN « EEE France métropolitaine ». Menace l'équilibre des écosystèmes.",
    reference_sources: ['Règlement UE 1143/2014', 'INPN EEE', 'CABI'],
    examples: ['Renouée du Japon', 'Jussie', 'Robinier', 'Ragondin', 'Ambroisie'],
    color: 'text-rose-700 bg-rose-500/10 border-rose-500/30',
    icon: '⚠',
  },
  {
    value: 'patrimoniale',
    label: 'Patrimoniale',
    shortLabel: 'Patrimoniale',
    definition:
      "Protégée par arrêté national/régional OU classée Liste Rouge UICN France ≥ NT. Espèce rare, menacée ou emblématique.",
    reference_sources: ['UICN France', 'Arrêtés ministériels protection', 'Directive Habitats 92/43/CEE', 'Directive Oiseaux 2009/147/CE'],
    examples: ['Loutre', 'Cistude', 'Milan noir', 'Orchidée sauvage'],
    color: 'text-violet-700 bg-violet-500/10 border-violet-500/30',
    icon: '💎',
  },
];

export const getCategory = (value?: string | null): CurationCategory | undefined =>
  CATEGORIES.find(c => c.value === value);

export const getCatStyle = (value?: string | null): string =>
  getCategory(value)?.color ?? 'text-muted-foreground bg-muted/40 border-border';

export const getCatLabel = (value?: string | null): string =>
  getCategory(value)?.label ?? value ?? '';

export const getCatIcon = (value?: string | null): string =>
  getCategory(value)?.icon ?? '·';

/**
 * Hiérarchie de priorité quand l'IA doit choisir UNE catégorie principale
 * et que plusieurs s'appliquent. Plus le rang est bas, plus la catégorie prime.
 *
 * Justification : EEE et Patrimoniale sont des signaux d'alerte/valorisation
 * qui doivent toujours dominer ; Ravageur ensuite (enjeu opérationnel) ;
 * puis services (Auxiliaire / Bio-indicatrice) ; Indigène en défaut.
 */
export const PRIMARY_PRIORITY: Record<CategoryValue, number> = {
  eee: 1,
  patrimoniale: 2,
  ravageur: 3,
  bioindicatrice: 4,
  auxiliaire: 5,
  indigene: 6,
};
