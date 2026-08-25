/**
 * Contenu bilingue de la page partenariat La Fréquence du Vivant × Soil Acoustics.
 * Source : le deck « LFdV x SoilAcoustics » (10 slides), repris fidèlement.
 * Règle de rédaction : aucun tiret cadratin.
 */

export type SaLang = 'en' | 'fr';

export const CALENDLY_URL = 'https://calendly.com/laurent-bziiit/entretien-ia';
export const SOIL_ACOUSTICS_URL = 'https://soilacoustics.com/';
export const CONTACT_EMAIL = 'contact@la-frequence-du-vivant.com';

export interface SaStat {
  value: string;
  label: string;
  body?: string;
}

export interface SaContent {
  meta: { title: string; description: string };
  topbar: { brand: string; pdf: string };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    badge: string;
    signature: string;
    ctaPrimary: string;
    ctaGhost: string;
  };
  stakes: {
    eyebrow: string;
    title: string;
    subtitle: string;
    cards: { title: string; body: string }[];
    stats: SaStat[];
  };
  platform: {
    eyebrow: string;
    title: string;
    columns: { title: string; items: string[] }[];
    missingTitle: string;
    missingBody: string;
  };
  apps: {
    eyebrow: string;
    title: string;
    cards: { title: string; audience: string; body: string }[];
  };
  missingPiece: {
    eyebrow: string;
    title: string;
    left: { title: string; items: string[] };
    right: { title: string; items: { label: string; body: string }[] };
  };
  seeking: {
    eyebrow: string;
    title: string;
    priorityTag: string;
    items: { title: string; body: string; priority?: boolean }[];
  };
  giveBack: {
    eyebrow: string;
    title: string;
    stats: SaStat[];
    note: string;
  };
  timeline: {
    eyebrow: string;
    title: string;
    steps: { month: string; tag: string; items: string[] }[];
    note: string;
  };
  pilot: {
    eyebrow: string;
    title: string;
    left: { title: string; items: string[] };
    right: { title: string; items: string[] };
    commitment: string;
  };
  cta: {
    title: string;
    body: string;
    primary: string;
    secondary: string;
    hint: string;
  };
  footer: {
    quote: string;
    author: string;
    name: string;
    role: string;
    phone: string;
    credit: string;
  };
}

const LINKS = [
  { label: 'la-frequence-du-vivant.com', url: 'https://la-frequence-du-vivant.com' },
  { label: 'piloterra.fr', url: 'https://piloterra.fr' },
];

export const SOIL_ACOUSTICS_FOOTER_LINKS = LINKS;

export const soilAcousticsContent: Record<SaLang, SaContent> = {
  fr: {
    meta: {
      title: 'La Fréquence du Vivant × Soil Acoustics : proposition de partenariat',
      description:
        'Bioacoustique du sol et 106 sites déjà documentés en France : proposition de partenariat technologique entre La Fréquence du Vivant et Soil Acoustics.',
    },
    topbar: { brand: 'La Fréquence du Vivant × Soil Acoustics', pdf: 'Version PDF' },
    hero: {
      eyebrow: 'La Fréquence du Vivant × Soil Acoustics',
      title: 'Écouter le sol. Ensemble.',
      lead: 'Proposition de partenariat technologique. Bioacoustique du sol × 106 sites déjà documentés en France.',
      badge: 'Objectif : un accord de principe sur un pilote en septembre',
      signature: 'Laurent Tripied · Fondateur, La Fréquence du Vivant · Août 2026',
      ctaPrimary: 'Réserver un créneau de 30 minutes',
      ctaGhost: 'Soil Acoustics ↗',
    },
    stakes: {
      eyebrow: '1 · Enjeux et opportunités',
      title: 'La biodiversité du sol est invisible.',
      subtitle: 'Nous la rendons audible, mesurable, partagée.',
      cards: [
        {
          title: 'Un angle mort dans la gestion des jardins, parcs et vignobles',
          body: "Les décisions d'aménagement se prennent sans données sur la vie du sol. Le test bêche et la lombricologie restent manuels, lents, rarement répétés.",
        },
        {
          title: 'Une demande qui monte : prouver l’impact écologique',
          body: 'Propriétaires, paysagistes, coopératives et collectivités doivent désormais démontrer une trajectoire, pas seulement un état initial.',
        },
        {
          title: 'Une communauté déjà prête à collecter',
          body: 'Nos marcheurs-ambassadeurs sont formés à la donnée biodiversité. Ils attendent un instrument pour le sol.',
        },
      ],
      stats: [
        { value: '1 an', label: "d'existence de l'association" },
        { value: '100+', label: 'marcheurs-ambassadeurs' },
        { value: '106', label: 'propriétés documentées' },
        { value: '3', label: 'offres complémentaires' },
      ],
    },
    platform: {
      eyebrow: '2 · Ce dont nous disposons déjà',
      title: 'Une plateforme ouverte, conçue pour brancher des capteurs',
      columns: [
        {
          title: 'Stack ouverte',
          items: [
            'Supabase / PostgreSQL + PostGIS',
            'Edge Functions Deno, Auth JWT + RLS',
            'API, MCP (Model Context Protocol), webhooks n8n / Resend / Brad Technology',
            'Frontend React / Lovable',
          ],
        },
        {
          title: 'Données croisées',
          items: [
            'Biodiversité : GBIF, iNaturalist, Xeno-Canto, eBird, INPN',
            'Climat : Open-Meteo, Météo-France, Copernicus',
            'Territoire : IGN, Cadastre, Corine Land Cover',
            'Déduplication stricte par nom scientifique',
          ],
        },
        {
          title: 'Capteurs déjà intégrés',
          items: [
            'Météo in situ (partenaires français)',
            'Température et humidité du sol à 4 profondeurs : 5, 15, 30, 60 cm',
            'Snapshots versionnés, donc suivi dans le temps',
          ],
        },
      ],
      missingTitle: 'Il manque une couche : le son du sol',
      missingBody:
        'Livrable client : le Pack Vivant, export PDF + Excel + CSV + GeoJSON + KML, 3 niveaux d’accès. Vos données trouveraient leur place dedans dès le pilote.',
    },
    apps: {
      eyebrow: '2 · Ce dont nous disposons déjà',
      title: 'Quatre applications, un même écosystème du vivant',
      cards: [
        {
          title: 'Les Marches du Vivant',
          audience: 'Ambassadeurs',
          body: 'Marches de sensibilisation guidées : les participants collectent eux-mêmes la donnée biodiversité (bioacoustique, photo, GPS) le long du parcours. 106 propriétés documentées.',
        },
        {
          title: 'Fréquence Jardin',
          audience: 'Paysagistes',
          body: "Diagnostic en 6 étapes pour jardins et parcs : recommandations d'aménagement (potager ou ornemental) générées à partir des données collectées. En partenariat avec Ver de Terre Production.",
        },
        {
          title: 'Fréquence Vignoble',
          audience: 'Vignerons',
          body: "Même approche pour les vignerons : rapport biodiversité du domaine et recommandations pour la développer. Un secteur où l'acoustique du sol a déjà fait ses preuves.",
        },
        {
          title: 'PiloTerra',
          audience: 'Coopératives',
          body: 'Portail IA agricole open source, lancé au Salon International de l’Agriculture 2026. Porte d’entrée vers nos clients coopératives.',
        },
      ],
    },
    missingPiece: {
      eyebrow: 'La pièce manquante',
      title: 'Ce que nous savons de vous, et pourquoi cela s’emboîte',
      left: {
        title: 'Ce que nous avons compris de SAM',
        items: [
          'Sonde acoustique portable, brevetée, issue de la recherche Baker Consultants × Université de Warwick (financement DEFRA)',
          'Mesure rapide, non invasive et répétable de l’activité de la faune du sol (vers de terre, larves, méso-faune)',
          'Base de sons internationale et algorithmes d’analyse ; rapports en ligne',
          'Déjà testé sur des vignobles et domaines (Ruinart, JoJo’s Vineyard, National Trust)',
        ],
      },
      right: {
        title: 'Pourquoi cela s’emboîte',
        items: [
          { label: 'Nos protocoles', body: 'Test bêche, plantes bio-indicatrices, lombricologie : SAM les complète et les accélère.' },
          { label: 'Nos capteurs', body: 'Température et humidité à 4 profondeurs donnent le contexte de chaque enregistrement.' },
          { label: 'Notre temporalité', body: 'Marches répétées sur un même site : la courbe d’impact que vos clients réclament.' },
          { label: 'Notre récit', body: 'Le son du sol devient une « Fréquence du jour » : la donnée ouvre sur l’expérience.' },
        ],
      },
    },
    seeking: {
      eyebrow: '3 · Ce que nous recherchons',
      title: 'Un partenariat technologique en quatre briques',
      priorityTag: 'Priorité',
      items: [
        {
          title: 'Une solution mobile pour nos marches',
          body: 'Des unités SAM utilisables par nos ambassadeurs pendant les Marches du Vivant, avec un protocole d’enregistrement simple et reproductible.',
        },
        {
          title: 'Un accès à l’achat pour les grands sites',
          body: 'Possibilité pour les gestionnaires de grands domaines (vignobles, parcs, coopératives) d’acquérir directement des unités.',
        },
        {
          title: 'L’accès API aux données',
          body: 'Enregistrements, indices et identification (espèces ou groupes fonctionnels) récupérables par API pour intégration dans notre plateforme et le Pack Vivant.',
          priority: true,
        },
        {
          title: 'Une communication croisée',
          body: 'Blog, réseaux sociaux, podcasts IA & Agriculture : développer nos audiences et nos potentiels de contacts respectifs, en France et au Royaume-Uni.',
        },
      ],
    },
    giveBack: {
      eyebrow: 'Ce que nous apportons en retour',
      title: 'Une vitrine française, une communauté formée, des réseaux déjà ouverts',
      stats: [
        {
          value: '106',
          label: 'sites',
          body: 'Visibilité concrète sur plus d’une centaine de propriétés : jardins, parcs, vignobles, fermes agroécologiques, marais salants.',
        },
        {
          value: '100+',
          label: 'ambassadeurs',
          body: 'Une communauté déjà formée à la collecte de données biodiversité : des retours terrain qualifiés, pas des tests isolés.',
        },
        {
          value: '2',
          label: 'réseaux partenaires',
          body: 'Ver de Terre Production (audience sol vivant, offre Fréquence Jardin) et PiloTerra (coopératives agricoles, La Ferme Digitale).',
        },
        {
          value: '1',
          label: 'marché',
          body: 'Une porte d’entrée sur le marché français, viticole en particulier, avec des cas d’usage documentés et racontés.',
        },
      ],
      note: 'Et un récit. Chaque site devient une histoire publiée (carnets, eBook, réseaux) : vos données ne restent pas dans un tableur, elles sont racontées à des propriétaires, paysagistes, vignerons et collectivités.',
    },
    timeline: {
      eyebrow: '4 · Calendrier',
      title: 'Quatre mois pour passer de l’accord au marché',
      steps: [
        {
          month: 'Sept.',
          tag: 'Validation',
          items: ['Appel de cadrage', 'Critères de succès écrits', 'Accord de partenariat'],
        },
        {
          month: 'Oct.',
          tag: 'Prototype',
          items: ['Unités en test terrain', 'Connexion API vers la plateforme', 'Annonce blog & réseaux'],
        },
        {
          month: 'Nov.',
          tag: 'Marches du Vivant',
          items: ['Intégration aux marches', 'Protocole ambassadeurs', 'Premiers Packs Vivant enrichis'],
        },
        {
          month: 'Déc.',
          tag: 'Fréquence Jardin',
          items: ['Intégration à l’offre', 'Campagne de lancement', 'Synthèse des 4 premiers mois'],
        },
      ],
      note: 'Fin décembre 2026 : retours marché détaillés et synthèse des quatre premiers mois, partagés avec Soil Acoustics.',
    },
    pilot: {
      eyebrow: 'Proposition de pilote',
      title: 'Un cadre simple, à faible risque pour les deux parties',
      left: {
        title: 'Ce que nous proposons',
        items: [
          'Un pilote sur 3 à 5 sites représentatifs (vignoble, jardin, ferme agroécologique)',
          '2 à 3 unités SAM mises à disposition ou prêtées pour la durée du pilote',
          'Un accès API « bac à sable » pour tester l’intégration',
          'Un protocole terrain co-écrit, appliqué par nos ambassadeurs',
        ],
      },
      right: {
        title: 'Ce que nous mesurons ensemble',
        items: [
          'Qualité et régularité des enregistrements en conditions de marche',
          'Cohérence avec nos relevés (test bêche, lombricologie, capteurs sol)',
          'Valeur perçue par les propriétaires et paysagistes',
          'Faisabilité de l’intégration dans le Pack Vivant',
        ],
      },
      commitment:
        'Notre engagement : un rapport de pilote partagé, des cas d’usage publiables, et une décision claire sur l’étape suivante avant fin 2026.',
    },
    cta: {
      title: 'Échangeons de vive voix',
      body: 'Choisissez le créneau qui vous convient : 30 minutes pour parcourir la donnée, le pilote et les conditions du partenariat.',
      primary: 'Réserver un créneau sur Calendly',
      secondary: 'Nous écrire directement',
      hint: 'Laurent Tripied · Fondateur, La Fréquence du Vivant',
    },
    footer: {
      quote: '« Écouter un territoire, c’est déjà commencer à le défendre. »',
      author: 'Manifeste fondateur, La Fréquence du Vivant',
      name: 'Laurent Tripied',
      role: 'Fondateur, La Fréquence du Vivant · CEO bziiit & PiloTerra',
      phone: '+33 6 70 76 14 99',
      credit: 'Technologie évoquée : Soil Acoustics Ltd. (Royaume-Uni) / La Fréquence du Vivant (France)',
    },
  },

  en: {
    meta: {
      title: 'La Fréquence du Vivant × Soil Acoustics: partnership proposal',
      description:
        'Soil bioacoustics and 106 sites already documented in France: a technology partnership proposal between La Fréquence du Vivant and Soil Acoustics.',
    },
    topbar: { brand: 'La Fréquence du Vivant × Soil Acoustics', pdf: 'PDF version' },
    hero: {
      eyebrow: 'La Fréquence du Vivant × Soil Acoustics',
      title: 'Listening to soil. Together.',
      lead: 'A technology partnership proposal. Soil bioacoustics × 106 sites already documented in France.',
      badge: 'Goal: an agreement in principle on a pilot in September',
      signature: 'Laurent Tripied · Founder, La Fréquence du Vivant · August 2026',
      ctaPrimary: 'Book a 30-minute call',
      ctaGhost: 'Soil Acoustics ↗',
    },
    stakes: {
      eyebrow: '1 · Context and opportunity',
      title: 'Soil biodiversity is invisible.',
      subtitle: 'We make it audible, measurable and shared.',
      cards: [
        {
          title: 'A blind spot in how gardens, parks and vineyards are managed',
          body: 'Land management decisions are taken without any data on soil life. Spade tests and earthworm counts remain manual, slow and rarely repeated.',
        },
        {
          title: 'A rising demand: proving ecological impact',
          body: 'Owners, landscape designers, cooperatives and local authorities now have to demonstrate a trajectory, not just a baseline.',
        },
        {
          title: 'A community already trained to collect',
          body: 'Our walker-ambassadors are trained in biodiversity data collection. What they lack is an instrument for the soil.',
        },
      ],
      stats: [
        { value: '1 year', label: 'since the non-profit was founded' },
        { value: '100+', label: 'walker-ambassadors' },
        { value: '106', label: 'documented properties' },
        { value: '3', label: 'complementary offerings' },
      ],
    },
    platform: {
      eyebrow: '2 · What we already have',
      title: 'An open platform, built to plug sensors in',
      columns: [
        {
          title: 'Open stack',
          items: [
            'Supabase / PostgreSQL + PostGIS',
            'Deno Edge Functions, JWT Auth + RLS',
            'API, MCP (Model Context Protocol), n8n / Resend / Brad Technology webhooks',
            'React / Lovable frontend',
          ],
        },
        {
          title: 'Cross-referenced data',
          items: [
            'Biodiversity: GBIF, iNaturalist, Xeno-Canto, eBird, INPN',
            'Climate: Open-Meteo, Météo-France, Copernicus',
            'Territory: IGN, French land registry, Corine Land Cover',
            'Strict deduplication by scientific name',
          ],
        },
        {
          title: 'Sensors already integrated',
          items: [
            'On-site weather stations (French partners)',
            'Soil temperature and moisture at four depths: 5, 15, 30, 60 cm',
            'Versioned snapshots, so change is tracked over time',
          ],
        },
      ],
      missingTitle: 'One layer is missing: the sound of the soil',
      missingBody:
        'Client deliverable: the Pack Vivant, exported as PDF + Excel + CSV + GeoJSON + KML, with 3 access levels. Your data would find its place in it from the pilot onwards.',
    },
    apps: {
      eyebrow: '2 · What we already have',
      title: 'Four applications, one living ecosystem',
      cards: [
        {
          title: 'Les Marches du Vivant (Living Walks)',
          audience: 'Ambassadors',
          body: 'Guided awareness walks where participants collect biodiversity data themselves (bioacoustics, photos, GPS) along the route. 106 properties documented.',
        },
        {
          title: 'Fréquence Jardin',
          audience: 'Landscape designers',
          body: 'A 6-step diagnosis for gardens and parks: layout recommendations (kitchen garden or ornamental) generated from the data collected. In partnership with Ver de Terre Production.',
        },
        {
          title: 'Fréquence Vignoble',
          audience: 'Winegrowers',
          body: 'The same approach for wine estates: a biodiversity report for the estate and recommendations to grow it. A sector where soil acoustics has already proven itself.',
        },
        {
          title: 'PiloTerra',
          audience: 'Cooperatives',
          body: 'An open-source agricultural AI portal, launched at the Paris International Agricultural Show 2026. Our entry point to cooperative clients.',
        },
      ],
    },
    missingPiece: {
      eyebrow: 'The missing piece',
      title: 'What we understand about your work, and why it fits',
      left: {
        title: 'What we understand about SAM',
        items: [
          'A portable, patented acoustic meter born from research by Baker Consultants × University of Warwick (DEFRA funded)',
          'A fast, non-invasive and repeatable measure of soil fauna activity (earthworms, larvae, mesofauna)',
          'An international sound library and analysis algorithms, with online reporting',
          'Already tested on vineyards and estates (Ruinart, JoJo’s Vineyard, National Trust)',
        ],
      },
      right: {
        title: 'Why it fits',
        items: [
          { label: 'Our protocols', body: 'Spade tests, bio-indicator plants, earthworm counts: SAM complements and accelerates them.' },
          { label: 'Our sensors', body: 'Temperature and moisture at four depths give context to every recording.' },
          { label: 'Our timeframe', body: 'Walks repeated on the same site produce the impact curve your clients ask for.' },
          { label: 'Our storytelling', body: 'The sound of the soil becomes a « Fréquence du jour »: data opens onto experience.' },
        ],
      },
    },
    seeking: {
      eyebrow: '3 · What we are looking for',
      title: 'A technology partnership in four building blocks',
      priorityTag: 'Priority',
      items: [
        {
          title: 'A mobile solution for our walks',
          body: 'SAM units our ambassadors can use during the Living Walks, with a simple and reproducible recording protocol.',
        },
        {
          title: 'Purchase access for large sites',
          body: 'The option for managers of large estates (vineyards, parks, cooperatives) to buy units directly.',
        },
        {
          title: 'API access to the data',
          body: 'Recordings, indices and identification (species or functional groups) retrievable by API, for integration into our platform and the Pack Vivant.',
          priority: true,
        },
        {
          title: 'Cross-communication',
          body: 'Blog, social media, AI & Agriculture podcasts: growing our respective audiences and lead potential, in France and the UK.',
        },
      ],
    },
    giveBack: {
      eyebrow: 'What we bring in return',
      title: 'A French showcase, a trained community, networks already open',
      stats: [
        {
          value: '106',
          label: 'sites',
          body: 'Concrete visibility across more than a hundred properties: gardens, parks, vineyards, agroecological farms, salt marshes.',
        },
        {
          value: '100+',
          label: 'ambassadors',
          body: 'A community already trained in biodiversity data collection: qualified field feedback, not isolated tests.',
        },
        {
          value: '2',
          label: 'partner networks',
          body: 'Ver de Terre Production (living-soil audience, Fréquence Jardin offering) and PiloTerra (agricultural cooperatives, La Ferme Digitale).',
        },
        {
          value: '1',
          label: 'market',
          body: 'A documented entry into the French market, vineyards in particular, with use cases that are written up and told.',
        },
      ],
      note: 'And a story. Every site becomes a published account (field notebooks, eBook, social media): your data does not stay in a spreadsheet, it is told to owners, landscape designers, winegrowers and local authorities.',
    },
    timeline: {
      eyebrow: '4 · Timeline',
      title: 'Four months from agreement to market',
      steps: [
        {
          month: 'Sept.',
          tag: 'Validation',
          items: ['Scoping call', 'Written success criteria', 'Partnership agreement'],
        },
        {
          month: 'Oct.',
          tag: 'Prototype',
          items: ['Units tested in the field', 'API connection to the platform', 'Blog and social announcement'],
        },
        {
          month: 'Nov.',
          tag: 'Living Walks',
          items: ['Integration into the walks', 'Ambassador protocol', 'First enriched Packs Vivant'],
        },
        {
          month: 'Dec.',
          tag: 'Fréquence Jardin',
          items: ['Integration into the offering', 'Launch campaign', 'Review of the first four months'],
        },
      ],
      note: 'End of December 2026: detailed market feedback and a review of the first four months, shared with Soil Acoustics.',
    },
    pilot: {
      eyebrow: 'Pilot proposal',
      title: 'A simple, low-risk framework for both sides',
      left: {
        title: 'What we propose',
        items: [
          'A pilot on 3 to 5 representative sites (vineyard, garden, agroecological farm)',
          '2 to 3 SAM units made available or loaned for the duration of the pilot',
          'A sandbox API access to test the integration',
          'A field protocol written together, applied by our ambassadors',
        ],
      },
      right: {
        title: 'What we measure together',
        items: [
          'Quality and consistency of recordings in walking conditions',
          'Coherence with our own readings (spade test, earthworm counts, soil sensors)',
          'Perceived value for owners and landscape designers',
          'Feasibility of integration into the Pack Vivant',
        ],
      },
      commitment:
        'Our commitment: a shared pilot report, publishable use cases, and a clear decision on the next step before the end of 2026.',
    },
    cta: {
      title: 'Let us talk it through',
      body: 'Pick the slot that suits you best: 30 minutes to walk through the data, the pilot and the terms of the partnership.',
      primary: 'Book a slot on Calendly',
      secondary: 'Email us directly',
      hint: 'Laurent Tripied · Founder, La Fréquence du Vivant',
    },
    footer: {
      quote: '"Listening to a territory is already the first act of defending it."',
      author: 'Founding manifesto, La Fréquence du Vivant',
      name: 'Laurent Tripied',
      role: 'Founder, La Fréquence du Vivant · CEO bziiit & PiloTerra',
      phone: '+33 6 70 76 14 99',
      credit: 'Technology mentioned: Soil Acoustics Ltd. (UK) / La Fréquence du Vivant (France)',
    },
  },
};
