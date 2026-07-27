import React from 'react';
import { Camera, Leaf, ZoomIn } from 'lucide-react';
import type { GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';

interface Props {
  items: GpsCandidate[];
  selectedId: string | null;
  colorFor: (w: GpsCandidate) => string;
  displayNameFor: (w: { scientificName?: string | null; commonName?: string | null }) => string;
  onSelect: (w: GpsCandidate) => void;
  onZoomPhoto: (w: GpsCandidate) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLLIElement>>;
}

/**
 * Bandeau latéral des observations (mode plein écran de la Carte des révélations).
 * Synchronisé avec la carte : la ligne sélectionnée est surlignée et défile en vue.
 */
export const RevealObservationList: React.FC<Props> = ({
  items,
  selectedId,
  colorFor,
  displayNameFor,
  onSelect,
  onZoomPhoto,
  rowRefs,
}) => (
  <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-r border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60">
    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--ds-forest-deep))]/60 border-b border-[hsl(var(--ds-line))]">
      Observations · {items.length}
    </div>
    <ul className="flex-1 overflow-y-auto divide-y divide-[hsl(var(--ds-line))]/60">
      {items.map((w) => {
        const active = w.id === selectedId;
        return (
          <li
            key={w.id}
            ref={(el) => {
              if (el) rowRefs.current.set(w.id, el);
              else rowRefs.current.delete(w.id);
            }}
            className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition ${
              active
                ? 'bg-[hsl(var(--ds-forest))]/10 ring-2 ring-inset ring-[hsl(var(--ds-gold,45_60%_55%))]'
                : 'hover:bg-[hsl(var(--ds-forest))]/5'
            }`}
            onClick={() => onSelect(w)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (w.photoUrl) onZoomPhoto(w);
                else onSelect(w);
              }}
              aria-label={w.photoUrl ? 'Agrandir la photo' : 'Centrer sur la carte'}
              className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] group"
            >
              {w.photoUrl ? (
                <>
                  <img src={w.photoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white" />
                  </span>
                </>
              ) : (
                <Leaf className="w-4 h-4 m-auto opacity-30" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: colorFor(w) }}
                  aria-hidden
                />
                <span className="text-[12px] font-medium text-[hsl(var(--ds-forest-deep))] truncate">
                  {displayNameFor(w)}
                </span>
              </div>
              <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 truncate">
                {w.scientificName}
              </div>
              <div className="text-[10px] text-[hsl(var(--ds-forest-deep))]/45 flex items-center gap-1">
                {w.source === 'marcheur' ? '📷' : '🌐'}
                {w.observationDate && (
                  <>
                    <Camera className="w-2.5 h-2.5" />
                    {new Date(w.observationDate).toLocaleDateString('fr-FR')}
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  </aside>
);

export default RevealObservationList;
