import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { ProprieteObjet } from '@/hooks/propriete/usePropertyObjets';
import { TOOL_BY_KEY } from '@/lib/paysageTools';
import { geometryAreaM2, fmtArea } from '@/components/propriete/palette/studio/geoMetrics';

interface Props {
  objets: ProprieteObjet[];
  activeId: string;
  /** Nombre de scénographies par ouvrage. */
  counts?: Record<string, number>;
  onSelect: (id: string) => void;
}

/**
 * Changer d'ouvrage sans quitter le Scénographe, même quand l'emprise voisine
 * est hors écran.
 */
export const OuvrageSwitcher: React.FC<Props> = ({ objets, activeId, counts = {}, onSelect }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const list = objets.filter((o) => o.geometry);
  if (list.length < 2) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Changer d'ouvrage"
        className="inline-flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-1 text-[10.5px] text-white/80 transition-colors hover:border-[#c8a24a] hover:text-white"
      >
        Ouvrage <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[50] mt-1.5 max-h-[60vh] w-[260px] overflow-auto rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-1 text-[hsl(var(--ds-forest-deep))] shadow-2xl">
          {list.map((o) => {
            const tool = TOOL_BY_KEY[o.outil_key];
            const area = geometryAreaM2(o.geometry);
            const n = counts[o.id] || 0;
            return (
              <button
                key={o.id}
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11.5px] transition-colors hover:bg-[hsl(var(--ds-forest-deep))]/8 ${
                  o.id === activeId ? 'bg-[#c8a24a]/15' : ''
                }`}
              >
                <span className="text-[14px]">{tool?.glyph ?? '🌿'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {o.nom?.trim() || tool?.label || 'Ouvrage'}
                  </span>
                  <span className="block text-[9.5px] opacity-60">
                    {area > 0 ? fmtArea(area) : '—'}
                    {n > 0 && ` · ${n} scénographie${n > 1 ? 's' : ''}`}
                  </span>
                </span>
                {o.id === activeId && <Check className="h-3.5 w-3.5 shrink-0 text-[#c8a24a]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OuvrageSwitcher;
