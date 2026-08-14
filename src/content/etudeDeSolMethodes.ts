/**
 * Contenu public de la page /etude-de-sol.
 * Libellés vitrine dérivés des catalogues de terrain
 * (structureTests / textureTests / phTests / lifeTests) — aucune logique dupliquée.
 */

export type MethodCategoryId =
  | 'terrain'
  | 'prelevements'
  | 'structure'
  | 'texture'
  | 'acidite'
  | 'vie'
  | 'synthese';

export interface MethodCategory {
  id: MethodCategoryId;
  label: string;
  /** Couleur d'accent en HSL brut (compatible tokens du design system). */
  accent: string;
}

export const METHOD_CATEGORIES: MethodCategory[] = [
  { id: 'terrain', label: 'État du terrain', accent: '24 42% 38%' },
  { id: 'prelevements', label: 'Prélèvements', accent: '198 40% 38%' },
  { id: 'structure', label: 'Structure', accent: '24 52% 42%' },
  { id: 'texture', label: 'Texture', accent: '38 68% 42%' },
  { id: 'acidite', label: 'Acidité', accent: '286 38% 46%' },
  { id: 'vie', label: 'Vie du sol', accent: '142 46% 32%' },
  { id: 'synthese', label: 'Synthèse', accent: '138 40% 24%' },
];

export const CATEGORY_MAP: Record<MethodCategoryId, MethodCategory> =
  METHOD_CATEGORIES.reduce((acc, c) => {
    acc[c.id] = c;
    return acc;
  }, {} as Record<MethodCategoryId, MethodCategory>);

export interface PublicMethod {
  id: string;
  category: MethodCategoryId;
  name: string;
  /** Une phrase, sans jargon. */
  summary: string;
  /** Ce que la méthode produit concrètement dans le carnet. */
  deliverable: string;
  optional?: boolean;
}

export const PUBLIC_METHODS: PublicMethod[] = [
  {
    id: 'terrain',
    category: 'terrain',
    name: 'État du terrain',
    summary:
      'Remanié, remblai, décaissement, naturel ou inconnu : l’histoire du site conditionne toute la lecture du sol.',
    deliverable: 'Statut du terrain qualifié',
  },
  {
    id: 'prelevements',
    category: 'prelevements',
    name: 'Carottes géolocalisées',
    summary:
      'Jusqu’à 10 points de prélèvement nommés, posés sur la carte cadastrale, renommables et déplaçables.',
    deliverable: 'Carte des prélèvements (GPS)',
  },
  {
    id: 'beche',
    category: 'structure',
    name: 'Test de la bêche',
    summary:
      'Une motte de 20 cm lâchée ou ouverte à la main : bloc massif, agrégats nets ou effondrement en grains.',
    deliverable: 'Compacte / Grumeleuse / Très meuble',
  },
  {
    id: 'stabilite',
    category: 'structure',
    name: 'Test de stabilité',
    summary:
      'Un agrégat sec immergé dans l’eau claire : bulles d’air, tenue de l’agrégat ou dispersion en 10 minutes.',
    deliverable: 'Confirmation de la classe de structure',
  },
  {
    id: 'boudin',
    category: 'texture',
    name: 'Test du boudin',
    summary:
      'Terre humide roulée en boudin d’un centimètre puis courbée : droit, en lune ou en cercle.',
    deliverable: 'Sableux / Limoneux / Argileux + teneur en argile',
  },
  {
    id: 'sedimentation',
    category: 'texture',
    name: 'Test de sédimentation',
    optional: true,
    summary:
      'Un bocal de terre et d’eau, 24 h de repos, puis lecture des strates sable, limon et argile.',
    deliverable: 'Classe de texture confirmée',
  },
  {
    id: 'bandelette',
    category: 'acidite',
    name: 'Bandelette / kit colorimétrique',
    summary:
      'Terre humide mêlée d’eau déminéralisée, bandelette trempée, teinte comparée au nuancier.',
    deliverable: 'Valeur de pH par prélèvement',
  },
  {
    id: 'phmetre',
    category: 'acidite',
    name: 'pHmètre électronique',
    optional: true,
    summary: 'Sonde calibrée plongée dans une boue de terre : une lecture chiffrée plus fine.',
    deliverable: 'Valeur de pH précise',
  },
  {
    id: 'beche_vivante',
    category: 'vie',
    name: 'Test de la bêche vivante',
    summary:
      'Un bloc de 20 × 20 × 20 cm émietté cinq minutes : comptage des vers et relevé des indices de vie.',
    deliverable: 'Nombre de vers + indices de vie',
  },
  {
    id: 'vinaigre',
    category: 'vie',
    name: 'Test du vinaigre',
    summary:
      'Quelques gouttes sur une motte sèche : l’effervescence révèle la présence de calcaire actif.',
    deliverable: 'Présence de calcaire actif',
  },
  {
    id: 'sachet',
    category: 'vie',
    name: 'Test du sachet de thé',
    optional: true,
    summary:
      'Un sachet enterré six à huit semaines : la vitesse de dégradation mesure l’activité biologique.',
    deliverable: 'Indice d’activité biologique',
  },
  {
    id: 'synthese',
    category: 'synthese',
    name: 'Lecture d’ensemble',
    summary:
      'Agrégation automatique des prélèvements en quatre curseurs : eau, texture, nutrition, pH.',
    deliverable: 'Verdict du site + carnet imprimable',
  },
];

export const METHOD_GUARANTEES = [
  {
    title: 'Une preuve photo par test',
    text: 'Chaque mesure peut être adossée à un cliché horodaté, rattaché à son prélèvement et à son test.',
  },
  {
    title: 'Jamais de moyenne à l’aveugle',
    text: 'Les valeurs restent attachées à leur carotte : la dominante du site est dérivée, jamais saisie à la main.',
  },
  {
    title: 'Un historique versionné',
    text: 'Le registre de sol conserve ses versions successives : aucune saisie de terrain ne peut être effacée en silence.',
  },
  {
    title: 'Un carnet PDF daté',
    text: 'Le diagnostic complet s’imprime en carnet A4, preuve papier hors ligne du relevé de terrain.',
  },
];

export const ENJEUX = [
  {
    id: 'eau',
    title: 'L’eau',
    claim: 'Infiltrer plutôt qu’arroser',
    text: 'Un sol compact ruisselle et assèche ; un sol poreux stocke la pluie et fait passer les étés. La structure décide de la facture d’eau.',
  },
  {
    id: 'vie',
    title: 'La vie',
    claim: 'La fertilité se fabrique seule',
    text: 'Vers, mycélium, micro-faune : ils recyclent la matière organique et creusent les galeries. Là où ils manquent, tout se paie en intrants.',
  },
  {
    id: 'structure',
    title: 'La structure',
    claim: 'Les racines passent, ou ne passent pas',
    text: 'Une semelle de tassement invisible bloque le développement racinaire et condamne les plantations les plus soignées.',
  },
  {
    id: 'palette',
    title: 'La palette',
    claim: 'Planter juste du premier coup',
    text: 'Le pH et la texture disent quelles espèces prospéreront. Les connaître avant de planter évite trois ans d’erreurs coûteuses.',
  },
];

export const SANS_DIAGNOSTIC = [
  'Des replantations en série sur les mêmes emplacements',
  'Un arrosage compensatoire qui ne règle jamais le problème',
  'Des chloroses et des dépérissements attribués au hasard',
  'Des aménagements dessinés sans savoir ce qu’il y a sous la terre',
];
