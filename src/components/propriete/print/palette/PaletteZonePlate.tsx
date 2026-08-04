import React from 'react';
import { PALETTE_BY_ID, STRATE_LABEL, STRATE_ORDER, type PaletteStrate } from '@/lib/plantPaletteKb';
import { ZONE_AMBIANCES } from '@/lib/paletteEngine';
import type { PaletteZoneView } from '@/components/propriete/palette/PaletteSummary';

interface Props {
  zone: PaletteZoneView;
  index: number;
}

const ambianceLabel = (id: string) => ZONE_AMBIANCES.find((a) => a.id === id)?.label ?? 'Comme le site';

/**
 * Planche d'un emplacement : la palette retenue, strate par strate, avec la
 * raison écologique de chaque choix — et les candidats restés en réserve.
 */
export const PaletteZonePlate: React.FC<Props> = ({ zone, index }) => {
  const retenues = zone.selected
    .map((id) => PALETTE_BY_ID.get(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof PALETTE_BY_ID.get>>[];

  const byStrate = React.useMemo(() => {
    const m = new Map<PaletteStrate, typeof retenues>();
    for (const s of retenues) m.set(s.strate, [...(m.get(s.strate) ?? []), s]);
    return m;
  }, [retenues]);

  const reserve = React.useMemo(() => {
    const keep = new Set(zone.selected);
    const out: string[] = [];
    for (const r of zone.recommendations)
      for (const c of r.species) {
        const sp = (c as any).species ?? c;
        if (sp?.id && !keep.has(sp.id)) out.push(`${sp.fr}`);
      }
    return Array.from(new Set(out)).slice(0, 14);
  }, [zone]);

  const local = retenues.filter((s) => s.vegetalLocal).length;

  return (
    <section className="print-avoid-break rounded-2xl border border-[hsl(var(--ds-line))] bg-white/55 p-3.5">
      <div className="flex items-baseline gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-black/10 print-exact"
          style={{ backgroundColor: zone.color }}
        />
        <span className="text-[9px] uppercase tracking-[0.2em] opacity-50">
          Emplacement {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-serif text-[17px]">{zone.name}</span>
        <span className="ml-auto rounded-full bg-[hsl(var(--ds-forest))]/12 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.14em] print-exact">
          {ambianceLabel(zone.ambiance)}
        </span>
      </div>

      {zone.intention?.trim() && (
        <p className="mt-1.5 border-l-2 border-[hsl(var(--ds-gold))]/70 pl-2.5 font-serif text-[12.5px] italic leading-snug opacity-80">
          {zone.intention}
        </p>
      )}

      {retenues.length === 0 ? (
        <p className="mt-2 text-[11px] italic opacity-60">
          Aucune espèce retenue à ce jour sur cet emplacement.
        </p>
      ) : (
        <div className="mt-2.5 space-y-2">
          {STRATE_ORDER.filter((s) => byStrate.has(s)).map((strate) => (
            <div key={strate}>
              <p className="text-[8.5px] uppercase tracking-[0.18em] opacity-55">
                {STRATE_LABEL[strate]}
              </p>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {byStrate.get(strate)!.map((sp) => (
                  <div
                    key={sp.id}
                    className="print-avoid-break rounded-lg border border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/70 px-2 py-1.5 print-exact"
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-[12px] leading-tight">{sp.fr}</span>
                      {sp.vegetalLocal && (
                        <span className="rounded-full border border-[hsl(var(--ds-gold))]/60 px-1 text-[7px] uppercase tracking-[0.1em] opacity-75">
                          Végétal local
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] italic opacity-60">{sp.latin}</div>
                    <p className="mt-0.5 text-[9px] leading-snug opacity-80">{sp.service}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[hsl(var(--ds-line))]/60 pt-1.5 text-[9px] opacity-65">
        <span>
          {retenues.length} espèce{retenues.length > 1 ? 's' : ''} retenue
          {retenues.length > 1 ? 's' : ''} · {local} en filière Végétal local
        </span>
        {reserve.length > 0 && (
          <span className="min-w-0 flex-1 truncate italic">Réserve : {reserve.join(' · ')}</span>
        )}
      </div>
    </section>
  );
};

export default PaletteZonePlate;
