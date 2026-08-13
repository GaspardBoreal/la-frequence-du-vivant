/**
 * Fiche application « Fréquence Jardin » — source unique de contenu.
 * La page web, l'export Markdown et l'export PDF lisent tous cet objet,
 * afin qu'aucune des trois formes ne puisse diverger.
 */

export interface FicheItem {
  name: string;
  desc: string;
}

export interface FicheSection {
  id: string;
  title: string;
  intro?: string;
  bullets?: string[];
  items?: FicheItem[];
}

export interface FicheMeta {
  label: string;
  value: string;
}

export const FICHE_URL = 'https://la-frequence-du-vivant.com/roadmap/frequence-jardin';

export const fiche = {
  name: 'Fréquence Jardin',
  publishedAt: '15.08.2026',
  baseline: "Le diagnostic vivant d'un lieu, de la première observation au geste de plantation.",
  summary:
    "Fréquence Jardin est une application web de diagnostic écologique de terrain. Elle conduit un jardin, une propriété ou une parcelle à travers cinq temps — observer, analyser le sol, identifier la flore bio-indicatrice, synthétiser, composer une palette végétale — puis prolonge ce diagnostic par un atelier de projet, une clinique sanitaire, un réseau de capteurs et une IA agronomique frugale. Elle est éditée par l'association La Fréquence du Vivant, dans la continuité des Marches du Vivant.",
  imprint: {
    association: 'Association LA FREQUENCE DU VIVANT',
    address: ['6 rue du Champ de Foire', '16 190 DEVIAT'],
    contact: 'Laurent TRIPIED : lt@bziiit.com / 06 70 76 14 99',
  },
  meta: [
    { label: 'Nom', value: 'Fréquence Jardin (espace Jardin de La Fréquence du Vivant)' },
    { label: 'Type', value: 'Application web (React / TypeScript / PostgreSQL), usage sur navigateur, mobile et desktop' },
    { label: 'Domaine', value: 'Agroécologie, écologie du sol, biodiversité, science participative, IoT agricole' },
    { label: 'Langue', value: 'Français' },
    { label: 'Statut', value: 'En production, déploiement progressif chez les propriétaires et partenaires' },
    { label: 'Accès', value: 'Espace authentifié par propriété ; pages publiques de restitution et d’export' },
    { label: 'Éditeur', value: 'Association La Fréquence du Vivant (loi 1901) — Laurent Tripied, Gaspard Boréal' },
    { label: 'Site', value: 'https://la-frequence-du-vivant.com' },
    { label: 'Fiche', value: FICHE_URL },
  ] as FicheMeta[],
  sections: [
    {
      id: 'en-bref',
      title: 'En bref',
      intro:
        "Ce que l'application fait, en huit phrases directement exploitables par un lecteur humain comme par un modèle de langage.",
      bullets: [
        "Elle lit un sol sur le terrain : structure, texture, pH, vie biologique, jusqu'à dix prélèvements géolocalisés par propriété, avec historique des versions et protection contre l'écrasement.",
        "Elle interprète la flore spontanée par la méthode des plantes bio-indicatrices (D.S.) et en tire un Indice de Concordance Globale (ICG) entre ce que le sol dit et ce que la flore raconte.",
        "Elle restitue le diagnostic en quatre curseurs lisibles — eau, texture, nutrition, pH — avant tout détail espèce par espèce.",
        "Elle recommande une palette végétale adaptée au sol lu, au climat local et aux projections climatiques, illustrée par des photographies sourcées.",
        "Elle permet de composer un ouvrage (haie, verger, massif) en posant les espèces sur le plan cadastral, puis d'imprimer un dossier de chantier.",
        "Elle compare un état avant et après travaux sur un lot d'ouvrages, avec un ICG avant / projeté / constaté explicable ligne à ligne.",
        "Elle accueille des capteurs et sondes connectés (sol, météo, pluviométrie) par webhook signé, en unités SI, et les positionne sur le plan.",
        "Elle embarque une IA de jardin frugale, à qui l'on attache explicitement les contextes utiles (vivant, sol, ouvrages, capteurs) pour limiter le coût et l'hallucination.",
      ],
    },
    {
      id: 'parcours',
      title: 'Le parcours en cinq temps',
      intro:
        "Le cœur de l'application est une progression, pas un tableau de bord. Chaque étape produit une matière que la suivante consomme.",
      items: [
        {
          name: "1. J'observe",
          desc: "Entrée sensible et factuelle : photographies géolocalisées, notes de terrain, relevés du vivant, contexte cadastral et paysager. Entrées : terrain, appareil photo, observations citoyennes. Sortie : un corpus d'observations situées, dédupliquées par nom scientifique et nommées en français.",
        },
        {
          name: "2. J'analyse le sol",
          desc: "Jusqu'à dix prélèvements nommés, renommables et supprimables, posés sur le plan. Structure, texture au toucher, pH, activité biologique, profondeur. Registre protégé : écriture réservée à l'onglet de saisie, garde-fou en base et historique consultable. Sortie : une lecture de sol (SoilLite) réutilisée par tous les écrans.",
        },
        {
          name: "3. J'identifie",
          desc: "La flore spontanée relevée est confrontée à la base bio-indicatrice (méthode D.S.). Verdict en tête de page sous forme de quatre mots-clés, puis cortège révélé, puis détail par espèce. Sortie : l'ICG, indice de concordance sol / flore, explicable espèce par espèce.",
        },
        {
          name: '4. Je synthétise',
          desc: "Récit du diagnostic assisté par IA, appuyé exclusivement sur les données de la propriété : ce que le sol raconte, ce que la flore confirme ou contredit, ce qu'il faut surveiller. Sortie : une synthèse imprimable, sans banderole pédagogique parasite.",
        },
        {
          name: '5. Palette végétale',
          desc: "Recommandation d'espèces adaptées au sol lu et au climat, avec projections climatiques, vignettes photographiques sourcées et impression conçue pour donner envie de planter. Sortie : une liste d'apports candidats, réutilisée par l'Atelier et le Chantier.",
        },
      ],
    },
    {
      id: 'modules',
      title: 'Les modules qui prolongent le diagnostic',
      items: [
        {
          name: 'Atelier du jardin',
          desc: "Plan cadastral en plein écran avec vues de fond superposables. On y pose et déplace les ouvrages, on y compose un massif au Scénographe en glissant des espèces, on y mesure au Mètre du jardinier, on y consulte la Chambre du Vivant en coupe 2,5D.",
        },
        {
          name: 'Le Chantier — avant / après',
          desc: "Lot d'ouvrages persistant, périmètre géométrique strict (rigueur, lisière 3 m, voisinage 15 m), ICG avant / projeté / constaté, tri du cortège espèce par espèce, médias classés par phase, rapport A4 simple ou complet.",
        },
        {
          name: 'La Clinique du vivant',
          desc: "Aide à la gestion des maladies observées : consultation assistée par IA sur base de connaissance pathogènes, foyers posés en GPS sur le plan, halos de propagation par type de pathogène, chaînes de contagion, tournée de soin ordonnée, journal de rétablissement.",
        },
        {
          name: 'Capteurs et sondes (IoT)',
          desc: "Catalogue de fournisseurs et de types de capteurs, capteurs rattachés à une propriété et posés au GPS, réception par webhook signé HMAC-SHA256 avec déduplication des livraisons, mesures normalisées en unités SI, fiche capteur avec tendance 30 jours, verdict agronomique et photographies en situation.",
        },
        {
          name: 'Herbier du moment',
          desc: "Ce qui se montre maintenant sur le lieu : sélection saisonnière du cortège, mise en page sensible, planche imprimable.",
        },
        {
          name: 'IA de Jardin',
          desc: "Assistant conversationnel frugal. L'utilisateur attache explicitement les contextes transmis (vivant, sol, ouvrages sélectionnés, rayon d'écoute, capteurs) et peut consulter le Bordereau du vivant : le détail exact de ce qui a été envoyé au modèle, avec la part de poids de chaque bloc, exportable en Markdown, JSON, CSV ou brut.",
        },
      ],
    },
    {
      id: 'donnees',
      title: 'Données, méthode et garanties',
      bullets: [
        "Sources : observations de terrain géolocalisées, observations citoyennes iNaturalist, cadastre, référentiels de flore bio-indicatrice, télémétrie des capteurs, données climatiques.",
        "Indicateurs : ICG (concordance sol / flore), quatre curseurs sol-flore en cinq crans (eau, texture, nutrition, pH), indices de diversité, cotation vivante des ouvrages.",
        "Intégrité : déduplication des espèces par nom scientifique, normalisation NFD des noms, résolution centralisée des noms français — aucun nom vernaculaire brut n'est affiché.",
        "Fraîcheur : priorité à la date réelle d'observation, synchronisation d'arrière-plan à la consultation, archivage des instantanés et garde-fou de régression.",
        "Protection : accès par propriété via règles de sécurité en base, écritures chirurgicales sur les registres sensibles, historique des versions et audit des chemins d'écriture du registre de sol.",
        "Sobriété : contextes IA attachés à la demande plutôt qu'envoyés en bloc, mesures en unités SI, interface volontairement dépouillée.",
      ],
    },
    {
      id: 'interoperabilite',
      title: 'Interopérabilité et exports',
      bullets: [
        "Impressions A4 conçues page par page : registre des prélèvements, atlas du cortège, palette végétale, dossier de chantier, rapport avant / après.",
        "Pack Vivant : archive ZIP réunissant PDF, Excel, CSV, GeoJSON et KML de toutes les espèces collectées, avec trois niveaux d'accès.",
        "Exports Markdown et JSON des contextes transmis à l'IA (Bordereau du vivant), directement réutilisables par un autre modèle.",
        "Webhook entrant signé pour la télémétrie, fonctions serveur pour l'agrégation biodiversité et la classification écologique des espèces.",
        "Interface MCP et fichier llms.txt pour l'exposition aux agents et moteurs conversationnels.",
      ],
    },
    {
      id: 'usages',
      title: "Pour qui, pour quoi",
      items: [
        {
          name: 'Jardin nourricier et particuliers engagés',
          desc: "Comprendre son sol sans laboratoire, choisir des espèces cohérentes, suivre l'évolution d'une haie ou d'un verger année après année.",
        },
        {
          name: "Maîtres d'ouvrage et paysagistes",
          desc: "Documenter un état initial opposable, projeter un aménagement, prouver le gain écologique après travaux avec un indice explicable.",
        },
        {
          name: 'Agriculteurs et porteurs de transition agroécologique',
          desc: "Lire la flore spontanée comme un diagnostic gratuit, croiser avec les sondes de sol, ajuster les pratiques.",
        },
        {
          name: 'Collectivités, associations naturalistes et entreprises',
          desc: "Suivre un site étendu, alimenter des indicateurs de biodiversité, restituer publiquement un travail de terrain.",
        },
      ],
    },
    {
      id: 'marches',
      title: 'Lien avec Les Marches du Vivant',
      intro:
        "Fréquence Jardin ne vit pas seule : elle est le versant « lieu » d'un dispositif dont le versant « collectif » est l'application des marcheurs, Les Marches du Vivant.",
      bullets: [
        "Les Marches du Vivant sont des immersions territoriales sensibles : des marcheuses et des marcheurs parcourent un territoire, photographient, écoutent, écrivent et relèvent le vivant.",
        "Leurs observations, une fois validées et rattachées, alimentent le corpus d'un lieu : les espèces relevées en marche deviennent une part du cortège lu dans Fréquence Jardin.",
        "Le vocabulaire est commun aux deux applications : Fréquences plutôt que points, Observations plutôt que contributions, noms français résolus par le même référentiel.",
        "Le mouvement fonctionne dans les deux sens : un jardin diagnostiqué peut devenir une étape de marche, et une marche peut ouvrir un diagnostic de lieu.",
        "L'espace marcheur offre carnet de terrain, carte, biodiversité, apprentissage et progression par rôles ; l'espace jardin offre la profondeur agronomique du lieu.",
        "Lien vers l'application des marcheurs : https://la-frequence-du-vivant.com/marches-du-vivant",
      ],
    },
  ] as FicheSection[],
};

/** Rend la fiche complète en Markdown, prêt à être lu par un modèle. */
export function ficheToMarkdown(): string {
  const L: string[] = [];
  L.push(`# ${fiche.name}`);
  L.push('');
  L.push(`> ${fiche.baseline}`);
  L.push('');
  L.push(fiche.summary);
  L.push('');
  L.push("## Carte d'identité");
  L.push('');
  L.push('| Champ | Valeur |');
  L.push('| --- | --- |');
  fiche.meta.forEach((m) => L.push(`| ${m.label} | ${m.value} |`));
  L.push('');

  fiche.sections.forEach((s) => {
    L.push(`## ${s.title}`);
    L.push('');
    if (s.intro) {
      L.push(s.intro);
      L.push('');
    }
    s.bullets?.forEach((b) => L.push(`- ${b}`));
    if (s.bullets?.length) L.push('');
    s.items?.forEach((i) => {
      L.push(`### ${i.name}`);
      L.push('');
      L.push(i.desc);
      L.push('');
    });
  });

  L.push('---');
  L.push('');
  L.push(
    `Fiche publiée par l'association La Fréquence du Vivant — ${FICHE_URL}`,
  );
  return L.join('\n');
}
