/**
 * Bibliothèque d'aménagements inspirants — « Observatoire des paysages vivants ».
 * Fiches internes servant de point de départ ; chaque fiche peut être posée
 * sur le plan (elle crée un objet pré-rempli sur le calque courant).
 */

export type InspirationTypologie =
  | 'urbain'
  | 'residentiel'
  | 'tertiaire'
  | 'agricole'
  | 'public';

export type InspirationEnjeu = 'eau' | 'nourricier' | 'sol' | 'biodiversite' | 'climat' | 'patrimoine';
export type InspirationAge = '<3' | '5-10' | '>10';

export interface InspirationCard {
  key: string;
  titre: string;
  lieu: string;
  typologie: InspirationTypologie;
  enjeux: InspirationEnjeu[];
  anciennete: InspirationAge;
  /** outil pré-sélectionné quand on pose la fiche sur le plan */
  toolKey: string;
  resume: string;
  /** ce que le sol raconte de ce projet */
  sol: string;
  motsCles: string[];
}

export const TYPOLOGIE_LABEL: Record<InspirationTypologie, string> = {
  urbain: 'Agroécologie urbaine',
  residentiel: 'Jardin résidentiel',
  tertiaire: 'Site tertiaire',
  agricole: 'Lisière agricole',
  public: 'Espace public',
};

export const ENJEU_LABEL: Record<InspirationEnjeu, string> = {
  eau: 'Eau & GIEP',
  nourricier: 'Nourricier',
  sol: 'Sol vivant',
  biodiversite: 'Biodiversité',
  climat: 'Climat / ICU',
  patrimoine: 'Patrimoine',
};

export const AGE_LABEL: Record<InspirationAge, string> = {
  '<3': 'moins de 3 ans',
  '5-10': '5 à 10 ans',
  '>10': 'plus de 10 ans',
};

export const INSPIRATIONS: InspirationCard[] = [
  {
    key: 'cour-eponge',
    titre: 'La cour éponge',
    lieu: 'Cour d’école désimperméabilisée',
    typologie: 'public',
    enjeux: ['eau', 'climat'],
    anciennete: '5-10',
    toolKey: 'desimpermeabilisation',
    resume:
      '400 m² d’enrobé déposés, remplacés par une noue plantée et un sol souple en copeaux. L’eau de toiture ne part plus au réseau.',
    sol: 'Remblai compacté : décompactage mécanique léger, puis BRF et couvert permanent. Aucun apport de terre végétale extérieure.',
    motsCles: ['ZAN', 'îlot de chaleur', 'GIEP', 'récréation'],
  },
  {
    key: 'verger-tertiaire',
    titre: 'Le verger de bureau',
    lieu: 'Parvis d’un site tertiaire',
    typologie: 'tertiaire',
    enjeux: ['nourricier', 'biodiversite'],
    anciennete: '5-10',
    toolKey: 'verger',
    resume:
      'Fruitiers hautes tiges plantés en prairie fauchée tardivement. Récolte partagée par les salariés, entretien divisé par trois.',
    sol: 'Sol de remblai pauvre : plantation en fosse large, mycorhization, paillage BRF renouvelé deux ans.',
    motsCles: ['QVT', 'gestion différenciée', 'récolte'],
  },
  {
    key: 'jardin-pluie-lotissement',
    titre: 'Le jardin de pluie du lotissement',
    lieu: 'Espace commun résidentiel',
    typologie: 'residentiel',
    enjeux: ['eau', 'biodiversite'],
    anciennete: '<3',
    toolKey: 'jardin-pluie',
    resume:
      'Cuvette de 60 m² recevant les descentes de gouttières de six pavillons. Vidange en moins de 48 h, floraison de mai à octobre.',
    sol: 'Argile lourde : fond scarifié, mélange sableux sur 40 cm, plantation d’hélophytes en fond et vivaces sèches en berge.',
    motsCles: ['pluie de projet', 'infiltration', 'vivaces'],
  },
  {
    key: 'foret-jardin',
    titre: 'La forêt-jardin domestique',
    lieu: 'Jardin de 800 m²',
    typologie: 'residentiel',
    enjeux: ['nourricier', 'sol'],
    anciennete: '>10',
    toolKey: 'foret-jardin',
    resume:
      'Sept strates comestibles installées progressivement. Après dix ans, l’arrosage est nul et l’entretien se limite à la récolte.',
    sol: 'Limon battant : couverture permanente dès l’année zéro, plus aucun travail du sol depuis la plantation.',
    motsCles: ['temps long', 'strates', 'autonomie'],
  },
  {
    key: 'restanques',
    titre: 'Les restanques réhabilitées',
    lieu: 'Coteau en pente forte',
    typologie: 'agricole',
    enjeux: ['patrimoine', 'eau'],
    anciennete: '>10',
    toolKey: 'restanque',
    resume:
      'Murs en pierre sèche relevés avec les pierres du site. L’eau ralentit, la terre reste, les reptiles reviennent.',
    sol: 'Sol squelettique calcaire : palette méditerranéenne stricte, aucun apport, paillage minéral.',
    motsCles: ['pierre sèche', 'érosion', 'savoir-faire'],
  },
  {
    key: 'haie-bocagere',
    titre: 'La haie bocagère retrouvée',
    lieu: 'Limite de parcelle agricole',
    typologie: 'agricole',
    enjeux: ['biodiversite', 'climat'],
    anciennete: '5-10',
    toolKey: 'haie-bocagere',
    resume:
      '180 ml de haie trois strates replantés sur talus. Brise-vent, corridor, et bois d’élagage valorisé en BRF sur place.',
    sol: 'Terre de labour appauvrie : plantation en jeunes plants, paillage biodégradable, aucune irrigation.',
    motsCles: ['corridor', 'BRF', 'brise-vent'],
  },
  {
    key: 'potager-partage',
    titre: 'Le potager en carrés partagé',
    lieu: 'Pied d’immeuble',
    typologie: 'urbain',
    enjeux: ['nourricier', 'sol'],
    anciennete: '<3',
    toolKey: 'carres-francais',
    resume:
      'Douze carrés en châtaignier posés sur sol pollué, en lasagne. Le dessin français rassure, le contenu est sauvage.',
    sol: 'Sol suspect : culture hors-sol sur géotextile, substrat compost + BRF, analyse annuelle.',
    motsCles: ['lien social', 'lasagne', 'pédagogie'],
  },
  {
    key: 'prairie-differenciee',
    titre: 'La prairie en gestion différenciée',
    lieu: 'Parc d’entreprise',
    typologie: 'tertiaire',
    enjeux: ['biodiversite', 'climat'],
    anciennete: '5-10',
    toolKey: 'prairie-fleurie',
    resume:
      'Deux tontes par an au lieu de vingt-deux. Le coût d’entretien chute de 70 %, la floraison devient un argument commercial.',
    sol: 'Sol tassé par le passage des tondeuses : arrêt du passage, décompactage biologique par les racines pivotantes.',
    motsCles: ['fauche tardive', 'coût d’entretien', 'esthétique du vivant'],
  },
];

export const filterInspirations = (opts: {
  typologie?: InspirationTypologie | 'all';
  enjeu?: InspirationEnjeu | 'all';
  anciennete?: InspirationAge | 'all';
  q?: string;
}): InspirationCard[] => {
  const q = (opts.q || '').trim().toLowerCase();
  return INSPIRATIONS.filter((c) => {
    if (opts.typologie && opts.typologie !== 'all' && c.typologie !== opts.typologie) return false;
    if (opts.enjeu && opts.enjeu !== 'all' && !c.enjeux.includes(opts.enjeu)) return false;
    if (opts.anciennete && opts.anciennete !== 'all' && c.anciennete !== opts.anciennete) return false;
    if (q) {
      const hay = `${c.titre} ${c.lieu} ${c.resume} ${c.sol} ${c.motsCles.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
};
