/**
 * Offsets partagés du « chrome » de carte.
 *
 * Le bandeau de fonds (`MapStyleToggle`, `absolute top-4 right-4`) occupe le
 * coin haut-droit de toutes les cartes. Tout panneau flottant doit se caler
 * SOUS lui : ces constantes centralisent la hauteur du bandeau pour qu'un
 * futur changement se répercute partout (inspecteur, barre Transformer…).
 */

/** Marge droite alignée sur celle du bandeau de fonds. */
export const MAP_CHROME_RIGHT = 'right-4';

/** Décalage vertical d'un panneau ancré (`top-*`) placé sous le bandeau. */
export const MAP_CHROME_TOP = 'top-[4.5rem] sm:top-[4.75rem]';

/** Décalage vertical supplémentaire quand la barre Transformer est ouverte. */
export const MAP_CHROME_TOP_STACKED = 'top-[8.5rem] sm:top-[8.75rem]';

/** Équivalent en padding, pour les conteneurs centrés `inset-x-0 top-0`. */
export const MAP_CHROME_TOP_PADDING = 'pt-[4.5rem] sm:pt-[4.75rem]';

/** Hauteur max d'un panneau latéral : reste au-dessus du curseur temporel. */
export const MAP_CHROME_PANEL_MAX_H = 'max-h-[calc(100%-8.5rem)]';
