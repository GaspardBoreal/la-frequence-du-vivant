/**
 * Brand Kit — Habillage de marque par événement
 * Chaque preset est un jeu de tokens (couleurs HSL, fontes, chrome).
 * Aucun composant TSX ici : les slots sont rendus par des composants génériques.
 */

export interface BrandPalette {
  /** Fond principal de la page — HSL string (ex: "88 40% 84%") */
  background: string;
  /** Texte principal — HSL */
  foreground: string;
  /** Accent CTA — HSL */
  accent: string;
  /** Foreground du CTA — HSL */
  accentForeground: string;
  /** Surface de carte / chip */
  surface: string;
  surfaceForeground: string;
  /** Dégradé signature (2 stops HSL séparés par virgule pour un linear-gradient) */
  signatureGradient: [string, string];
}

export interface BrandFonts {
  /** Google Font name pour le logotype (ex: "Allura") */
  logotype: string;
  /** Font pour titres */
  display: string;
  /** Font pour corps */
  body: string;
  /** URL Google Fonts prête à charger (avec familles + display=swap) */
  googleFontsHref: string;
}

export interface BrandBadge {
  label: string;
  imageUrl?: string;
  href?: string;
}

export interface BrandKit {
  slug: string;
  /** Nom lisible du partenaire */
  partner: string;
  /** Court libellé sous le logotype (ex: "Villegouge · Gironde") */
  tagline?: string;
  palette: BrandPalette;
  fonts: BrandFonts;
  /** URL du logo raster/svg si disponible (sinon on rend un texte scripté) */
  logoUrl?: string;
  /** Forme du CTA principal */
  ctaShape: 'blob' | 'pill' | 'rounded';
  /** Style de séparateur entre sections */
  divider: 'wave' | 'vine' | 'straight' | 'none';
  /** Certifications / labels partenaire */
  badges?: BrandBadge[];
  /** Signature de bas de page */
  footerSignature?: string;
  /** Réseaux sociaux du partenaire */
  socials?: { facebook?: string; instagram?: string; tripadvisor?: string; website?: string };
  /** Meta (og:image dédiée, theme-color) */
  meta?: { themeColor?: string; ogImage?: string };
}

/** Type des overrides JSON stockés en base — deep-merge avec le preset. */
export type BrandKitOverrides = Partial<
  Omit<BrandKit, 'palette' | 'fonts' | 'meta'> & {
    palette?: Partial<BrandPalette>;
    fonts?: Partial<BrandFonts>;
    meta?: Partial<NonNullable<BrandKit['meta']>>;
  }
>;
