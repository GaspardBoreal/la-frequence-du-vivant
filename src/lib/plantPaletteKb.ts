/**
 * Base éditoriale de palette végétale — Étape 5 « Palette végétale ».
 *
 * ~120 taxons de plaines et collines (France métropolitaine), décrits par leurs
 * optima écologiques sur la MÊME échelle -3 → +3 que `plantIndicatorKb.ts`
 * (cohérence indispensable pour croiser sol mesuré ↔ flore observée ↔ palette).
 *
 * Axes :
 *   eau       -3 très sec        → +3 très humide / hydromorphe
 *   texture   -3 sableux drainant→ +3 argileux lourd
 *   nutrition -3 oligotrophe     → +3 eutrophe / nitrophile
 *   ph        -3 acidiphile      → +3 calcicole
 *   lumiere   -3 ombre dense     → +3 plein soleil
 *
 * Sources : CNPF (2018) Flore forestière française, t.1 Plaines et collines ·
 * Baseflor / Catminat (Ph. Julve) · Tela Botanica · Végétal local (OFB).
 */

export type PaletteStrate = 'arbre' | 'arbuste' | 'herbacee' | 'grimpante' | 'couvre_sol';
export type PaletteOrigin = 'indigene' | 'horticole';
/** Trois familles d'usage, pour proposer une palette lisible par le propriétaire. */
export type PaletteUsage = 'nourricier' | 'potager' | 'ornemental';


export interface PaletteSpecies {
  id: string;
  fr: string;
  latin: string;
  strate: PaletteStrate;
  origin: PaletteOrigin;
  /** Filière « Végétal local » disponible (marque OFB). */
  vegetalLocal: boolean;
  optima: { eau: number; texture: number; nutrition: number; ph: number; lumiere: number };
  /** Services rendus, mots-clés courts. */
  services: string[];
  /** Ligne 2 de la fiche : raison écologique. */
  reason: string;
  /** Ligne 3 de la fiche : service rendu, formulé pour le propriétaire. */
  service: string;
  /** Déconseillée : motif éditorial (invasive, allergène majeur, hors sol…). */
  caution?: string;
}

type Row = [
  string, // id
  string, // fr
  string, // latin
  PaletteStrate,
  PaletteOrigin,
  0 | 1, // végétal local
  [number, number, number, number, number], // eau, texture, nutrition, ph, lumiere
  string, // services (séparés par |)
  string, // raison écologique
  string, // service rendu
];

const ROWS: Row[] = [
  // ── Arbres ────────────────────────────────────────────────────────────────
  ['quercus-robur', 'Chêne pédonculé', 'Quercus robur', 'arbre', 'indigene', 1, [1, 2, 1, 0, 2], 'ombre|faune|bois', 'Supporte les sols lourds et frais, pivot des chênaies de plaine.', 'Ombre portée durable et plus de 400 espèces associées.'],
  ['quercus-petraea', 'Chêne sessile', 'Quercus petraea', 'arbre', 'indigene', 1, [-1, 0, 0, -1, 2], 'ombre|faune|bois', 'Préfère les sols drainants légèrement acides, plus tolérant à la sécheresse estivale.', 'Charpente paysagère et refuge d’insectes xylophages.'],
  ['quercus-pubescens', 'Chêne pubescent', 'Quercus pubescens', 'arbre', 'indigene', 1, [-2, -1, -1, 2, 3], 'ombre|faune|sécheresse', 'Espèce des coteaux calcaires secs, référence pour l’adaptation climatique.', 'Ombre claire sans irrigation, même en été chaud.'],
  ['carpinus-betulus', 'Charme', 'Carpinus betulus', 'arbre', 'indigene', 1, [1, 2, 1, 1, -1], 'haie|ombre|brise-vent', 'Tolère l’ombre et les sols argileux frais, se taille sans faiblir.', 'Haie haute opaque et feuillage marcescent en hiver.'],
  ['fagus-sylvatica', 'Hêtre', 'Fagus sylvatica', 'arbre', 'indigene', 1, [1, 0, 0, 0, -2], 'ombre|haie', 'Exige une atmosphère fraîche, souffre des étés secs en sol filtrant.', 'Voûte dense et sous-bois apaisé.'],
  ['acer-campestre', 'Érable champêtre', 'Acer campestre', 'arbre', 'indigene', 1, [0, 1, 1, 2, 1], 'haie|mellifère|faune', 'Calcicole robuste, pilier historique du bocage.', 'Ossature de haie, floraison précoce pour les butineurs.'],
  ['acer-monspessulanum', 'Érable de Montpellier', 'Acer monspessulanum', 'arbre', 'indigene', 0, [-2, -1, -1, 2, 3], 'sécheresse|faune', 'Petit arbre méditerranéen des calcaires arides.', 'Résiste aux canicules avec un port compact.'],
  ['tilia-cordata', 'Tilleul à petites feuilles', 'Tilia cordata', 'arbre', 'indigene', 1, [0, 1, 1, 1, 1], 'mellifère|ombre', 'Sol frais profond, mésophile, longévité remarquable.', 'Floraison très mellifère et ombre de repos.'],
  ['fraxinus-excelsior', 'Frêne commun', 'Fraxinus excelsior', 'arbre', 'indigene', 1, [2, 1, 2, 1, 1], 'faune|fourrage', 'Indique des sols frais et riches, sensible à la chalarose.', 'Croissance rapide, feuillage fourrager de secours.'],
  ['prunus-avium', 'Merisier', 'Prunus avium', 'arbre', 'indigene', 1, [0, 0, 1, 1, 2], 'mellifère|fruits|faune', 'Sol drainant profond, pionnier des lisières.', 'Floraison blanche massive puis fruits pour les oiseaux.'],
  ['sorbus-domestica', 'Cormier', 'Sorbus domestica', 'arbre', 'indigene', 1, [-1, 0, 0, 2, 3], 'fruits|sécheresse', 'Arbre de lumière des coteaux secs, très longévif.', 'Fruits comestibles et silhouette patrimoniale.'],
  ['sorbus-torminalis', 'Alisier torminal', 'Sorbus torminalis', 'arbre', 'indigene', 1, [-1, 1, 0, 2, 1], 'fruits|faune', 'Sols calcaires filtrants, discret en lisière.', 'Nourrit merles et grives, feuillage d’automne éclatant.'],
  ['juglans-regia', 'Noyer commun', 'Juglans regia', 'arbre', 'horticole', 0, [0, 0, 2, 1, 3], 'fruits|ombre', 'Sol profond et aéré, craint l’hydromorphie.', 'Récolte nourricière et ombre estivale ample.'],
  ['castanea-sativa', 'Châtaignier', 'Castanea sativa', 'arbre', 'indigene', 1, [0, -1, 0, -2, 2], 'fruits|bois', 'Strictement acidiphile, refuse le calcaire actif.', 'Fruits, piquets durables et floraison mellifère tardive.'],
  ['betula-pendula', 'Bouleau verruqueux', 'Betula pendula', 'arbre', 'indigene', 1, [0, -2, -2, -2, 3], 'pionnier|faune', 'Pionnier des sols pauvres et acides, courte durée de vie.', 'Installe vite une ombre légère sur terrain nu.'],
  ['alnus-glutinosa', 'Aulne glutineux', 'Alnus glutinosa', 'arbre', 'indigene', 1, [3, 2, 1, 0, 2], 'fixateur azote|berge', 'Espèce des sols engorgés, fixe l’azote par symbiose.', 'Tient les berges et enrichit les sols pauvres humides.'],
  ['salix-alba', 'Saule blanc', 'Salix alba', 'arbre', 'indigene', 1, [3, 2, 2, 1, 3], 'berge|mellifère', 'Zones inondables, reprise par bouturage.', 'Première ressource de pollen en fin d’hiver.'],
  ['populus-nigra', 'Peuplier noir', 'Populus nigra', 'arbre', 'indigene', 1, [3, 1, 2, 1, 3], 'berge|faune', 'Ripisylve alluviale, racines traçantes.', 'Stabilise les zones humides et abrite la faune cavernicole.'],
  ['pinus-sylvestris', 'Pin sylvestre', 'Pinus sylvestris', 'arbre', 'indigene', 1, [-2, -2, -2, -1, 3], 'persistant|brise-vent', 'Sols sableux pauvres, très frugal en eau.', 'Écran persistant toute l’année.'],
  ['malus-sylvestris', 'Pommier sauvage', 'Malus sylvestris', 'arbre', 'indigene', 1, [1, 1, 1, 0, 2], 'mellifère|fruits|faune', 'Lisières fraîches, ancêtre des vergers.', 'Floraison mellifère et fruits d’hiver pour la faune.'],
  ['pyrus-pyraster', 'Poirier sauvage', 'Pyrus pyraster', 'arbre', 'indigene', 1, [-1, 0, 0, 1, 3], 'mellifère|fruits', 'Coteaux secs, très rustique.', 'Floraison blanche précoce, bois dense.'],
  ['ulmus-minor', 'Orme champêtre', 'Ulmus minor', 'arbre', 'indigene', 1, [1, 2, 2, 1, 2], 'haie|faune', 'Sols argileux riches, à conduire en cépée face à la graphiose.', 'Haie basse dense, hôte de papillons rares.'],
  ['salix-caprea', 'Saule marsault', 'Salix caprea', 'arbre', 'indigene', 1, [2, 1, 1, 0, 2], 'mellifère|pionnier', 'Pionnier frais, colonise vite les sols remaniés.', 'Chatons dorés en février, décisifs pour les abeilles sauvages.'],
  ['taxus-baccata', 'If', 'Taxus baccata', 'arbre', 'indigene', 1, [0, 1, 0, 2, -2], 'persistant|haie', 'Supporte l’ombre profonde et le calcaire.', 'Haie persistante taillée, mémoire longue du jardin.'],
  ['ilex-aquifolium', 'Houx', 'Ilex aquifolium', 'arbre', 'indigene', 1, [1, 0, 0, -1, -2], 'persistant|faune', 'Sous-bois frais acidiclines.', 'Baies hivernales et abri persistant pour les oiseaux.'],
  ['sorbus-aucuparia', 'Sorbier des oiseleurs', 'Sorbus aucuparia', 'arbre', 'indigene', 1, [1, -1, -1, -1, 2], 'fruits|faune', 'Sols acides frais, montagnard en plaine fraîche.', 'Baies rouges très recherchées des grives.'],

  // ── Arbustes ──────────────────────────────────────────────────────────────
  ['corylus-avellana', 'Noisetier', 'Corylus avellana', 'arbuste', 'indigene', 1, [1, 1, 1, 1, 0], 'haie|fruits|pollen', 'Mésophile tolérant, cépée vigoureuse.', 'Pollen de janvier et noisettes ; recèpe facile.'],
  ['crataegus-monogyna', 'Aubépine monogyne', 'Crataegus monogyna', 'arbuste', 'indigene', 1, [0, 1, 1, 2, 2], 'haie|mellifère|faune', 'Calcicole rustique, épineuse, cœur de la haie bocagère.', 'Refuge de nidification protégé par les épines.'],
  ['prunus-spinosa', 'Prunellier', 'Prunus spinosa', 'arbuste', 'indigene', 1, [-1, 1, 0, 2, 3], 'haie|mellifère|fruits', 'Drageonne sur sols secs à frais, très colonisateur.', 'Première floraison de mars, prunelles d’automne.'],
  ['cornus-sanguinea', 'Cornouiller sanguin', 'Cornus sanguinea', 'arbuste', 'indigene', 1, [1, 2, 1, 2, 1], 'haie|faune', 'Argiles calcaires fraîches, rameaux rouges en hiver.', 'Baies noires pour les oiseaux, couleur hivernale.'],
  ['cornus-mas', 'Cornouiller mâle', 'Cornus mas', 'arbuste', 'indigene', 1, [-1, 1, 0, 2, 2], 'mellifère|fruits', 'Calcicole sec, floraison ultra-précoce.', 'Fleurs jaunes de février, cornouilles comestibles.'],
  ['viburnum-lantana', 'Viorne lantane', 'Viburnum lantana', 'arbuste', 'indigene', 1, [-1, 1, 0, 3, 2], 'haie|faune', 'Strictement calcicole, très résistante à la sécheresse.', 'Feuillage velouté et fruits bicolores décoratifs.'],
  ['viburnum-opulus', 'Viorne obier', 'Viburnum opulus', 'arbuste', 'indigene', 1, [2, 2, 1, 1, 1], 'haie|faune', 'Sols frais à humides, lisières de zones humides.', 'Fruits rouges persistants, floraison en ombelles.'],
  ['euonymus-europaeus', 'Fusain d’Europe', 'Euonymus europaeus', 'arbuste', 'indigene', 1, [1, 2, 1, 2, 1], 'haie|faune', 'Argiles fraîches calcaires, ombre partielle acceptée.', 'Fruits roses spectaculaires en automne.'],
  ['ligustrum-vulgare', 'Troène commun', 'Ligustrum vulgare', 'arbuste', 'indigene', 1, [0, 1, 1, 2, 1], 'haie|mellifère', 'Calcicole très tolérant, semi-persistant.', 'Haie dense taillée, floraison parfumée de juin.'],
  ['rhamnus-cathartica', 'Nerprun purgatif', 'Rhamnus cathartica', 'arbuste', 'indigene', 1, [-1, 1, 0, 3, 2], 'faune', 'Calcaire sec, hôte du papillon citron.', 'Nourrit des chenilles spécialisées.'],
  ['frangula-alnus', 'Bourdaine', 'Frangula alnus', 'arbuste', 'indigene', 1, [2, 0, -1, -2, 1], 'faune|mellifère', 'Sols acides humides, indicatrice de fond humide.', 'Floraison longue, essentielle aux abeilles solitaires.'],
  ['sambucus-nigra', 'Sureau noir', 'Sambucus nigra', 'arbuste', 'indigene', 1, [1, 1, 3, 1, 1], 'faune|fruits', 'Nitrophile marqué, signale un sol très riche.', 'Fleurs et baies récoltables, croissance immédiate.'],
  ['rosa-canina', 'Églantier', 'Rosa canina', 'arbuste', 'indigene', 1, [0, 1, 0, 2, 3], 'haie|mellifère|fruits', 'Lisières sèches, épineux protecteur.', 'Cynorhodons riches en vitamine C pour l’hiver.'],
  ['lonicera-xylosteum', 'Camérisier', 'Lonicera xylosteum', 'arbuste', 'indigene', 1, [0, 1, 1, 2, -1], 'faune', 'Sous-bois calcaires, tolère l’ombre.', 'Comble les pieds de haie ombragés.'],
  ['salix-purpurea', 'Osier pourpre', 'Salix purpurea', 'arbuste', 'indigene', 1, [3, 1, 1, 1, 3], 'berge|vannerie', 'Berges et sols engorgés, bouturage immédiat.', 'Fascines vivantes contre l’érosion, brins de vannerie.'],
  ['cytisus-scoparius', 'Genêt à balais', 'Cytisus scoparius', 'arbuste', 'indigene', 1, [-2, -2, -2, -2, 3], 'fixateur azote|mellifère', 'Sols sableux acides pauvres, fixateur d’azote.', 'Restaure la fertilité des terrains décapés.'],
  ['ulex-europaeus', 'Ajonc d’Europe', 'Ulex europaeus', 'arbuste', 'indigene', 1, [-1, -2, -2, -2, 3], 'fixateur azote|abri', 'Landes acides, très épineux.', 'Abri hivernal fleuri pour la petite faune.'],
  ['juniperus-communis', 'Genévrier commun', 'Juniperus communis', 'arbuste', 'indigene', 1, [-2, -1, -2, 2, 3], 'persistant|faune', 'Pelouses sèches calcaires, très frugal.', 'Persistant sans arrosage, baies aromatiques.'],
  ['buxus-sempervirens', 'Buis', 'Buxus sempervirens', 'arbuste', 'indigene', 1, [-1, 0, 0, 3, -1], 'persistant|haie', 'Calcaire sec ombragé ; surveiller la pyrale.', 'Structure persistante basse, très longévive.'],
  ['hippophae-rhamnoides', 'Argousier', 'Hippophae rhamnoides', 'arbuste', 'indigene', 0, [-1, -3, -2, 2, 3], 'fixateur azote|fruits', 'Sables calcaires, fixe l’azote, drageonnant.', 'Fixe les sols meubles et donne des baies vitaminées.'],
  ['amelanchier-ovalis', 'Amélanchier commun', 'Amelanchier ovalis', 'arbuste', 'indigene', 0, [-2, -1, -1, 3, 3], 'mellifère|fruits', 'Rochers calcaires secs, très sobre.', 'Floraison blanche d’avril, fruits sucrés.'],
  ['colutea-arborescens', 'Baguenaudier', 'Colutea arborescens', 'arbuste', 'indigene', 0, [-2, -1, -1, 2, 3], 'fixateur azote|mellifère', 'Coteaux calcaires chauds, légumineuse ligneuse.', 'Fleurit tout l’été sans arrosage.'],
  ['pistacia-terebinthus', 'Térébinthe', 'Pistacia terebinthus', 'arbuste', 'indigene', 0, [-3, -1, -1, 2, 3], 'sécheresse|faune', 'Garrigues sèches, très résistant à la canicule.', 'Palette d’adaptation aux étés futurs.'],
  ['rubus-fruticosus', 'Ronce commune', 'Rubus fruticosus', 'arbuste', 'indigene', 1, [1, 1, 2, 0, 1], 'faune|fruits', 'Nitrophile des lisières, à contenir en bord de haie.', 'Ourlet nourricier majeur pour oiseaux et insectes.'],
  ['ribes-rubrum', 'Groseillier rouge', 'Ribes rubrum', 'arbuste', 'indigene', 1, [2, 1, 2, 1, 0], 'fruits|mellifère', 'Sol frais riche, tolère la mi-ombre.', 'Petits fruits au pied des haies ombragées.'],
  ['ribes-nigrum', 'Cassissier', 'Ribes nigrum', 'arbuste', 'horticole', 0, [2, 2, 2, 0, 1], 'fruits', 'Sol frais humifère, exige l’humidité estivale.', 'Récolte aromatique de juillet.'],
  ['salix-viminalis', 'Osier vert', 'Salix viminalis', 'arbuste', 'indigene', 1, [3, 2, 2, 1, 3], 'berge|biomasse', 'Sols saturés, croissance très rapide.', 'Haie vivante tressée, épuration des eaux de ruissellement.'],
  ['tamarix-gallica', 'Tamaris', 'Tamarix gallica', 'arbuste', 'indigene', 0, [1, -2, 0, 2, 3], 'vent|sel', 'Sables littoraux, tolère embruns et salinité.', 'Brise-vent léger en contexte exposé.'],
  ['lavandula-angustifolia', 'Lavande vraie', 'Lavandula angustifolia', 'arbuste', 'horticole', 0, [-3, -2, -2, 2, 3], 'mellifère|sécheresse', 'Sol drainant calcaire, pourrit en sol lourd humide.', 'Nectar d’été massif, bordure structurante.'],
  ['rosmarinus-officinalis', 'Romarin', 'Salvia rosmarinus', 'arbuste', 'horticole', 0, [-3, -2, -2, 2, 3], 'mellifère|aromatique', 'Terrains secs filtrants, persistant.', 'Floraison hivernale, ressource rare en janvier.'],
  ['santolina-chamaecyparissus', 'Santoline', 'Santolina chamaecyparissus', 'arbuste', 'horticole', 0, [-3, -2, -2, 2, 3], 'sécheresse|couvre-sol', 'Sols pauvres brûlants, feuillage gris réflecteur.', 'Bordure argentée sans arrosage.'],
  ['cistus-albidus', 'Ciste cotonneux', 'Cistus albidus', 'arbuste', 'indigene', 0, [-3, -2, -2, 1, 3], 'sécheresse|mellifère', 'Garrigues calcaires, résiste aux sols squelettiques.', 'Fleurit en plein soleil sur sol pauvre.'],
  ['spartium-junceum', 'Genêt d’Espagne', 'Spartium junceum', 'arbuste', 'horticole', 0, [-3, -2, -2, 2, 3], 'fixateur azote|mellifère', 'Talus secs ; potentiellement envahissant au sud.', 'Fixe les talus, floraison parfumée.'],
  ['coronilla-emerus', 'Coronille arbrisseau', 'Hippocrepis emerus', 'arbuste', 'indigene', 0, [-1, 0, -1, 3, 2], 'fixateur azote|mellifère', 'Ourlets calcaires, légumineuse discrète.', 'Enrichit doucement les sols maigres.'],
  ['prunus-mahaleb', 'Bois de Sainte-Lucie', 'Prunus mahaleb', 'arbuste', 'indigene', 0, [-2, 0, -1, 3, 3], 'mellifère|fruits', 'Calcaires arides, très résistant.', 'Floraison parfumée d’avril sur sol ingrat.'],
  ['pyracantha-coccinea', 'Buisson ardent', 'Pyracantha coccinea', 'arbuste', 'indigene', 0, [-1, 0, 0, 2, 3], 'haie|faune|persistant', 'Sols secs calcaires, épineux persistant.', 'Haie défensive et baies d’hiver.'],
  ['berberis-vulgaris', 'Épine-vinette', 'Berberis vulgaris', 'arbuste', 'indigene', 0, [-1, 0, 0, 3, 3], 'haie|faune', 'Coteaux calcaires ; hôte de la rouille noire des céréales.', 'Haie épineuse fruitière, à éloigner des cultures.'],

  // ── Grimpantes ────────────────────────────────────────────────────────────
  ['hedera-helix', 'Lierre grimpant', 'Hedera helix', 'grimpante', 'indigene', 1, [1, 1, 2, 1, -2], 'faune|mellifère|persistant', 'Supporte l’ombre dense, ne parasite pas son support.', 'Dernier nectar d’octobre, baies de février, gîte à oiseaux.'],
  ['lonicera-periclymenum', 'Chèvrefeuille des bois', 'Lonicera periclymenum', 'grimpante', 'indigene', 1, [1, 0, 1, -1, 0], 'mellifère|parfum', 'Lisières fraîches acidiclines.', 'Parfum nocturne, nectar des sphinx.'],
  ['clematis-vitalba', 'Clématite des haies', 'Clematis vitalba', 'grimpante', 'indigene', 1, [0, 1, 2, 2, 2], 'faune', 'Sols riches calcaires ; vigoureuse, à contenir.', 'Abri dense, akènes plumeux décoratifs.'],
  ['vitis-vinifera', 'Vigne', 'Vitis vinifera subsp. vinifera', 'grimpante', 'horticole', 0, [-1, 0, 0, 2, 3], 'fruits|ombre', 'Sol drainant chaud, craint l’excès d’eau.', 'Ombrage estival caduc sur pergola, puis lumière d’hiver.'],
  ['humulus-lupulus', 'Houblon', 'Humulus lupulus', 'grimpante', 'indigene', 1, [2, 2, 3, 1, 1], 'faune|aromatique', 'Sols frais riches en azote, disparaît l’hiver.', 'Écran végétal saisonnier très rapide.'],
  ['rosa-arvensis', 'Rosier des champs', 'Rosa arvensis', 'grimpante', 'indigene', 1, [1, 1, 1, 1, 0], 'mellifère|faune', 'Lisières fraîches semi-ombragées.', 'Rosier sauvage sarmenteux, cynorhodons tardifs.'],

  // ── Herbacées & vivaces ───────────────────────────────────────────────────
  ['achillea-millefolium', 'Achillée millefeuille', 'Achillea millefolium', 'herbacee', 'indigene', 1, [-1, 0, 0, 1, 3], 'mellifère|prairie', 'Prairies mésophiles, très plastique.', 'Fleurit tout l’été, nourrit syrphes et coccinelles.'],
  ['leucanthemum-vulgare', 'Marguerite', 'Leucanthemum vulgare', 'herbacee', 'indigene', 1, [0, 0, 0, 1, 3], 'prairie|mellifère', 'Prairies maigres non fertilisées.', 'Signal visuel d’une prairie fleurie réussie.'],
  ['centaurea-jacea', 'Centaurée jacée', 'Centaurea jacea', 'herbacee', 'indigene', 1, [0, 1, 0, 1, 3], 'prairie|mellifère', 'Prairies de fauche mésophiles.', 'Nectar de fin d’été pour papillons.'],
  ['knautia-arvensis', 'Knautie des champs', 'Knautia arvensis', 'herbacee', 'indigene', 1, [-1, 0, 0, 2, 3], 'mellifère', 'Prairies sèches calcaires.', 'Ressource clé des abeilles solitaires spécialisées.'],
  ['salvia-pratensis', 'Sauge des prés', 'Salvia pratensis', 'herbacee', 'indigene', 1, [-1, 1, 0, 3, 3], 'mellifère|prairie', 'Pelouses calcaires sèches.', 'Floraison bleue de mai, très visitée par les bourdons.'],
  ['origanum-vulgare', 'Origan', 'Origanum vulgare', 'herbacee', 'indigene', 1, [-2, 0, -1, 2, 3], 'mellifère|aromatique', 'Ourlets calcaires chauds.', 'Le plus fort attracteur de papillons en août.'],
  ['thymus-serpyllum', 'Serpolet', 'Thymus serpyllum', 'couvre_sol', 'indigene', 1, [-3, -2, -2, 1, 3], 'mellifère|couvre-sol', 'Sols squelettiques secs, rampant.', 'Tapis piétinable, aromatique et mellifère.'],
  ['sedum-album', 'Orpin blanc', 'Sedum album', 'couvre_sol', 'indigene', 1, [-3, -3, -3, 2, 3], 'couvre-sol|sécheresse', 'Dalles et sables très secs, plante grasse.', 'Végétalise l’inaccessible : murets, toitures, graviers.'],
  ['sedum-acre', 'Orpin âcre', 'Sedum acre', 'couvre_sol', 'indigene', 1, [-3, -3, -3, 2, 3], 'couvre-sol|mellifère', 'Terrains minéraux brûlants.', 'Floraison jaune sur sol nu, sans entretien.'],
  ['dianthus-carthusianorum', 'Œillet des Chartreux', 'Dianthus carthusianorum', 'herbacee', 'indigene', 0, [-2, -1, -2, 3, 3], 'mellifère', 'Pelouses calcaires maigres.', 'Indicateur de réussite d’une prairie sèche.'],
  ['echium-vulgare', 'Vipérine', 'Echium vulgare', 'herbacee', 'indigene', 1, [-2, -2, -1, 2, 3], 'mellifère', 'Sols remaniés secs et caillouteux.', 'Nectar renouvelé toutes les 20 minutes.'],
  ['malva-sylvestris', 'Mauve sauvage', 'Malva sylvestris', 'herbacee', 'indigene', 1, [-1, 0, 2, 1, 3], 'mellifère|comestible', 'Bords de chemins nitrophiles.', 'Fleurs et feuilles comestibles, longue floraison.'],
  ['silene-vulgaris', 'Silène enflé', 'Silene vulgaris', 'herbacee', 'indigene', 1, [-1, 0, 0, 2, 3], 'mellifère', 'Prairies et talus secs calcaires.', 'Nectar nocturne pour les papillons de nuit.'],
  ['galium-verum', 'Gaillet jaune', 'Galium verum', 'herbacee', 'indigene', 1, [-2, 0, -1, 2, 3], 'prairie|mellifère', 'Pelouses sèches, parfum de miel.', 'Structure la prairie maigre, hôte de sphinx.'],
  ['lotus-corniculatus', 'Lotier corniculé', 'Lotus corniculatus', 'herbacee', 'indigene', 1, [-1, 0, -1, 1, 3], 'fixateur azote|mellifère', 'Légumineuse des prairies maigres.', 'Fixe l’azote et nourrit plus de 100 insectes.'],
  ['trifolium-pratense', 'Trèfle des prés', 'Trifolium pratense', 'herbacee', 'indigene', 1, [0, 1, 1, 1, 3], 'fixateur azote|fourrage', 'Prairies mésophiles fertiles.', 'Améliore la fertilité et nourrit les bourdons.'],
  ['medicago-lupulina', 'Luzerne lupuline', 'Medicago lupulina', 'herbacee', 'indigene', 1, [-1, 0, 0, 2, 3], 'fixateur azote|couvre-sol', 'Sols calcaires tassés, pionnière.', 'Couvre-sol fixateur pour zones piétinées.'],
  ['sanguisorba-minor', 'Petite pimprenelle', 'Sanguisorba minor', 'herbacee', 'indigene', 1, [-2, 0, -1, 3, 3], 'prairie|comestible', 'Pelouses calcaires sèches.', 'Feuillage comestible, persiste en été sec.'],
  ['plantago-lanceolata', 'Plantain lancéolé', 'Plantago lanceolata', 'herbacee', 'indigene', 1, [0, 1, 1, 1, 3], 'prairie|faune', 'Prairies pâturées et sols tassés.', 'Plante hôte du damier de la succise.'],
  ['prunella-vulgaris', 'Brunelle commune', 'Prunella vulgaris', 'couvre_sol', 'indigene', 1, [1, 1, 1, 1, 2], 'couvre-sol|mellifère', 'Pelouses fraîches piétinées.', 'Fleurit dans les gazons peu tondus.'],
  ['ajuga-reptans', 'Bugle rampante', 'Ajuga reptans', 'couvre_sol', 'indigene', 1, [2, 2, 1, 0, -1], 'couvre-sol|mellifère', 'Sols frais ombragés, stolonifère.', 'Tapis fleuri bleu sous les arbres.'],
  ['geum-urbanum', 'Benoîte commune', 'Geum urbanum', 'herbacee', 'indigene', 1, [1, 1, 2, 1, -2], 'ombre', 'Sous-bois frais nitrophiles.', 'Comble les ombres difficiles.'],
  ['primula-veris', 'Primevère officinale', 'Primula veris', 'herbacee', 'indigene', 1, [0, 1, 0, 2, 1], 'mellifère|printemps', 'Prairies calcaires mi-ombragées.', 'Première couleur de mars sous les fruitiers.'],
  ['pulmonaria-officinalis', 'Pulmonaire', 'Pulmonaria officinalis', 'couvre_sol', 'indigene', 1, [1, 1, 2, 1, -2], 'ombre|mellifère', 'Sous-bois frais riches.', 'Nectar de mars à l’ombre, feuillage tacheté.'],
  ['anemone-nemorosa', 'Anémone des bois', 'Anemone nemorosa', 'couvre_sol', 'indigene', 1, [1, 1, 1, 0, -2], 'ombre|printemps', 'Sous-bois frais, vernale éphémère.', 'Tapis blanc d’avril avant le feuillage des arbres.'],
  ['digitalis-purpurea', 'Digitale pourpre', 'Digitalis purpurea', 'herbacee', 'indigene', 1, [1, -1, 0, -2, 1], 'mellifère|ombre', 'Clairières acides ; toxique.', 'Bourdons spécialisés, verticalité en lisière.'],
  ['campanula-trachelium', 'Campanule gantelée', 'Campanula trachelium', 'herbacee', 'indigene', 0, [1, 1, 1, 2, -1], 'ombre|mellifère', 'Lisières fraîches calcaires.', 'Fleurit à l’ombre en plein été.'],
  ['hypericum-perforatum', 'Millepertuis perforé', 'Hypericum perforatum', 'herbacee', 'indigene', 1, [-2, 0, -1, 1, 3], 'mellifère|médicinal', 'Talus secs remaniés.', 'Pollen abondant, colonise les sols pauvres.'],
  ['verbascum-thapsus', 'Bouillon-blanc', 'Verbascum thapsus', 'herbacee', 'indigene', 1, [-2, -1, 0, 2, 3], 'mellifère|structure', 'Friches sèches caillouteuses.', 'Hampe de 2 m, refuge d’insectes en hiver.'],
  ['daucus-carota', 'Carotte sauvage', 'Daucus carota', 'herbacee', 'indigene', 1, [-1, 0, 0, 2, 3], 'mellifère|auxiliaires', 'Friches et prairies sèches.', 'Ombelle plateforme pour les insectes auxiliaires.'],
  ['scabiosa-columbaria', 'Scabieuse colombaire', 'Scabiosa columbaria', 'herbacee', 'indigene', 0, [-2, 0, -2, 3, 3], 'mellifère', 'Pelouses calcaires maigres.', 'Floraison tardive précieuse en septembre.'],
  ['succisa-pratensis', 'Succise des prés', 'Succisa pratensis', 'herbacee', 'indigene', 1, [2, 1, -1, 0, 2], 'mellifère|prairie humide', 'Prairies humides oligotrophes.', 'Plante hôte du damier de la succise, fleurit en octobre.'],
  ['filipendula-ulmaria', 'Reine des prés', 'Filipendula ulmaria', 'herbacee', 'indigene', 1, [3, 2, 2, 1, 2], 'zone humide|mellifère', 'Sols engorgés riches, mégaphorbiaie.', 'Structure les bords d’eau, parfum d’amande.'],
  ['lythrum-salicaria', 'Salicaire', 'Lythrum salicaria', 'herbacee', 'indigene', 1, [3, 2, 2, 1, 3], 'zone humide|mellifère', 'Berges et fossés inondables.', 'Épis roses très mellifères tout l’été.'],
  ['iris-pseudacorus', 'Iris des marais', 'Iris pseudacorus', 'herbacee', 'indigene', 1, [3, 2, 2, 1, 3], 'zone humide|épuration', 'Vases et bords de mare.', 'Filtre les eaux de ruissellement, floraison jaune.'],
  ['caltha-palustris', 'Populage des marais', 'Caltha palustris', 'herbacee', 'indigene', 1, [3, 2, 2, 1, 2], 'zone humide|printemps', 'Sols saturés en eau toute l’année.', 'Première floraison des zones humides.'],
  ['mentha-aquatica', 'Menthe aquatique', 'Mentha aquatica', 'herbacee', 'indigene', 1, [3, 1, 2, 1, 3], 'zone humide|mellifère', 'Pied dans l’eau, stolonifère.', 'Ceinture de mare très visitée en août.'],
  ['carex-pendula', 'Laîche pendante', 'Carex pendula', 'herbacee', 'indigene', 1, [3, 2, 1, 1, -1], 'zone humide|ombre', 'Suintements ombragés argileux.', 'Structure graphique des fonds humides ombragés.'],
  ['juncus-effusus', 'Jonc épars', 'Juncus effusus', 'herbacee', 'indigene', 1, [3, 2, 0, -1, 3], 'zone humide|indicateur', 'Sols compactés engorgés acides.', 'Signale l’excès d’eau et le tassement.'],
  ['deschampsia-cespitosa', 'Canche cespiteuse', 'Deschampsia cespitosa', 'herbacee', 'indigene', 1, [2, 2, 1, 0, 1], 'graminée|structure', 'Sols lourds humides, touffes persistantes.', 'Graminée d’ossature dans les fonds froids.'],
  ['molinia-caerulea', 'Molinie bleue', 'Molinia caerulea', 'herbacee', 'indigene', 1, [2, 1, -2, -1, 2], 'graminée|prairie humide', 'Sols acides pauvres alternativement humides.', 'Lumière dorée d’automne sur sols ingrats.'],
  ['festuca-ovina', 'Fétuque ovine', 'Festuca ovina', 'herbacee', 'indigene', 1, [-3, -2, -3, 1, 3], 'graminée|gazon sec', 'Pelouses maigres très sèches.', 'Base des gazons sans arrosage.'],
  ['bromus-erectus', 'Brome érigé', 'Bromus erectus', 'herbacee', 'indigene', 1, [-2, 0, -2, 3, 3], 'graminée|prairie sèche', 'Pelouses calcaires, structurant.', 'Ossature de la prairie sèche pérenne.'],
  ['briza-media', 'Brize intermédiaire', 'Briza media', 'herbacee', 'indigene', 1, [-1, 0, -2, 2, 3], 'graminée|prairie', 'Prairies maigres calcaires.', 'Épillets tremblants, marqueur de maigreur.'],
  ['stipa-pennata', 'Stipe plumeuse', 'Stipa pennata', 'herbacee', 'indigene', 0, [-3, -1, -3, 3, 3], 'graminée|sécheresse', 'Steppes calcaires ; espèce protégée, à sourcer.', 'Mouvement argenté sur les sols les plus arides.'],
  ['helleborus-foetidus', 'Hellébore fétide', 'Helleborus foetidus', 'herbacee', 'indigene', 0, [-1, 1, 0, 3, -1], 'ombre|hiver', 'Sous-bois calcaires secs.', 'Floraison de janvier à l’ombre sèche.'],
  ['euphorbia-amygdaloides', 'Euphorbe des bois', 'Euphorbia amygdaloides', 'couvre_sol', 'indigene', 0, [1, 1, 1, 1, -2], 'ombre|couvre-sol', 'Sous-bois frais, persistant.', 'Couvre les ombres sèches difficiles.'],
  ['vinca-minor', 'Petite pervenche', 'Vinca minor', 'couvre_sol', 'indigene', 1, [1, 1, 1, 1, -2], 'couvre-sol|ombre', 'Sous-bois frais, tapissante persistante.', 'Supprime le désherbage sous les haies.'],
  ['fragaria-vesca', 'Fraisier des bois', 'Fragaria vesca', 'couvre_sol', 'indigene', 1, [1, 1, 1, 1, 0], 'couvre-sol|fruits', 'Lisières fraîches, stolonifère.', 'Couvre-sol comestible sous les arbustes.'],
  ['geranium-sanguineum', 'Géranium sanguin', 'Geranium sanguineum', 'herbacee', 'indigene', 0, [-2, 0, -1, 3, 2], 'mellifère|couvre-sol', 'Ourlets calcaires secs.', 'Touffe fleurie longuement, sans arrosage.'],
  ['nepeta-racemosa', 'Népéta', 'Nepeta racemosa', 'herbacee', 'horticole', 0, [-2, -1, -1, 2, 3], 'mellifère|bordure', 'Horticole sobre pour sols drainants.', 'Bordure remontante, aimant à bourdons.'],
  ['perovskia-atriplicifolia', 'Sauge de Russie', 'Salvia yangii', 'herbacee', 'horticole', 0, [-3, -2, -2, 2, 3], 'mellifère|sécheresse', 'Horticole de sol pauvre drainant.', 'Nuage bleu d’août, zéro arrosage.'],
  ['stachys-byzantina', 'Épiaire laineuse', 'Stachys byzantina', 'couvre_sol', 'horticole', 0, [-3, -2, -2, 2, 3], 'couvre-sol|mellifère', 'Sol sec drainant, feuillage laineux.', 'Couvre-sol argenté, gîte de l’anthidie.'],
  ['helianthemum-nummularium', 'Hélianthème', 'Helianthemum nummularium', 'couvre_sol', 'indigene', 0, [-3, -1, -3, 3, 3], 'couvre-sol|mellifère', 'Pelouses calcaires rases.', 'Tapis jaune sur sol squelettique.'],
  ['allium-sphaerocephalon', 'Ail à tête ronde', 'Allium sphaerocephalon', 'herbacee', 'indigene', 0, [-3, -1, -2, 3, 3], 'mellifère|bulbe', 'Pelouses sèches calcaires.', 'Bulbe estival très mellifère, sans entretien.'],
  ['muscari-neglectum', 'Muscari négligé', 'Muscari neglectum', 'herbacee', 'indigene', 0, [-1, 0, 0, 2, 3], 'bulbe|printemps', 'Prairies sèches, bulbe naturalisable.', 'Bleu de mars dans la prairie.'],
  ['narcissus-pseudonarcissus', 'Jonquille', 'Narcissus pseudonarcissus', 'herbacee', 'indigene', 1, [1, 1, 1, 0, 1], 'bulbe|printemps', 'Prairies fraîches, se naturalise.', 'Colonise durablement les vergers pâturés.'],
  ['tanacetum-vulgare', 'Tanaisie', 'Tanacetum vulgare', 'herbacee', 'indigene', 1, [0, 1, 2, 1, 3], 'auxiliaires|répulsif', 'Friches riches, très rustique.', 'Base de purins et refuge d’auxiliaires.'],
  ['symphytum-officinale', 'Consoude officinale', 'Symphytum officinale', 'herbacee', 'indigene', 1, [2, 2, 3, 1, 2], 'fertilité|mellifère', 'Sols frais très riches.', 'Biomasse fertilisante et nectar continu.'],
  ['urtica-dioica', 'Ortie dioïque', 'Urtica dioica', 'herbacee', 'indigene', 1, [1, 1, 3, 1, 1], 'faune|fertilité', 'Nitrophile stricte ; à cantonner.', 'Plante hôte de cinq papillons emblématiques.'],
  ['borago-officinalis', 'Bourrache', 'Borago officinalis', 'herbacee', 'horticole', 0, [0, 0, 2, 1, 3], 'mellifère|annuelle', 'Annuelle de sol riche, se ressème seule.', 'Nectar record, comble les vides du potager.'],
  ['phacelia-tanacetifolia', 'Phacélie', 'Phacelia tanacetifolia', 'herbacee', 'horticole', 0, [0, 0, 1, 1, 3], 'engrais vert|mellifère', 'Annuelle de couverture, non gélive tardive.', 'Couvre le sol nu et nourrit avant plantation.'],
  ['sinapis-alba', 'Moutarde blanche', 'Sinapis alba', 'herbacee', 'horticole', 0, [0, 1, 2, 2, 3], 'engrais vert', 'Annuelle rapide de sol frais.', 'Structure le sol tassé avant plantation d’automne.'],
];

export const PALETTE_KB: PaletteSpecies[] = ROWS.map(
  ([id, fr, latin, strate, origin, vl, o, services, reason, service]) => ({
    id,
    fr,
    latin,
    strate,
    origin,
    vegetalLocal: vl === 1,
    optima: { eau: o[0], texture: o[1], nutrition: o[2], ph: o[3], lumiere: o[4] },
    services: services.split('|'),
    reason,
    service,
  }),
);

export const PALETTE_BY_ID = new Map(PALETTE_KB.map((s) => [s.id, s]));

export const STRATE_LABEL: Record<PaletteStrate, string> = {
  arbre: 'Arbres',
  arbuste: 'Arbustes',
  grimpante: 'Grimpantes',
  herbacee: 'Herbacées & vivaces',
  couvre_sol: 'Couvre-sol',
};

export const STRATE_ORDER: PaletteStrate[] = ['arbre', 'arbuste', 'grimpante', 'herbacee', 'couvre_sol'];

/**
 * Espèces à écarter par principe (indépendamment du site) : invasives avérées
 * en France métropolitaine ou impasses écologiques fréquentes en jardin.
 */
export const PALETTE_BLACKLIST: Array<{ fr: string; latin: string; why: string }> = [
  { fr: 'Buddleia de David', latin: 'Buddleja davidii', why: 'Invasive avérée : colonise berges et friches, appauvrit les cortèges indigènes. Nourrit les papillons adultes mais aucune chenille locale.' },
  { fr: 'Renouée du Japon', latin: 'Reynoutria japonica', why: 'Invasive majeure : rhizomes indestructibles, déstructure les berges et les fondations.' },
  { fr: 'Robinier faux-acacia', latin: 'Robinia pseudoacacia', why: 'Invasive drageonnante qui enrichit le sol en azote et banalise la flore des lisières maigres.' },
  { fr: 'Herbe de la pampa', latin: 'Cortaderia selloana', why: 'Invasive réglementée : dissémination massive, aucun service faunistique.' },
  { fr: 'Laurier-palme', latin: 'Prunus laurocerasus', why: 'Haie monospécifique invasive en sous-bois, feuillage toxique, valeur faunistique quasi nulle.' },
  { fr: 'Thuya', latin: 'Thuja plicata', why: 'Haie opaque sans nectar ni baies, acidifie le sol, mur végétal biologiquement mort.' },
  { fr: 'Ailante', latin: 'Ailanthus altissima', why: 'Invasive allélopathique, drageonne à grande distance.' },
  { fr: 'Érable negundo', latin: 'Acer negundo', why: 'Invasive des ripisylves, bois cassant, remplace les saules et peupliers indigènes.' },
];

export const PALETTE_SOURCES = [
  'CNPF · G. Dumé, C. Gauberville, D. Mansion, J.-C. Rameau (2018) — Flore forestière française, guide écologique illustré, t.1 Plaines et Collines.',
  'Baseflor / Catminat — Ph. Julve, indices écologiques (humidité, texture, trophie, pH, lumière).',
  'Tela Botanica — référentiel taxonomique TAXREF et chorologie française.',
  'Végétal local — marque OFB : semences et plants d’origine locale tracée.',
  'Liste des espèces exotiques envahissantes — Code de l’environnement, arrêté du 14/02/2018.',
];
