/**
 * Trophic classification — assigns each species to one of 5 trophic levels
 * (or to the "decomposer" orbit) using a hybrid strategy:
 *   1. Curated knowledge base (species-knowledge-base.json + a small inline KB)
 *   2. Heuristic fallback by family / kingdom / scientific name patterns
 *
 * Returns a stable structure with a `source` flag so the UI can show
 * transparency about the attribution origin.
 */

export type TrophicTier = 1 | 2 | 3 | 4 | 5;
export type TrophicGroup = `L${TrophicTier}` | 'DECOMPOSER' | 'UNCLASSIFIED';

export interface TrophicAssignment {
  group: TrophicGroup;
  source: 'kb' | 'heuristic';
  rationale?: string;
}

/* ------------------------------------------------------------------ */
/* Tiny inline KB for emblematic / common species (extendable easily) */
/* ------------------------------------------------------------------ */
const SPECIES_KB: Record<string, TrophicGroup> = {
  // L5 — prédateurs supérieurs
  'Buteo buteo': 'L5',
  'Accipiter nisus': 'L5',
  'Accipiter gentilis': 'L5',
  'Falco tinnunculus': 'L5',
  'Falco peregrinus': 'L5',
  'Milvus milvus': 'L5',
  'Milvus migrans': 'L5',
  'Circaetus gallicus': 'L5',
  'Circus aeruginosus': 'L5',
  'Pernis apivorus': 'L5',
  'Tyto alba': 'L5',
  'Strix aluco': 'L5',
  'Athene noctua': 'L5',
  'Asio otus': 'L5',
  'Vulpes vulpes': 'L5',
  'Martes martes': 'L5',
  'Martes foina': 'L5',
  'Mustela putorius': 'L5',
  'Meles meles': 'L5',
  'Lutra lutra': 'L5',
  'Genetta genetta': 'L5',
  // L4 — conso tertiaires (piscivores, reptiles, gros insectivores)
  'Ardea cinerea': 'L4',
  'Ardea alba': 'L4',
  'Egretta garzetta': 'L4',
  'Alcedo atthis': 'L4',
  'Phalacrocorax carbo': 'L4',
  'Ciconia ciconia': 'L4',
  'Natrix natrix': 'L4',
  'Natrix maura': 'L4',
  'Vipera aspis': 'L4',
  'Hierophis viridiflavus': 'L4',
  'Lacerta bilineata': 'L4',
  'Timon lepidus': 'L4',
  'Podarcis muralis': 'L4',
  'Anguis fragilis': 'L4',
  // L3 — conso secondaires (insectivores moyens, batraciens, araignées, coccinelles)
  'Erinaceus europaeus': 'L3',
  'Talpa europaea': 'L3',
  'Sorex araneus': 'L3',
  'Parus major': 'L3',
  'Cyanistes caeruleus': 'L3',
  'Periparus ater': 'L3',
  'Hirundo rustica': 'L3',
  'Delichon urbicum': 'L3',
  'Apus apus': 'L3',
  'Sylvia atricapilla': 'L3',
  'Troglodytes troglodytes': 'L3',
  'Turdus merula': 'L3',
  'Turdus philomelos': 'L3',
  'Erithacus rubecula': 'L3',
  'Phoenicurus ochruros': 'L3',
  'Motacilla alba': 'L3',
  'Picus viridis': 'L3',
  'Dendrocopos major': 'L3',
  'Sitta europaea': 'L3',
  'Certhia brachydactyla': 'L3',
  'Bufo bufo': 'L3',
  'Bufo spinosus': 'L3',
  'Rana temporaria': 'L3',
  'Pelophylax kl. esculentus': 'L3',
  'Salamandra salamandra': 'L3',
  'Triturus marmoratus': 'L3',
  'Coccinella septempunctata': 'L3',
  'Harmonia axyridis': 'L3',
  // L2 — conso primaires (herbivores, pollinisateurs, granivores)
  'Apis mellifera': 'L2',
  'Bombus terrestris': 'L2',
  'Bombus pascuorum': 'L2',
  'Bombus lapidarius': 'L2',
  'Xylocopa violacea': 'L2',
  'Pieris rapae': 'L2',
  'Pieris brassicae': 'L2',
  'Vanessa atalanta': 'L2',
  'Vanessa cardui': 'L2',
  'Aglais io': 'L2',
  'Aglais urticae': 'L2',
  'Polyommatus icarus': 'L2',
  'Maniola jurtina': 'L2',
  'Gonepteryx rhamni': 'L2',
  'Oryctolagus cuniculus': 'L2',
  'Lepus europaeus': 'L2',
  'Capreolus capreolus': 'L2',
  'Cervus elaphus': 'L2',
  'Sus scrofa': 'L2',
  'Sciurus vulgaris': 'L2',
  'Apodemus sylvaticus': 'L2',
  // Decomposers
  'Lumbricus terrestris': 'DECOMPOSER',
  'Eisenia fetida': 'DECOMPOSER',
  'Armadillidium vulgare': 'DECOMPOSER',
  'Porcellio scaber': 'DECOMPOSER',
  'Glomeris marginata': 'DECOMPOSER',
};


/* ------------------------------------------------------------------ */
/* Heuristics by family / kingdom                                     */
/* ------------------------------------------------------------------ */
const FAMILY_RULES: Record<string, TrophicGroup> = {
  // Rapaces / chouettes
  Accipitridae: 'L5', Falconidae: 'L5', Strigidae: 'L5', Tytonidae: 'L5', Pandionidae: 'L5',
  // Carnivores
  Mustelidae: 'L5', Canidae: 'L5', Felidae: 'L5',
  // Hérons / piscivores / serpents
  Ardeidae: 'L4', Ciconiidae: 'L4', Colubridae: 'L4', Viperidae: 'L4', Lacertidae: 'L4',
  Alcedinidae: 'L4',
  // Insectivores moyens
  Erinaceidae: 'L3', Soricidae: 'L3', Talpidae: 'L3',
  Paridae: 'L3', Hirundinidae: 'L3', Sylviidae: 'L3', Muscicapidae: 'L3', Troglodytidae: 'L3',
  Picidae: 'L3', Motacillidae: 'L3',
  Bufonidae: 'L3', Ranidae: 'L3', Salamandridae: 'L3',
  // Araignées, prédateurs invertébrés
  Araneidae: 'L3', Lycosidae: 'L3', Salticidae: 'L3', Thomisidae: 'L3',
  Coccinellidae: 'L3', Carabidae: 'L3', Mantidae: 'L3',
  // Pollinisateurs / herbivores invertébrés
  Apidae: 'L2', Andrenidae: 'L2', Halictidae: 'L2', Megachilidae: 'L2',
  Syrphidae: 'L2', Bombyliidae: 'L2',
  Nymphalidae: 'L2', Pieridae: 'L2', Lycaenidae: 'L2', Hesperiidae: 'L2', Papilionidae: 'L2',
  Sphingidae: 'L2', Geometridae: 'L2', Noctuidae: 'L2',
  Acrididae: 'L2', Tettigoniidae: 'L2', Gryllidae: 'L2',
  Aphididae: 'L2', Cicadellidae: 'L2',
  // Herbivores vertébrés
  Leporidae: 'L2', Cervidae: 'L2', Bovidae: 'L2', Equidae: 'L2', Suidae: 'L2',
  Cricetidae: 'L2', Muridae: 'L2', Sciuridae: 'L2',
  // Granivores oiseaux
  Fringillidae: 'L2', Emberizidae: 'L2', Passeridae: 'L2', Columbidae: 'L2',
  // Décomposeurs
  Lumbricidae: 'DECOMPOSER',
  Armadillidiidae: 'DECOMPOSER', Porcellionidae: 'DECOMPOSER',
  Glomeridae: 'DECOMPOSER', Julidae: 'DECOMPOSER',
};

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */
export interface ClassifyInput {
  scientificName?: string | null;
  family?: string | null;
  kingdom?: string | null;
  /** iNaturalist iconic_taxon_name : Aves, Insecta, Arachnida, Mammalia, Reptilia,
   *  Amphibia, Mollusca, Actinopterygii, Plantae, Fungi, Protozoa, Chromista… */
  iconicTaxon?: string | null;
}

/** iconic_taxon → fallback trophic group (when KB + family fail). */
const ICONIC_RULES: Record<string, TrophicGroup> = {
  Plantae: 'L1',
  Fungi: 'DECOMPOSER',
  Protozoa: 'L1',
  Chromista: 'L1',
  // Animalia subdivisions
  Insecta: 'L2',        // dominant pollinisateurs + herbivores
  Arachnida: 'L3',      // prédateurs invertébrés
  Mollusca: 'DECOMPOSER', // escargots, limaces (détritivores/herbivores → orbit décomposeurs)
  Amphibia: 'L3',
  Reptilia: 'L4',
  Aves: 'L3',           // par défaut passereaux insectivores (les rapaces sont en KB)
  Mammalia: 'L2',       // par défaut herbivores (carnivores en KB/famille)
  Actinopterygii: 'L4', // poissons
};

/** A family field that is empty, a numeric ID, or "Unknown" is unusable. */
const isUsableFamily = (f: string): boolean =>
  !!f && f !== 'Unknown' && !/^\d+$/.test(f);

export function classifyTrophic(sp: ClassifyInput): TrophicAssignment {
  const sn = (sp.scientificName || '').trim();
  const familyRaw = (sp.family || '').trim();
  const family = isUsableFamily(familyRaw) ? familyRaw : '';
  const kingdom = (sp.kingdom || '').trim();
  const iconic = (sp.iconicTaxon || '').trim();

  // 1. KB lookup (exact match, then genus)
  if (sn && SPECIES_KB[sn]) {
    return { group: SPECIES_KB[sn], source: 'kb', rationale: 'Espèce curée' };
  }
  const genus = sn.split(/\s+/)[0];
  if (genus && SPECIES_KB[genus]) {
    return { group: SPECIES_KB[genus], source: 'kb', rationale: `Genre ${genus} curé` };
  }

  // 2. Family-based heuristic (only if family is a real name, not an iNat numeric ID)
  if (family && FAMILY_RULES[family]) {
    return { group: FAMILY_RULES[family], source: 'heuristic', rationale: `Famille ${family}` };
  }

  // 3. iconic_taxon fallback (iNaturalist) — bien plus discriminant que kingdom seul
  if (iconic && ICONIC_RULES[iconic]) {
    return { group: ICONIC_RULES[iconic], source: 'heuristic', rationale: `Groupe ${iconic}` };
  }

  // 4. Kingdom fallback
  if (kingdom === 'Plantae') {
    return { group: 'L1', source: 'heuristic', rationale: 'Règne Plantae → producteur' };
  }
  if (kingdom === 'Fungi') {
    return { group: 'DECOMPOSER', source: 'heuristic', rationale: 'Règne Fungi → décomposeur' };
  }
  if (kingdom === 'Chromista' || kingdom === 'Protozoa') {
    return { group: 'L1', source: 'heuristic', rationale: `${kingdom} → producteur primaire` };
  }
  if (kingdom === 'Animalia') {
    // Fallback prudent : herbivores/pollinisateurs dominent en biomasse observable
    return { group: 'L2', source: 'heuristic', rationale: 'Règne Animalia (groupe inconnu) → conso primaire par défaut' };
  }

  // 5. Scientific name patterns (lichens etc.)
  if (/lichen|cladonia|usnea|parmelia|xanthoria/i.test(sn)) {
    return { group: 'L1', source: 'heuristic', rationale: 'Lichen → producteur primaire' };
  }

  return { group: 'UNCLASSIFIED', source: 'heuristic' };
}


/* ------------------------------------------------------------------ */
/* Level metadata for UI                                              */
/* ------------------------------------------------------------------ */
export interface TrophicLevelMeta {
  group: TrophicGroup;
  label: string;
  shortLabel: string;
  description: string;
  examples: string;
  /** CSS HSL token name (without var()) */
  token: string;
}

export const TROPHIC_LEVELS: TrophicLevelMeta[] = [
  {
    group: 'L1',
    label: 'Producteurs primaires',
    shortLabel: 'L1',
    description:
      "Êtres vivants capables de produire leur propre matière organique à partir de la lumière du soleil. Ils sont la base de toute chaîne alimentaire.",
    examples: 'Plantes, algues, lichens, mousses',
    token: '--trophic-l1',
  },
  {
    group: 'L2',
    label: 'Consommateurs primaires',
    shortLabel: 'L2',
    description:
      'Herbivores et pollinisateurs : ils transforment la matière végétale en énergie animale et participent à la reproduction des plantes.',
    examples: 'Abeilles, papillons, criquets, lapins, chevreuils',
    token: '--trophic-l2',
  },
  {
    group: 'L3',
    label: 'Consommateurs secondaires',
    shortLabel: 'L3',
    description:
      'Petits prédateurs et insectivores qui régulent les populations d’herbivores. Indicateurs précieux d’un écosystème vivant.',
    examples: 'Mésanges, hérissons, araignées, batraciens, coccinelles',
    token: '--trophic-l3',
  },
  {
    group: 'L4',
    label: 'Consommateurs tertiaires',
    shortLabel: 'L4',
    description:
      'Carnivores moyens, piscivores, reptiles : maillons souvent rares qui révèlent la maturité d’un milieu.',
    examples: 'Hérons, couleuvres, lézards verts, martins-pêcheurs',
    token: '--trophic-l4',
  },
  {
    group: 'L5',
    label: 'Prédateurs supérieurs',
    shortLabel: 'L5',
    description:
      'Au sommet de la chaîne. Leur présence atteste d’un territoire suffisamment riche et préservé pour soutenir l’ensemble.',
    examples: 'Rapaces, chouettes, renard, fouine',
    token: '--trophic-l5',
  },
];

export const DECOMPOSER_META: TrophicLevelMeta = {
  group: 'DECOMPOSER',
  label: 'Décomposeurs & recycleurs',
  shortLabel: '⟲',
  description:
    "En orbite autour de tous les niveaux : ils referment le cycle du vivant en transformant la matière morte en sols fertiles. Sans eux, rien ne recommence.",
  examples: 'Champignons, vers de terre, cloportes, mille-pattes',
  token: '--trophic-decomposer',
};

export function getLevelMeta(group: TrophicGroup): TrophicLevelMeta | null {
  if (group === 'DECOMPOSER') return DECOMPOSER_META;
  if (group === 'UNCLASSIFIED') return null;
  return TROPHIC_LEVELS.find((l) => l.group === group) || null;
}

/** Probable predator → prey edges, used for the "isolate chain" interaction.
 *  Keeps it simple: each predator level eats the level just below + decomposers
 *  feed on dead matter from all levels (rendered separately in UI). */
export function probablePreyGroups(predator: TrophicGroup): TrophicGroup[] {
  switch (predator) {
    case 'L5':
      return ['L3', 'L4', 'L2'];
    case 'L4':
      return ['L2', 'L3'];
    case 'L3':
      return ['L2'];
    case 'L2':
      return ['L1'];
    default:
      return [];
  }
}

/** Symétrique : qui mange cette espèce ? */
export function probablePredatorGroups(prey: TrophicGroup): TrophicGroup[] {
  switch (prey) {
    case 'L1':
      return ['L2'];
    case 'L2':
      return ['L3', 'L4', 'L5'];
    case 'L3':
      return ['L4', 'L5'];
    case 'L4':
      return ['L5'];
    default:
      return [];
  }
}
