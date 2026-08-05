import type { PartnerOffer } from './types';

/**
 * Dossier « Vienne Nature × La Fréquence du Vivant ».
 * Base d'analyse : les 10 marchés fournis par le partenaire.
 * Aucun montant n'est affiché (volonté explicite).
 */
export const vienneNatureOffer: PartnerOffer = {
  slug: 'vienne-nature',
  partnerName: 'Vienne Nature',
  partnerSite: 'https://www.vienne-nature.fr/',
  subtitle:
    "Catalogue des outils et prestations mobilisables en consortium pour répondre aux marchés publics d'inventaire, de suivi et d'animation territoriale",
  dateLabel: 'Août 2026',
  intro:
    "Ce dossier ne propose pas un catalogue générique : il part des dix marchés que Vienne Nature a portés ou porte actuellement, et met en regard, pour chacun, les briques technologiques déjà en production dans La Fréquence du Vivant. Ce qui est listé en « outils » et « services » existe et tourne aujourd'hui. Ce qui demande un développement est isolé dans une section distincte, avec une durée de mise en œuvre plafonnée à trois mois. Aucun montant n'y figure : le chiffrage se construit marché par marché, avec vous.",
  sources:
    "Sources : tableau des missions et marchés transmis par Vienne Nature (10 marchés, 1998-2025) ; plateforme La Fréquence du Vivant et application Les Marches du Vivant (état de production, août 2026).",
  matchers: ['vienne nature', 'vienne-nature'],

  markets: [
    {
      period: '2021 - 2023',
      title: 'Atlas de la Biodiversité Communale (ABC)',
      brief:
        'Suivi de la trame noire, enquêtes chiroptères, recensement des mares, cartographie des haies, inventaires Odonates et Unionidés.',
      scope: 'Grand Poitiers Communauté Urbaine',
      client: "Grand Poitiers, avec soutien de l'OFB et de l'Agence de l'Eau",
      deliverables:
        "Rapports techniques, cartographies SIG (mares, haies), base de données d'occurrences d'espèces",
      blocks: [
        'Application de collecte terrain',
        'Atelier cartographique (cadastre / IGN)',
        "Moteur d'agrégation biodiversité",
        'Pack Vivant (GeoJSON / KML / Excel)',
        'Pages publiques de restitution',
      ],
    },
    {
      period: 'Pluriannuel (récurrent)',
      title: 'Animation et suivi Natura 2000',
      brief:
        "Expertises écologiques d'habitats et d'espèces, actualisation des DOCOB, animation des comités de pilotage.",
      scope: "Basse Vallée de la Gartempe, Anglin, Corchon, Étangs d'Asnières",
      client: 'DREAL Nouvelle-Aquitaine et DDT de la Vienne',
      deliverables:
        "Rapports de diagnostic, suivis de l'état de conservation, fiches d'évaluation d'incidence",
      blocks: [
        'Espace Site / Propriété (diagnostic en 5 étapes)',
        'Score ICG avant / projeté / constaté',
        'Chaîne de rapports imprimables A4',
        'Serveur MCP (accès machine aux données de site)',
      ],
    },
    {
      period: '2021 (signature)',
      title: 'Contrats Territoriaux Re-Sources',
      brief:
        "Évaluation de la vulnérabilité des sols et inventaire des pratiques d'épandage de produits phytopharmaceutiques.",
      scope: "Aires d'alimentation des captages (Auxances et Sud Vienne)",
      client: 'DDT 86, Eaux de Vienne et Grand Poitiers',
      deliverables:
        "Rapports de diagnostic territorial, cartes de vulnérabilité, plans d'action de réduction des intrants",
      blocks: [
        "Module sol (jusqu'à 10 prélèvements géolocalisés par site)",
        'Base flore bio-indicatrice (E / T / N / pH, méthode D.S.)',
        'Connecteurs Sentinel Hub, Cadastre / IGN, Open-Meteo',
        'Sonde de sol portable multi-paramètres',
      ],
    },
    {
      period: '1998 - 2023',
      title: 'Inventaire herpétologique départemental',
      brief:
        'Recensement systématique des populations de reptiles et amphibiens par mailles géographiques.',
      scope: 'Département de la Vienne',
      client: 'Coordonné par Poitou-Charentes Nature (appui DREAL)',
      deliverables:
        "Ouvrages d'analyse de répartition, cartographies, base de données validée",
      blocks: [
        'Application de collecte terrain (photos horodatées, EXIF)',
        'Déduplication et validation taxonomique',
        'Connecteurs GBIF et iNaturalist',
        'Exports normalisés pour ouvrage et cartographie',
      ],
    },
    {
      period: '2012 - 2013',
      title: 'Diagnostic des sources',
      brief:
        'Inventaires multidisciplinaires faune / flore et analyses physico-chimiques des eaux (température, pH, nitrates).',
      scope: 'Département de la Vienne (Payré, Lusignan, etc.)',
      client: "DREAL Poitou-Charentes, Région et Agence de l'Eau",
      deliverables:
        'Rapports scientifiques annuels, bases de données d\'inventaires, fiches hydrochimiques',
      blocks: [
        'Fiche de station géolocalisée avec preuves photo ordonnées',
        'Sonde de sol / eau multi-paramètres',
        "Moteur d'agrégation multi-taxons",
        'Rapports annuels imprimables',
      ],
    },
    {
      period: '2016',
      title: "Diagnostic écologique d'ENS",
      brief:
        "Relevés phytosociologiques, inventaires de flore vasculaire et suivis de l'avifaune.",
      scope: 'ENS du Domaine du Léché (Saulgé)',
      client: 'Conseil Départemental de la Vienne (partenariat CREN)',
      deliverables:
        "Rapport d'étude initiale, cartographie des habitats (EUNIS), base de données floristique",
      blocks: [
        "Étape « J'identifie » : cortège floristique et matrice écologique 8 colonnes",
        'Atlas du cortège imprimable (20 vignettes A4)',
        'Connecteur Xeno-Canto pour l\'avifaune',
        'Atelier cartographique et cotation des surfaces',
      ],
    },
    {
      period: '2024 (bilan)',
      title: 'Inventaire des mulettes',
      brief:
        "Évaluation de l'état de conservation des bivalves d'eau douce par prospections protocolées.",
      scope: 'Bassins de la Gartempe et de la Creuse',
      client: 'Syndicat SYAGC (Contrat Territorial Gartempe et Creuse)',
      deliverables:
        "Rapport d'expertise, cartographies des stations, propositions de gestion et de restauration",
      blocks: [
        'Collecte protocolée par station',
        'Cartographie des stations et export GeoJSON / KML',
        'Rapport de gestion imprimable',
      ],
    },
    {
      period: 'En cours (2025)',
      title: 'Diagnostics agricoles PAEC MONT',
      brief:
        "Diagnostics écologiques individuels pour valider l'admissibilité des exploitations aux MAEC.",
      scope: 'Bocages et vallées du Montmorillonnais',
      client: "DRAAF Nouvelle-Aquitaine et Chambre d'Agriculture 86",
      deliverables:
        'Fiches d\'admissibilité par exploitation, rapports naturalistes, supports de formation',
      blocks: [
        'Espace Site multi-parcelles avec périmètre cadastral strict',
        'Diagnostic sol + flore bio-indicatrice',
        'Génération de dossiers imprimés par exploitation',
        'Matériel pédagogique et supports de formation',
      ],
    },
    {
      period: 'Période LGV',
      title: 'Suivis écologiques de Malaguet',
      brief:
        "Monitoring de l'évolution des habitats alluviaux et de l'efficacité des mesures de compensation.",
      scope: 'Zone alluviale de Malaguet',
      client: 'LISEA (concessionnaire LGV Tours-Bordeaux)',
      deliverables:
        "Rapports de suivi d'indicateurs biodiversité, fiches d'évaluation de compensation",
      blocks: [
        'Chantier avant / après avec photos par phase',
        'Score ICG avant / projeté / constaté et jury des espèces',
        'Séries temporelles par site',
        'Dossier de chantier imprimable',
      ],
    },
    {
      period: '2021 - 2022',
      title: 'Recensement des arbres remarquables',
      brief:
        'Actualisation participative de la base de données historique et caractérisation morphologique.',
      scope: 'Département de la Vienne',
      client: 'Vienne Nature (maître d\'œuvre sur financements divers)',
      deliverables:
        'Base de données actualisée, ouvrage « Arbres remarquables de la Vienne »',
      blocks: [
        'Collecte participative géolocalisée (Les Marches du Vivant)',
        'Cotation des dimensions sur orthophoto haute résolution',
        'Curation et validation des contributions',
        "Chaîne d'export vers ouvrage et base publique",
      ],
    },
  ],

  tools: [
    {
      title: 'Application Les Marches du Vivant',
      what:
        "Collecte de terrain géolocalisée : observation rattachée à un observateur, à une session et à un site, photos horodatées avec lecture EXIF, fonctionnement sur téléphone sans formation préalable.",
      useFor:
        'ABC Grand Poitiers, inventaire herpétologique, arbres remarquables, mulettes',
      proof:
        'Application en production, sessions publiques et privées, historique de contributions par observateur.',
    },
    {
      title: 'Espace Site / Propriété — diagnostic en 5 étapes',
      what:
        "Parcours structuré : J'observe, J'analyse le sol, J'identifie la flore, Le tri du cortège, La palette végétale. Chaque étape produit des données exploitables et une sortie imprimable.",
      useFor: 'Natura 2000, ENS, PAEC MONT, Re-Sources',
      proof:
        'Écrans en production, avec score ICG avant / projeté / constaté et explicabilité espèce par espèce.',
    },
    {
      title: 'Atelier cartographique',
      what:
        "Fond cadastre et IGN, orthophoto haute résolution jusqu'au zoom 24, dessin d'ouvrages et de zones, cotation des dimensions au mètre, filtrage strict des observations par périmètre géométrique (ray-casting).",
      useFor: 'Cartographie des mares et haies, stations de mulettes, parcellaire agricole, ENS',
      proof:
        'Atelier en production, avec sélection cadastrale, mesure des segments et curseur de rigueur géographique.',
    },
    {
      title: 'Base flore bio-indicatrice',
      what:
        "58 espèces documentées avec coefficients E (eau), T (texture), N (nutrition azotée) et pH, méthode D.S. adossée à la Flore Forestière Française, exportable en Excel et CSV avec légende méthodologique.",
      useFor: 'Re-Sources (vulnérabilité des sols), ENS, PAEC MONT',
      proof:
        'Export livré et déjà partagé à un botaniste pour confrontation avec les coefficients de Julve.',
    },
    {
      title: "Moteur d'agrégation biodiversité",
      what:
        "Déduplication par nom scientifique, fusion des observations citoyennes et des occurrences iNaturalist, résolution automatique des noms vernaculaires français, comptages consolidés par site et par période.",
      useFor: 'Tous les marchés produisant une base de données d\'occurrences',
      proof:
        'RPC unifiée de comptage d\'espèces, temps réel sur les observations, garde-fou anti-régression sur les synchronisations.',
    },
    {
      title: "Chaîne d'exports",
      what:
        'Pack Vivant en un clic : PDF, Excel, CSV, GeoJSON, KML. Dossier de chantier avant / après, atlas du cortège imprimable (20 vignettes A4), planches photo, bordereau de contexte.',
      useFor: 'Livrables SIG et bases de données de tous les marchés listés',
      proof: 'Fonction serveur de génération de pack, formats déjà produits pour des sites réels.',
    },
    {
      title: 'Serveur MCP',
      what:
        "Accès machine aux données d'un site (fiche, biodiversité, pool d'espèces, points d'observation, diagnostics), authentifié par utilisateur. Vos propres outils, ou une IA, peuvent lire nos données sans copie manuelle.",
      useFor: 'Interopérabilité avec vos bases et vos rapports, réponses assistées aux appels d\'offres',
      proof: 'Serveur MCP en production, manifeste d\'outils versionné.',
    },
    {
      title: 'Connecteurs de données ouvertes',
      what:
        'GBIF, iNaturalist, Xeno-Canto, Open-Meteo, Sentinel Hub, Cadastre et IGN, Lexicon. Les données externes sont rapprochées des observations de terrain sur le même site.',
      useFor: 'Contextualisation scientifique, cartographie réglementaire, imagerie satellite',
      proof: 'Connecteurs actifs, synchronisation quotidienne et rattrapage automatique des observations.',
    },
    {
      title: 'Sonde de sol portable multi-dimensionnelle',
      what:
        'Relevés multi-paramètres sur le terrain, rattachés au point de prélèvement géolocalisé du site.',
      useFor: 'Re-Sources, diagnostic des sources, PAEC MONT',
      proof: "Prélèvements gérés jusqu'à 10 points par site, avec renommage, suppression et preuves photo ordonnées.",
    },
    {
      title: 'Pages publiques et carnets de terrain',
      what:
        "Restitution grand public d'une sortie ou d'un site, avec réglage fin de visibilité (privé, restreint, public) et pages référencées.",
      useFor: 'Volet médiation et valorisation des ABC, ENS, arbres remarquables',
      proof: 'Pages publiques en ligne, analytics anonymes, partage social.',
    },
    {
      title: 'IA de terrain contextuelle',
      what:
        "Assistant qui ne répond qu'à partir des données du site effectivement chargées, avec un bordereau traçant chaque bloc de contexte utilisé. Noms vernaculaires français en premier, nom scientifique entre parenthèses. Réponses tabulaires exportables.",
      useFor: 'Aide à la rédaction de rapports, préparation de COPIL, réponses aux appels d\'offres',
      proof: 'Console de contexte, bordereau du vivant, export Markdown / JSON / CSV.',
    },
  ],

  services: [
    {
      title: 'Structuration et reprise de bases existantes',
      detail:
        "Import de vos historiques d'occurrences, normalisation taxonomique, déduplication, résolution des noms français, contrôle de cohérence géographique.",
      useFor: 'Herpétofaune 1998-2023, arbres remarquables, bases ABC',
    },
    {
      title: 'Animation de collecte participative',
      detail:
        "Organisation de sessions de terrain, encadrement des bénévoles, protocole de saisie, curation des contributions et validation avant versement en base.",
      useFor: 'ABC, arbres remarquables, volet participatif des contrats territoriaux',
    },
    {
      title: 'Production de livrables imprimés',
      detail:
        "Mise en page A4 conforme aux attentes des donneurs d'ordre : rapports, atlas d'espèces, planches photo, fiches de station, dossiers avant / après.",
      useFor: 'Tous les marchés',
    },
    {
      title: 'Restitution publique et médiation',
      detail:
        'Pages de site, carnets de terrain, matériel pédagogique, supports de formation, fonds d\'écran et visuels de campagne.',
      useFor: 'ABC, ENS, PAEC MONT (supports de formation)',
    },
    {
      title: 'Ouverture et interopérabilité des données',
      detail:
        'Exports normalisés, mise à disposition machine via MCP, préparation au versement GBIF, réversibilité complète des données à tout moment.',
      useFor: 'Exigences OFB, Agence de l\'Eau, DREAL',
    },
    {
      title: 'Support technique et hébergement',
      detail:
        "Hébergement des données pendant la durée du marché, support aux équipes, correctifs et évolutions mineures, formation initiale des utilisateurs.",
      useFor: 'Marchés pluriannuels (Natura 2000, suivis LGV)',
    },
  ],

  developments: [
    {
      title: 'Module protocoles naturalistes par maille',
      trigger: 'Inventaire herpétologique départemental, enquêtes chiroptères et odonates (ABC)',
      duration: '6 à 8 semaines',
      output:
        "Saisie protocolée par maille avec pression d'observation, restitution de répartition, export pour ouvrage de synthèse.",
    },
    {
      title: 'Module linéaires et points d\'eau',
      trigger: 'Recensement des mares et cartographie des haies (ABC), diagnostic des sources',
      duration: '6 semaines',
      output:
        'Saisie de linéaires et de points d\'eau, fiches de station, cartographie SIG exportable.',
    },
    {
      title: 'Module trame noire',
      trigger: 'Suivi de la trame noire (ABC Grand Poitiers)',
      duration: '5 semaines',
      output:
        'Croisement pollution lumineuse et observations nocturnes, cartes de continuités et de ruptures.',
    },
    {
      title: 'Module habitats et phytosociologie',
      trigger: "Diagnostic écologique d'ENS, expertises d'habitats Natura 2000",
      duration: '8 à 10 semaines',
      output:
        'Typologie EUNIS, saisie de relevés phytosociologiques, cartographie d\'habitats et surfaces calculées.',
    },
    {
      title: "Module suivi d'état de conservation Natura 2000",
      trigger: 'Animation et suivi Natura 2000, actualisation des DOCOB',
      duration: '8 semaines',
      output:
        "Indicateurs paramétrables, séries temporelles par site, fiches d'évaluation d'incidence générées.",
    },
    {
      title: 'Module diagnostic d\'exploitation agricole',
      trigger: 'Diagnostics agricoles PAEC MONT',
      duration: '6 à 8 semaines',
      output:
        "Fiche d'admissibilité MAEC par exploitation, traitement par lot, export groupé pour la DRAAF.",
    },
    {
      title: 'Module sonde de sol connectée',
      trigger: 'Re-Sources, diagnostic des sources',
      duration: '5 à 7 semaines',
      output:
        'Ingestion automatique des relevés multi-paramètres, rattachement aux prélèvements existants, séries temporelles et alertes.',
    },
    {
      title: 'Module bioacoustique',
      trigger: 'Enquêtes chiroptères (ABC), suivis avifaune (ENS)',
      duration: '8 semaines',
      output:
        'Import d\'enregistrements, rattachement Xeno-Canto, écoute, annotation et validation par un expert.',
    },
    {
      title: 'Module vulnérabilité des sols et intrants',
      trigger: 'Contrats Territoriaux Re-Sources',
      duration: '10 à 12 semaines',
      output:
        "Croisement sol, imagerie satellite et parcellaire à l'échelle d'une aire d'alimentation de captage, cartes de vulnérabilité, plan d'action.",
    },
    {
      title: 'IA vocale de terrain',
      trigger: 'Prospections longues (mulettes, herpétofaune, diagnostics agricoles)',
      duration: '6 semaines',
      output:
        'Saisie mains libres pendant la prospection, transcription rattachée au point GPS, relecture et validation a posteriori.',
    },
    {
      title: 'Gabarits d\'export réglementaire',
      trigger: 'Exigences DREAL, Agence de l\'Eau, OFB',
      duration: '4 à 6 semaines',
      output:
        'Modèles de rapport et de tableau conformes aux formats attendus par les donneurs d\'ordre, générés automatiquement depuis les données du site.',
    },
  ],

  collaboration: [
    {
      mode: 'Sous-traitance technique',
      summary:
        'Vienne Nature est mandataire et titulaire du marché. Nous intervenons comme prestataire technique sur le volet outillage, données et livrables numériques.',
      roles:
        'Vienne Nature porte la responsabilité scientifique, la relation au donneur d\'ordre et le terrain. Nous fournissons la plateforme, les exports et le support.',
      data:
        'Les données collectées appartiennent à Vienne Nature et au donneur d\'ordre. Nous en sommes hébergeur, jamais propriétaire.',
      commitments: [
        'Livraison des exports aux formats attendus dans les délais du marché',
        'Réversibilité complète des données à la fin de la mission',
        'Aucune diffusion publique sans accord écrit',
        'Support pendant toute la durée du marché',
      ],
    },
    {
      mode: 'Cotraitance en groupement',
      summary:
        'Réponse conjointe, chaque cotraitant portant un lot identifié. Adapté aux marchés pluriannuels ou comportant un volet numérique et médiation significatif.',
      roles:
        'Vienne Nature porte l\'expertise naturaliste et l\'animation territoriale. Nous portons le lot plateforme, données ouvertes, restitution publique et innovation (sonde, satellite, IA).',
      data:
        'Gouvernance partagée définie dans la convention de groupement, avec propriété au donneur d\'ordre et droit d\'usage réciproque.',
      commitments: [
        'Engagement de moyens humains identifiés dans le mémoire technique',
        'Co-signature des livrables',
        'Contribution au versement des données en base nationale',
        'Continuité de service au-delà du marché si reconduction',
      ],
    },
  ],

  questions: [
    {
      theme: 'Gouvernance des données',
      question:
        'Qui doit être juridiquement propriétaire des données collectées via la plateforme : Vienne Nature, le donneur d\'ordre, ou une propriété partagée définie marché par marché ?',
      why: "C'est la première question posée par un conseil d'administration d'association naturaliste. Nous devons pouvoir y répondre par écrit avant toute réponse commune.",
    },
    {
      theme: 'Hébergement et RGPD',
      question:
        'Avez-vous des exigences d\'hébergement (localisation des serveurs, souveraineté, certification) imposées par vos donneurs d\'ordre publics ?',
      why: 'Certaines DREAL et agences imposent un hébergement européen ou une clause de réversibilité formelle.',
    },
    {
      theme: 'Validation scientifique',
      question:
        'Qui valide les identifications issues de la collecte participative, et selon quelle procédure ? Souhaitez-vous un circuit de validation à deux niveaux dans l\'outil ?',
      why: "La crédibilité scientifique de vos livrables ne doit jamais dépendre d'une saisie non validée.",
    },
    {
      theme: 'Outils existants',
      question:
        'Quels outils utilisez-vous aujourd\'hui pour vos bases d\'occurrences (Serena, Faune-Vienne, tableurs, SIG) et lesquels souhaitez-vous conserver ?',
      why: "Nous ne remplaçons pas ce qui fonctionne : nous nous branchons dessus. L'interopérabilité est un critère de confiance.",
    },
    {
      theme: 'Versement en base nationale',
      question:
        'Vos marchés imposent-ils un versement GBIF, INPN ou SINP, et sous quel délai après la fin de la mission ?',
      why: 'Nous préparons les exports au bon format dès la collecte plutôt qu\'en fin de marché.',
    },
    {
      theme: 'Méthode botanique',
      question:
        'Souhaitez-vous que la base bio-indicatrice s\'aligne sur les coefficients de Julve, sur Ellenberg, ou expose les deux en parallèle ?',
      why: 'Le choix méthodologique doit être le vôtre ; nous adaptons la base et la légende des planches en conséquence.',
    },
    {
      theme: 'Continuité',
      question:
        'Quel engagement de continuité attendez-vous au-delà de la durée d\'un marché : maintien des données en ligne, accès en lecture, ou archivage remis ?',
      why: 'Les suivis pluriannuels (Natura 2000, LGV) perdent leur valeur si la donnée disparaît entre deux marchés.',
    },
    {
      theme: 'Réversibilité',
      question:
        'Quel format d\'archive souhaitez-vous recevoir en cas de fin de collaboration, et à quelle fréquence en attendez-vous une copie de sauvegarde ?',
      why: "Nous préférons contractualiser la sortie dès l'entrée : c'est ce qui rend l'engagement crédible.",
    },
    {
      theme: 'Équipe et formation',
      question:
        'Combien de salariés et de bénévoles seraient amenés à utiliser les outils, et sur quel calendrier de formation ?',
      why: "Le dimensionnement du support et des sessions de prise en main en dépend directement.",
    },
    {
      theme: 'Premier marché test',
      question:
        'Lequel de vos marchés en cours ou à venir accepteriez-vous d\'utiliser comme démonstrateur commun, à échelle réduite ?',
      why: 'Une preuve sur un périmètre restreint vaut mieux qu\'un engagement global : elle rassure votre direction et nous engage sur du concret.',
    },
  ],

  closing:
    "Notre proposition n'est pas de remplacer l'expertise de Vienne Nature, qui n'est pas remplaçable, mais de lui donner une chaîne d'outils qui accélère la collecte, sécurise la donnée et rend les livrables plus lisibles pour les donneurs d'ordre. Le premier pas que nous proposons est un démonstrateur sur un périmètre restreint, choisi par vous.",
};
