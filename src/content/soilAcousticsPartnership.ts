/**
 * Contenu bilingue de la page partenariat La Fréquence du Vivant × Soil Acoustics.
 * Source unique : la page EN (par défaut) et FR lisent le même objet.
 */

export type SaLang = 'en' | 'fr';

export const CALENDLY_URL = 'https://calendly.com/laurent-bziiit/entretien-ia';
export const SOIL_ACOUSTICS_URL = 'https://soilacoustics.com/';
export const CONTACT_EMAIL = 'contact@la-frequence-du-vivant.com';

export interface SaContent {
  meta: { title: string; description: string };
  topbar: { brand: string; pdf: string };
  hero: {
    eyebrow: string;
    title: string;
    leadBefore: string;
    leadStrong: string;
    leadAfter: string;
    badge: string;
    ctaPrimary: string;
    ctaGhost: string;
  };
  constat: {
    eyebrow: string;
    title: string;
    cards: { title: string; body: string }[];
  };
  explore: {
    eyebrow: string;
    title: string;
    body: string;
    credit: string;
    features: string[];
  };
  apps: {
    eyebrow: string;
    title: string;
    cards: { title: string; body: string }[];
  };
  status: {
    eyebrow: string;
    title: string;
    steps: { dot: string; tag: string; title: string; body: string }[];
    note: string;
  };
  cta: {
    title: string;
    body: string;
    primary: string;
    secondary: string;
    hint: string;
  };
  footer: { quote: string; author: string; creditBefore: string };
}

export const soilAcousticsContent: Record<SaLang, SaContent> = {
  en: {
    meta: {
      title: 'La Fréquence du Vivant × Soil Acoustics — Partnership in discussion',
      description:
        'Exploring a technology partnership to listen to soil biodiversity across 100+ sites: Living Walks, Fréquence Jardin, Fréquence Vignoble.',
    },
    topbar: { brand: 'La Fréquence du Vivant × Soil Acoustics', pdf: 'PDF version' },
    hero: {
      eyebrow: 'Partnership in discussion',
      title: 'Listening to what lives beneath our feet.',
      leadBefore: 'La Fréquence du Vivant is exploring a collaboration with ',
      leadStrong: 'Soil Acoustics',
      leadAfter:
        ' (UK) to give soil biodiversity — earthworms, larvae, soil mesofauna — a voice alongside our field walks and the sensors already deployed across more than a hundred sites.',
      badge: 'In discussion since August 2026 · nothing finalised yet',
      ctaPrimary: 'Book a 30-minute call',
      ctaGhost: 'Soil Acoustics ↗',
    },
    constat: {
      eyebrow: 'The starting point',
      title: 'A living world we can barely hear',
      cards: [
        {
          title: "A life we can't see",
          body: 'The spade test and earthworm counts give us a valuable snapshot, but a slow and occasional one. Most soil activity goes unnoticed by everyday observation.',
        },
        {
          title: 'A trend to prove',
          body: 'Owners, landscape designers and local authorities now ask us to show change over time, not just a single state.',
        },
        {
          title: 'A community already walking',
          body: 'Over a hundred trained ambassadors already cover our partner territories, collecting biodiversity data as they go.',
        },
      ],
    },
    explore: {
      eyebrow: "What we're exploring",
      title: 'Listening to soil the way we listen to a forest',
      body: "Soil Acoustics grew out of research carried out with the University of Warwick and backed by the UK's DEFRA Farming Innovation programme. Their instrument records the sounds soil fauna make — a fast, non-invasive way to estimate soil activity, where our current protocols take time and patience.",
      credit: 'More on Soil Acoustics ↗',
      features: [
        'A field recorder our ambassadors could use during Living Walks.',
        'A read on soil activity, alongside our existing temperature and moisture readings at four depths.',
        'A possible addition to our Pack Vivant deliverable, if the collaboration goes ahead.',
      ],
    },
    apps: {
      eyebrow: 'Where it could fit',
      title: 'Three fields already ready for a new frequency',
      cards: [
        {
          title: 'Living Walks',
          body: 'A new listening gesture during our awareness walks, alongside the airborne bioacoustics we already practise.',
        },
        {
          title: 'Fréquence Jardin',
          body: 'One more data layer to sharpen the layout recommendations we give landscape designers and owners.',
        },
        {
          title: 'Fréquence Vignoble',
          body: 'A closer read of soil life for wine estates — a field where soil acoustics has already proven itself elsewhere in Europe.',
        },
      ],
    },
    status: {
      eyebrow: 'Where things stand',
      title: 'An exploration, step by step',
      steps: [
        {
          dot: '✓',
          tag: 'August 2026',
          title: 'First contact',
          body: 'Initial exchanges between the two teams about a possible partnership.',
        },
        {
          dot: '2',
          tag: 'In progress',
          title: 'Technical exploration',
          body: "We're discussing the data, its format, and the terms of a possible field pilot.",
        },
        {
          dot: '3',
          tag: 'Ahead',
          title: 'Pilot & announcement',
          body: 'Subject to agreement between both parties.',
        },
      ],
      note: 'This page will be updated as things move forward. No date is guaranteed.',
    },
    cta: {
      title: "Let's talk it through",
      body: 'Pick the slot that suits you best — 30 minutes to walk through the data, the pilot and the terms of a possible partnership.',
      primary: 'Book a slot on Calendly',
      secondary: 'Email us directly',
      hint: 'Laurent Tripied · Founder, La Fréquence du Vivant',
    },
    footer: {
      quote: '"Listening to a territory is already the first act of defending it."',
      author: '— Founding manifesto, La Fréquence du Vivant',
      creditBefore: 'Technology mentioned: Soil Acoustics Ltd. (UK) — ',
    },
  },

  fr: {
    meta: {
      title: 'La Fréquence du Vivant × Soil Acoustics — Partenariat en discussion',
      description:
        "Exploration d'un partenariat technologique pour écouter la biodiversité du sol sur plus de 100 sites : Marches du Vivant, Fréquence Jardin, Fréquence Vignoble.",
    },
    topbar: { brand: 'La Fréquence du Vivant × Soil Acoustics', pdf: 'Version PDF' },
    hero: {
      eyebrow: 'Partenariat en discussion',
      title: 'Écouter le sol ensemble.',
      leadBefore: 'Proposition de collaboration Soil Acoustics (Royaume-Uni) x\u00a0La Fréquence du Vivant\u00a0(France) pour donner une voix à la biodiversité du sol [vers de terre, larves, méso-faune ...] aux côtés de nos marches et des capteurs déjà déployés sur plus de cent sites.',
      leadStrong: '',
      leadAfter: '',
      badge: 'Contexte / Enjeux / Opportunités\u00a0',
      ctaPrimary: 'Réserver un créneau de 30 minutes',
      ctaGhost: 'Soil Acoustics ↗',
    },
    constat: {
      eyebrow: 'Le constat',
      title: 'Un monde vivant, largement inaudible',
      cards: [
        {
          title: "Une vie qu'on ne voit pas",
          body: "Le test bêche et la lombricologie donnent un instantané précieux, mais lent et ponctuel. La majorité de l'activité du sol échappe à l'observation courante.",
        },
        {
          title: 'Une trajectoire à prouver',
          body: 'Propriétaires, paysagistes et collectivités nous demandent désormais de démontrer une évolution dans le temps, pas seulement un état des lieux.',
        },
        {
          title: 'Une communauté déjà en marche',
          body: 'Plus de cent ambassadeurs LES MARCHES DU VIVANT, formés à la collecte de données biodiversité, parcourent déjà nos territoires partenaires.',
        },
      ],
    },
    explore: {
      eyebrow: 'Ce que nous explorons',
      title: 'Écouter le sol comme on écoute une forêt',
      body: "Soil Acoustics est né des recherches menées avec l'université de Warwick et soutenues par le programme britannique DEFRA Farming Innovation. Leur instrument capte les sons produits par la faune du sol — une manière rapide et non invasive d'estimer son activité, là où nos protocoles actuels demandent du temps et de la patience.",
      credit: 'En savoir plus sur Soil Acoustics ↗',
      features: [
        'Un enregistreur de terrain que nos ambassadeurs pourraient utiliser pendant les Marches du Vivant.',
        "Une lecture de l'activité du sol, en complément de nos relevés de température et d'humidité à 4 profondeurs.",
        "Une piste d'intégration à notre Pack Vivant, si la collaboration se confirme.",
      ],
    },
    apps: {
      eyebrow: "Où cela pourrait s'inscrire",
      title: 'Trois terrains déjà prêts à accueillir une nouvelle fréquence',
      cards: [
        {
          title: 'Les Marches du Vivant',
          body: "Un nouveau geste d'écoute pendant nos marches de sensibilisation, aux côtés de la bioacoustique aérienne que nous pratiquons déjà.",
        },
        {
          title: 'Fréquence Jardin',
          body: "Une donnée supplémentaire pour affiner les recommandations d'aménagement transmises aux paysagistes et propriétaires.",
        },
        {
          title: 'Fréquence Vignoble',
          body: "Une lecture fine de la vie du sol pour les domaines viticoles, un terrain où l'acoustique du sol a déjà fait ses preuves ailleurs en Europe.",
        },
      ],
    },
    status: {
      eyebrow: 'Où en sont les discussions',
      title: 'Une exploration pas à pas',
      steps: [
        {
          dot: '✓',
          tag: 'Août 2026',
          title: 'Premier contact',
          body: "Échanges initiaux entre les deux équipes autour d'un partenariat possible.",
        },
        {
          dot: '2',
          tag: 'En cours',
          title: 'Explorations techniques',
          body: "Nous échangeons sur la donnée, son format et les conditions d'un test de terrain.",
        },
        {
          dot: '3',
          tag: 'À venir',
          title: 'Pilote & annonce',
          body: "Sous réserve d'accord entre les deux parties.",
        },
      ],
      note: 'Cette page sera mise à jour au fil des échanges selon les retours et objectifs validés par Soil acoustics x La Fréquence du Vivant',
    },
    cta: {
      title: 'Échangeons de vive voix',
      body: "Choisissez le créneau qui vous convient :\n30 minutes pour parcourir la donnée, le pilote et les conditions d'un partenariat.",
      primary: 'Réserver un créneau sur Calendly',
      secondary: 'Nous écrire directement',
      hint: 'Laurent Tripied · Fondateur, La Fréquence du Vivant',
    },
    footer: {
      quote: '« Écouter un territoire, c\'est déjà commencer à le défendre. »',
      author: 'Manifeste fondateur, La Fréquence du Vivant',
      creditBefore: 'Technologie évoquée : Soil Acoustics Ltd. (Royaume-Uni) / La Fréquence du Vivant (France)',
    },
  },
};
