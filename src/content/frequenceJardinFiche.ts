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

export const SITE_URL = 'https://la-frequence-du-vivant.com';
export const FICHE_URL = `${SITE_URL}/roadmap/frequence-jardin`;

import logoGermination from '@/assets/brand/frequence-jardin/logos/logo-germination.png.asset.json';
import logoJardinOndulant from '@/assets/brand/frequence-jardin/logos/logo-jardin-ondulant.png.asset.json';
import logoFeuilleSignalLfdv from '@/assets/brand/lfdv/logo-feuille-signal-lfdv.png.asset.json';
import logoSentier from '@/assets/brand/marches-du-vivant/logo-sentier-frequence.png.asset.json';
import logoEmpreinte from '@/assets/brand/marches-du-vivant/logo-empreinte-vivante.png.asset.json';
import logoHorizon from '@/assets/brand/marches-du-vivant/logo-horizon-marche.png.asset.json';
import logoGerminationOndePleine from '@/assets/brand/frequence-jardin/logos/logo-germination-onde-pleine.png.asset.json';
import logoGerminationCercle from '@/assets/brand/frequence-jardin/logos/logo-germination-cercle.png.asset.json';
import logoGerminationNervure from '@/assets/brand/frequence-jardin/logos/logo-germination-nervure.png.asset.json';
import logoGerminationSolLu from '@/assets/brand/frequence-jardin/logos/logo-germination-sol-lu.png.asset.json';

export type FicheLogoFamily = 'lfdv' | 'jardin' | 'marches';

/** Statut d'arbitrage d'une proposition de logo. */
export type FicheLogoStatus = 'retenu' | 'variante' | 'ecarte';

export interface FicheLogo {
  slug: string;
  name: string;
  family: FicheLogoFamily;
  intention: string;
  /** Chemin CDN relatif de l'image. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Arbitrage : logo retenu pour la famille, variante d'emploi, ou écarté. */
  status?: FicheLogoStatus;
  /** Règle d'emploi associée au statut (affichée sur la fiche et la page logo). */
  usage?: string;
}

export const logoStatusLabels: Record<FicheLogoStatus, string> = {
  retenu: 'Retenu',
  variante: 'Variante d’emploi',
  ecarte: 'Écarté',
};


export const logoFamilies: { id: FicheLogoFamily; title: string; intro: string }[] = [
  {
    id: 'lfdv',
    title: 'La Fréquence du Vivant',
    intro:
      "La marque ombrelle : l'association qui porte l'ensemble des espaces. C'est elle qui signe les documents, les en-têtes et les fiches d'annuaire ; les deux familles suivantes en sont des déclinaisons applicatives.",
  },
  {
    id: 'marches',
    title: 'Les Marches du Vivant',
    intro:
      "Trois directions pour l'application des marcheurs, dans la même écriture botanique poétique, orientée chemin, pas et itinéraire.",
  },
  {
    id: 'jardin',
    title: 'Fréquence Jardin',
    intro:
      "Six directions de logo pour l'espace Jardin, non encore arbitrées. Quatre d'entre elles déclinent le motif fondateur de la graine en germination.",
  },
];


export const ficheLogos: FicheLogo[] = [
  {
    slug: 'germination',
    name: 'Germination en fréquence',
    family: 'jardin',
    intention:
      "Une graine en train de germer, dont la tige devient une onde. Le logo dit le commencement : ce qui lève dans un sol lu, et l'écoute qui l'accompagne. C'est la proposition la plus narrative des trois.",
    src: logoGermination.url,
    alt: "Logo Fréquence Jardin — Germination en fréquence : une graine germant en onde, identité visuelle de l'espace Jardin de La Fréquence du Vivant",
    width: 1024,
    height: 1024,
  },
  {
    slug: 'jardin-ondulant',
    name: 'Jardin ondulant',
    family: 'jardin',
    intention:
      "Trois feuilles en spirale accompagnées d'ondes concentriques. Le plus ample et le plus premium : il tient les formats paysage, les couvertures de rapport et les supports imprimés.",
    src: logoJardinOndulant.url,
    alt: 'Logo Fréquence Jardin — Jardin ondulant : trois feuilles en spirale entourées d’ondes concentriques, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
  },
  {
    slug: 'feuille-signal-la-frequence-du-vivant',
    name: 'Feuille-signal — La Fréquence du Vivant',
    family: 'lfdv',
    intention:
      "La Feuille-signal signée « La Fréquence du Vivant » : une feuille dont la nervure devient une onde. C'est le logo de la marque ombrelle — l'association qui abrite Les Marches du Vivant et Fréquence Jardin. Il s'emploie en en-tête de document, en signature et en fiche d'annuaire, les identités applicatives venant en second niveau.",

    src: logoFeuilleSignalLfdv.url,
    alt: 'Logo La Fréquence du Vivant — Feuille-signal : une feuille dont la nervure devient une onde, marque de l’association La Fréquence du Vivant',
    width: 1024,
    height: 1024,
  },
  {
    slug: 'germination-onde-pleine',
    name: 'Germination — onde pleine',
    family: 'jardin',
    intention:
      "La graine germe au centre d'une onde qui traverse tout le cadre, d'un bord à l'autre. Les racines descendent sous la ligne de signal : le sol écoute autant que l'air. La plus horizontale des variations, faite pour les en-têtes et les bandeaux.",
    src: logoGerminationOndePleine.url,
    alt: 'Logo Fréquence Jardin — Germination onde pleine : une graine en germination traversée par une onde sonore dorée, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
  },
  {
    slug: 'germination-cercle',
    name: 'Germination — cercle',
    family: 'jardin',
    intention:
      "Le germe inscrit dans un sceau d'ondes concentriques. Compacte et refermée sur elle-même, cette variation reste lisible en très petit : favicon, pastille d'annuaire, tampon de document.",
    src: logoGerminationCercle.url,
    alt: 'Logo Fréquence Jardin — Germination cercle : une graine germant au centre d’un sceau d’ondes concentriques dorées, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
  },
  {
    slug: 'germination-nervure',
    name: 'Germination — nervure',
    family: 'jardin',
    intention:
      "La tige elle-même devient onde : elle monte de la graine jusqu'aux cotylédons en oscillant. La plus verticale et la plus élancée, elle tient les formats portrait, les couvertures et les colonnes étroites.",
    src: logoGerminationNervure.url,
    alt: 'Logo Fréquence Jardin — Germination nervure : une graine dont la tige monte en onde dorée vers deux cotylédons, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
  },
  {
    slug: 'germination-sol-lu',
    name: 'Germination — sol lu',
    family: 'jardin',
    intention:
      "Le germe posé sur un sol stratifié, dont les horizons portent l'onde. Ici le signal court dans la terre et non dans l'air : c'est la variation la plus fidèle à la méthode — on lit le sol avant de planter.",
    src: logoGerminationSolLu.url,
    alt: 'Logo Fréquence Jardin — Germination sol lu : une graine germant sur des horizons de sol traversés par une onde dorée, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
  },
  {
    slug: 'sentier-frequence',
    name: 'Sentier en fréquence',
    family: 'marches',
    intention:
      "Un chemin sinueux qui se change progressivement en onde, ponctué de graminées et d'ombelles. Le logo raconte la marche elle-même : on entre par le sentier, on ressort en signal.",
    src: logoSentier.url,
    alt: 'Logo Les Marches du Vivant — Sentier en fréquence : un chemin qui devient une onde parmi les graminées, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
    status: 'ecarte',
    usage:
      'Conservé comme illustration éditoriale (articles, pages de contenu), pas comme logo.',
  },
  {
    slug: 'empreinte-vivante',
    name: 'Empreinte vivante',
    family: 'marches',
    intention:
      "Une empreinte de pas dont l'intérieur est un feuillage, entourée d'ondes concentriques. Le plus symbolique : la trace laissée par le marcheur est faite de vivant, et elle se propage.",
    src: logoEmpreinte.url,
    alt: 'Logo Les Marches du Vivant — Empreinte vivante : une empreinte de pas remplie de feuillages entourée d’ondes, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
    status: 'retenu',
    usage:
      "Logo de l'application Les Marches du Vivant : interface, favicon, avatar, pastille d'annuaire, en-tête d'export. Forme compacte, lisible en très petit et en monochrome.",
  },
  {
    slug: 'horizon-marche',
    name: 'Horizon marché',
    family: 'marches',
    intention:
      "Un horizon de courbes superposées — haies, coteaux, lisières — traversé par une fine ligne de signal ambrée. Le plus paysager : il tient les bandeaux, les couvertures et les formats larges.",
    src: logoHorizon.url,
    alt: 'Logo Les Marches du Vivant — Horizon marché : des collines et haies en courbes traversées par un signal, identité de La Fréquence du Vivant',
    width: 1024,
    height: 1024,
    status: 'variante',
    usage:
      'Motif de bandeau et de couverture (hero, image de partage, en-tête de rapport). Ne remplace jamais le logo retenu.',
  },

];

export const logosByFamily = (family: FicheLogoFamily) =>
  ficheLogos.filter((l) => l.family === family);

/** URL absolue d'une image de logo (utilisable dans un annuaire externe). */
export const logoImageUrl = (l: FicheLogo) => `${SITE_URL}${l.src}`;
/** URL absolue de la page dédiée d'un logo. */
export const logoPageUrl = (l: FicheLogo) => `${FICHE_URL}/logo/${l.slug}`;
export const findLogo = (slug?: string) => ficheLogos.find((l) => l.slug === slug);


export const fiche = {
  name: 'Fréquence Jardin',
  publishedAt: '13.08.2026',
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
  L.push(`*Fiche publiée le ${fiche.publishedAt}.*`);
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

  L.push('## Identité visuelle');
  L.push('');
  L.push(
    "Propositions de logo, par famille de marque. Chaque logo dispose d'une page dédiée et d'une URL d'image directe, réutilisables dans un annuaire ou une fiche externe.",
  );
  L.push('');
  logoFamilies.forEach((fam) => {
    L.push(`### ${fam.title}`);
    L.push('');
    L.push(fam.intro);
    L.push('');
    logosByFamily(fam.id).forEach((l) => {
      L.push(`#### ${l.name}`);
      L.push('');
      L.push(l.intention);
      L.push('');
      L.push(`![${l.alt}](${logoImageUrl(l)})`);
      L.push('');
      L.push(`- Page du logo : ${logoPageUrl(l)}`);
      L.push(`- Image directe : ${logoImageUrl(l)}`);
      L.push(`- Texte alternatif : ${l.alt}`);
      L.push('');
    });
  });


  L.push('---');
  L.push('');
  L.push(
    `${fiche.imprint.association} · ${fiche.imprint.address.join(' · ')} · Contact : ${fiche.imprint.contact}`,
  );
  L.push('');
  L.push(
    `Fiche publiée par l'association La Fréquence du Vivant — ${FICHE_URL}`,
  );
  return L.join('\n');
}
