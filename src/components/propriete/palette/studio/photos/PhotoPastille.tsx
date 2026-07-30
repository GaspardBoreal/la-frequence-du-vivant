/**
 * Pastille « Carnet photo » d'un ouvrage de l'Atelier.
 *
 * Un petit polaroïd incliné, liseré or, qui porte la première photo en
 * micro-vignette et le nombre de clichés. Deux usages :
 *  - `photoPastilleIcon()` → divIcon Leaflet posé sur la carte
 *  - `<PhotoPastilleButton />` → même signe visuel dans le registre
 */
import React from 'react';
import L from 'leaflet';

const clampCount = (n: number) => (n > 9 ? '9+' : String(n));

const innerHtml = (count: number, thumb?: string) => `
  <span class="ds-photo-pastille__frame">
    <span class="ds-photo-pastille__film"${
      thumb ? ` style="background-image:url('${thumb.replace(/'/g, "\\'")}')"` : ''
    }>${
      thumb
        ? ''
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M14.5 4h-5L8 6H4.5A1.5 1.5 0 0 0 3 7.5v10A1.5 1.5 0 0 0 4.5 19h15a1.5 1.5 0 0 0 1.5-1.5v-10A1.5 1.5 0 0 0 19.5 6H16z"/><circle cx="12" cy="12.5" r="3.2"/></svg>`
    }</span>
  </span>
  <span class="ds-photo-pastille__count">${clampCount(count)}</span>
`;

/** Icône Leaflet — le clic est capté par le Marker qui la porte. */
export const photoPastilleIcon = (count: number, label: string, thumb?: string) =>
  L.divIcon({
    className: 'ds-photo-pastille-wrap',
    html: `<span class="ds-photo-pastille" role="button" tabindex="0" aria-label="Carnet photo · ${label.replace(
      /"/g,
      '',
    )} · ${count} photo${count > 1 ? 's' : ''}">${innerHtml(count, thumb)}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

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
