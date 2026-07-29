import React from 'react';
import { Search, Landmark } from 'lucide-react';
import {
  PAYSAGE_TOOLS,
  TOOL_FAMILIES,
  type PaysageTool,
  type ToolFamilyKey,
} from '@/lib/paysageTools';

interface Props {
  activeToolKey: string | null;
  onPick: (tool: PaysageTool | null) => void;
}

const GEOM_HINT: Record<string, string> = {
  point: 'un clic',
  line: 'clics puis double-clic',
  polygon: 'clics puis double-clic',
};

export const ToolPalette: React.FC<Props> = ({ activeToolKey, onPick }) => {
  const [family, setFamily] = React.useState<ToolFamilyKey>('eau');
  const [q, setQ] = React.useState('');

  const list = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle)
      return PAYSAGE_TOOLS.filter((t) =>
        `${t.label} ${t.hint}`.toLowerCase().includes(needle),
      );
    return PAYSAGE_TOOLS.filter((t) => t.family === family);
  }, [family, q]);

  const fam = TOOL_FAMILIES.find((f) => f.key === family)!;

  return (
    <div className="flex flex-col gap-2.5 text-[hsl(var(--ds-forest-deep))]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher un ouvrage…"
          className="w-full rounded-full border border-[hsl(var(--ds-line))] bg-white/60 py-1.5 pl-7 pr-3 text-[11px] outline-none focus:border-[hsl(var(--ds-forest))]/50"
        />
      </div>

      {!q && (
        <div className="flex flex-wrap gap-1">
          {TOOL_FAMILIES.map((f) => (
            <button
              key={f.key}
              onClick={() => setFamily(f.key)}
              className={`rounded-full border px-2 py-0.5 text-[10px] transition-all ${
                f.key === family
                  ? 'border-transparent text-[hsl(var(--ds-cream))]'
                  : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
              style={f.key === family ? { backgroundColor: f.color } : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {!q && (
        <p className="text-[10px] italic leading-snug opacity-60">« {fam.tagline} »</p>
      )}

      <div className="grid grid-cols-1 gap-1">
        {list.map((t) => {
          const active = t.key === activeToolKey;
          return (
            <button
              key={t.key}
              onClick={() => onPick(active ? null : t)}
              title={t.hint}
              className={`group flex items-start gap-2 rounded-lg border px-2 py-1.5 text-left transition-all ${
                active
                  ? 'border-transparent shadow-sm'
                  : 'border-[hsl(var(--ds-line))]/70 hover:border-[hsl(var(--ds-forest))]/45 hover:bg-[hsl(var(--ds-forest))]/5'
              }`}
              style={active ? { backgroundColor: `${t.color}22`, borderColor: t.color } : undefined}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[13px]"
                style={{ backgroundColor: `${t.color}22` }}
              >
                {t.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
                  {t.label}
                  {t.historique && (
                    <Landmark className="h-3 w-3 shrink-0 opacity-50" aria-label="Historique" />
                  )}
                </span>
                <span className="block truncate text-[10px] opacity-60">{t.hint}</span>
                {active && (
                  <span className="mt-0.5 block text-[10px] font-medium" style={{ color: t.color }}>
                    Tracer : {GEOM_HINT[t.geom]}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ToolPalette;
