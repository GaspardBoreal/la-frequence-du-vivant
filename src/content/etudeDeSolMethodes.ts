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
  /** Le geste de terrain, pas à pas. */
  steps: string[];
  /** Matériel nécessaire, quand il y en a. */
  material?: string;
  /** Résultats possibles de la lecture. */
  results?: string[];
  /** Repères chiffrés associés au test. */
  benchmarks?: string[];
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
    steps: [
      'Recueillir l’histoire du site auprès du propriétaire ou du gestionnaire (travaux, terrassements, cultures).',
      'Croiser avec les archives, photographies aériennes anciennes et observations de terrain.',
      'Qualifier le statut : remanié, remblai rapporté, décaissé, naturel en place ou historique inconnu.',
    ],
    results: [
      'Terrain remanié — horizons mélangés, lecture prélèvement par prélèvement',
      'Remblai rapporté — vigilance matériaux et continuité hydraulique',
      'Terrain décaissé — horizon profond, pauvre en matière organique',
      'Sol naturel en place — horizons lisibles',
      'Historique inconnu — à investiguer',
    ],
    deliverable: 'Statut du terrain qualifié',
  },
  {
    id: 'prelevements',
    category: 'prelevements',
    name: 'Carottes géolocalisées',
    summary:
      'Jusqu’à 10 points de prélèvement nommés, posés sur la carte cadastrale, renommables et déplaçables.',
    steps: [
      'Poser chaque point de prélèvement sur la carte cadastrale de la propriété.',
      'Nommer les carottes (A à J) et préciser le lieu-dit ou l’usage de la zone.',
      'Renommer ou déplacer un point à tout moment : les mesures suivent leur carotte.',
    ],
    benchmarks: ['Jusqu’à 10 prélèvements par propriété', 'Coordonnées GPS conservées par point'],
    deliverable: 'Carte des prélèvements (GPS)',
  },
  {
    id: 'beche',
    category: 'structure',
    name: 'Test de la bêche',
    summary:
      'Une motte de 20 cm lâchée ou ouverte à la main : bloc massif, agrégats nets ou effondrement en grains.',
    material: 'Une bêche, un sol dur pour la chute (dalle, allée).',
    steps: [
      'Prélever un bloc de terre à la bêche sur ~20 cm de profondeur, sans le casser.',
      'Le laisser tomber d’environ 1 m sur un sol dur, ou l’ouvrir doucement à la main.',
      'Observer comment il se rompt : bloc massif, agrégats nets, ou effondrement en grains.',
    ],
    results: ['Compacte', 'Grumeleuse', 'Très meuble (particulaire)'],
    deliverable: 'Compacte / Grumeleuse / Très meuble',
  },
  {
    id: 'stabilite',
    category: 'structure',
    name: 'Test de stabilité',
    summary:
      'Un agrégat sec immergé dans l’eau claire : bulles d’air, tenue de l’agrégat ou dispersion en 10 minutes.',
    material: 'Un bocal transparent, de l’eau claire, un agrégat sec de la taille d’une noix.',
    steps: [
      'Prendre un agrégat sec de la taille d’une noix sur le prélèvement.',
      'L’immerger délicatement dans un bocal d’eau claire, sans remuer.',
      'Observer 10 min : bulles d’air (= porosité), tenue de l’agrégat ou dispersion totale.',
    ],
    benchmarks: ['Lecture à 10 minutes'],
    deliverable: 'Confirmation de la classe de structure',
  },
  {
    id: 'boudin',
    category: 'texture',
    name: 'Test du boudin',
    summary:
      'Terre humide roulée en boudin d’un centimètre puis courbée : droit, en lune ou en cercle.',
    material: 'De la terre humidifiée, un peu d’eau.',
    steps: [
      'Prélevez de la terre humidifiée sur l’un de vos prélèvements.',
      'Façonnez un boudin d’environ 1 cm de diamètre.',
      'Essayez de le courber doucement entre les doigts.',
      'Observez le résultat et choisissez la classe correspondante.',
    ],
    results: ['Sableux', 'Limoneux', 'Argileux'],
    benchmarks: [
      'Boudin droit ≈ 10 % d’argile',
      'Boudin en lune : 10 à 30 % d’argile',
      'Boudin en cercle : > 30 % d’argile',
    ],
    deliverable: 'Sableux / Limoneux / Argileux + teneur en argile',
  },
  {
    id: 'sedimentation',
    category: 'texture',
    name: 'Test de sédimentation',
    optional: true,
    summary:
      'Un bocal de terre et d’eau, 24 h de repos, puis lecture des strates sable, limon et argile.',
    material: 'Un bocal transparent à couvercle, de l’eau claire.',
    steps: [
      'Remplissez un bocal au tiers de terre, complétez d’eau claire, refermez.',
      'Agitez énergiquement puis laissez reposer 24 h sans y toucher.',
      'Lisez les strates déposées : sable au fond, limon au milieu, argile au-dessus.',
      'Reportez la classe dominante obtenue pour confirmer le test du boudin.',
    ],
    benchmarks: ['24 h de repos'],
    deliverable: 'Classe de texture confirmée',
  },
  {
    id: 'bandelette',
    category: 'acidite',
    name: 'Bandelette / kit colorimétrique',
    summary:
      'Terre humide mêlée d’eau déminéralisée, bandelette trempée, teinte comparée au nuancier.',
    material: 'Bandelettes pH, eau déminéralisée, verre transparent, nuancier du kit.',
    steps: [
      'Prélevez une cuillère de terre humide sur l’un de vos prélèvements, sans cailloux ni racines.',
      'Mélangez-la à deux volumes d’eau déminéralisée dans un verre, remuez puis laissez reposer 10 minutes.',
      'Trempez la bandelette dans le liquide clarifié pendant quelques secondes.',
      'Comparez immédiatement la teinte au nuancier et reportez la valeur lue.',
    ],
    benchmarks: ['Échelle de lecture pH 4 à 9', 'Jamais d’eau du robinet (calcaire)'],
    deliverable: 'Valeur de pH par prélèvement',
  },
  {
    id: 'phmetre',
    category: 'acidite',
    name: 'pHmètre électronique',
    optional: true,
    summary: 'Sonde calibrée plongée dans une boue de terre : une lecture chiffrée plus fine.',
    material: 'pHmètre de sol ou de liquide, solution de calibration, eau déminéralisée.',
    steps: [
      'Calibrez la sonde avec la solution étalon fournie, puis rincez-la à l’eau déminéralisée.',
      'Préparez une boue de terre humide (deux tiers terre, un tiers eau déminéralisée).',
      'Insérez la sonde au cœur de la boue et attendez la stabilisation de l’affichage.',
      'Notez la valeur stabilisée, rincez la sonde avant le prélèvement suivant.',
    ],
    benchmarks: ['Rinçage obligatoire entre deux prélèvements'],
    deliverable: 'Valeur de pH précise',
  },
  {
    id: 'beche_vivante',
    category: 'vie',
    name: 'Test de la bêche vivante',
    summary:
      'Un bloc de 20 × 20 × 20 cm émietté cinq minutes : comptage des vers et relevé des indices de vie.',
    material: 'Une bêche, une bâche claire, un sol frais (ni sec ni détrempé).',
    steps: [
      'Découper un bloc de terre de 20 cm de côté et 20 cm de profondeur, sur un sol frais (ni sec ni détrempé).',
      'Le déposer sur une bâche claire et l’émietter à la main pendant 5 minutes, sans outil.',
      'Compter les vers de terre, puis cocher tous les autres indices repérés (galeries, radicelles, micro-faune, mycélium).',
    ],
    benchmarks: [
      'Moins de 5 vers par bêchée : vie discrète',
      '5 à 15 vers : vie installée',
      'Plus de 15 vers : vie foisonnante',
    ],
    deliverable: 'Nombre de vers + indices de vie',
  },
  {
    id: 'vinaigre',
    category: 'vie',
    name: 'Test du vinaigre',
    summary:
      'Quelques gouttes sur une motte sèche : l’effervescence révèle la présence de calcaire actif.',
    material: 'Du vinaigre blanc, une coupelle, une motte sèche.',
    steps: [
      'Prélever une petite motte sèche du même échantillon et la poser dans une coupelle.',
      'Verser quelques gouttes de vinaigre blanc directement sur la motte.',
      'Écouter et observer : mousse et crépitement = calcaire ; silence = sol décarbonaté.',
    ],
    results: ['Effervescence = calcaire actif', 'Silence = sol décarbonaté'],
    deliverable: 'Présence de calcaire actif',
  },
  {
    id: 'sachet',
    category: 'vie',
    name: 'Test du sachet de thé',
    optional: true,
    summary:
      'Un sachet enterré six à huit semaines : la vitesse de dégradation mesure l’activité biologique.',
    material: 'Un sachet de thé (ou un carré de coton), un piquet de repérage.',
    steps: [
      'Enterrer un sachet de thé (ou un carré de coton) à 8 cm de profondeur, repéré par un piquet.',
      'Laisser en place 6 à 8 semaines, en notant la date sur votre carnet.',
      'Déterrer et comparer : plus la dégradation est avancée, plus l’activité biologique est intense.',
    ],
    benchmarks: ['Profondeur 8 cm', 'Durée 6 à 8 semaines'],
    deliverable: 'Indice d’activité biologique',
  },
  {
    id: 'synthese',
    category: 'synthese',
    name: 'Lecture d’ensemble',
    summary:
      'Agrégation automatique des prélèvements en quatre curseurs : eau, texture, nutrition, pH.',
    steps: [
      'Agréger les prélèvements : dominantes de structure et de texture, moyenne et amplitude du pH, indice de vie.',
      'Positionner les quatre curseurs du site (eau, texture, nutrition, pH) sur une échelle à cinq crans.',
      'Confronter la voix du sol à la voix de la flore observée et mesurer la concordance.',
      'Éditer le carnet A4 daté, prélèvement par prélèvement, avec les preuves photo.',
    ],
    benchmarks: ['Quatre curseurs à 5 crans', 'Concordance sol / flore'],
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

/* ------------------------------------------------------------------ */
/* Tables de lecture publiques                                         */
/* ------------------------------------------------------------------ */

export const STRUCTURE_CLASSES = [
  { label: 'Compacte', reading: 'Bloc massif qui se rompt en plaques : porosité fermée, racines et eau bloquées.' },
  { label: 'Grumeleuse', reading: 'Agrégats nets de la taille d’un pois : la structure recherchée, air et eau circulent.' },
  { label: 'Très meuble (particulaire)', reading: 'Effondrement en grains sans cohésion : peu de rétention, matière organique à reconstituer.' },
];

export const TEXTURE_CLASSES = [
  { label: 'Sableux', reading: 'Drainant, léger, se réchauffe vite mais retient peu l’eau et les nutriments.' },
  { label: 'Limoneux', reading: 'Bon compromis rétention / drainage, facile à travailler ; vigilance sur la battance.' },
  { label: 'Argileux', reading: 'Forte réserve en eau et en nutriments, mais asphyxiant et lent à ressuyer.' },
];

export const PH_CLASSES_PUBLIC = [
  { label: 'Très acide', range: '4,0 à 5,0', reading: 'Phosphore, calcium et magnésium très peu disponibles ; aluminium et manganèse toxiques.' },
  { label: 'Acide', range: '5,0 à 6,0', reading: 'Phosphore réduit, lessivage des bases ; activité bactérienne freinée au profit des champignons.' },
  { label: 'Faiblement acide', range: '6,0 à 6,8', reading: 'Optimum de disponibilité pour la grande majorité des éléments nutritifs.' },
  { label: 'Neutre', range: '6,8 à 7,2', reading: 'Équilibre idéal : nutriments et vie microbienne au maximum de leur efficacité.' },
  { label: 'Basique', range: '7,2 à 8,0', reading: 'Fer, manganèse et zinc se bloquent : risque de chlorose.' },
  { label: 'Très basique', range: '8,0 à 9,0', reading: 'Blocage marqué du fer et du phosphore ; le calcaire actif domine la chimie du sol.' },
];

export const LIFE_SIGNS_PUBLIC = [
  'Vers de terre',
  'Galeries',
  'Radicelles et chevelu racinaire',
  'Micro-faune (cloportes, collemboles, larves)',
  'Mycélium',
  'Matière organique en décomposition',
  'Odeur d’humus',
  'Effervescence au vinaigre',
];

export const LIFE_CLASSES_PUBLIC = [
  { label: 'Vie discrète', reading: 'Peu d’indices, très peu de vers : sol tassé, appauvri ou trop souvent mis à nu.' },
  { label: 'Vie installée', reading: 'Indices variés et population de vers correcte : les cycles fonctionnent.' },
  { label: 'Vie foisonnante', reading: 'Nombreux indices simultanés et forte densité de vers : fertilité auto-entretenue.' },
];

export const SYNTHESE_AXES = [
  { label: 'Eau', question: 'Le sol garde-t-il l’humidité ?', steps: 'Très sec → Plutôt sec → Équilibré → Plutôt frais → Frais et humide' },
  { label: 'Texture', question: 'De quoi la terre est-elle faite ?', steps: 'Sableux → Plutôt sableux → Équilibré → Plutôt argileux → Argileux' },
  { label: 'Nutrition', question: 'Le milieu nourrit-il ses plantes ?', steps: 'Très pauvre → Plutôt pauvre → Moyen → Plutôt riche → Riche' },
  { label: 'pH', question: 'Quelle est la réaction du sol ?', steps: 'Franchement acide → Plutôt acide → Neutre → Plutôt calcaire → Calcaire' },
];

export const METHODES_DOC = {
  title: 'Méthodes d’analyse de sol',
  baseline: 'Le protocole de terrain de Fréquence Jardin — douze gestes, un carnet.',
  url: 'https://la-frequence-du-vivant.com/etude-de-sol',
  cadre: {
    sert: [
      'Lire un sol vivant sur le terrain, sans laboratoire, en cinq minutes par point.',
      'Attacher chaque mesure à une carotte géolocalisée et à une preuve photo.',
      'Croiser la voix du sol et la voix de la flore pour fonder une palette végétale.',
    ],
    pasSert: [
      'Ce n’est pas une analyse de laboratoire : aucun dosage NPK chiffré, aucune granulométrie normée.',
      'Aucune recherche de polluants, de métaux lourds ou de contaminants.',
      'Les valeurs sont des classes de terrain, assumées comme telles, avec leur incertitude.',
    ],
  },
  imprint: {
    association: 'La Fréquence du Vivant',
    contact: 'contact@la-frequence-du-vivant.com',
    note: 'Le carnet de terrain s’inspire de la méthode D.S. (diagnostic sensible du sol) et des protocoles de la bêche vivante diffusés par l’AFES et les Chambres d’agriculture.',
  },
};

/** Fiche complète en Markdown, identique au contenu du PDF. */
export function methodesToMarkdown(): string {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const L: string[] = [];
  L.push(`# ${METHODES_DOC.title}`, '');
  L.push(`> ${METHODES_DOC.baseline}`, '');
  L.push(`Généré le ${date} · ${METHODES_DOC.url}`, '');

  L.push('## 1. Le cadre', '', '**Ce que le diagnostic fait**', '');
  METHODES_DOC.cadre.sert.forEach((s) => L.push(`- ${s}`));
  L.push('', '**Ce qu’il ne fait pas**', '');
  METHODES_DOC.cadre.pasSert.forEach((s) => L.push(`- ${s}`));
  L.push('');

  L.push('## 2. Le protocole', '');
  METHOD_CATEGORIES.forEach((cat) => {
    const list = PUBLIC_METHODS.filter((m) => m.category === cat.id);
    if (!list.length) return;
    L.push(`### ${cat.label}`, '');
    list.forEach((m) => {
      L.push(`#### ${m.name}${m.optional ? ' *(optionnel)*' : ''}`, '');
      L.push(m.summary, '');
      if (m.material) L.push(`**Matériel** — ${m.material}`, '');
      L.push('**Geste de terrain**', '');
      m.steps.forEach((s, i) => L.push(`${i + 1}. ${s}`));
      L.push('');
      if (m.results?.length) {
        L.push('**Résultats possibles**', '');
        m.results.forEach((r) => L.push(`- ${r}`));
        L.push('');
      }
      if (m.benchmarks?.length) {
        L.push('**Repères** — ' + m.benchmarks.join(' · '), '');
      }
      L.push(`**Livrable** — ${m.deliverable}`, '');
    });
  });

  L.push('## 3. Les tables de lecture', '');
  L.push('### Classes de structure', '');
  STRUCTURE_CLASSES.forEach((c) => L.push(`- **${c.label}** — ${c.reading}`));
  L.push('', '### Classes de texture', '');
  TEXTURE_CLASSES.forEach((c) => L.push(`- **${c.label}** — ${c.reading}`));
  L.push('', '### Classes de pH', '');
  PH_CLASSES_PUBLIC.forEach((c) => L.push(`- **${c.label}** (${c.range}) — ${c.reading}`));
  L.push('', '### Indices de vie relevés', '');
  LIFE_SIGNS_PUBLIC.forEach((s) => L.push(`- ${s}`));
  L.push('', '### Classes de vie', '');
  LIFE_CLASSES_PUBLIC.forEach((c) => L.push(`- **${c.label}** — ${c.reading}`));
  L.push('');

  L.push('## 4. La synthèse', '');
  SYNTHESE_AXES.forEach((a) => L.push(`- **${a.label}** — ${a.question} · ${a.steps}`));
  L.push('');
  L.push('Le verdict du site combine ces quatre curseurs, la concordance sol / flore et l’indice de vie, puis s’imprime en carnet A4 daté.', '');

  L.push('## 5. Garanties', '');
  METHOD_GUARANTEES.forEach((g) => L.push(`- **${g.title}** — ${g.text}`));
  L.push('');

  L.push('---', '');
  L.push(`${METHODES_DOC.imprint.association} · ${METHODES_DOC.imprint.contact}`, '');
  L.push(METHODES_DOC.imprint.note, '');
  return L.join('\n');
}
