import type { PartnerRoadmap } from './types';

export const vdtpRoadmap: PartnerRoadmap = {
  slug: 'vdtp',
  date: '2026-08-12',
  partnerName: 'Verre de Terre Production',
  partnerContact: 'Vincent Levavasseur',
  partnerSite: 'https://www.verredeterre.fr',
  matchers: [
    'VDTP',
    'Ver de Terre Production',
    'Verre de Terre Production',
    'Levavasseur',
    'Jardin nourricier',
  ],
  subtitle:
    "Feuille de route des travaux issue de l'entretien de test de l'application — priorisation, planning et chantiers détaillés.",
  interviewLabel: 'Entretien du 7 août 2026 · 35 min · revue du 12 août 2026',
  intro:
    "Vincent Levavasseur a testé l'espace Propriété de bout en bout : J'observe, J'analyse le sol, J'identifie, la synthèse et les impressions. Ce document convertit ses retours en chantiers ordonnés, avec pour chacun ce que l'on construit, ce que cela produit et quand.",
  context:
    "Évolution actée depuis l'entretien : les trois sondes de sol (15, 30 et 60 cm) sont installées sur le site, la station météo est en place et l'API constructeur est accessible. L'ingestion des mesures passe donc en P3, avant la restructuration produit et le test MERCI : c'est le seul chantier qui apporte de la donnée mesurée là où tout le reste est déclaratif.",

  themes: [
    {
      id: 'fiabilite',
      label: 'Fiabilité de la saisie',
      family: 'Fiabilité',
      summary:
        "Perte des données du registre de sol pendant le test, et impossibilité de sortir proprement du mode édition.",
    },
    {
      id: 'synthese',
      label: 'Synthèse avant détail',
      family: 'Lisibilité',
      summary:
        "Trop d'informations analytiques affichées d'emblée : la synthèse doit primer, le détail vient au clic.",
    },
    {
      id: 'echelles',
      label: 'Échelles de concordance',
      family: 'Lisibilité',
      summary:
        "Une seule échelle à 5 crans par facteur (Eau, Nutrition, pH) et une texture énoncée en mot, pas un triangle.",
    },
    {
      id: 'abondance',
      label: 'Pondération par abondance',
      family: 'Science',
      summary:
        "Un pied isolé ne doit pas peser autant qu'une espèce qui recouvre la parcelle.",
    },
    {
      id: 'tests',
      label: 'Hiérarchie des tests de sol',
      family: 'Science',
      summary:
        "Structure et boudin en essentiels ; sédimentation, pH, vinaigre et sachet de thé en optionnels annoncés.",
    },
    {
      id: 'referentiels',
      label: 'Référentiels et méthode',
      family: 'Science',
      summary:
        "Encart méthodologique visible, et comparaison D.S. / Flore Forestière Française / Julve / Ellenberg.",
    },
    {
      id: 'merci',
      label: 'Test MERCI (biomasse)',
      family: 'Science',
      summary:
        "La meilleure analyse de sol simple : relevé d'espèces plus biomasse, à cheval entre J'analyse et J'identifie.",
    },
    {
      id: 'capteurs',
      label: 'Sondes et station météo',
      family: 'Données',
      summary:
        "Trois profondeurs de sol, température de surface et air à 3 m : mesure continue, différenciation forte.",
    },
    {
      id: 'arrosage',
      label: "Volet arrosage dans J'observe",
      family: 'Produit',
      summary:
        "Réseau, récupération de toiture, mare ou rivière, puits ou forage : question absente et structurante.",
    },
    {
      id: 'navigation',
      label: 'Portrait et « Mon projet »',
      family: 'Produit',
      summary:
        "« Je synthétise » remonte dans le Portrait ; à sa place « Mon projet », pont vers la Palette et l'Atelier.",
    },
    {
      id: 'questions',
      label: 'Répondre aux questions',
      family: 'Produit',
      summary:
        "Ce que les gens cherchent d'abord : suis-je dans les clous, et quelles réponses à mes problèmes.",
    },
    {
      id: 'galerie',
      label: 'Galerie de jardins inspirants',
      family: 'Rayonnement',
      summary:
        "Une quinzaine de jardins de personnes reconnues, navigables de jardin en jardin, portraits très synthétiques.",
    },
  ],

  verbatims: [
    {
      at: '12:02',
      speaker: 'Vincent Levavasseur',
      quote:
        "Ça a l'air de buguer. Bon, je vais quitter le jardin. Il y a tout qui bugue là, j'ai tout fait planter.",
      themeId: 'fiabilite',
    },
    {
      at: '15:21',
      speaker: 'Vincent Levavasseur',
      quote:
        "Il n'y a plus aucune donnée. J'ai dû enregistrer un moment pour quitter, et c'est mal vu. Ça m'a fait tout planter.",
      themeId: 'fiabilite',
    },
    {
      at: '24:07',
      speaker: 'Vincent Levavasseur',
      quote:
        "Faut que tu oublies tes histoires de points et de plantes : c'est seulement s'ils cliquent dessus qu'ils ont ce détail-là.",
      themeId: 'synthese',
    },
    {
      at: '25:38',
      speaker: 'Vincent Levavasseur',
      quote:
        "Une échelle à 5 points : à gauche t'es sec, à droite t'es frais et humide ; à gauche pauvre, à droite riche. À 5 niveaux, tu restes qualitatif et tu ne tombes pas dans le piège du quantitatif.",
      themeId: 'echelles',
    },
    {
      at: '23:07',
      speaker: 'Vincent Levavasseur',
      quote:
        "Sur la texture tu n'es pas sur un duo, tu es sur un triptyque. Les gens ne comprennent rien au triangle : affiche juste argilo-limoneux.",
      themeId: 'echelles',
    },
    {
      at: '26:53',
      speaker: 'Vincent Levavasseur',
      quote:
        "Une méthode de bio-indication donne beaucoup d'importance à la plante la plus présente. Si tu n'as qu'un pied de coquelicot, il a autant d'importance qu'une achillée qui recouvre tout.",
      themeId: 'abondance',
    },
    {
      at: '10:24',
      speaker: 'Vincent Levavasseur',
      quote:
        "La meilleure analyse de sol simple et efficace, c'est d'évaluer la biomasse : mettre le test MERCI là-dedans, à un moment clé de l'année.",
      themeId: 'merci',
    },
    {
      at: '11:30',
      speaker: 'Vincent Levavasseur',
      quote:
        "Structure et boudin, ce sont les deux trucs vraiment intéressants. Sédimentation, pH, vinaigre : optionnels, et tu les as bien mis en tant que tels.",
      themeId: 'tests',
    },
    {
      at: '19:25',
      speaker: 'Vincent Levavasseur',
      quote:
        "L'Excel ne donne que les scores de chaque plante. La méthode et l'encart qui explique comment ils analysent, c'est aussi important.",
      themeId: 'referentiels',
    },
    {
      at: '17:23',
      speaker: 'Vincent Levavasseur',
      quote:
        "On va utiliser Julve, qui est ouvert, open source, et je refais une comparaison avec Dussert et avec Ellenberg.",
      themeId: 'referentiels',
    },
    {
      at: '05:08',
      speaker: 'Vincent Levavasseur',
      quote:
        "La vignette du haut mériterait de préciser : est-ce que j'arrose, et si oui comment ? Eau du réseau, récupération de toiture, prélèvement en rivière ou en mare, pompe dans un puits ou un forage ?",
      themeId: 'arrosage',
    },
    {
      at: '07:24',
      speaker: 'Vincent Levavasseur',
      quote:
        "La signature écologique du site, on ne comprend pas ce que ça veut dire. C'est un peu compliqué d'en faire quelque chose, tel que c'est.",
      themeId: 'synthese',
    },
    {
      at: '29:56',
      speaker: 'Vincent Levavasseur',
      quote:
        "Je rajouterais « mes recommandations » : le portrait, c'est ta vitrine extérieure ; et ensuite ce truc qui fait le pont entre J'observe, J'analyse, J'identifie et la palette.",
      themeId: 'navigation',
    },
    {
      at: '02:56',
      speaker: 'Vincent Levavasseur',
      quote:
        "Ce que les gens veulent en premier, c'est : est-ce que je suis dans les clous ou pas, et quelles sont les réponses à mes problèmes.",
      themeId: 'questions',
    },
    {
      at: '01:52',
      speaker: 'Vincent Levavasseur',
      quote:
        "Ce serait très très fort de faire découvrir les jardins de quinze personnes inspirantes, avec un peu de notoriété.",
      themeId: 'galerie',
    },
    {
      at: '33:38',
      speaker: 'Laurent Tripied',
      quote:
        "Trois sondes : une à 15 cm, une à 30, une à 60, la température juste à la sortie de la sonde à 10 cm, et la station météo à 3 mètres de hauteur pour mesurer les écarts.",
      themeId: 'capteurs',
    },
  ],

  priorities: [
    {
      code: 'P0',
      title: 'Fiabilité de la saisie',
      window: 'Semaine du 10 août',
      rationale:
        "Un utilisateur a effacé un registre complet en quelques clics. Rien d'autre ne compte tant que ce risque existe.",
      startPct: 0,
      widthPct: 8,
      tasks: [
        {
          title: 'Audit complet des chemins d\'écriture du registre de sol',
          detail:
            "Recensement de tous les composants qui écrivent dans le registre, vérification que le mode lecture seule s'applique partout sauf dans J'analyse, et que le garde-fou base rejette bien toute écriture destructive non déclarée.",
          output: 'Rapport de couverture et correctifs sur les points d\'entrée non protégés.',
          effortDays: 2,
          status: 'doing',
          themeId: 'fiabilite',
        },
        {
          title: 'Reproduction du scénario de perte (Safari, desktop)',
          detail:
            "Rejeu automatisé du parcours de Vincent : ouverture du jardin, entrée en édition, saisie partielle, sortie brutale. Vérification que rien n'est écrasé et qu'aucune sauvegarde vide ne part.",
          output: 'Test de non-régression rejouable avant chaque livraison.',
          effortDays: 1,
          status: 'todo',
          themeId: 'fiabilite',
        },
        {
          title: 'Sortie du mode édition sans piège',
          detail:
            "Bouton « Terminer » présent en haut et en bas de l'écran, sortie possible à tout moment sans validation forcée, confirmation explicite de ce qui a été enregistré.",
          output: 'Parcours d\'édition sans impasse, sur mobile comme sur desktop.',
          effortDays: 2,
          status: 'todo',
          themeId: 'fiabilite',
        },
        {
          title: 'Historique du registre mis en avant',
          detail:
            "Le panneau d'historique devient visible dès l'ouverture de J'analyse, avec la date de la dernière version et une restauration en un clic.",
          output: 'Récupération autonome d\'une version antérieure, sans intervention technique.',
          effortDays: 1,
          status: 'todo',
          themeId: 'fiabilite',
        },
      ],
    },
    {
      code: 'P1',
      title: 'Lisibilité et synthèse',
      window: 'Semaines du 10 et du 17 août',
      rationale:
        "Le diagnostic est jugé riche mais noyé. Rendre la synthèse première est le geste qui débloque l'usage grand public.",
      startPct: 6,
      widthPct: 16,
      tasks: [
        {
          title: 'Refonte de la concordance sol / flore en échelles à 5 crans',
          detail:
            "Un curseur unique par facteur : Eau (sec ↔ frais et humide), Nutrition (pauvre ↔ riche), pH (acide ↔ calcaire). La texture n'est plus un triangle mais un libellé (« argilo-limoneux »), éventuellement accompagné de trois jauges argile / limon / sable.",
          output: 'Une lecture immédiate du site en quatre curseurs, sans jargon.',
          effortDays: 4,
          status: 'todo',
          themeId: 'echelles',
        },
        {
          title: 'Détail replié derrière le curseur',
          detail:
            "Le décompte « 11 plantes fraîches contre 8 sèches » n'est plus affiché d'emblée : il apparaît au clic sur le curseur, avec la liste des espèces qui portent le verdict.",
          output: 'Zéro perte d\'information, charge cognitive divisée.',
          effortDays: 2,
          status: 'todo',
          themeId: 'synthese',
        },
        {
          title: 'Suppression de l\'encart « Signature écologique »',
          detail:
            "L'encart est retiré de l'écran et de l'impression ; l'espace récupéré profite au verdict de synthèse.",
          output: 'Un écran d\'entrée plus court et compréhensible.',
          effortDays: 0.5,
          status: 'todo',
          themeId: 'synthese',
        },
        {
          title: 'Verdict en tête de « J\'identifie »',
          detail:
            "Quatre mots-clés en haut de page (eau, texture, nutrition, pH), le cortège révélé et le détail par espèce en second rideau.",
          output: 'Une réponse en trois secondes, le détail pour ceux qui le veulent.',
          effortDays: 2,
          status: 'todo',
          themeId: 'synthese',
        },
        {
          title: 'Encart méthode à l\'écran et à l\'impression',
          detail:
            "Explication de la méthode D.S. et de la Flore Forestière Française, signification des coefficients E / T / N / pH, limites d'usage et sources citées.",
          output: 'Crédibilité scientifique lisible par un tiers, y compris sur le PDF.',
          effortDays: 1.5,
          status: 'done',
          themeId: 'referentiels',
        },
      ],
    },
    {
      code: 'P2',
      title: 'Justesse scientifique',
      window: 'Fin août',
      rationale:
        "Sans pondération par l'abondance, le verdict bio-indicateur peut être faux. C'est la condition d'un usage professionnel.",
      startPct: 18,
      widthPct: 14,
      tasks: [
        {
          title: 'Coefficient d\'abondance / recouvrement par espèce',
          detail:
            "Saisie rapide du recouvrement (rare, présent, abondant, dominant) sur le relevé, puis pondération des indices bio-indicateurs par ce coefficient.",
          output: 'Indices recalculés, espèce dominante mise en avant dans le verdict.',
          effortDays: 5,
          status: 'todo',
          themeId: 'abondance',
        },
        {
          title: 'Hiérarchisation des tests de sol',
          detail:
            "Deux familles clairement séparées : essentiels (structure de la motte, test du boudin) et optionnels (sédimentation, pH, vinaigre, sachet de thé), chacun avec sa durée annoncée.",
          output: 'Un parcours court par défaut, l\'approfondissement en option.',
          effortDays: 2,
          status: 'todo',
          themeId: 'tests',
        },
        {
          title: 'Invitation à l\'analyse de laboratoire',
          detail:
            "Détection des cas complexes (verdicts contradictoires, sol suspecté pollué ou très déséquilibré) et proposition explicite d'une analyse labo, avec ce qu'elle apporte en plus.",
          output: 'Un renvoi honnête vers la mesure quand le test terrain ne suffit pas.',
          effortDays: 1.5,
          status: 'todo',
          themeId: 'tests',
        },
        {
          title: 'Comparaison Julve / Ellenberg / D.S.',
          detail:
            "Intégration du référentiel Julve (ouvert) et des valeurs Ellenberg en regard de la méthode D.S., avec affichage des écarts entre référentiels pour une même espèce.",
          output: 'Un verdict discutable et traçable, référentiel par référentiel.',
          effortDays: 6,
          status: 'todo',
          themeId: 'referentiels',
        },
      ],
    },
    {
      code: 'P3',
      title: 'Capteurs sol et météo : ingestion et séries temporelles',
      window: 'Début septembre',
      rationale:
        "Les trois sondes sont posées et l'API est ouverte : la donnée existe déjà. C'est le seul chantier qui fait passer le diagnostic du déclaratif au mesuré.",
      startPct: 30,
      widthPct: 18,
      tasks: [
        {
          title: 'Connecteur d\'ingestion planifié',
          detail:
            "Fonction edge appelée à intervalle régulier : interrogation de l'API des sondes et de la station météo, normalisation des unités, déduplication par capteur et horodatage, stockage en heure locale de Paris conformément à la règle du projet.",
          output: 'Un flux de mesures continu, sans intervention manuelle.',
          effortDays: 4,
          status: 'todo',
          themeId: 'capteurs',
        },
        {
          title: 'Modèle de données capteurs',
          detail:
            "Une table de capteurs rattachés à la propriété et à une zone (potager d'hiver, potager d'été, verger) avec leur profondeur : sol 15, 30 et 60 cm, surface 10 cm, air à 3 m. Une table de mesures (température, humidité) indexée par capteur et par date.",
          output: 'Historique interrogeable, extensible à d\'autres sites équipés.',
          effortDays: 3,
          status: 'todo',
          themeId: 'capteurs',
        },
        {
          title: 'Onglet « Le sol vivant en continu »',
          detail:
            "Courbes multi-profondeurs superposées, sélecteur de période (24 h, 7 jours, 30 jours, saison), comparaison entre zones et graphe d'écart sol / air.",
          output: 'La lecture du sol en mouvement, jour après jour.',
          effortDays: 5,
          status: 'todo',
          themeId: 'capteurs',
        },
        {
          title: 'Lecture agronomique et seuils',
          detail:
            "Repères posés sur les courbes : sol gelé, sécheresse en profondeur, saturation en eau, inertie thermique. Croisement avec les prélèvements du registre pour situer chaque mesure dans son contexte.",
          output: 'Des alertes compréhensibles plutôt qu\'un graphe brut.',
          effortDays: 3,
          status: 'todo',
          themeId: 'capteurs',
        },
        {
          title: 'Ouverture des mesures',
          detail:
            "Les séries sont exposées dans le contexte de l'IA de jardin, dans le serveur MCP et en export CSV, avec la même granularité que l'affichage.",
          output: 'Donnée réutilisable par un tiers ou par une IA, sans copier-coller.',
          effortDays: 2,
          status: 'todo',
          themeId: 'capteurs',
        },
      ],
    },
    {
      code: 'P4',
      title: 'Structure produit',
      window: 'Mi-septembre',
      rationale:
        "Une fois le diagnostic lisible et la donnée mesurée disponible, la navigation peut se réorganiser autour du Portrait et de « Mon projet ».",
      startPct: 46,
      widthPct: 16,
      tasks: [
        {
          title: 'Bloc arrosage dans « J\'observe »',
          detail:
            "Source d'eau (réseau, récupération de toiture, mare ou rivière, puits ou forage), mode d'apport et fréquence. L'information alimente le diagnostic hydrique et remonte dans le portrait.",
          output: 'Un pan structurant du jardin enfin documenté.',
          effortDays: 2.5,
          status: 'todo',
          themeId: 'arrosage',
        },
        {
          title: 'Fusion de « Je synthétise » dans le Portrait',
          detail:
            "La synthèse cesse d'être un onglet : elle devient le Portrait, vitrine du site, alimentée en continu par les observations, les analyses et désormais les capteurs.",
          output: 'Une page fierté, partageable, toujours à jour.',
          effortDays: 4,
          status: 'todo',
          themeId: 'navigation',
        },
        {
          title: 'Nouvel onglet « Mon projet »',
          detail:
            "Recommandations, contraintes et points de vigilance, avec les questions qui préparent la palette végétale. C'est le pont entre le diagnostic et l'Atelier.",
          output: 'Le chaînon manquant entre constater et agir.',
          effortDays: 5,
          status: 'todo',
          themeId: 'navigation',
        },
        {
          title: 'Barre de question en entrée de propriété',
          detail:
            "« Posez une question sur votre jardin » en haut de la propriété, branchée sur l'IA de jardin et ses contextes ciblés, avec des questions d'amorce répondant au « suis-je dans les clous ».",
          output: 'La réponse avant le formulaire.',
          effortDays: 2,
          status: 'todo',
          themeId: 'questions',
        },
      ],
    },
    {
      code: 'P5',
      title: 'Test MERCI (biomasse)',
      window: 'Fin septembre / octobre',
      rationale:
        "Le protocole demande un cadrage méthodologique et une fenêtre saisonnière : il se prépare pendant l'été pour être prêt au printemps suivant.",
      startPct: 62,
      widthPct: 20,
      tasks: [
        {
          title: 'Protocole MERCI simplifié',
          detail:
            "Relevé d'espèces déjà présent, puis pesée sur placette ou estimation de biomasse par photo, avec rappel de la fenêtre optimale (juin). Choix explicite entre version pesée et version estimée.",
          output: 'Un protocole tenable dans un jardin, sans matériel de laboratoire.',
          effortDays: 6,
          status: 'todo',
          themeId: 'merci',
        },
        {
          title: 'Restitution en capacité fertilisante',
          detail:
            "Conversion de la biomasse en restitution d'azote, phosphore et potasse, présentée en langage de jardinier, avec la marge d'incertitude affichée.",
          output: 'Une estimation d\'apport chiffrée, utilisable pour décider.',
          effortDays: 4,
          status: 'todo',
          themeId: 'merci',
        },
        {
          title: 'Positionnement à cheval J\'analyse / J\'identifie',
          detail:
            "Le module réutilise le relevé de flore existant et alimente en retour le diagnostic de sol : une seule saisie, deux usages.",
          output: 'Pas de double saisie pour l\'utilisateur.',
          effortDays: 3,
          status: 'todo',
          themeId: 'merci',
        },
      ],
    },
    {
      code: 'P6',
      title: 'Rayonnement',
      window: 'Octobre et au-delà',
      rationale:
        "La galerie suppose que le portrait soit court et beau : elle vient après la refonte du Portrait.",
      startPct: 80,
      widthPct: 20,
      tasks: [
        {
          title: 'Galerie de jardins inspirants',
          detail:
            "Une quinzaine de portraits de jardins de personnes reconnues, navigation de jardin en jardin, portrait volontairement très synthétique, statut ambassadeur proposé mais optionnel.",
          output: 'Une entrée par l\'inspiration avant l\'entrée par le formulaire.',
          effortDays: 8,
          status: 'todo',
          themeId: 'galerie',
        },
        {
          title: 'Recommandations de contenus au fil du parcours',
          detail:
            "Suggestions de lectures, de vidéos et de jardins voisins déclenchées par le diagnostic, sans transformer l'application en fil d'actualité.",
          output: 'De l\'inspiration au bon moment, dosée.',
          effortDays: 4,
          status: 'todo',
          themeId: 'galerie',
        },
      ],
    },
  ],

  milestones: [
    {
      date: '12 août 2026',
      label: 'Revue partenaire',
      detail: 'Présentation de cette feuille de route et arbitrage des priorités.',
    },
    {
      date: '17 août 2026',
      label: 'P0 livré',
      detail: 'Registre de sol infaillible, sortie d\'édition assainie, historique accessible.',
    },
    {
      date: '31 août 2026',
      label: 'P1 livré',
      detail: 'Concordance en curseurs à 5 crans, verdict en tête, encart méthode partout.',
    },
    {
      date: '12 septembre 2026',
      label: 'P2 livré',
      detail: 'Pondération par abondance active et référentiels comparés.',
    },
    {
      date: '30 septembre 2026',
      label: 'P3 livré',
      detail: 'Sondes et météo ingérées, onglet de suivi continu et écarts sol / air en ligne.',
    },
    {
      date: '15 octobre 2026',
      label: 'P4 livré',
      detail: 'Portrait unifié, onglet « Mon projet » et barre de question en place.',
    },
    {
      date: '31 octobre 2026',
      label: 'P5 cadré',
      detail: 'Protocole MERCI prêt pour la saison de mesure, galerie lancée.',
    },
  ],

  sensorSample: [
    { day: 'J-6', air: 27.4, sol10: 23.1, sol30: 20.2, sol60: 18.4 },
    { day: 'J-5', air: 29.8, sol10: 24.6, sol30: 20.9, sol60: 18.6 },
    { day: 'J-4', air: 31.2, sol10: 25.8, sol30: 21.6, sol60: 18.9 },
    { day: 'J-3', air: 24.5, sol10: 23.4, sol30: 21.4, sol60: 19.0 },
    { day: 'J-2', air: 19.6, sol10: 20.8, sol30: 20.6, sol60: 19.0 },
    { day: 'J-1', air: 22.1, sol10: 21.3, sol30: 20.4, sol60: 18.9 },
    { day: "Aujourd'hui", air: 26.3, sol10: 22.9, sol30: 20.7, sol60: 18.8 },
  ],

  closing:
    "Trois convictions ressortent de l'entretien : on ne perd jamais la donnée d'un utilisateur, on montre la synthèse avant le détail, et on mesure plutôt que d'estimer dès que c'est possible. Les sondes étant posées, la troisième devient réalisable dès septembre — c'est ce qui distinguera durablement l'outil.",
};
