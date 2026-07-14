import type { BrandKit } from '../types';

/**
 * Château Boutinet — Villegouge, Gironde.
 * Codes relevés sur chateauboutinet.fr :
 *  - fond vert sauge tendre, accent orange chaud, transitions ambre → or
 *  - logotype scripté "Boutinet", corps sans-serif fin
 *  - rondelle orange flottante (CTA)
 *  - certifications AB / Bienvenue à la ferme / Best of Wine Tourism
 */
export const chateauBoutinet: BrandKit = {
  slug: 'chateau_boutinet',
  partner: 'Château Boutinet',
  tagline: 'Villegouge · Fronsadais · Gironde',

  palette: {
    // Sauge tendre (fond de site Boutinet)
    background: '88 40% 84%',
    foreground: '30 15% 12%',
    // Ambre / orange signature du bouton "Boutique en ligne"
    accent: '25 82% 57%',
    accentForeground: '30 30% 10%',
    // Crème / surfaces
    surface: '44 55% 92%',
    surfaceForeground: '30 20% 15%',
    // Dégradé ambre → or (bandeau de transition observé sur le site)
    signatureGradient: ['25 82% 57%', '38 82% 62%'],
  },

  fonts: {
    logotype: 'Allura',
    display: 'Cormorant Garamond',
    body: 'Montserrat',
    googleFontsHref:
      'https://fonts.googleapis.com/css2?family=Allura&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600&display=swap',
  },

  ctaShape: 'blob',
  divider: 'wave',

  badges: [
    {
      label: 'Agriculture Biologique',
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_European_Organic_Farming.svg/240px-Logo_European_Organic_Farming.svg.png',
    },
    { label: 'Bienvenue à la ferme' },
    { label: 'Best of Wine Tourism' },
    { label: 'Vignobles & Découvertes' },
  ],

  footerSignature:
    'Un événement co-conçu avec Château Boutinet — 1436 route des Palombes, 33141 Villegouge.',

  socials: {
    website: 'https://www.chateauboutinet.fr/',
    facebook: 'https://www.facebook.com/ChateauBoutinet/',
    instagram: 'https://www.instagram.com/chateauboutinet/',
    tripadvisor:
      'https://www.tripadvisor.fr/Attraction_Review-g1939402-d3428588-Reviews-Chateau_Boutinet-Villegouge_Gironde_Nouvelle_Aquitaine.html',
  },

  meta: {
    themeColor: '#D4E5C4',
  },
};
