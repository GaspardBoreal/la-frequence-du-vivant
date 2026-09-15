export type RobotAudience = 'jardin' | 'marche' | 'vignoble' | 'partenaire';
export type RobotFunction = 'observer' | 'sol' | 'cartographier' | 'transporter' | 'agir';
export type RobotBudget = 'moins-3000' | '3000-10000' | '10000-30000' | 'plus-30000';
export type RobotMaturity = 'commercial' | 'pilote' | 'recherche';
export type RobotDecision = 'acheter' | 'fabriquer' | 'louer' | 'surveiller' | 'ecarter';

export interface RobotSource {
  id: string;
  label: string;
  publisher: string;
  url: string;
  status: 'source primaire' | 'recherche' | 'réglementation' | 'prix public' | 'document fourni';
  checked: string;
}

export interface RobotSolution {
  id: string;
  name: string;
  type: string;
  summary: string;
  audiences: RobotAudience[];
  functions: RobotFunction[];
  budget: RobotBudget;
  cost: string;
  maturity: RobotMaturity;
  decision: RobotDecision;
  energy: string;
  repairability: string;
  output: string;
  integration: string;
  limits: string;
  why: string;
  sourceIds: string[];
}

export const ROBOT_SOURCES: RobotSource[] = [
  { id: 'pdf', label: 'Hugging Face, Tnkr, Asimov… Qui sont les acteurs de la robotique humanoïde open source ?', publisher: 'Journal du Net — document fourni', url: '#dossier', status: 'document fourni', checked: '15 septembre 2026' },
  { id: 'hf-humanoid', label: 'LeRobot Humanoid: An Open, Low-Cost, 3D-Printed Humanoid', publisher: 'Hugging Face', url: 'https://huggingface.co/blog/virgilebatto/lerobot-humanoid', status: 'source primaire', checked: '15 septembre 2026' },
  { id: 'microduck', label: 'Microduck — Made to move, ready to learn', publisher: 'Pollen Robotics', url: 'https://pollen-robotics.com/microduck/', status: 'source primaire', checked: '15 septembre 2026' },
  { id: 'openpi', label: 'openpi — modèles ouverts pour la robotique', publisher: 'Physical Intelligence', url: 'https://github.com/Physical-Intelligence/openpi', status: 'source primaire', checked: '15 septembre 2026' },
  { id: 'geniesim', label: 'Genie Sim 3.0', publisher: 'AgiBot', url: 'https://www.agibot.com/article/231/detail/55.html', status: 'source primaire', checked: '15 septembre 2026' },
  { id: 'asimov', label: 'Asimov 1 — documentation technique', publisher: 'Menlo Research', url: 'https://docs.menlo.ai/asimov/1', status: 'source primaire', checked: '15 septembre 2026' },
  { id: 'romi', label: 'ROMI — Robotics for Microfarms', publisher: 'Projet européen ROMI', url: 'https://romi-project.eu/', status: 'recherche', checked: '15 septembre 2026' },
  { id: 'audiomoth', label: 'AudioMoth', publisher: 'Open Acoustic Devices', url: 'https://www.openacousticdevices.info/', status: 'source primaire', checked: '15 septembre 2026' },
  { id: 'biomonitor', label: 'New monitoring technologies', publisher: 'BioMonitor4CAP', url: 'https://biomonitor4cap.eu/en/project/field-research', status: 'recherche', checked: '15 septembre 2026' },
  { id: 'cidea', label: 'CIDEA — capteurs enterrés et collecte robotisée', publisher: 'INRAE TSCF', url: 'https://tscf.clermont.hub.inrae.fr/nos-projets/projets-regionaux/cidea', status: 'recherche', checked: '15 septembre 2026' },
  { id: 'orica', label: 'ORICA — outils robotiques agroécologiques', publisher: 'INRAE TSCF', url: 'https://tscf.clermont.hub.inrae.fr/nos-projets/projet-nationaux/orica', status: 'recherche', checked: '15 septembre 2026' },
  { id: 'ninsar', label: 'NINSAR — flottes de robots élémentaires', publisher: 'INRAE TSCF', url: 'https://eng-tscf.clermont.hub.inrae.fr/our-projects/national-projects/agroecologie-et-numerique-ninsar', status: 'recherche', checked: '15 septembre 2026' },
  { id: 'cannophy', label: 'CANNOPHY — phénotypage robotisé de la vigne', publisher: 'INRAE TSCF', url: 'https://tscf.clermont.hub.inrae.fr/nos-projets/projet-nationaux/projets-termines/cannophy', status: 'recherche', checked: '15 septembre 2026' },
  { id: 'farmbot', label: 'FarmBot Kits', publisher: 'FarmBot', url: 'https://farm.bot/collections/farmbot-kits', status: 'prix public', checked: '15 septembre 2026' },
  { id: 'vitirover', label: 'Vitirover — tondeuse solaire autonome', publisher: 'AgTecher, fiche produit', url: 'https://agtecher.com/en/robotics/vitirover/', status: 'prix public', checked: '15 septembre 2026' },
  { id: 'soilwatch', label: 'SoilWatch 10', publisher: 'Pino-Tech', url: 'https://pino-tech.eu/product/soilwatch-10/', status: 'prix public', checked: '15 septembre 2026' },
  { id: 'dragino-ph', label: 'Dragino SPH01 — pH et température', publisher: 'shopioT Europe', url: 'https://shopiot.eu/products/dragino-sph01-nb-nb-iot-soil-ph-temperature-sensor-eu', status: 'prix public', checked: '15 septembre 2026' },
  { id: 'dgac', label: 'Exploitation de drones en catégorie ouverte', publisher: 'Ministère de la Transition écologique', url: 'https://www.ecologie.gouv.fr/politiques-publiques/exploitation-drones-categorie-ouverte', status: 'réglementation', checked: '15 septembre 2026' },
  { id: 'drone-phyto', label: 'Pulvérisation par voie aérienne des produits phytopharmaceutiques', publisher: 'Ministère de l’Agriculture', url: 'https://agriculture.gouv.fr/pulverisation-par-voie-aerienne-des-produits-phytopharmaceutiques', status: 'réglementation', checked: '15 septembre 2026' },
];

export const ROBOT_SOLUTIONS: RobotSolution[] = [
  {
    id: 'kit-marche', name: 'Kit terrain biodiversité + sol', type: 'Capteurs portables standardisés',
    summary: 'Téléphone/GNSS, bioacoustique, caméra, humidité, température et protocole de calibration dans deux valises interchangeables.',
    audiences: ['jardin', 'marche', 'vignoble', 'partenaire'], functions: ['observer', 'sol'], budget: 'moins-3000', cost: '1 200 à 3 000 € — budget cible à chiffrer sur devis', maturity: 'commercial', decision: 'acheter',
    energy: 'Piles rechargeables et batteries USB', repairability: 'Élevée — modules remplaçables', output: 'Sons, images, GPS, humidité, température, conductivité', integration: 'Import dans Fréquence Jardin et carnets de marche après validation',
    limits: 'La répétabilité dépend du protocole, du placement et de l’étalonnage.', why: 'C’est le moyen le moins cher de savoir si davantage de technologie produit réellement une meilleure décision.', sourceIds: ['audiomoth', 'biomonitor', 'cidea'],
  },
  {
    id: 'audiomoth', name: 'AudioMoth + analyse BirdNET', type: 'Enregistreur bioacoustique ouvert',
    summary: 'Écoute passive à bas coût pour comparer des paysages sonores et repérer oiseaux ou chauves-souris.',
    audiences: ['jardin', 'marche', 'vignoble'], functions: ['observer'], budget: 'moins-3000', cost: 'Prix variable selon distributeur et boîtier — sur devis', maturity: 'commercial', decision: 'acheter',
    energy: 'Piles AA', repairability: 'Élevée — matériel et logiciel ouverts', output: 'Audio horodaté et détections à valider', integration: 'Pièces sonores et observations rattachées au lieu ou à la marche',
    limits: 'Une détection automatique n’est pas une identification certaine ; validation et réglage du seuil indispensables.', why: 'Très bon rapport coût, autonomie et preuve scientifique pour enrichir les inventaires sans immobiliser un opérateur.', sourceIds: ['audiomoth', 'biomonitor'],
  },
  {
    id: 'soil-sensors', name: 'Sondes de sol modulaires', type: 'Humidité, température, conductivité, pH contrôlé',
    summary: 'Des mesures répétées dans le temps, toujours confrontées à la Carotte de sol et aux méthodes de terrain.',
    audiences: ['jardin', 'marche', 'vignoble'], functions: ['sol'], budget: 'moins-3000', cost: 'Environ 25 € par humidimètre durable ; autour de 150 € pour une sonde pH connectée', maturity: 'commercial', decision: 'acheter',
    energy: 'Très basse consommation', repairability: 'Moyenne à élevée selon la sonde', output: 'Séries temporelles de sol', integration: 'Console Capteurs et sondes de Fréquence Jardin',
    limits: 'Le pH exige calibration et contrôle ; les capteurs NPK grand public ne fondent pas une prescription de fertilisation.', why: 'Ils répondent à une question utile — quand et où le sol change — sans prétendre remplacer l’observation ou le laboratoire.', sourceIds: ['soilwatch', 'dragino-ph', 'cidea'],
  },
  {
    id: 'chariot-manuel', name: 'Chariot instrumenté manuel', type: 'Porte-capteurs poussé ou tracté',
    summary: 'Un châssis simple transporte le kit et garantit les mêmes hauteurs, positions et séquences de mesure.',
    audiences: ['jardin', 'marche', 'vignoble', 'partenaire'], functions: ['observer', 'sol', 'transporter'], budget: 'moins-3000', cost: 'Objectif de fabrication : moins de 1 000 € hors capteurs', maturity: 'pilote', decision: 'fabriquer',
    energy: 'Aucune motorisation', repairability: 'Très élevée — pièces standard', output: 'Mesures mieux répétées', integration: 'Waypoints et check-list de protocole',
    limits: 'Ne supprime pas l’effort humain ; il le rend plus régulier et documenté.', why: 'Avant de robotiser le déplacement, il faut vérifier que le déplacement est bien le goulot d’étranglement.', sourceIds: ['romi', 'ninsar'],
  },
  {
    id: 'porteur-teleopere', name: 'Petit porteur téléopéré', type: 'Chariot motorisé basse vitesse',
    summary: 'Motorisation supervisée, arrêt d’urgence et reprise manuelle pour inspection, transport ou arrosage ciblé.',
    audiences: ['jardin', 'marche', 'vignoble', 'partenaire'], functions: ['observer', 'sol', 'transporter', 'agir'], budget: '3000-10000', cost: 'Objectif prototype : 3 000 à 10 000 €', maturity: 'pilote', decision: 'fabriquer',
    energy: 'Batterie rechargeable', repairability: 'Élevée si composants standardisés', output: 'Télémétrie, images, trajectoires, mesures du kit', integration: 'Prototype à connecter aux waypoints et à la console IoT',
    limits: 'Site fermé, vitesse basse, supervision permanente ; aucune circulation au milieu du public.', why: 'La téléopération conserve le jugement humain et apporte l’essentiel du gain sans le coût ni le risque de l’autonomie complète.', sourceIds: ['romi', 'orica', 'ninsar'],
  },
  {
    id: 'farmbot', name: 'FarmBot Genesis', type: 'Portique CNC ouvert sur planche fixe',
    summary: 'Sème, arrose et désherbe une surface délimitée ; bon démonstrateur de formation et de recherche.',
    audiences: ['jardin', 'partenaire'], functions: ['observer', 'agir'], budget: '3000-10000', cost: '5 995 à 7 995 $ selon le modèle', maturity: 'commercial', decision: 'surveiller',
    energy: 'Électrique', repairability: 'Élevée — plans, API et documentation ouverts', output: 'Journal d’actions et images de la planche', integration: 'Possible via API, non prioritaire',
    limits: 'Surface fixe, coût élevé pour un seul jardin, faible pertinence pour biodiversité diffuse.', why: 'Très convaincant pour apprendre et expérimenter, moins rationnel qu’un kit mobile pour diagnostiquer des lieux variés.', sourceIds: ['farmbot'],
  },
  {
    id: 'vitirover', name: 'Vitirover', type: 'Petit robot solaire d’entretien',
    summary: 'Tonte lente et continue dans vignes, vergers ou espaces délimités, avec faible poids au sol.',
    audiences: ['vignoble', 'partenaire'], functions: ['agir'], budget: '10000-30000', cost: 'Environ 10 000 € selon la fiche produit consultée', maturity: 'commercial', decision: 'louer',
    energy: 'Solaire et batterie', repairability: 'À confirmer avec le fournisseur', output: 'Trajectoires et entretien de l’enherbement', integration: 'Bilan avant/après et zones refuges dans Fréquence Jardin',
    limits: 'Ne convient pas à toutes les pentes ni à tous les couverts ; le risque pour la petite faune doit être vérifié.', why: 'C’est un candidat crédible à un essai mutualisé, pas un achat aveugle : une saison pilote doit démontrer le bénéfice écologique et économique.', sourceIds: ['vitirover'],
  },
  {
    id: 'drone-mapping', name: 'Cartographie par drone en prestation', type: 'Imagerie aérienne opérée par un professionnel',
    summary: 'Cartographie de végétation, hétérogénéité et évolution sans acheter ni maintenir une flotte.',
    audiences: ['marche', 'vignoble', 'partenaire'], functions: ['cartographier', 'observer'], budget: '3000-10000', cost: 'Sur devis par mission', maturity: 'commercial', decision: 'louer',
    energy: 'Batterie', repairability: 'Gérée par le prestataire', output: 'Orthophotos et cartes', integration: 'Calques de propriété, SIG et exports GeoJSON/KML',
    limits: 'Règles DGAC, zones de vol, vue directe, vie privée ; aucun survol de rassemblement. Pulvériser est un usage distinct et beaucoup plus encadré.', why: 'La prestation transforme un coût fixe, une formation et un risque réglementaire en coût ponctuel mesurable.', sourceIds: ['dgac', 'drone-phyto'],
  },
  {
    id: 'robot-vigne-lourd', name: 'Robot viticole porte-outils lourd', type: 'Désherbage et travail du sol autonomes',
    summary: 'Ted, Bakus, YV01, Zilus et solutions comparables répondent à des chantiers professionnels intensifs.',
    audiences: ['vignoble', 'partenaire'], functions: ['agir'], budget: 'plus-30000', cost: 'Sur devis — investissement généralement à six chiffres', maturity: 'commercial', decision: 'louer',
    energy: 'Électrique, hybride ou thermique selon modèle', repairability: 'Faible à moyenne — maintenance spécialisée', output: 'Travail réalisé et télémétrie constructeur', integration: 'Bilan chantier avant/après, pas de connexion prioritaire',
    limits: 'Transport, assurance, formation, supervision, maintenance et indisponibilité dominent souvent le coût total.', why: 'La CUMA, la coopérative ou la prestation répartit le risque et augmente le taux d’utilisation.', sourceIds: ['orica', 'cannophy'],
  },
  {
    id: 'lerobot-humanoid', name: 'Humanoïdes ouverts LeRobot / Asimov', type: 'Plateformes d’apprentissage robotique',
    summary: 'Des supports ouverts pour apprendre la locomotion, la simulation et le transfert vers le réel.',
    audiences: ['partenaire'], functions: ['transporter', 'agir'], budget: 'plus-30000', cost: 'LeRobot : environ 2 500 $ de composants ; Asimov : objectif autour de 15 000 $', maturity: 'recherche', decision: 'ecarter',
    energy: 'Batterie et calcul graphique', repairability: 'Ouverte mais exigeante', output: 'Données d’apprentissage robotique', integration: 'Aucune intégration terrain prévue',
    limits: 'Plateformes expérimentales, non tropicalisées, instables sur sol vivant et sans outil agronomique adapté.', why: 'Leur valeur est pédagogique et scientifique. Elles coûtent plus cher et répondent moins bien qu’un petit porteur aux besoins réels du terrain.', sourceIds: ['pdf', 'hf-humanoid', 'asimov'],
  },
  {
    id: 'microduck', name: 'Microduck', type: 'Petit bipède éducatif',
    summary: 'Un robot de 25 cm pour entraîner des comportements en simulation et les transférer sur une machine réelle.',
    audiences: ['partenaire'], functions: ['transporter'], budget: 'moins-3000', cost: '399 $ avant taxes et livraison', maturity: 'pilote', decision: 'surveiller',
    energy: 'Batterie', repairability: 'Logiciel ouvert ; matériel à confirmer', output: 'Données de locomotion et politiques entraînées', integration: 'Médiation ou atelier pédagogique seulement',
    limits: 'Moins de 800 g, outil de développement et non matériel de terrain.', why: 'Intéressant pour rendre la robotique compréhensible, pas pour améliorer une mesure de sol ou intervenir dans un vignoble.', sourceIds: ['pdf', 'microduck'],
  },
];

export const AUDIENCE_COPY: Record<RobotAudience, { label: string; title: string; lead: string; cta: string }> = {
  jardin: { label: 'Jardin', title: 'Mesurer avant d’automatiser', lead: 'Commencer par un kit de mesure robuste, puis automatiser uniquement un geste répétitif, réversible et réellement coûteux en temps.', cta: 'Découvrir Fréquence Jardin' },
  marche: { label: 'Marche du Vivant', title: 'Un sac à dos robotique avant le rover', lead: 'Standardiser le protocole collectif et déplacer les capteurs sans mettre une machine autonome au milieu des marcheurs.', cta: 'Explorer les Marches' },
  vignoble: { label: 'Vignoble', title: 'Acheter les capteurs, mutualiser les machines', lead: 'Mesurer finement chaque parcelle, louer les robots lourds et juger leur valeur sur une saison complète.', cta: 'Voir le parcours vignoble' },
  partenaire: { label: 'Partenaire', title: 'Financer des preuves, pas des promesses', lead: 'Trois paliers assortis de critères d’arrêt : chaque euro supplémentaire dépend d’un gain terrain mesuré.', cta: 'Étudier un pilote' },
};

export const DOSSIER_QUOTES = [
  { quote: '« des outils communs permettant à la communauté de partager données, modèles et méthodes d’entraînement »', page: 'p. 1', verdict: 'À retenir : un langage commun pour collecter et réutiliser les données.' },
  { quote: '« le prototype revient à environ 2 500 dollars en composants »', page: 'p. 1', verdict: 'À recadrer : coût des pièces, pas coût total d’un robot de terrain opérationnel.' },
  { quote: '« vendu 399 dollars »', page: 'p. 1–2', verdict: 'À utiliser pour la médiation, pas comme outil agronomique.' },
  { quote: '« plus de 10 000 heures de données robotiques »', page: 'p. 2', verdict: 'À surveiller : l’adaptation au matériel et au terrain reste à financer.' },
  { quote: '« publier le code d’un robot sur GitHub ne suffit pas »', page: 'p. 2', verdict: 'Principe central : plans, nomenclature, montage, calibration et maintenance doivent rester ensemble.' },
  { quote: '« collecter ces données dans le monde réel ou les générer en simulation »', page: 'p. 3', verdict: 'Méthode : simuler d’abord, mais valider ensuite sur sol, pente, pluie et végétation réels.' },
];