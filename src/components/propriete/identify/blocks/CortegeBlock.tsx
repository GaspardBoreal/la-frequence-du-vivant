import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { PLANT_INDICATORS, FAMILY_META, type PlantFamily } from '@/lib/plantIndicatorKb';
import { FamilyIcon } from '../FloraPictos';

export const CortegeBlock: React.FC<{
  observed: string[];
  onToggle: (id: string) => void;
  index?: number;
}> = ({ observed, onToggle, index = 0 }) => {
  const [query, setQuery] = React.useState('');
  const [family, setFamily] = React.useState<PlantFamily | 'all'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLANT_INDICATORS.filter((p) => {
      if (family !== 'all' && p.famille !== family) return false;
      if (!q) return true;
      return (
        p.nom.toLowerCase().includes(q) ||
        (p.latin ?? '').toLowerCase().includes(q)
      );
    });
  }, [query, family]);

  const grouped = useMemo(() => {
    const map: Record<PlantFamily, typeof PLANT_INDICATORS> = {
      herbacee: [], arbuste: [], liane: [], arbre: [],
    };
    filtered.forEach((p) => map[p.famille].push(p));
    return map;
  }, [filtered]);

  const count = observed.length;

  return (
    <AnalyzeCard
      number={1}
      category="Cortège floristique"
      title="Cochez les plantes que vous reconnaissez"
      subtitle="Ces bio-indicatrices racontent votre sol. Ne devinez pas — cochez seulement celles observées."
      index={index}
    >
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ds-forest))]/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une plante…"
            className="w-full pl-9 pr-3 py-2 rounded-full text-sm border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 outline-none focus:border-[hsl(var(--ds-forest))]"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(['all', 'herbacee', 'arbuste', 'liane', 'arbre'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFamily(f)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                family === f
                  ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
                  : 'bg-transparent text-[hsl(var(--ds-forest-deep))] border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              }`}
            >
              {f === 'all' ? 'Toutes' : FAMILY_META[f].label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] font-semibold text-[hsl(var(--ds-forest))]">
          {count} coché{count > 1 ? 'es' : 'e'}
        </span>
      </div>

      <div className="space-y-5 max-h-[560px] overflow-y-auto pr-1 -mr-1">
        {(Object.keys(grouped) as PlantFamily[]).map((fam) => {
          const list = grouped[fam];
          if (list.length === 0) return null;
          return (
            <div key={fam}>
              <div className="flex items-center gap-2 mb-2">
                <FamilyIcon family={fam} size={22} />
                <div>
                  <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-[hsl(var(--ds-forest))]/80">
                    {FAMILY_META[fam].label}
                  </div>
                  <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/60">
                    {FAMILY_META[fam].hint}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {list.map((p) => {
                  const on = observed.includes(p.id);
                  return (
                    <motion.button
                      key={p.id}
                      type="button"
                      onClick={() => onToggle(p.id)}
                      whileTap={{ scale: 0.97 }}
                      className={`group flex items-center gap-2 rounded-xl border px-2 py-2 text-left transition-all ${
                        on
                          ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[inset_0_1px_6px_rgba(47,93,58,0.15)]'
                          : 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60 hover:border-[hsl(var(--ds-forest))]/50'
                      }`}
                    >
                      <FamilyIcon family={fam} active={on} size={36} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))] leading-tight truncate">
                          {p.nom}
                        </div>
                        {p.latin && (
                          <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 truncate">
                            {p.latin}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center text-[11px] italic text-[hsl(var(--ds-forest-deep))]/60 py-6">
            Aucune plante ne correspond à cette recherche.
          </div>
        )}
      </div>
    </AnalyzeCard>
  );
};
