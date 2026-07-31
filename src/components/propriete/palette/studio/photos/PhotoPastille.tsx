/**
 * Pastille « Carnet photo » d'un ouvrage de l'Atelier.
 *
 * Un petit polaroïd incliné, liseré or, qui porte la première photo en
 * micro-vignette et le nombre de clichés. Posée non plus au centre de
 * l'ouvrage, mais accrochée à son bord comme un onglet de carnet, reliée
 * par un fin fil doré. Trois usages :
 *  - `photoPastilleIcon()` → divIcon Leaflet posé sur la carte (variante « tag »)
 *  - variante compacte `dot` aux petits zooms
 *  - `<PhotoPastilleButton />` → même signe visuel dans le registre
 */
import React from 'react';
import L from 'leaflet';

const clampCount = (n: number) => (n > 9 ? '9+' : String(n));

const CAM_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M14.5 4h-5L8 6H4.5A1.5 1.5 0 0 0 3 7.5v10A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 19.5 6H16z"/><circle cx="12" cy="12.5" r="3.2"/></svg>`;

const innerHtml = (count: number, thumb?: string) => `
  <span class="ds-photo-pastille__frame">
    <span class="ds-photo-pastille__film"${
      thumb ? ` style="background-image:url('${thumb.replace(/'/g, "\\'")}')"` : ''
    }>${thumb ? '' : CAM_SVG}</span>
  </span>
  <span class="ds-photo-pastille__count">${clampCount(count)}</span>
`;

const dotHtml = (count: number) => `
  <span class="ds-photo-pastille__dot">${clampCount(count)}</span>
`;

export type PastilleSide = 'left' | 'right';

interface IconOpts {
  /** Côté d'accrochage : la pastille se pose en haut-gauche ou haut-droite du sommet. */
  side?: PastilleSide;
  /** Variante compacte (petit zoom) : simple point doré compté. */
  compact?: boolean;
  /** Ouvrage sélectionné : la pastille se relève légèrement. */
  active?: boolean;
}

/**
 * Icône Leaflet — le clic est capté par le Marker qui la porte.
 * L'ancre est déportée en pixels : la pastille reste hors de la surface
 * de l'ouvrage quel que soit le niveau de zoom.
 */
export const photoPastilleIcon = (
  count: number,
  label: string,
  thumb?: string,
  { side = 'left', compact = false, active = false }: IconOpts = {},
) => {
  const size = compact ? 22 : 46;
  const aria = `Carnet photo · ${label.replace(/"/g, '')} · ${count} photo${count > 1 ? 's' : ''}`;
  const cls = [
    'ds-photo-pastille',
    compact ? 'ds-photo-pastille--dot' : 'ds-photo-pastille--tag',
    `ds-photo-pastille--${side}`,
    active ? 'is-active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = compact
    ? dotHtml(count)
    : `<span class="ds-photo-pastille__thread"></span>${innerHtml(count, thumb)}`;

  return L.divIcon({
    className: 'ds-photo-pastille-wrap',
    html: `<span class="${cls}" role="button" tabindex="0" aria-label="${aria}">${body}</span>`,
    iconSize: [size, size],
    // Ancre = le sommet de l'ouvrage : la pastille flotte au-dessus, décalée
    // du côté choisi, le fil pointant vers le sommet.
    iconAnchor: compact
      ? [size / 2, size / 2]
      : side === 'left'
        ? [size - 6, size - 6]
        : [6, size - 6],
  });
};

export const PhotoPastilleButton: React.FC<{
  count: number;
  label: string;
  thumb?: string;
  onClick: () => void;
  className?: string;
}> = ({ count, label, thumb, onClick, className = '' }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={`Carnet photo · ${label} · ${count} photo${count > 1 ? 's' : ''}`}
    className={`ds-photo-pastille ds-photo-pastille--btn ${className}`}
    dangerouslySetInnerHTML={{ __html: innerHtml(count, thumb) }}
  />
);

export default PhotoPastilleButton;
