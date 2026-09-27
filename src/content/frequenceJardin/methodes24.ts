export type Famille = 'lieu' | 'matiere' | 'eau' | 'racines' | 'vivant' | 'assiette' | 'semis';
export type Palier = 'indispensable' | 'tres-utile' | 'complement';
export type Statut = 'app' | 'guide'; // app = intégrée à l'application ; guide = guide de terrain

export interface MethodeTerrain {
  id: string;
  ordreComplexite: number;   // 1 = la plus rapide, 24 = la plus longue
  nom: string;
  statut: Statut;
  duree: string;             // libellé indicatif, par point de prélèvement
  rangNourricier: number;    // 1 à 24
  palier: Palier;
  famille: Famille;
  enjeu: string;             // un mot, pour un jardin nourricier
  profondeurCm?: [number, number]; // uniquement quand le protocole la donne
  geste: string;             // une phrase
  source: { label: string; url: string; interne?: boolean };
}

export const FAMILLES: Record<Famille, { question: string; sens: string; couleur: string }> = {
  lieu:     { question: 'Que raconte ce lieu ?',          sens: 'Relier',            couleur: 'hsl(var(--ds-forest-deep))' },
  matiere:  { question: 'De quoi est faite ma terre ?',   sens: 'Toucher',           couleur: 'hsl(var(--ds-eco-ph))' },
  eau:      { question: 'Mon sol boit-il ?',              sens: 'Regarder l’eau',    couleur: 'hsl(var(--ds-eco-eau))' },
  racines:  { question: 'Mes racines passent-elles ?',    sens: 'Palper',            couleur: 'hsl(var(--ds-eco-texture))' },
  vivant:   { question: 'Qui vit là-dessous ?',           sens: 'Observer, écouter', couleur: 'hsl(var(--ds-verdict-oui))' },
  assiette: { question: 'Est-ce sain et nourricier ?',    sens: 'Goûter serein',     couleur: 'hsl(var(--ds-eco-nutri))' },
  semis:    { question: 'Quand semer ?',                  sens: 'Sentir la chaleur', couleur: 'hsl(var(--ds-verdict-non))' },
};

export const PALIERS: Record<Palier, { label: string; plage: string }> = {
  'indispensable': { label: 'Indispensables', plage: '01 à 08' },
  'tres-utile':    { label: 'Très utiles',    plage: '09 à 17' },
  'complement':    { label: 'Compléments',    plage: '18 à 24' },
};

export const METHODES_24: MethodeTerrain[] = [
  { id: 'vinaigre', ordreComplexite: 1, nom: 'Test du vinaigre', statut: 'app', duree: '1 min', rangNourricier: 13, palier: 'tres-utile', famille: 'matiere', enjeu: 'calcaire',
    geste: 'Quelques gouttes sur une motte sèche : effervescence = calcaire actif, silence = sol décarbonaté.',
    source: { label: 'Tests vinaigre et HCl — Alladjaba et al., J. Appl. Biosci. 2024', url: 'https://doi.org/10.35759/JABs.196.3' } },
  { id: 'goutte', ordreComplexite: 2, nom: 'Goutte d’eau', statut: 'guide', duree: '2 min', rangNourricier: 21, palier: 'complement', famille: 'eau', enjeu: 'arrosage', profondeurCm: [0, 0],
    geste: 'Une goutte sur terre sèche : absorbée en moins de 5 s, le sol boit ; au-delà de 60 s, il repousse l’eau.',
    source: { label: 'Échelle WDPT (Dekker) — ClimEx Handbook', url: 'https://climexhandbook.w.uib.no/2019/11/05/soil-wetability-or-water-repellency/' } },
  { id: 'tige', ordreComplexite: 3, nom: 'Tige de fer', statut: 'guide', duree: '2 min', rangNourricier: 15, palier: 'tres-utile', famille: 'racines', enjeu: 'semelle',
    geste: 'Enfoncer une tige métallique à la main : là où elle bloque, une semelle ou un horizon compact.',
    source: { label: 'Pénétromètre et semelles de travail — Malcolm, CSIRO 1964', url: 'https://publish.csiro.au/EA/EA9640189' } },
  { id: 'boudin', ordreComplexite: 4, nom: 'Test du boudin', statut: 'app', duree: '2 min', rangNourricier: 3, palier: 'indispensable', famille: 'matiere', enjeu: 'texture',
    geste: 'Rouler un boudin de terre humide d’1 cm et le courber : droit, en lune ou en cercle selon l’argile.',
    source: { label: 'Test du boudin — Guide des sols, PNR du Verdon', url: 'https://www.parcduverdon.fr/sites/default/files/pnrverdon/pdf/2021_guide-des-sols_fiche_test_boudin-web.pdf' } },
  { id: 'thermometre', ordreComplexite: 5, nom: 'Thermomètre de sol', statut: 'guide', duree: '5 min', rangNourricier: 7, palier: 'indispensable', famille: 'semis', enjeu: 'semis', profondeurCm: [5, 5],
    geste: 'Sonde à 5 cm, le matin : semer quand le sol atteint le minimum de germination de l’espèce.',
    source: { label: 'Températures de germination — ProSpecieRara', url: 'https://www.prospecierara.ch/fileadmin/user_upload/prospecierara.ch/Pflanzen/Wissen/Information_germination_ProSpecieRara.pdf' } },
  { id: 'beche', ordreComplexite: 6, nom: 'Test de la bêche', statut: 'app', duree: '5 min', rangNourricier: 9, palier: 'tres-utile', famille: 'racines', enjeu: 'structure', profondeurCm: [0, 20],
    geste: 'Une motte de 20 cm lâchée ou ouverte à la main : bloc massif, agrégats nets ou grains.',
    source: { label: 'VESS 2020 — évaluation visuelle de la structure (Canton de Vaud)', url: 'https://www.vd.ch/fileadmin/user_upload/themes/environnement/sol/fichiers_pdf/2020-06-10-VESS2020_fr.pdf' } },
  { id: 'stabilite', ordreComplexite: 7, nom: 'Test de stabilité', statut: 'app', duree: '10 min', rangNourricier: 18, palier: 'complement', famille: 'racines', enjeu: 'érosion',
    geste: 'Un agrégat sec dans l’eau claire, 10 minutes : tient-il ou se disperse-t-il ?',
    source: { label: 'SLAKES, stabilité des agrégats — Jones et al., SOIL 2021', url: 'https://soil.copernicus.org/articles/7/33/2021/' } },
  { id: 'phmetre', ordreComplexite: 8, nom: 'pHmètre électronique', statut: 'app', duree: '10 min', rangNourricier: 19, palier: 'complement', famille: 'matiere', enjeu: 'précision',
    geste: 'Sonde calibrée plongée dans une boue de terre : une valeur de pH fine.',
    source: { label: 'ISO 10390:2021 — détermination du pH des sols', url: 'https://www.boutique.afnor.org/en-gb/standard/iso-103902021/soil-treated-biowaste-and-sludge-determination-of-ph/xs136105/240725' } },
  { id: 'beche-vivante', ordreComplexite: 9, nom: 'Bêche vivante', statut: 'app', duree: '10 min', rangNourricier: 10, palier: 'tres-utile', famille: 'vivant', enjeu: 'vers', profondeurCm: [0, 20],
    geste: 'Un bloc de 20 × 20 × 20 cm émietté 5 minutes : compter les vers, noter galeries, radicelles, mycélium.',
    source: { label: 'Connaître et observer les vers de terre — Chambre d’agriculture du Tarn', url: 'https://tarn.chambre-agriculture.fr/fileadmin/user_upload/Occitanie/074_Inst-Tarn/4-AGROENVIRONNEMENT/Ecophyto/agriculture_conservation/Observer_le_sol/Conna%C3%AEtre_et_Observer_les_vers_de_terre.pdf' } },
  { id: 'bandelette-ph', ordreComplexite: 10, nom: 'Bandelette pH', statut: 'app', duree: '15 min', rangNourricier: 4, palier: 'indispensable', famille: 'matiere', enjeu: 'pH',
    geste: 'Terre et eau déminéralisée, bandelette trempée, teinte comparée au nuancier.',
    source: { label: 'Le pH du sol — Espace pour la vie (Jardin botanique de Montréal)', url: 'https://espacepourlavie.ca/potentiel-hydrogene-ph-du-sol' } },
  { id: 'carottes', ordreComplexite: 11, nom: 'Carottes géolocalisées', statut: 'app', duree: '15 min', rangNourricier: 16, palier: 'tres-utile', famille: 'lieu', enjeu: 'zones',
    geste: 'Jusqu’à 10 points de prélèvement nommés et géolocalisés sur le plan cadastral.',
    source: { label: 'Protocole Fréquence Jardin — étude de sol vivante', url: '/etude-de-sol', interne: true } },
  { id: 'cartes', ordreComplexite: 12, nom: 'Lecture des cartes', statut: 'guide', duree: '15 min', rangNourricier: 1, palier: 'indispensable', famille: 'assiette', enjeu: 'salubrité',
    geste: 'Géorisques et cartes des sols avant de cultiver : anciens sites industriels, remontée de nappe, argiles.',
    source: { label: 'Géorisques — CASIAS, remontée de nappe, argiles', url: 'https://www.georisques.gouv.fr/' } },
  { id: 'nitrates', ordreComplexite: 13, nom: 'Bandelettes nitrates', statut: 'guide', duree: '20 min', rangNourricier: 5, palier: 'indispensable', famille: 'assiette', enjeu: 'azote',
    geste: 'Terre et eau à volume égal, filtrer, lire la bandelette : l’azote disponible, avant de fertiliser.',
    source: { label: 'Guide Nitratest — Agribio84 (2025)', url: 'https://ecophytopic.fr/sites/default/files/2026-01/_Guide%20nitratest%20simplifi%C3%A9%20-%20Agribio84%202025_0.pdf' } },
  { id: 'etat-terrain', ordreComplexite: 14, nom: 'État du terrain', statut: 'app', duree: '30 min', rangNourricier: 12, palier: 'tres-utile', famille: 'lieu', enjeu: 'remblais',
    geste: 'Remanié, remblai, décaissé ou naturel : l’histoire du site conditionne toute la lecture.',
    source: { label: 'Protocole Fréquence Jardin — diagnostiquer son jardin', url: '/frequence-jardin/diagnostiquer-son-jardin', interne: true } },
  { id: 'anneau', ordreComplexite: 15, nom: 'Anneau d’infiltration', statut: 'guide', duree: '45 min', rangNourricier: 14, palier: 'tres-utile', famille: 'eau', enjeu: 'battance', profondeurCm: [0, 8],
    geste: 'Un cylindre de 15 cm enfoncé, 444 mL d’eau (25 mm de pluie), chronométrer l’infiltration.',
    source: { label: 'Infiltration — FAO Global Soil Partnership (protocole USDA)', url: 'https://www.fao.org/fileadmin/user_upload/GSP/GSDP/Field_exercises/Infiltration_EN.pdf' } },
  { id: 'moutarde', ordreComplexite: 16, nom: 'Protocole moutarde', statut: 'guide', duree: '1 h / m²', rangNourricier: 17, palier: 'tres-utile', famille: 'vivant', enjeu: 'diversité',
    geste: '1 m² arrosé de moutarde diluée : les vers remontent, on les compte et on les classe.',
    source: { label: 'Observatoire participatif des vers de terre — Université de Rennes', url: 'https://ecobiosoil.univ-rennes1.fr/' } },
  { id: 'ecoute', ordreComplexite: 17, nom: 'Écoute du sol', statut: 'guide', duree: '1 h + micro', rangNourricier: 24, palier: 'complement', famille: 'vivant', enjeu: 'suivi',
    geste: 'Un micro de contact planté quelques minutes : la complexité sonore suit la diversité de la faune.',
    source: { label: 'Robinson et al., Journal of Applied Ecology 2024', url: 'https://doi.org/10.1111/1365-2664.14738' } },
  { id: 'percolation', ordreComplexite: 18, nom: 'Test de percolation', statut: 'guide', duree: '½ journée', rangNourricier: 2, palier: 'indispensable', famille: 'eau', enjeu: 'asphyxie', profondeurCm: [30, 40],
    geste: 'Trou de 30 à 40 cm, saturer, remplir, mesurer la baisse en cm/h.',
    source: { label: 'Essai Porchet — Agglomération du Grand Guéret', url: 'https://www.agglo-grandgueret.fr/wp-content/uploads/2025/07/test_dinfiltration.pdf' } },
  { id: 'mini-profil', ordreComplexite: 19, nom: 'Mini-profil à la tarière', statut: 'guide', duree: '½ journée', rangNourricier: 11, palier: 'tres-utile', famille: 'racines', enjeu: 'racines', profondeurCm: [60, 80],
    geste: 'Sondage de 60 à 80 cm : profondeur utile, horizons, taches rouille ou grises d’engorgement.',
    source: { label: 'Hydromorphie des sols — Étude et Gestion des Sols (AFES)', url: 'https://www.afes.fr/wp-content/uploads/2023/04/EGS_21_1_2104_Berthier_51_60_web.pdf' } },
  { id: 'sedimentation', ordreComplexite: 20, nom: 'Test de sédimentation', statut: 'app', duree: '24 h', rangNourricier: 20, palier: 'complement', famille: 'matiere', enjeu: 'contrôle',
    geste: 'Terre et eau dans un bocal, 24 h de repos : sable, limon et argile en strates.',
    source: { label: 'Test du bocal — Espace pour la vie', url: 'https://espacepourlavie.ca/test-du-bocal-deau-pour-estimer-la-texture-du-sol' } },
  { id: 'berlese', ordreComplexite: 21, nom: 'Entonnoir de Berlese', statut: 'guide', duree: '1 semaine', rangNourricier: 23, palier: 'complement', famille: 'vivant', enjeu: 'microfaune',
    geste: 'Un échantillon sous une lampe, au-dessus d’un entonnoir et d’un tamis : la microfaune descend.',
    source: { label: 'Indice QBS-ar — boîte à outils CREA (Zenodo 2024)', url: 'https://zenodo.org/records/14070537' } },
  { id: 'bioessai', ordreComplexite: 22, nom: 'Bioessai haricot', statut: 'guide', duree: '4 semaines', rangNourricier: 6, palier: 'indispensable', famille: 'assiette', enjeu: 'herbicides',
    geste: 'Pois ou fèves en pots, mélange 50/50 contre un témoin, 3 à 4 semaines : feuilles en cuillère = résidu d’herbicide.',
    source: { label: 'Bioessai herbicides dans le compost — Washington State University', url: 'https://wpcdn.web.wsu.edu/wp-puyallup/uploads/sites/411/2014/12/PDF_Clopyralid_Bioassay.pdf' } },
  { id: 'sachet-the', ordreComplexite: 23, nom: 'Sachet de thé', statut: 'app', duree: '90 jours', rangNourricier: 22, palier: 'complement', famille: 'vivant', enjeu: 'recyclage', profondeurCm: [8, 8],
    geste: 'Un sachet de thé vert et un de rooibos à 8 cm, 90 jours : la vitesse de décomposition.',
    source: { label: 'Tea Bag Index — guide FiBL (Keuskamp et al. 2013)', url: 'https://www.fibl.org/fileadmin/documents/shop/1309-sachets-de-the.pdf' } },
  { id: 'lecture-ensemble', ordreComplexite: 24, nom: 'Lecture d’ensemble', statut: 'app', duree: 'en clôture', rangNourricier: 8, palier: 'indispensable', famille: 'lieu', enjeu: 'palette',
    geste: 'Les prélèvements agrégés en 4 curseurs (eau, texture, nutrition, pH), confrontés à la flore.',
    source: { label: 'Méthode D.S. et ICG — plantes bio-indicatrices', url: '/frequence-jardin/plantes-bio-indicatrices', interne: true } },
];
