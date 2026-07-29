/**
 * Base de recommandations par type d'ouvrage — socle expert.
 *
 * Chaque fiche est indexée par la clé d'outil du registre `paysageTools.ts`.
 * Ce socle est livré dans le code ; il peut être **surchargé et enrichi** par
 * les administrateurs dans la table `propriete_ouvrage_kb` (voir
 * `useOuvrageRecoKb`). On ne recommande évidemment pas les mêmes gestes pour
 * une mare, un potager ou un pas japonais.
 *
 * Sources principales du socle :
 *  - MSV — Maraîchage Sol Vivant, principes de couverture permanente
 *  - GIEP — Gestion intégrée des eaux pluviales (Cerema)
 *  - CNPF 2018, Flore forestière française (Rameau, Dumé, Gauberville)
 *  - Guides pierre sèche (ABPS) et haies bocagères (Afac-Agroforesteries)
 */

import { PAYSAGE_TOOLS, TOOL_FAMILIES, type PaysageTool, type ToolFamilyKey } from './paysageTools';

export interface OuvrageEntretien {
  an0: string;
  an1: string;
  an3: string;
}

export interface OuvrageReco {
  /** étapes de mise en œuvre, dans l'ordre du chantier */
  miseEnOeuvre: string[];
  /** saison / fenêtre idéale d'intervention */
  calendrier: string;
  entretien: OuvrageEntretien;
  /** végétaux associés ou compagnonnage conseillé */
  especes: string[];
  /** points de vigilance, erreurs classiques */
  vigilance: string[];
  sources: string[];
}

const S_MSV = 'MSV — Maraîchage Sol Vivant';
const S_GIEP = 'GIEP / Cerema — Gestion intégrée des eaux pluviales';
const S_CNPF = 'CNPF 2018 — Flore forestière française (plaines et collines)';
const S_ABPS = 'ABPS — Artisans bâtisseurs en pierre sèche';
const S_AFAC = 'Afac-Agroforesteries — Haies et bocage';

/** Fiches rédigées, type par type. */
export const OUVRAGE_RECO_KB: Record<string, OuvrageReco> = {
  /* ── Eau & GIEP ─────────────────────────────────────────────── */
  mare: {
    miseEnOeuvre: [
      'Vérifier l’alimentation : eaux de toiture, ruissellement de surface ou nappe affleurante — jamais un remplissage au réseau.',
      'Creuser en profils étagés : une berge en pente douce (1/4 minimum) sur au moins un tiers du linéaire, une zone profonde de 80 à 120 cm hors gel.',
      'Étanchéité selon le sol : argile compactée si la texture le permet, sinon géotextile + EPDM (bâche PVC proscrite).',
      'Créer une plage de sortie (rampe minérale ou bois) : sans elle, hérissons et amphibiens se noient.',
      'Laisser la mare se coloniser seule pendant une saison avant toute plantation dense.',
    ],
    calendrier:
      'Terrassement de fin d’été à début d’automne (sol ressuyé, portance bonne) ; mise en eau naturelle par les pluies d’hiver.',
    entretien: {
      an0: 'Surveiller la tenue des berges après chaque gros orage. Aucun entretien du fond. Ne jamais introduire de poissons.',
      an1: 'Faucher la ceinture herbacée une seule fois, à l’automne, en laissant 30 % non fauché en refuge.',
      an3: 'Curage très partiel (un tiers maximum) tous les 5 à 10 ans, en septembre, en déposant les vases 48 h en bordure pour laisser fuir la faune.',
    },
    especes: [
      'Ceinture humide : Iris pseudacorus, Lythrum salicaria, Mentha aquatica, Caltha palustris',
      'Immergées oxygénantes : Ceratophyllum demersum, Myriophyllum spicatum',
      'Bord : Carex pendula, Filipendula ulmaria, Eupatorium cannabinum',
      'À bannir absolument : Ludwigia, Elodea, Myriophyllum aquaticum (invasives réglementées)',
    ],
    vigilance: [
      'Ombrage : au-delà de 50 % d’ombre portée, l’eau se ferme et la biodiversité chute.',
      'Une mare de moins de 20 m² s’assèche vite en été — assumer un assèchement estival est écologiquement acceptable, pas un échec.',
      'Déclaration obligatoire au-delà de certains seuils (loi sur l’eau) : vérifier avant de creuser.',
    ],
    sources: [S_GIEP, 'Pôle-relais mares et vallées alluviales'],
  },
  'jardin-pluie': {
    miseEnOeuvre: [
      'Calculer le volume : viser 5 à 10 % de la surface de toiture raccordée.',
      'Tester la perméabilité (essai Porchet) : sous 10 mm/h, prévoir un drain de surverse.',
      'Décaisser 20 à 40 cm, remplir d’un mélange 60 % sable / 30 % terre végétale / 10 % compost.',
      'Aménager une surverse vers un exutoire sûr, jamais vers un mur ou une fondation.',
    ],
    calendrier: 'Terrassement en fin d’été, plantation en automne pour un enracinement avant l’été suivant.',
    entretien: {
      an0: 'Arrosage d’établissement uniquement en cas de sécheresse marquée. Retirer les sédiments à l’entrée.',
      an1: 'Recharger le paillage, vérifier que l’entrée d’eau ne s’est pas colmatée.',
      an3: 'Décompacter la zone d’entrée si l’infiltration ralentit ; renouveler les vivaces les plus faibles.',
    },
    especes: [
      'Fond humide temporaire : Carex, Juncus effusus, Iris sibirica',
      'Talus drainant : Achillea millefolium, Salvia nemorosa, Deschampsia cespitosa',
    ],
    vigilance: [
      'Distance minimale de 3 m à toute fondation.',
      'Un jardin de pluie n’est pas une mare : il doit se vider en moins de 48 h.',
    ],
    sources: [S_GIEP],
  },
  noue: {
    miseEnOeuvre: [
      'Suivre la ligne de plus grande pente avec une pente longitudinale faible (0,5 à 2 %).',
      'Profil large et peu profond (rapport 3/1 minimum) pour rester tondable et sûr.',
      'Semer un mélange prairial rustique dès le terrassement fini : le sol nu se ravine en un orage.',
    ],
    calendrier: 'Terrassement fin d’été, semis dans la foulée (septembre) ou au printemps.',
    entretien: {
      an0: 'Ressemer les zones érodées. Contrôler après chaque épisode pluvieux intense.',
      an1: 'Deux fauches par an, hauteur 10 cm minimum, export des produits de fauche.',
      an3: 'Une fauche tardive annuelle suffit ; reprofiler ponctuellement les amorces d’érosion.',
    },
    especes: ['Mélange prairial : Festuca rubra, Lotus corniculatus, Achillea millefolium, Prunella vulgaris'],
    vigilance: ['Ne jamais tondre à ras : la noue perd sa capacité filtrante.'],
    sources: [S_GIEP],
  },
  baissiere: {
    miseEnOeuvre: [
      'Tracer strictement sur courbe de niveau (niveau à bulle, niveau égyptien ou GPS) : 5 cm d’erreur suffisent à créer un ravin.',
      'Fossé amont, merlon aval planté : le merlon reçoit les arbres.',
      'Prévoir un déversoir enherbé en point bas pour les épisodes exceptionnels.',
    ],
    calendrier: 'Ouverture en fin d’été ; plantation du merlon en novembre-décembre.',
    entretien: {
      an0: 'Vérifier le niveau après les premières pluies, corriger les points bas.',
      an1: 'Maintenir le merlon couvert (paillage ou couvert vivant permanent).',
      an3: 'La baissière se comble naturellement : c’est le signe qu’elle fonctionne. Reprofiler seulement si elle déborde.',
    },
    especes: ['Merlon : arbres fruitiers rustiques, Sambucus nigra, Corylus avellana, consoude en pied'],
    vigilance: ['Interdit en terrain instable ou en amont immédiat d’une habitation.'],
    sources: [S_GIEP, 'Permaculture — design en courbes de niveau'],
  },
  'tranchee-infiltration': {
    miseEnOeuvre: [
      'Excaver 60 à 100 cm, envelopper d’un géotextile perméable, remplir de galets 40/70 lavés.',
      'Prévoir un regard de visite en tête pour le contrôle et le curage.',
    ],
    calendrier: 'Toute l’année hors sol gelé ou détrempé.',
    entretien: {
      an0: 'Contrôle visuel du regard après chaque forte pluie.',
      an1: 'Nettoyage du regard, vérification du temps de vidange.',
      an3: 'Remplacement de la couche filtrante de surface si le colmatage est avéré.',
    },
    especes: ['Aucune plantation directe ; enherber les abords en couvert permanent.'],
    vigilance: ['Le colmatage par fines est la cause d’échec numéro un : filtrer en amont.'],
    sources: [S_GIEP],
  },
  citerne: {
    miseEnOeuvre: [
      'Dimensionner : surface de toiture × 0,6 m de pluie annuelle × 0,9 de rendement.',
      'Installer un filtre à feuilles et un dispositif anti-moustique.',
      'Trop-plein raccordé à une noue ou un jardin de pluie, jamais au réseau.',
    ],
    calendrier: 'Pose possible toute l’année ; idéalement avant l’automne pour un premier remplissage gratuit.',
    entretien: {
      an0: 'Nettoyage du filtre chaque trimestre la première année.',
      an1: 'Vidange et rinçage annuels du fond.',
      an3: 'Contrôle de l’étanchéité et des joints.',
    },
    especes: ['Sans objet — habiller la cuve avec une grimpante caduque (Clematis vitalba, Lonicera).'],
    vigilance: ['Eau non potable : signalétique obligatoire sur tout robinet.'],
    sources: [S_GIEP],
  },
  desimpermeabilisation: {
    miseEnOeuvre: [
      'Déposer l’enrobé ou la dalle, évacuer les gravats, puis décompacter la plateforme sur 40 cm (sous-solage, jamais retournement).',
      'Apporter 5 à 10 cm de compost mûr en surface, sans enfouir.',
      'Semer immédiatement un couvert d’implantation (seigle, phacélie, trèfle).',
    ],
    calendrier: 'Chantier de fin d’été, couvert semé avant les pluies d’automne.',
    entretien: {
      an0: 'Ne rien planter de pérenne la première année : laisser le sol se restructurer.',
      an1: 'Rouler ou faucher le couvert, ressemer une seconde génération.',
      an3: 'Plantation définitive possible ; le taux de matière organique doit avoir progressé.',
    },
    especes: ['Couverts pionniers : Secale cereale, Phacelia tanacetifolia, Trifolium incarnatum, Vicia sativa'],
    vigilance: ['Analyser les remblais avant réemploi : un fond de parking peut être pollué.'],
    sources: [S_MSV, 'ZAN — Zéro artificialisation nette'],
  },

  /* ── Sol vivant / MSV ───────────────────────────────────────── */
  'planche-permanente': {
    miseEnOeuvre: [
      'Fixer une trame définitive : planches de 80 cm, passe-pieds de 40 cm, jamais renégociés.',
      'Occultation bâche ou carton 6 à 10 semaines si la parcelle est enherbée.',
      'Apport de 5 cm de compost en surface, puis paillage permanent.',
      'Décompactage à la grelinette uniquement, jamais de retournement.',
    ],
    calendrier: 'Occultation d’automne pour une première culture au printemps suivant.',
    entretien: {
      an0: 'Ne jamais marcher sur la planche. Maintenir la couverture toute l’année.',
      an1: 'Rotation en place, apport de 3 cm de compost par an, faux-semis pour gérer l’adventice.',
      an3: 'La structure se construit seule : réduire les apports, augmenter la part de couverts vivants.',
    },
    especes: [
      'Couverts d’intersaison : Vicia faba, Avena strigosa, Trifolium incarnatum',
      'Compagnonnage : œillet d’Inde, capucine, coriandre en bordure d’auxiliaires',
    ],
    vigilance: [
      'Le tassement des passe-pieds est normal et souhaitable : c’est le prix de la planche intacte.',
      'Un paillage trop épais au printemps retarde le réchauffement — l’écarter deux semaines avant semis.',
    ],
    sources: [S_MSV],
  },
  butte: {
    miseEnOeuvre: [
      'Réserver la butte aux sols lourds, hydromorphes ou peu profonds — inutile ailleurs.',
      'Base de bois mort raméal si butte type hügel, puis terre, puis compost, puis paillage.',
      'Orientation nord-sud, hauteur 40 cm maximum pour ne pas assécher.',
    ],
    calendrier: 'Montage à l’automne, plantation au printemps après tassement naturel.',
    entretien: {
      an0: 'Arroser plus qu’une planche à plat : la butte draine, donc sèche.',
      an1: 'Recharger le sommet qui s’affaisse, maintenir le paillage.',
      an3: 'La butte s’aplatit : soit on la recharge, soit on la laisse devenir planche permanente.',
    },
    especes: ['Sommet : cucurbitacées, aromatiques méditerranéennes. Flanc nord : salades, épinards.'],
    vigilance: ['En climat sec, la butte est une erreur classique : elle amplifie le stress hydrique.'],
    sources: [S_MSV],
  },
  'couverture-permanente': {
    miseEnOeuvre: [
      'Choisir la matière selon le C/N : paille pour couvrir, tonte fine pour nourrir, BRF pour construire l’humus.',
      'Épaisseur 5 à 15 cm selon la matière, sans jamais coller aux collets.',
    ],
    calendrier: 'Poser à l’entrée de l’été pour l’eau, à l’entrée de l’hiver pour la vie du sol.',
    entretien: {
      an0: 'Recharger deux fois dans l’année : le paillage se minéralise vite sur sol nu affamé.',
      an1: 'Une recharge annuelle suffit généralement.',
      an3: 'Basculer vers un couvert vivant permanent : moins de manutention, plus de racines.',
    },
    especes: ['Couverts vivants : Trifolium repens, Medicago lupulina, Fragaria vesca en sous-couvert'],
    vigilance: ['Le paillage frais azoté en forte épaisseur fermente et brûle les racines.'],
    sources: [S_MSV],
  },
  brf: {
    miseEnOeuvre: [
      'Broyer des rameaux de moins de 7 cm de diamètre, feuillus, dans les 48 h suivant la coupe.',
      'Épandre 3 à 5 cm en surface, sans enfouir : le BRF enfoui provoque une faim d’azote.',
    ],
    calendrier: 'Automne, pour laisser l’hiver amorcer la dégradation fongique.',
    entretien: {
      an0: 'Compenser la faim d’azote éventuelle par un apport de légumineuses ou de compost mûr.',
      an1: 'Recharge légère, la vie fongique prend le relais.',
      an3: 'Apport tous les 2 à 3 ans seulement.',
    },
    especes: ['Associer une légumineuse fixatrice : Trifolium, Vicia, Lupinus.'],
    vigilance: ['Éviter les résineux en forte proportion et tout bois traité.'],
    sources: [S_MSV],
  },
  'zone-non-travail': {
    miseEnOeuvre: [
      'Matérialiser physiquement le périmètre (piquets, bordure vivante) pour que l’engin ne rentre plus.',
      'Décompacter une dernière fois, puis ne plus jamais intervenir mécaniquement.',
    ],
    calendrier: 'Décision à prendre en sortie d’hiver, avant la reprise des chantiers.',
    entretien: {
      an0: 'Observer : le test bêche annuel documente le retour de la porosité.',
      an1: 'Maintenir un couvert permanent ; aucune circulation.',
      an3: 'Comparer un profil de sol avec une zone témoin circulée : c’est l’argument client le plus fort.',
    },
    especes: ['Couvert permanent multi-espèces à enracinement contrasté (graminées + légumineuses + crucifères).'],
    vigilance: ['Une seule benne posée annule trois ans de restructuration.'],
    sources: [S_MSV],
  },
  lasagne: {
    miseEnOeuvre: [
      'Carton brun non imprimé au contact du sol, largement recouvrant.',
      'Alterner couches brunes (paille, feuilles) et vertes (tontes, déchets de cuisine), 30 cm au total.',
      'Terminer par 5 cm de compost mûr pour planter tout de suite.',
    ],
    calendrier: 'Montage en automne pour planter au printemps ; possible au printemps avec plants repiqués.',
    entretien: {
      an0: 'Arroser copieusement au montage puis maintenir humide le premier mois.',
      an1: 'La lasagne s’affaisse de moitié : recharger en matière brune.',
      an3: 'Le sol reconstitué prend le relais : passer en planche permanente.',
    },
    especes: ['Première année : cucurbitacées, pommes de terre, courges — gourmandes et couvrantes.'],
    vigilance: ['Cartons avec adhésif ou encre couleur à écarter.'],
    sources: [S_MSV],
  },

  /* ── Nourricier ─────────────────────────────────────────────── */
  potager: {
    miseEnOeuvre: [
      'Placer le potager à moins de 30 m de la cuisine et d’un point d’eau : la distance tue les potagers, pas le sol.',
      'Exposition sud à sud-est, 6 h de soleil minimum, à l’abri du vent dominant.',
      'Trame de planches permanentes plutôt qu’une parcelle unique labourée.',
      'Prévoir dès le départ le stockage : compost, réserve d’eau, rangement outils.',
    ],
    calendrier: 'Préparation à l’automne (occultation), premières cultures au printemps.',
    entretien: {
      an0: 'Viser petit et bien tenu : 30 m² réellement cultivés valent mieux que 200 m² enfrichés.',
      an1: 'Mettre en place la rotation sur 4 familles, installer les vivaces de bordure.',
      an3: 'Sol structuré : réduire les apports, augmenter la part de vivaces et d’auto-semis.',
    },
    especes: [
      'Bordure d’auxiliaires : Calendula officinalis, Borago officinalis, Phacelia, Tagetes',
      'Vivaces productives : rhubarbe, artichaut, ciboulette, oseille, livèche',
      'Compagnonnage : carotte + poireau, tomate + basilic, courge + maïs + haricot',
    ],
    vigilance: [
      'Sol de potager en ville : analyse plomb/HAP indispensable avant toute culture racinaire.',
      'Un potager sans eau accessible en été est abandonné dès la deuxième saison.',
    ],
    sources: [S_MSV],
  },
  verger: {
    miseEnOeuvre: [
      'Choisir porte-greffe et variétés selon le sol et le climat, en privilégiant les variétés locales.',
      'Espacement réel adulte : 6 à 10 m en plein vent — la faute la plus fréquente est la densité excessive.',
      'Trou de plantation large, jamais profond ; collet impérativement hors sol.',
      'Tuteur bipode, protection anti-gibier, cuvette d’arrosage et paillage large.',
    ],
    calendrier: 'Plantation à racines nues de novembre à mars, hors gel — « à la Sainte-Catherine ».',
    entretien: {
      an0: 'Trois arrosages copieux l’été (50 L) valent mieux que dix petits. Taille de formation légère.',
      an1: 'Taille de formation, retrait du tuteur dès que possible, maintien du paillage.',
      an3: 'Passage en taille de fructification ; enherbement permanent inter-rangs avec fauche tardive.',
    },
    especes: [
      'Strate basse : consoude, tanaisie, capucine en pied d’arbre',
      'Fixateurs d’azote : Elaeagnus umbellata, Alnus glutinosa en bordure humide',
      'Prairie de fauche inter-rangs riche en légumineuses',
    ],
    vigilance: [
      'Collet enterré = mort à 5 ans, cause n°1 d’échec en verger.',
      'Ne pas tondre à ras autour du tronc : blessures de rotofil.',
    ],
    sources: [S_CNPF, 'RGF — Réseau des greffeurs et variétés fruitières locales'],
  },
  'haie-fruitiere': {
    miseEnOeuvre: [
      'Préparer une bande décompactée d’1,5 m de large, paillée avant plantation.',
      'Alterner petits fruits et arbustes fruitiers tous les 1 à 1,5 m.',
      'Poser un paillage biodégradable continu, jamais un film plastique.',
    ],
    calendrier: 'Plantation en racines nues, novembre à février.',
    entretien: {
      an0: 'Arrosage d’établissement la première saison sèche ; désherbage du pied uniquement.',
      an1: 'Taille de formation, recharge du paillage.',
      an3: 'Taille de fructification et rajeunissement progressif des vieux bois.',
    },
    especes: [
      'Ribes rubrum, Ribes nigrum, Rubus idaeus, Corylus avellana, Amelanchier, Aronia, Sambucus nigra',
    ],
    vigilance: ['Concurrence herbacée fatale les deux premières années : le paillage n’est pas optionnel.'],
    sources: [S_AFAC],
  },
  'foret-jardin': {
    miseEnOeuvre: [
      'Concevoir en 7 strates, en partant de la canopée : c’est la canopée qui fixe tout le reste.',
      'Planter d’abord les arbres de structure et les fixateurs d’azote, les strates basses viendront en An 2-3.',
      'Prévoir des cheminements permanents dès le départ : une forêt-jardin sans accès n’est jamais récoltée.',
    ],
    calendrier: 'Plantation ligneuse en hiver ; strates herbacées au printemps suivant.',
    entretien: {
      an0: 'Paillage massif, arrosage d’établissement, protection contre le gibier.',
      an1: 'Éclaircir les fixateurs qui prennent trop de place, densifier les strates basses.',
      an3: 'Gestion par récolte et éclaircie sélective : on taille pour la lumière, pas pour la forme.',
    },
    especes: [
      'Canopée : Castanea sativa, Juglans regia, Malus, Prunus avium',
      'Fixateurs : Elaeagnus, Alnus, Robinia (à contenir)',
      'Arbustive : Corylus, Ribes, Amelanchier — Herbacée : consoude, ail des ours, fraisier',
    ],
    vigilance: ['La densité de plantation initiale doit anticiper l’ombre à 10 ans, pas à 2 ans.'],
    sources: [S_CNPF],
  },
  aromatiques: {
    miseEnOeuvre: [
      'Drainage avant tout : décaisser et incorporer graviers ou sable sur sol lourd.',
      'Paillage minéral pour les méditerranéennes, organique pour les vivaces fraîches.',
    ],
    calendrier: 'Plantation au printemps pour les méditerranéennes, en automne pour les vivaces rustiques.',
    entretien: {
      an0: 'Aucun arrosage au-delà de l’établissement pour les méditerranéennes : l’excès d’eau tue.',
      an1: 'Taille légère après floraison pour maintenir le port compact.',
      an3: 'Rajeunir ou remplacer les sujets ligneux dégarnis (lavande, thym : durée de vie 8-10 ans).',
    },
    especes: [
      'Sec : Thymus vulgaris, Lavandula, Salvia officinalis, Rosmarinus, Santolina',
      'Frais : Mentha (à contenir), Melissa officinalis, Levisticum, Allium schoenoprasum',
    ],
    vigilance: ['La menthe et la mélisse colonisent : les contenir en pot enterré ou en bordure fermée.'],
    sources: [S_CNPF],
  },
  serre: {
    miseEnOeuvre: [
      'Orientation faîtage est-ouest en production, nord-sud pour un usage saisonnier.',
      'Ventilation haute obligatoire : c’est l’excès de chaleur, pas le froid, qui détruit les cultures.',
      'Sol de serre traité comme une planche permanente : jamais de travail profond.',
    ],
    calendrier: 'Montage à l’automne pour un démarrage précoce au printemps.',
    entretien: {
      an0: 'Surveiller l’arrosage : sous serre, la pluie n’arrive jamais.',
      an1: 'Nettoyage annuel des parois, apport de compost, couvert d’hiver.',
      an3: 'Vérifier la salinisation du sol (irrigation sans lessivage) ; ouvrir la serre l’hiver.',
    },
    especes: ['Couverts d’hiver sous abri : seigle, vesce. Auxiliaires : capucine en plante-piège pucerons.'],
    vigilance: ['Déclaration préalable au-delà de 5 m² d’emprise dans la plupart des communes.'],
    sources: [S_MSV],
  },
  treille: {
    miseEnOeuvre: [
      'Structure dimensionnée pour 30 kg/m² de charge végétale humide.',
      'Plantation à 40 cm minimum du pied de mur, en inclinant le plant vers la structure.',
    ],
    calendrier: 'Pose de la structure à l’automne, plantation en hiver.',
    entretien: {
      an0: 'Palissage régulier des jeunes pousses, arrosage d’établissement.',
      an1: 'Taille de formation : établir la charpente définitive.',
      an3: 'Taille annuelle de fructification en hiver, ébourgeonnage en vert.',
    },
    especes: ['Vitis vinifera de table, Actinidia (kiwi, pieds mâle + femelle), Wisteria pour l’ombre pure'],
    vigilance: ['La glycine détruit les structures légères : réserver aux poteaux maçonnés.'],
    sources: [S_CNPF],
  },

  /* ── Patrimoine & structures ────────────────────────────────── */
  'mur-pierre-seche': {
    miseEnOeuvre: [
      'Fondation décaissée de 20 à 30 cm, hérisson drainant, jamais de béton.',
      'Fruit de 10 à 15 %, boutisses traversantes tous les mètres, lit de pose horizontal.',
      'Réemploi de la pierre locale : la pierre importée trahit le paysage.',
    ],
    calendrier: 'Toute l’année hors gel ; l’été facilite le tri et la manutention.',
    entretien: {
      an0: 'Laisser la structure se tasser, ne rien reprendre avant un hiver complet.',
      an1: 'Reprise ponctuelle des pierres descellées après le premier cycle gel-dégel.',
      an3: 'Contrôle décennal ; la végétation herbacée des joints est un atout, pas un défaut.',
    },
    especes: ['Flore de murs : Sedum, Umbilicus rupestris, Asplenium trichomanes, Cymbalaria muralis'],
    vigilance: [
      'Ne jamais jointoyer au mortier : le mur perd son drainage et se disloque.',
      'Un mur de soutènement de plus d’1,20 m relève de l’ouvrage d’art — faire valider.',
    ],
    sources: [S_ABPS],
  },
  restanque: {
    miseEnOeuvre: [
      'Relever précisément la pente et le linéaire avant tout terrassement.',
      'Mur en pierre sèche appareillé, remblai drainant en arrière, terre végétale en surface.',
      'Prévoir l’évacuation des eaux en tête de terrasse.',
    ],
    calendrier: 'Chantier de printemps ou d’automne, hors périodes de fortes pluies.',
    entretien: {
      an0: 'Surveiller les ventres de mur après les premières pluies.',
      an1: 'Reprise des désordres ponctuels, maintien du couvert sur la terrasse.',
      an3: 'Inspection après tout épisode cévenol ou hiver rigoureux.',
    },
    especes: ['Terrasse : oliviers, amandiers, vigne, aromatiques méditerranéennes.'],
    vigilance: ['La restanque est un ouvrage hydraulique autant que paysager : le drainage prime.'],
    sources: [S_ABPS],
  },
  plessis: {
    miseEnOeuvre: [
      'Piquets de châtaignier ou robinier tous les 40 cm, fichés de 40 cm.',
      'Tressage en frais avec des baliveaux de noisetier ou de saule, en croisant les brins.',
    ],
    calendrier: 'Tressage en hiver, sève descendue, brins souples.',
    entretien: {
      an0: 'Resserrer le tressage après le premier retrait du bois.',
      an1: 'Compléter les brins cassés.',
      an3: 'Durée de vie 7 à 12 ans selon l’essence ; renouveler par tronçons.',
    },
    especes: ['Saule vivant tressé (Salix viminalis) pour un plessis qui reprend et devient haie.'],
    vigilance: ['Un plessis de saule vivant demande une taille annuelle sinon il devient arbre.'],
    sources: [S_AFAC],
  },
  'haie-bocagere': {
    miseEnOeuvre: [
      'Composer en trois strates : arbres de haut jet, arbustes, ourlet herbacé.',
      'Minimum 5 essences locales, plants d’origine tracée (label Végétal local).',
      'Paillage biodégradable continu et protection gibier selon la pression.',
    ],
    calendrier: 'Plantation en racines nues, novembre à mars.',
    entretien: {
      an0: 'Aucun recépage ; désherbage du pied et arrosage en cas de sécheresse sévère.',
      an1: 'Recépage sélectif des arbustes pour épaissir la base.',
      an3: 'Taille latérale tous les 3 ans, hors période de nidification (15 mars – 31 juillet).',
    },
    especes: [
      'Prunus spinosa, Crataegus monogyna, Corylus avellana, Cornus sanguinea, Viburnum lantana, Acer campestre, Quercus en haut jet',
    ],
    vigilance: [
      'Taille interdite en période de nidification.',
      'Une haie mono-spécifique de thuya n’est pas une haie bocagère : elle n’offre ni gîte ni couvert.',
    ],
    sources: [S_AFAC, S_CNPF],
  },
  charmille: {
    miseEnOeuvre: [
      'Plantation dense (3 plants/ml), taille dès la première année pour densifier la base.',
      'Sol préparé en tranchée continue, pas en trous individuels.',
    ],
    calendrier: 'Plantation en hiver, première taille en juin de l’année suivante.',
    entretien: {
      an0: 'Arrosage d’établissement, paillage.',
      an1: 'Deux tailles par an (juin et septembre) pour un port net.',
      an3: 'Taille annuelle unique en fin d’été suffit sur sujet établi.',
    },
    especes: ['Carpinus betulus (marcescent, garde sa feuille l’hiver), Fagus sylvatica en sol frais'],
    vigilance: ['Le charme souffre en sol sec et calcaire superficiel : préférer le troène ou l’érable champêtre.'],
    sources: [S_CNPF],
  },
  'carres-francais': {
    miseEnOeuvre: [
      'Modules de 1,20 m maximum : au-delà, on ne peut plus atteindre le centre.',
      'Bordures en bois non traité, châtaignier ou douglas ; éviter les traverses créosotées.',
      'Fond ouvert sur la terre en place, jamais un fond plein.',
    ],
    calendrier: 'Montage en hiver, remplissage et plantation au printemps.',
    entretien: {
      an0: 'Le substrat se tasse : recharger en compost au bout de six mois.',
      an1: 'Rotation entre carrés, apport annuel de compost.',
      an3: 'Contrôler l’état des bordures bois ; remplacer par module.',
    },
    especes: ['Association classique : salades + radis + carottes + aromatiques en bordure.'],
    vigilance: ['Un carré surélevé sèche deux fois plus vite qu’une planche à plat.'],
    sources: [S_MSV],
  },
  'allee-cavaliere': {
    miseEnOeuvre: [
      'Tracer depuis le point de vue majeur : la perspective se dessine depuis l’œil, pas depuis le plan.',
      'Alignement régulier, essence unique, espacement constant.',
    ],
    calendrier: 'Plantation hivernale, tracé validé sur site au printemps précédent.',
    entretien: {
      an0: 'Arrosage d’établissement, tuteurage soigné : un alignement de travers ne se rattrape pas.',
      an1: 'Taille de formation identique sur tous les sujets.',
      an3: 'Remplacer immédiatement tout manquant : un trou dans un alignement se voit dix ans.',
    },
    especes: ['Tilia cordata, Platanus (hors zones à chancre coloré), Carpinus betulus, Quercus robur'],
    vigilance: ['Anticiper le gabarit adulte et les réseaux enterrés.'],
    sources: [S_CNPF],
  },
  'bassin-agrement': {
    miseEnOeuvre: [
      'Étanchéité soignée, margelle en pierre locale, profondeur 60 à 80 cm.',
      'Circulation d’eau minimale (filtration végétale) pour éviter l’eutrophisation.',
    ],
    calendrier: 'Terrassement en été, mise en eau à l’automne.',
    entretien: {
      an0: 'Retirer les filaments d’algues manuellement ; l’équilibre s’installe en une saison.',
      an1: 'Taille des plantes de berge à l’automne, nettoyage de la filtration.',
      an3: 'Curage partiel tous les 5 ans.',
    },
    especes: ['Nymphaea (couvrir un tiers de la surface), Iris, Pontederia — proscrire les invasives.'],
    vigilance: ['Bassin d’agrément ≠ mare écologique : il n’a pas la même valeur biodiversité, le dire au client.'],
    sources: [S_GIEP],
  },
  cabane: {
    miseEnOeuvre: [
      'Implantation en lisière plutôt qu’au centre : la cabane structure la limite.',
      'Fondations ponctuelles (plots) plutôt qu’une dalle, pour ne pas imperméabiliser.',
      'Bois local non traité, bardage ventilé.',
    ],
    calendrier: 'Chantier de belle saison.',
    entretien: {
      an0: 'Vérifier l’écoulement des eaux de toiture — les diriger vers une noue ou une cuve.',
      an1: 'Contrôle des fixations et du bardage.',
      an3: 'Traitement naturel du bois exposé si nécessaire (huile, saturateur).',
    },
    especes: ['Habiller d’une grimpante caduque au sud pour l’ombre d’été.'],
    vigilance: ['Déclaration préalable au-delà de 5 m², permis au-delà de 20 m².'],
    sources: ['Règlement national d’urbanisme'],
  },

  /* ── Biodiversité ───────────────────────────────────────────── */
  'prairie-fleurie': {
    miseEnOeuvre: [
      'Appauvrir le sol si nécessaire (export de terre végétale) : une prairie fleurie échoue sur sol riche.',
      'Semis à faible densité (2 à 4 g/m²), semences locales, roulage après semis.',
      'Ne pas mélanger avec un gazon : les graminées de gazon étouffent tout.',
    ],
    calendrier: 'Semis de fin d’été (septembre) ou début de printemps.',
    entretien: {
      an0: 'Une fauche de nettoyage en juillet si les adventices annuelles dominent.',
      an1: 'Une fauche tardive unique (fin août-septembre), export impératif des produits.',
      an3: 'Fauche tardive annuelle avec 20 % de zones non fauchées tournantes.',
    },
    especes: [
      'Centaurea jacea, Leucanthemum vulgare, Knautia arvensis, Daucus carota, Lotus corniculatus, Papaver rhoeas',
    ],
    vigilance: [
      'Sans export de la fauche, le sol s’enrichit et la prairie retourne à l’ortie en trois ans.',
      'Mélanges horticoles « fleurs des champs » : jolis un an, morts le second. Exiger du semencier local.',
    ],
    sources: [S_CNPF, 'Végétal local — semences d’origine tracée'],
  },
  'hotel-insectes': {
    miseEnOeuvre: [
      'Orientation sud à sud-est, à 30-100 cm du sol, à l’abri de la pluie battante.',
      'Diamètres de perçage variés (2 à 10 mm), profondeur 10 cm, trous borgnes et poncés.',
      'Bois sec non traité, jamais de bambou éclaté ni de pomme de pin décorative.',
    ],
    calendrier: 'Installation en fin d’hiver, avant l’émergence des premières abeilles solitaires (février).',
    entretien: {
      an0: 'Ne rien toucher : l’occupation se fait la première saison.',
      an1: 'Renouveler un tiers des modules occupés depuis deux ans.',
      an3: 'Remplacement complet des tiges creuses tous les 3 ans pour limiter les parasites.',
    },
    especes: ['Attirer les pollinisateurs : plage de fleurs mellifères à moins de 50 m — sinon l’hôtel reste vide.'],
    vigilance: ['Un hôtel à insectes sans ressource florale à proximité est un objet décoratif, pas un habitat.'],
    sources: ['OPIE — Office pour les insectes et leur environnement'],
  },
  'tas-bois': {
    miseEnOeuvre: [
      'Empiler bois mort de diamètres variés, en partie enterré, à l’ombre et au frais.',
      'Volume minimal 1 m³ pour que le microclimat intérieur se maintienne.',
    ],
    calendrier: 'Constitution à l’automne, avec les produits d’élagage du site.',
    entretien: {
      an0: 'Aucun. Le tas doit se décomposer.',
      an1: 'Recharger le sommet avec les nouveaux bois de taille.',
      an3: 'Le tas s’affaisse : c’est du gîte à saproxyliques, ne pas l’évacuer.',
    },
    especes: ['Accueille : Lucanus cervus, carabes, orvet, hérisson, mésanges en quête d’insectes.'],
    vigilance: ['Éloigner de 5 m des constructions bois (termites, capricornes).'],
    sources: ['OPIE'],
  },
  pierrier: {
    miseEnOeuvre: [
      'Pierres locales de calibres variés, empilées à sec sur une base drainante, exposition sud.',
      'Ménager des cavités profondes, hors gel, accessibles depuis le sol.',
    ],
    calendrier: 'Toute l’année ; l’automne permet une colonisation dès le printemps.',
    entretien: {
      an0: 'Aucun.',
      an1: 'Dégager la végétation ligneuse qui ombragerait le pierrier.',
      an3: 'Maintenir 70 % d’ensoleillement : le pierrier vaut par sa chaleur.',
    },
    especes: ['Flore : Sedum album, Sempervivum. Faune : lézard des murailles, orvet, hyménoptères terricoles.'],
    vigilance: ['Un pierrier ombragé perd tout son intérêt herpétologique.'],
    sources: ['SHF — Société herpétologique de France'],
  },
  nichoir: {
    miseEnOeuvre: [
      'Diamètre du trou selon l’espèce visée : 28 mm (mésange bleue), 32 mm (mésange charbonnière), 45 mm (étourneau).',
      'Orientation est à sud-est, inclinée vers l’avant, à 2-4 m de hauteur, hors trajectoire des chats.',
      'Bois brut de 18 mm minimum, sans perchoir extérieur (il aide les prédateurs).',
    ],
    calendrier: 'Pose entre octobre et janvier, avant les prospections de territoire.',
    entretien: {
      an0: 'Ne pas ouvrir pendant la nidification.',
      an1: 'Nettoyage annuel en octobre : retirer l’ancien nid, brosser à sec, sans produit.',
      an3: 'Contrôler la fixation et l’état du bois ; remplacer les planches fendues.',
    },
    especes: ['Ressource associée : arbres à insectes et haie multistrate à proximité immédiate.'],
    vigilance: ['Espacer les nichoirs d’une même espèce d’au moins 20 m : les mésanges sont territoriales.'],
    sources: ['LPO — Ligue pour la protection des oiseaux'],
  },
  corridor: {
    miseEnOeuvre: [
      'Relier deux réservoirs de biodiversité existants : un corridor qui ne relie rien ne sert à rien.',
      'Largeur utile minimale 5 m ; continuité au sol prioritaire sur la continuité aérienne.',
      'Traiter les points de rupture (clôtures, murs) par des passages à faune de 15 cm.',
    ],
    calendrier: 'Plantation hivernale ; suppression des ruptures possible toute l’année.',
    entretien: {
      an0: 'Paillage et protection des plants ; aucun traitement.',
      an1: 'Regarnir les manquants, maintenir la continuité au sol.',
      an3: 'Fauche tardive alternée d’une moitié par an pour conserver un refuge permanent.',
    },
    especes: ['Cortège local multistrate : arbustes à baies, ourlet herbacé indigène.'],
    vigilance: ['Éclairage nocturne : un corridor éclairé est une barrière pour les chiroptères.'],
    sources: ['Trame verte et bleue — SRCE'],
  },

  /* ── Circulation & usage ────────────────────────────────────── */
  'pas-japonais': {
    miseEnOeuvre: [
      'Marcher réellement le tracé avant de poser : le pas japonais suit la ligne de désir, jamais le dessin.',
      'Entraxe de 60 à 65 cm d’axe en axe — la mesure du pas moyen, à vérifier avec le client.',
      'Dalles de 40 cm minimum, posées sur lit de sable stabilisé de 5 cm sur fond décompacté.',
      'Affleurer le niveau du sol fini pour permettre le passage de la tondeuse.',
    ],
    calendrier: 'Pose de printemps ou d’automne, sol ressuyé.',
    entretien: {
      an0: 'Reprendre le calage des dalles qui bougent après le premier hiver.',
      an1: 'Contrôle du niveau, appoint de sable sous les dalles descendues.',
      an3: 'Nettoyage des dalles glissantes (brosse, jamais de javel) ; laisser les joints se végétaliser.',
    },
    especes: [
      'Joints piétinables : Thymus serpyllum, Sagina subulata, Mentha requienii, Leptinella squalida',
    ],
    vigilance: [
      'Un entraxe régulier mais faux oblige à un pas artificiel : mesurer sur la personne qui l’empruntera.',
      'Dalles surélevées = croche-pieds et blocage de la tonte.',
    ],
    sources: ['Vocabulaire paysager — cheminements perméables'],
  },
  cheminement: {
    miseEnOeuvre: [
      'Fond de forme décapé, géotextile, grave 0/31,5 compactée, finition sable stabilisé ou grave calcaire.',
      'Largeur 1,20 m pour un croisement, 0,90 m pour un usage simple ; pente transversale de 2 %.',
      'Rester perméable : pas de bordure béton continue qui bloque l’eau.',
    ],
    calendrier: 'Chantier de printemps ou d’automne.',
    entretien: {
      an0: 'Recharger les zones de tassement après le premier hiver.',
      an1: 'Désherbage manuel ou thermique, appoint de finition.',
      an3: 'Recharge complète de la couche de finition tous les 4 à 6 ans.',
    },
    especes: ['Ourlet de bordure : Achillea, Prunella vulgaris, thym rampant en rive sèche.'],
    vigilance: ['Accessibilité PMR : au-delà de 5 % de pente, prévoir un palier de repos.'],
    sources: ['Cerema — Cheminements perméables'],
  },
  terrasse: {
    miseEnOeuvre: [
      'Orientation selon l’usage réel : petit-déjeuner à l’est, repas du soir à l’ouest.',
      'Privilégier une pose sur plots ou sur sable, drainante, plutôt qu’une dalle béton.',
      'Prévoir l’ombre dès la conception (arbre, pergola) : une terrasse plein sud est inutilisable en été.',
    ],
    calendrier: 'Chantier de belle saison, sol ressuyé.',
    entretien: {
      an0: 'Contrôler l’écoulement des eaux après les premières pluies.',
      an1: 'Nettoyage doux annuel ; saturateur si bois.',
      an3: 'Reprise des calages, remplacement des lames dégradées.',
    },
    especes: ['Ombre portée : Cercis siliquastrum, Albizia, treille de vigne caduque (ombre l’été, soleil l’hiver).'],
    vigilance: ['Une terrasse imperméable de plus de 20 m² doit gérer ses eaux sur place.'],
    sources: [S_GIEP],
  },
  'aire-jeu': {
    miseEnOeuvre: [
      'Sol souple naturel : copeaux de bois calibrés sur 30 cm, plutôt que dalles caoutchouc.',
      'Zone de sécurité dégagée de 1,50 m autour de chaque agrès.',
      'Ombrage naturel indispensable en exposition sud.',
    ],
    calendrier: 'Chantier de printemps.',
    entretien: {
      an0: 'Ratisser et recharger les copeaux tous les trimestres.',
      an1: 'Contrôle annuel des fixations et de l’épaisseur d’amortissement.',
      an3: 'Renouvellement complet du sol souple.',
    },
    especes: ['Écarter les végétaux toxiques ou épineux : if, laurier-cerise, pyracantha, ricin.'],
    vigilance: ['Aire collective : norme NF EN 1176/1177 et contrôle périodique obligatoires.'],
    sources: ['NF EN 1176 — Équipements d’aires de jeux'],
  },
  assise: {
    miseEnOeuvre: [
      'Positionner face à la vue et dos protégé : on s’assoit là où l’on se sent abrité.',
      'Assise à 45 cm, en bois local massif ou pierre du site.',
      'Sol stabilisé devant l’assise pour éviter la cuvette boueuse.',
    ],
    calendrier: 'Toute l’année.',
    entretien: {
      an0: 'Contrôle du calage après le premier hiver.',
      an1: 'Traitement naturel du bois si besoin.',
      an3: 'Remplacement des pièces dégradées.',
    },
    especes: ['Planter une odorante à portée de main : lavande, romarin, menthe.'],
    vigilance: ['Une assise sans ombre en été et sans soleil en hiver ne sert jamais.'],
    sources: ['Vocabulaire paysager — haltes et points de vue'],
  },
  'acces-engins': {
    miseEnOeuvre: [
      'Tracer l’accès avant tout autre chantier et l’imposer à toutes les entreprises.',
      'Renforcer par plaques de roulement ou géotextile + grave, pour concentrer le tassement.',
      'Décompacter et réhabiliter l’emprise en fin de chantier.',
    ],
    calendrier: 'À définir en phase préparatoire, avant la première livraison.',
    entretien: {
      an0: 'Interdire physiquement toute circulation hors emprise.',
      an1: 'Décompactage et réensemencement de l’emprise après chantier.',
      an3: 'Suivi de la reprise de porosité (test bêche comparatif).',
    },
    especes: ['Réhabilitation : couvert pionnier à enracinement puissant (radis fourrager, luzerne, seigle).'],
    vigilance: ['Le tassement en profondeur est quasi irréversible : mieux vaut le concentrer que le disperser.'],
    sources: [S_MSV],
  },
};

/** Fiche générique par famille, quand aucune fiche spécifique n'existe. */
const FAMILY_FALLBACK: Record<ToolFamilyKey, OuvrageReco> = {
  eau: {
    miseEnOeuvre: [
      'Vérifier l’origine et le volume d’eau à gérer avant tout dimensionnement.',
      'Rester en gestion à la source : infiltrer là où la pluie tombe.',
    ],
    calendrier: 'Terrassement en fin d’été, sol ressuyé ; végétalisation à l’automne.',
    entretien: {
      an0: 'Contrôle après chaque épisode pluvieux intense.',
      an1: 'Entretien de la végétation, vérification de la capacité d’infiltration.',
      an3: 'Décolmatage éventuel de la zone d’entrée.',
    },
    especes: [
      'Fond humide temporaire : Juncus effusus, Carex pendula, Iris pseudacorus',
      'Talus et marges drainantes : Deschampsia cespitosa, Achillea millefolium, Lythrum salicaria',
      'Ligneux de bord d’eau : Salix purpurea, Cornus sanguinea, Viburnum opulus',
      'À bannir : Ludwigia, Elodea, Myriophyllum aquaticum, Reynoutria (invasives réglementées)',
    ],
    vigilance: ['Vérifier les distances réglementaires aux constructions et limites.'],
    sources: [S_GIEP],
  },
  sol: {
    miseEnOeuvre: [
      'Ne jamais retourner : décompacter, couvrir, nourrir.',
      'Installer une couverture permanente dès la fin du chantier.',
    ],
    calendrier: 'Automne pour l’installation, printemps pour la culture.',
    entretien: {
      an0: 'Maintenir la couverture, éviter toute circulation.',
      an1: 'Apport organique de surface, couvert d’intersaison.',
      an3: 'Réduire les apports : la vie du sol prend le relais.',
    },
    especes: [
      'Graminées structurantes : Secale cereale (seigle), Avena strigosa, Lolium multiflorum',
      'Légumineuses fixatrices : Vicia sativa, Trifolium incarnatum, Medicago sativa',
      'Crucifères décompactantes : Raphanus sativus (radis fourrager), Sinapis alba',
      'Mellifères d’intersaison : Phacelia tanacetifolia, Fagopyrum esculentum',
    ],
    vigilance: ['Sol nu = sol qui perd : jamais plus de quelques semaines à découvert.'],
    sources: [S_MSV],
  },
  nourricier: {
    miseEnOeuvre: [
      'Placer au plus près de l’usage quotidien et d’un point d’eau.',
      'Préparer le sol par occultation plutôt que par travail mécanique.',
      'Pailler dès la plantation.',
    ],
    calendrier: 'Ligneux en hiver, herbacées au printemps.',
    entretien: {
      an0: 'Arrosage d’établissement, désherbage du pied.',
      an1: 'Taille de formation, recharge du paillage.',
      an3: 'Taille de production, gestion par la récolte.',
    },
    especes: [
      'Fruitiers rustiques de plein vent : Malus, Pyrus, Prunus domestica (variétés locales tracées)',
      'Petits fruits de lisière : Ribes rubrum, Ribes nigrum, Rubus idaeus',
      'Aromatiques compagnes : Thymus vulgaris, Salvia officinalis, Origanum vulgare',
      'Auxiliaires du potager : Tagetes patula, Calendula officinalis, Borago officinalis',
    ],
    vigilance: ['Surestimer la surface cultivable est l’erreur la plus fréquente.'],
    sources: [S_MSV, S_CNPF],
  },
  patrimoine: {
    miseEnOeuvre: [
      'Relever et documenter l’existant avant toute intervention.',
      'Réemployer les matériaux du site ; techniques traditionnelles sans liant hydraulique.',
    ],
    calendrier: 'Hors gel ; belle saison pour la maçonnerie sèche.',
    entretien: {
      an0: 'Laisser l’ouvrage se stabiliser avant toute reprise.',
      an1: 'Reprise ponctuelle après le premier cycle gel-dégel.',
      an3: 'Inspection périodique, réparation par tronçons.',
    },
    especes: ['Laisser s’installer la flore saxicole ou d’ourlet, marqueur de patrimonialité.'],
    vigilance: ['Vérifier les servitudes patrimoniales et le périmètre ABF.'],
    sources: [S_ABPS],
  },
  biodiversite: {
    miseEnOeuvre: [
      'Vérifier la ressource associée : un habitat sans nourriture reste vide.',
      'Placer à l’abri des dérangements et de l’éclairage nocturne.',
    ],
    calendrier: 'Installation en automne-hiver, avant la saison de reproduction.',
    entretien: {
      an0: 'Ne pas intervenir : observer.',
      an1: 'Nettoyage hors période sensible.',
      an3: 'Renouvellement partiel des matériaux dégradés.',
    },
    especes: ['Cortège floral mellifère local à proximité immédiate.'],
    vigilance: ['Aucune intervention pendant la période de nidification (15 mars – 31 juillet).'],
    sources: ['LPO', 'OPIE'],
  },
  usage: {
    miseEnOeuvre: [
      'Observer les lignes de désir avant de tracer : 80 % de l’usage est intuitif.',
      'Rester perméable et réversible autant que possible.',
    ],
    calendrier: 'Chantier de printemps ou d’automne, sol ressuyé.',
    entretien: {
      an0: 'Reprise des tassements après le premier hiver.',
      an1: 'Entretien courant, appoint de matériau.',
      an3: 'Recharge ou reprise de la couche de finition.',
    },
    especes: ['Ourlets de bordure rustiques et piétinables.'],
    vigilance: ['Un usage contrarié se voit au sol : les raccourcis dessinent la vérité du plan.'],
    sources: ['Cerema'],
  },
  annotation: {
    miseEnOeuvre: ['Élément de lecture du plan : rien à mettre en œuvre sur le terrain.'],
    calendrier: 'Sans objet.',
    entretien: {
      an0: 'Mettre à jour l’annotation au fil du chantier.',
      an1: 'Archiver ou supprimer les annotations obsolètes.',
      an3: 'Sans objet.',
    },
    especes: [],
    vigilance: ['Une annotation périmée induit le client en erreur : la tenir à jour.'],
    sources: [],
  },
};

export const toolByKey = (key: string): PaysageTool | undefined =>
  PAYSAGE_TOOLS.find((t) => t.key === key);

export const familyByKey = (key: ToolFamilyKey) => TOOL_FAMILIES.find((f) => f.key === key);

/** Fiche du socle pour un type d'ouvrage (spécifique, sinon générique famille). */
export const baseRecoFor = (outilKey: string): OuvrageReco => {
  const specific = OUVRAGE_RECO_KB[outilKey];
  if (specific) return specific;
  const tool = toolByKey(outilKey);
  return FAMILY_FALLBACK[tool?.family ?? 'usage'];
};

/** Vrai quand une fiche rédigée spécifiquement existe dans le socle. */
export const hasSpecificReco = (outilKey: string) => !!OUVRAGE_RECO_KB[outilKey];
