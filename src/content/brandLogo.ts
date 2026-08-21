/**
 * Source unique des métadonnées du logo retenu « Empreinte vivante »
 * (Les Marches du Vivant), pour l'indexation en recherche d'images
 * (Google Images, Bing Images) : alt canonique, légende, licence, ImageObject.
 *
 * Trois déclinaisons coexistent, parce qu'un fichier unique ne peut pas rester
 * lisible partout :
 *  - `mark`   : l'empreinte seule, sans texte — petites tailles (nav, footer, favicon, avatar) ;
 *  - `light`  : lock-up empreinte + wordmark encré vert profond — fonds clairs, PDF, annuaires ;
 *  - `dark`   : lock-up empreinte + wordmark crème — fonds sombres, og:image.
 * Le fichier historique (`legacy`) reste servi : son URL est déjà publiée.
 */
import logoLegacy from '@/assets/brand/marches-du-vivant/logo-empreinte-vivante.png.asset.json';
import logoMark from '@/assets/brand/marches-du-vivant/logo-empreinte-vivante-marque.png.asset.json';
import logoLight from '@/assets/brand/marches-du-vivant/logo-empreinte-vivante-clair.png.asset.json';
import logoDark from '@/assets/brand/marches-du-vivant/logo-empreinte-vivante-sombre.png.asset.json';
import lockupLight from '@/assets/brand/marches-du-vivant/logo-lockup-horizontal.png.asset.json';
import lockupDark from '@/assets/brand/marches-du-vivant/logo-lockup-horizontal-clair.png.asset.json';
import lockupVertical from '@/assets/brand/marches-du-vivant/logo-lockup-vertical.png.asset.json';

export const BRAND_SITE = 'https://la-frequence-du-vivant.com';

export type BrandLogoVariantKey =
  | 'mark'
  | 'light'
  | 'dark'
  | 'legacy'
  | 'lockup-light'
  | 'lockup-dark'
  | 'lockup-vertical';

export interface BrandLogoVariant {
  key: BrandLogoVariantKey;
  /** Nom court affiché dans les pages de marque. */
  label: string;
  /** Où l'employer — texte destiné aux humains. */
  usage: string;
  /** Chemin CDN relatif — utilisable directement dans une balise <img>. */
  path: string;
  /** URL absolue — la seule forme comprise par les moteurs et le sitemap. */
  url: string;
  width: number;
  height: number;
  /** Texte alternatif propre à la déclinaison. */
  alt: string;
}

const build = (
  key: BrandLogoVariantKey,
  pointer: { url: string },
  label: string,
  usage: string,
  alt: string,
  width = 1024,
  height = 1024,
): BrandLogoVariant => ({
  key,
  label,
  usage,
  path: pointer.url,
  url: `${BRAND_SITE}${pointer.url}`,
  width,
  height,
  alt,
});

export const BRAND_LOGO_MARK = build(
  'mark',
  logoMark,
  'Marque seule',
  "Petites tailles : navigation, pied de page, favicon, avatar. Le nom de la marque est composé en texte à côté, jamais dans l'image.",
  'Logo Les Marches du Vivant — empreinte de pas en feuillage entourée d’ondes, marque seule sans texte',
);

export const BRAND_LOGO_LIGHT = build(
  'light',
  logoLight,
  'Lock-up fond clair',
  'Fonds clairs : documents, PDF, impressions, fiches annuaire et partenaires.',
  'Logo Les Marches du Vivant — Empreinte vivante avec le nom « Les Marches du Vivant », version pour fond clair',
);

export const BRAND_LOGO_DARK = build(
  'dark',
  logoDark,
  'Lock-up fond sombre',
  'Fonds sombres : hero de la fiche agent IA, aperçus sociaux (og:image), supports en thème nuit.',
  'Logo Les Marches du Vivant — Empreinte vivante avec le nom « Les Marches du Vivant », version pour fond sombre',
);

export const BRAND_LOGO_LEGACY = build(
  'legacy',
  logoLegacy,
  'Version initiale',
  "Conservée pour les liens déjà publiés à l'extérieur. Ne plus l'employer dans de nouveaux supports : son wordmark est trop fin pour rester lisible en petite taille.",
  'Logo Les Marches du Vivant — Empreinte vivante, agent IA de mesure collaborative de la biodiversité',
);

/* ------------------------------------------------------------------ *
 * Lock-up horizontal (empreinte + wordmark à droite).
 * Utilisé en tête de la page Sauniers.
 * ------------------------------------------------------------------ */
export const BRAND_LOGO_LOCKUP = build(
  'lockup-light',
  lockupLight,
  'Lock-up horizontal — fond clair',
  'Fonds clairs : documents, PDF, impressions. Encre verte profonde d’origine.',
  'Logo Les Marches du Vivant — empreinte en feuillage et nom en toute lettre, version horizontale pour fond clair',
  1965,
  800,
);

export const BRAND_LOGO_LOCKUP_DARK = build(
  'lockup-dark',
  lockupDark,
  'Lock-up horizontal — fond sombre',
  'Fonds sombres : hero de la page Sauniers et tout écran Forêt Émeraude.',
  'Logo Les Marches du Vivant — empreinte en feuillage et nom en toute lettre, version horizontale pour fond sombre',
  1965,
  800,
);

export const BRAND_LOGO_LOCKUP_VERTICAL = build(
  'lockup-vertical',
  lockupVerticalOpt,
  'Lock-up vertical — empreinte au-dessus du nom',
  'Bandeaux centrés et fonds sombres : le nom est composé en clair sous l’empreinte. Fond transparent.',
  'Logo Les Marches du Vivant — empreinte de pas en feuillage surmontant le nom en toutes lettres, version verticale',
  1024,
  1024,
);

/**
 * Déclinaison d'indexation : même dessin, aplati sur un carré vert profond
 * 1200 × 1200. Le nom est en blanc : sur le fond blanc des résultats de
 * recherche d'images, la version transparente serait illisible. C'est ce
 * fichier qui porte le JSON-LD, le sitemap images et les métadonnées IPTC.
 */
export const BRAND_LOGO_INDEX = build(
  'index',
  logoIndex,
  'Logo officiel — carré fond vert',
  "Recherche d'images, annuaires, aperçus sociaux, fiches partenaires : partout où le fond n'est pas maîtrisé.",
  'Logo Les Marches du Vivant — empreinte de pas en feuillage entourée d’ondes, nom en toutes lettres sur fond vert profond',
  1200,
  1200,
);

/** Les déclinaisons à présenter, dans l'ordre de recommandation. */
export const BRAND_LOGO_VARIANTS: BrandLogoVariant[] = [
  BRAND_LOGO_INDEX,
  BRAND_LOGO_LOCKUP_VERTICAL,
  BRAND_LOGO_LOCKUP_DARK,
  BRAND_LOGO_MARK,
];

/** Déclinaison canonique : celle que décrit le JSON-LD et que citent les annuaires. */
export const BRAND_LOGO_CANONICAL = BRAND_LOGO_INDEX;


/* ------------------------------------------------------------------ *
 * Alias historiques — conservés pour ne casser aucun appelant existant.
 * ------------------------------------------------------------------ */
export const BRAND_LOGO_PATH = BRAND_LOGO_CANONICAL.path;
export const BRAND_LOGO_URL = BRAND_LOGO_CANONICAL.url;
export const BRAND_LOGO_WIDTH = BRAND_LOGO_CANONICAL.width;
export const BRAND_LOGO_HEIGHT = BRAND_LOGO_CANONICAL.height;

/** Texte alternatif canonique — identique partout où le logo complet apparaît. */
export const BRAND_LOGO_ALT =
  'Logo Les Marches du Vivant — Empreinte vivante, agent IA de mesure collaborative de la biodiversité';

/** Attribut title (info-bulle) — complément lu par les moteurs. */
export const BRAND_LOGO_TITLE =
  'Les Marches du Vivant — logo Empreinte vivante, La Fréquence du Vivant';

/** Légende visible / caption structurée. */
export const BRAND_LOGO_CAPTION =
  "Empreinte vivante : logo officiel de l'agent IA Les Marches du Vivant, édité par l'association La Fréquence du Vivant.";

export const BRAND_LOGO_DESCRIPTION =
  "Logo officiel des Marches du Vivant : une empreinte de pas dont l'intérieur est un feuillage, entourée d'ondes concentriques — la trace du marcheur est faite de vivant et se propage. Identité de l'agent IA de mesure collaborative de la biodiversité édité par l'association La Fréquence du Vivant.";

export const BRAND_LOGO_CREDIT = 'La Fréquence du Vivant';
export const BRAND_LOGO_COPYRIGHT =
  '© La Fréquence du Vivant — association loi 1901. Logo utilisable pour citer le projet, sans modification.';

/** Licence déclarée : active le badge « Licensable » dans Google Images. */
export const BRAND_LOGO_LICENSE = 'https://creativecommons.org/licenses/by-nd/4.0/';
export const BRAND_LOGO_ACQUIRE_PAGE = `${BRAND_SITE}/roadmap/frequence-jardin/logo/empreinte-vivante`;

const ORGANIZATION_ID = `${BRAND_SITE}/#organization`;
export const BRAND_LOGO_ID = `${BRAND_SITE}/#logo`;

/**
 * Nœud JSON-LD ImageObject du logo.
 * @param pageUrl URL de la page qui affiche le logo (pour `url` / `mainEntityOfPage`).
 * @param representativeOfPage true si le logo est l'image principale de la page.
 * @param variant Déclinaison à décrire ; seule la canonique porte l'`@id` `#logo`,
 *                pour ne pas dupliquer l'entité de marque dans le graphe.
 */
export function brandLogoImageObject(
  pageUrl: string,
  representativeOfPage = false,
  variant: BrandLogoVariant = BRAND_LOGO_CANONICAL,
) {
  const node: Record<string, unknown> = {
    '@type': 'ImageObject',
    '@id': representativeOfPage ? BRAND_LOGO_ID : `${pageUrl}/#logo-${variant.key}`,
    url: variant.url,
    contentUrl: variant.path,
    width: variant.width,
    height: variant.height,
    name: variant.alt,
    caption: BRAND_LOGO_CAPTION,
    description: BRAND_LOGO_DESCRIPTION,
    creditText: BRAND_LOGO_CREDIT,
    copyrightNotice: BRAND_LOGO_COPYRIGHT,
    license: BRAND_LOGO_LICENSE,
    representativeOfPage,
  };
  return node;
}
