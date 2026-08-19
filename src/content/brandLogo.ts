/**
 * Source unique des métadonnées du logo retenu « Empreinte vivante »
 * (Les Marches du Vivant), pour l'indexation en recherche d'images
 * (Google Images, Bing Images) : alt canonique, légende, licence, ImageObject.
 */
import logoEmpreinte from '@/assets/brand/marches-du-vivant/logo-empreinte-vivante.png.asset.json';

export const BRAND_SITE = 'https://la-frequence-du-vivant.com';

/** Chemin CDN du logo (relatif — utilisable directement dans une balise <img>). */
export const BRAND_LOGO_PATH = logoEmpreinte.url;

/** URL absolue du logo — la seule forme comprise par les moteurs et le sitemap images. */
export const BRAND_LOGO_URL = `${BRAND_SITE}${BRAND_LOGO_PATH}`;

export const BRAND_LOGO_WIDTH = 1024;
export const BRAND_LOGO_HEIGHT = 1024;

/** Texte alternatif canonique — identique partout où le logo apparaît. */
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
 */
export function brandLogoImageObject(pageUrl: string, representativeOfPage = false) {
  return {
    '@type': 'ImageObject',
    '@id': BRAND_LOGO_ID,
    name: 'Empreinte vivante — logo Les Marches du Vivant',
    alternateName: BRAND_LOGO_ALT,
    caption: BRAND_LOGO_CAPTION,
    description: BRAND_LOGO_DESCRIPTION,
    contentUrl: BRAND_LOGO_URL,
    url: pageUrl,
    thumbnailUrl: BRAND_LOGO_URL,
    width: BRAND_LOGO_WIDTH,
    height: BRAND_LOGO_HEIGHT,
    encodingFormat: 'image/png',
    inLanguage: 'fr',
    representativeOfPage,
    creditText: BRAND_LOGO_CREDIT,
    copyrightNotice: BRAND_LOGO_COPYRIGHT,
    creator: { '@id': ORGANIZATION_ID },
    copyrightHolder: { '@id': ORGANIZATION_ID },
    license: BRAND_LOGO_LICENSE,
    acquireLicensePage: BRAND_LOGO_ACQUIRE_PAGE,
    mainEntityOfPage: pageUrl,
    keywords: [
      'Les Marches du Vivant',
      'logo Les Marches du Vivant',
      'La Fréquence du Vivant',
      'Empreinte vivante',
      'agent IA biodiversité',
    ],
  } as const;
}
