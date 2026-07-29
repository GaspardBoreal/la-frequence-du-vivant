/**
 * Registre déclaratif des outils de conception paysagère.
 *
 * Chaque outil produit un « objet » posé sur un calque de l'atelier :
 *  - `geom` définit la façon de le tracer (point / ligne / polygone)
 *  - `unit` définit l'unité de métré affichée et agrégée dans le bilan
 *  - `impact` alimente le « Bilan du plan » (argumentaire technico-économique)
 *
 * Sources d'inspiration : MSV (Maraîchage Sol Vivant), GIEP / gestion intégrée
 * des eaux pluviales, ZAN, et vocabulaire paysager historique (restanque,
 * pierre sèche, plessis, charmille…).
 */

export type ToolGeom = 'point' | 'line' | 'polygon';
export type ToolFamilyKey =
  | 'eau'
  | 'sol'
  | 'nourricier'
  | 'patrimoine'
  | 'biodiversite'
  | 'usage'
  | 'annotation';

export interface ToolImpact {
  /** m² rendus perméables (polygone) */
  desimpermeabilise?: boolean;
  /** rétention d'eau en litres par m² (ou par ml pour une ligne) */
  retentionLpU?: number;
  /** surface nourricière */
  nourricier?: boolean;
  /** couverture permanente du sol (MSV) */
  couverture?: boolean;
  /** coût indicatif conventionnel / sol vivant, en € par unité */
  coutConventionnel?: number;
  coutSolVivant?: number;
  /** entretien annuel indicatif, € / unité / an */
  entretienConventionnel?: number;
  entretienSolVivant?: number;
}

export interface PaysageTool {
  key: string;
  label: string;
  family: ToolFamilyKey;
  geom: ToolGeom;
  color: string;
  /** emoji de repérage rapide sur la carte et dans la boîte à outils */
  glyph: string;
  unit: 'm2' | 'ml' | 'u';
  hint: string;
  /** patrimonial / historique (badge dans la boîte à outils) */
  historique?: boolean;
  impact?: ToolImpact;
  /** croissance visuelle dans le temps (rayon en m à An 0 / 3 / 10) */
  growth?: [number, number, number];
}

export interface ToolFamily {
  key: ToolFamilyKey;
  label: string;
  tagline: string;
  color: string;
}

export const TOOL_FAMILIES: ToolFamily[] = [
  { key: 'eau', label: 'Eau & GIEP', tagline: 'Garder l’eau là où elle tombe', color: '#3b7ea1' },
  { key: 'sol', label: 'Sol vivant · MSV', tagline: 'Couvrir, nourrir, ne plus retourner', color: '#8a6d3b' },
  { key: 'nourricier', label: 'Nourricier', tagline: 'Beau et bon : fruits, aromates, fleurs', color: '#2f7d4f' },
  { key: 'patrimoine', label: 'Patrimoine & structures', tagline: 'Faire avec l’existant, sans table rase', color: '#7a5c3b' },
  { key: 'biodiversite', label: 'Biodiversité', tagline: 'Gîte et couvert pour les auxiliaires', color: '#6b8f3a' },
  { key: 'usage', label: 'Circulation & usage', tagline: '80 % de l’usage est intuitif', color: '#6a6a72' },
  { key: 'annotation', label: 'Annotation', tagline: 'Dire au client ce que l’on voit', color: '#b0451f' },
];

export const PAYSAGE_TOOLS: PaysageTool[] = [
  /* ── Eau & GIEP ─────────────────────────────────────────────── */
  { key: 'noue', label: 'Noue végétalisée', family: 'eau', geom: 'line', color: '#3b7ea1', glyph: '〰️', unit: 'ml',
    hint: 'Fossé peu profond enherbé : ralentit, infiltre, évite le réseau.',
    impact: { retentionLpU: 250, coutConventionnel: 120, coutSolVivant: 65, entretienConventionnel: 8, entretienSolVivant: 3 } },
  { key: 'jardin-pluie', label: 'Jardin de pluie', family: 'eau', geom: 'polygon', color: '#4a9ec2', glyph: '🌧️', unit: 'm2',
    hint: 'Cuvette plantée qui reçoit les eaux de toiture. Le jardin devient éponge.',
    impact: { retentionLpU: 120, desimpermeabilise: true, coutConventionnel: 95, coutSolVivant: 55, entretienConventionnel: 6, entretienSolVivant: 2 } },
  { key: 'mare', label: 'Mare / bassin tampon', family: 'eau', geom: 'polygon', color: '#2e6f96', glyph: '💧', unit: 'm2',
    hint: 'Réserve, refuge de biodiversité et régulateur thermique.',
    impact: { retentionLpU: 400, coutConventionnel: 180, coutSolVivant: 110 } },
  { key: 'baissiere', label: 'Baissière (swale)', family: 'eau', geom: 'line', color: '#5aa7c8', glyph: '⛰️', unit: 'ml',
    hint: 'Tracée sur courbe de niveau : recharge la nappe du sol en amont.',
    impact: { retentionLpU: 300, coutConventionnel: 90, coutSolVivant: 40 } },
  { key: 'tranchee-infiltration', label: 'Tranchée d’infiltration', family: 'eau', geom: 'line', color: '#7fb8d0', glyph: '🪨', unit: 'ml',
    hint: 'Drain drainant en fond de pente ou en pied de surface imperméable.',
    impact: { retentionLpU: 200, coutConventionnel: 140, coutSolVivant: 95 } },
  { key: 'citerne', label: 'Citerne / récupération', family: 'eau', geom: 'point', color: '#2b5f80', glyph: '🛢️', unit: 'u',
    hint: 'Stockage pour l’arrosage d’établissement des végétaux.',
    impact: { coutConventionnel: 1800, coutSolVivant: 1400 } },
  { key: 'desimpermeabilisation', label: 'Désimperméabilisation', family: 'eau', geom: 'polygon', color: '#8bb8c9', glyph: '🧱', unit: 'm2',
    hint: 'Enrobé ou dalle déposé : surface rendue au sol vivant (ZAN).',
    impact: { desimpermeabilise: true, retentionLpU: 60, coutConventionnel: 70, coutSolVivant: 45 } },

  /* ── Sol vivant / MSV ───────────────────────────────────────── */
  { key: 'planche-permanente', label: 'Planche permanente', family: 'sol', geom: 'polygon', color: '#8a6d3b', glyph: '🟫', unit: 'm2',
    hint: 'Sol jamais retourné, jamais tassé : la structure se construit seule.',
    impact: { couverture: true, nourricier: true, coutConventionnel: 40, coutSolVivant: 22, entretienConventionnel: 12, entretienSolVivant: 4 } },
  { key: 'butte', label: 'Butte / billon', family: 'sol', geom: 'polygon', color: '#9c7c46', glyph: '🌾', unit: 'm2',
    hint: 'Volume drainant sur sol lourd ou hydromorphe.',
    impact: { couverture: true, nourricier: true, coutConventionnel: 55, coutSolVivant: 30 } },
  { key: 'couverture-permanente', label: 'Couverture permanente', family: 'sol', geom: 'polygon', color: '#a98c52', glyph: '🍂', unit: 'm2',
    hint: 'Paillage vivant ou mort : jamais de sol nu, jamais de croûte.',
    impact: { couverture: true, retentionLpU: 30, coutConventionnel: 18, coutSolVivant: 9, entretienConventionnel: 6, entretienSolVivant: 1.5 } },
  { key: 'brf', label: 'Apport BRF / compost', family: 'sol', geom: 'polygon', color: '#7d6335', glyph: '🪵', unit: 'm2',
    hint: 'Activation biologique : on nourrit la vie, pas la plante.',
    impact: { couverture: true, coutConventionnel: 25, coutSolVivant: 12 } },
  { key: 'zone-non-travail', label: 'Zone sans travail du sol', family: 'sol', geom: 'polygon', color: '#6d5a30', glyph: '🚫', unit: 'm2',
    hint: 'Périmètre où l’engin ne passe plus : la porosité revient.',
    impact: { couverture: true, coutSolVivant: 0, entretienConventionnel: 9, entretienSolVivant: 2 } },
  { key: 'lasagne', label: 'Lasagne / faux-semis', family: 'sol', geom: 'polygon', color: '#96773f', glyph: '📚', unit: 'm2',
    hint: 'Démarrage sans décapage sur sol dégradé ou remblai.',
    impact: { couverture: true, nourricier: true, coutConventionnel: 35, coutSolVivant: 16 } },

  /* ── Nourricier ─────────────────────────────────────────────── */
  { key: 'verger', label: 'Verger', family: 'nourricier', geom: 'polygon', color: '#2f7d4f', glyph: '🍎', unit: 'm2',
    hint: 'Fruitiers hautes tiges, prairie fauchée en sous-strate.',
    impact: { nourricier: true, couverture: true, coutConventionnel: 60, coutSolVivant: 42 }, growth: [2, 3.5, 6] },
  { key: 'haie-fruitiere', label: 'Haie fruitière', family: 'nourricier', geom: 'line', color: '#3a8f5c', glyph: '🌳', unit: 'ml',
    hint: 'Brise-vent productif : petits fruits, cornouiller, néflier.',
    impact: { nourricier: true, retentionLpU: 40, coutConventionnel: 85, coutSolVivant: 55 }, growth: [0.8, 1.8, 3] },
  { key: 'foret-jardin', label: 'Forêt-jardin', family: 'nourricier', geom: 'polygon', color: '#276b43', glyph: '🌲', unit: 'm2',
    hint: 'Sept strates comestibles, entretien décroissant dans le temps.',
    impact: { nourricier: true, couverture: true, coutConventionnel: 95, coutSolVivant: 62, entretienConventionnel: 14, entretienSolVivant: 4 }, growth: [1.5, 3, 6] },
  { key: 'potager', label: 'Potager', family: 'nourricier', geom: 'polygon', color: '#4f9a5e', glyph: '🥬', unit: 'm2',
    hint: 'Cœur nourricier : à proximité immédiate de l’usage.',
    impact: { nourricier: true, couverture: true, coutConventionnel: 70, coutSolVivant: 38 } },
  { key: 'aromatiques', label: 'Aromatiques / vivaces', family: 'nourricier', geom: 'polygon', color: '#77a85c', glyph: '🌿', unit: 'm2',
    hint: 'Sec, drainé, plein soleil : la strate qui parfume l’accès.',
    impact: { nourricier: true, couverture: true, coutConventionnel: 48, coutSolVivant: 30 } },
  { key: 'serre', label: 'Serre / châssis', family: 'nourricier', geom: 'polygon', color: '#94b58a', glyph: '🏠', unit: 'm2',
    hint: 'Prolonge la saison, abrite les semis et la pépinière du site.',
    impact: { nourricier: true, coutConventionnel: 210, coutSolVivant: 180 } },
  { key: 'treille', label: 'Treille / pergola productive', family: 'nourricier', geom: 'line', color: '#5f9350', glyph: '🍇', unit: 'ml',
    hint: 'Ombrage estival, transparence hivernale : le climatiseur végétal.',
    impact: { nourricier: true, coutConventionnel: 260, coutSolVivant: 190 }, growth: [1, 2.5, 4] },

  /* ── Patrimoine & structures (historique) ───────────────────── */
  { key: 'mur-pierre-seche', label: 'Mur en pierre sèche', family: 'patrimoine', geom: 'line', color: '#8a7a63', glyph: '🧱', unit: 'ml', historique: true,
    hint: 'Sans liant : refuge à reptiles, régulation thermique, savoir-faire UNESCO.',
    impact: { coutConventionnel: 380, coutSolVivant: 290 } },
  { key: 'restanque', label: 'Restanque / terrasse', family: 'patrimoine', geom: 'polygon', color: '#9a8567', glyph: '🪜', unit: 'm2', historique: true,
    hint: 'Casse la pente, retient la terre, ralentit l’eau depuis des siècles.',
    impact: { retentionLpU: 80, coutConventionnel: 210, coutSolVivant: 150 } },
  { key: 'plessis', label: 'Clôture plessée', family: 'patrimoine', geom: 'line', color: '#7d6a4c', glyph: '🪢', unit: 'ml', historique: true,
    hint: 'Osier ou noisetier tressé sur place : ressource locale, zéro transport.',
    impact: { coutConventionnel: 130, coutSolVivant: 60 } },
  { key: 'haie-bocagere', label: 'Haie bocagère', family: 'patrimoine', geom: 'line', color: '#5d7a48', glyph: '🌾', unit: 'ml', historique: true,
    hint: 'Trois strates champêtres : brise-vent, corridor, bois d’œuvre.',
    impact: { retentionLpU: 55, couverture: true, coutConventionnel: 95, coutSolVivant: 58 }, growth: [1, 2.5, 4.5] },
  { key: 'charmille', label: 'Charmille / palissade végétale', family: 'patrimoine', geom: 'line', color: '#6e8a54', glyph: '🪴', unit: 'ml', historique: true,
    hint: 'Géométrie française : structure verte taillée, marcescente en hiver.',
    impact: { coutConventionnel: 120, coutSolVivant: 85, entretienConventionnel: 12, entretienSolVivant: 8 }, growth: [0.6, 1.4, 2.2] },
  { key: 'carres-francais', label: 'Potager en carrés', family: 'patrimoine', geom: 'polygon', color: '#8a9a5b', glyph: '🔲', unit: 'm2', historique: true,
    hint: 'Le potager d’ornement à la française : rigueur du plan, richesse du contenu.',
    impact: { nourricier: true, couverture: true, coutConventionnel: 130, coutSolVivant: 85 } },
  { key: 'allee-cavaliere', label: 'Allée / perspective', family: 'patrimoine', geom: 'line', color: '#8c8168', glyph: '➖', unit: 'ml', historique: true,
    hint: 'Axe de composition : cadre la vue, ordonne la promenade.',
    impact: { coutConventionnel: 90, coutSolVivant: 55 } },
  { key: 'bassin-agrement', label: 'Bassin d’agrément', family: 'patrimoine', geom: 'polygon', color: '#5d87a1', glyph: '⛲', unit: 'm2', historique: true,
    hint: 'Miroir d’eau historique, réinterprété en réserve fonctionnelle.',
    impact: { retentionLpU: 350, coutConventionnel: 320, coutSolVivant: 240 } },
  { key: 'cabane', label: 'Cabane / abri', family: 'patrimoine', geom: 'point', color: '#7a6248', glyph: '🛖', unit: 'u', historique: true,
    hint: 'Rangement, séchage, abri d’observation.',
    impact: { coutConventionnel: 2400, coutSolVivant: 1600 } },

  /* ── Biodiversité ───────────────────────────────────────────── */
  { key: 'prairie-fleurie', label: 'Prairie fleurie', family: 'biodiversite', geom: 'polygon', color: '#9bb04a', glyph: '🌼', unit: 'm2',
    hint: 'Fauche tardive, gestion différenciée : l’esthétique du vivant.',
    impact: { couverture: true, retentionLpU: 45, coutConventionnel: 22, coutSolVivant: 8, entretienConventionnel: 7, entretienSolVivant: 1.2 } },
  { key: 'hotel-insectes', label: 'Hôtel à insectes', family: 'biodiversite', geom: 'point', color: '#b08d57', glyph: '🐝', unit: 'u',
    hint: 'Nichoir à auxiliaires : régulation naturelle des ravageurs.',
    impact: { coutConventionnel: 160, coutSolVivant: 60 } },
  { key: 'tas-bois', label: 'Tas de bois mort', family: 'biodiversite', geom: 'point', color: '#7c6142', glyph: '🪵', unit: 'u',
    hint: 'Le bois mort est le plus vivant des habitats. Valorise l’élagage sur place.',
    impact: { coutSolVivant: 0 } },
  { key: 'pierrier', label: 'Pierrier / muret sec', family: 'biodiversite', geom: 'point', color: '#948b7c', glyph: '🪨', unit: 'u',
    hint: 'Valorise les déblais du chantier : refuge thermique.',
    impact: { coutSolVivant: 0 } },
  { key: 'nichoir', label: 'Nichoir / perchoir', family: 'biodiversite', geom: 'point', color: '#6d8aa1', glyph: '🐦', unit: 'u',
    hint: 'Prédation naturelle et présence sensible du vivant.',
    impact: { coutConventionnel: 90, coutSolVivant: 45 } },
  { key: 'corridor', label: 'Corridor écologique', family: 'biodiversite', geom: 'line', color: '#78a05a', glyph: '↔️', unit: 'ml',
    hint: 'Continuité entre habitats : la biodiversité circule ou disparaît.',
    impact: { couverture: true, coutSolVivant: 25 } },

  /* ── Circulation & usage ────────────────────────────────────── */
  { key: 'cheminement', label: 'Cheminement perméable', family: 'usage', geom: 'line', color: '#8f8a7c', glyph: '🚶', unit: 'ml',
    hint: 'Stabilisé, sablé, copeaux : on marche sans imperméabiliser.',
    impact: { coutConventionnel: 110, coutSolVivant: 60 } },
  { key: 'pas-japonais', label: 'Pas japonais', family: 'usage', geom: 'line', color: '#a09a8c', glyph: '⚪', unit: 'ml',
    hint: 'Traversée légère d’une prairie : usage sans compaction continue.',
    impact: { coutConventionnel: 70, coutSolVivant: 40 } },
  { key: 'terrasse', label: 'Terrasse / séjour', family: 'usage', geom: 'polygon', color: '#a3937b', glyph: '🪑', unit: 'm2',
    hint: 'Le lieu depuis lequel le client regardera son jardin évoluer.',
    impact: { coutConventionnel: 210, coutSolVivant: 160 } },
  { key: 'aire-jeu', label: 'Aire de jeu / détente', family: 'usage', geom: 'polygon', color: '#c2a15a', glyph: '🛝', unit: 'm2',
    hint: 'Sol souple naturel (copeaux, sable) plutôt que dalle amortissante.',
    impact: { desimpermeabilise: true, coutConventionnel: 130, coutSolVivant: 75 } },
  { key: 'assise', label: 'Point d’assise / halte', family: 'usage', geom: 'point', color: '#8c7c62', glyph: '🪵', unit: 'u',
    hint: 'Un banc bien placé fait plus pour l’usage qu’un plan parfait.',
    impact: { coutConventionnel: 480, coutSolVivant: 300 } },
  { key: 'acces-engins', label: 'Accès engins / chantier', family: 'usage', geom: 'line', color: '#7c7c84', glyph: '🚜', unit: 'ml',
    hint: 'À tracer AVANT le chantier : le tassement se paie 10 ans.',
    impact: { coutConventionnel: 40, coutSolVivant: 25 } },

  /* ── Annotation ─────────────────────────────────────────────── */
  { key: 'note', label: 'Note libre', family: 'annotation', geom: 'point', color: '#b0451f', glyph: '📝', unit: 'u',
    hint: 'Verbatim du client, contrainte de terrain, question ouverte.' },
  { key: 'photo-pin', label: 'Punaise photo', family: 'annotation', geom: 'point', color: '#c26a3a', glyph: '📷', unit: 'u',
    hint: 'Point de vue de référence pour l’avant/après.' },
  { key: 'cote', label: 'Cote / mesure', family: 'annotation', geom: 'line', color: '#a1442a', glyph: '📏', unit: 'ml',
    hint: 'Distance mesurée sur le plan, reportée dans le devis.' },
  { key: 'fleche', label: 'Flèche / flux', family: 'annotation', geom: 'line', color: '#9c3f1e', glyph: '➡️', unit: 'ml',
    hint: 'Vent dominant, ruissellement, vue à préserver, nuisance à masquer.' },
];

export const TOOL_BY_KEY: Record<string, PaysageTool> = Object.fromEntries(
  PAYSAGE_TOOLS.map((t) => [t.key, t]),
);

export const toolsOfFamily = (f: ToolFamilyKey): PaysageTool[] =>
  PAYSAGE_TOOLS.filter((t) => t.family === f);

export const DEFAULT_LAYERS = [
  'Existant',
  'Sol & eau',
  'Structures',
  'Plantations',
  'Circulations',
  'Annotations',
];
