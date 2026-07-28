import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Check, Sparkles, HelpCircle } from 'lucide-react';
import { AnalyzeCard } from '@/components/propriete/analyze/AnalyzeCard';
import { PLANT_INDICATORS, FAMILY_META, type PlantFamily, type PlantIndicator } from '@/lib/plantIndicatorKb';
import { FamilyIcon } from '../FloraPictos';
import { FloraRevealHeader } from './FloraRevealHeader';
import { usePropertyFloraMatched } from '@/hooks/propriete/usePropertyFloraMatched';
import type { FloraMatch } from '@/lib/plantIndicatorMatcher';
import { CortegePhotoLightbox, type CortegePhotoItem } from './CortegePhotoLightbox';

type TierKey = 'revealed' | 'weak' | 'hidden';

const TIER_META: Record<TierKey, { title: string; hint: string; dot: string; bg: string }> = {
  revealed: {
    title: 'Déjà révélées par les marcheurs',
    hint: 'Confirmé sur le terrain — cochez si vous les reconnaissez également',
    dot: 'bg-emerald-500',
    bg: 'from-emerald-500/8',
  },
  weak: {
    title: 'Signaux faibles — à confirmer',
    hint: 'Observations partielles (genre voisin ou peu nombreuses)',
    dot: 'bg-amber-500',
    bg: 'from-amber-500/8',
  },
  hidden: {
    title: 'À chercher sur le terrain',
    hint: 'Pas encore observées par la Fréquence',
    dot: 'bg-neutral-400',
    bg: 'from-transparent',
  },
};

export const CortegeBlock: React.FC<{
  observed: string[];
  onToggle: (id: string) => void;
  index?: number;
  proprieteId?: string;
}> = ({ observed, onToggle, index = 0, proprieteId }) => {
  const [query, setQuery] = React.useState('');
  const [family, setFamily] = React.useState<PlantFamily | 'all'>('all');

  const { matches, stats, hasWalkerData, isLoading } = usePropertyFloraMatched(proprieteId);

  const tiered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const passesFilter = (m: FloraMatch) => {
      if (family !== 'all' && m.plant.famille !== family) return false;
      if (!q) return true;
      return (
        m.plant.nom.toLowerCase().includes(q) ||
        (m.plant.latin ?? '').toLowerCase().includes(q)
      );
    };
    const revealed: FloraMatch[] = [];
    const weak: FloraMatch[] = [];
    const hidden: FloraMatch[] = [];
    for (const m of matches) {
      if (!passesFilter(m)) continue;
      if (m.confidence === 'high') revealed.push(m);
      else if (m.confidence === 'medium' || m.confidence === 'low') weak.push(m);
      else hidden.push(m);
    }
    // Sort revealed & weak by observation count desc
    revealed.sort((a, b) => b.observations - a.observations);
    weak.sort((a, b) => b.observations - a.observations);
    return { revealed, weak, hidden };
  }, [matches, query, family]);

  const count = observed.length;

  // Galerie plein écran : toutes les vignettes photo actuellement affichées.
  const gallery = useMemo<CortegePhotoItem[]>(() => {
    const out: CortegePhotoItem[] = [];
    for (const tier of ['revealed', 'weak', 'hidden'] as TierKey[]) {
      for (const m of tiered[tier]) {
        if (!m.photos[0]) continue;
        out.push({
          url: m.photos[0],
          nom: m.plant.nom,
          latin: m.plant.latin,
          lastSeen: m.lastSeen,
          observations: m.observations,
        });
      }
    }
    return out;
  }, [tiered]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const openPhoto = (url: string) => {
    const i = gallery.findIndex((g) => g.url === url);
    if (i >= 0) setLightbox(i);
  };

  return (
    <AnalyzeCard
      number={2}
      category="Cortège illustré · photos des marcheurs"
      title="Cochez les plantes que vous reconnaissez"
      subtitle="Ces bio-indicatrices racontent votre sol. Cochez celles que vous observez — les plantes déjà repérées par les marcheurs sont mises en évidence."
      index={index}
    >
      {!isLoading && (
        <FloraRevealHeader stats={stats} hasWalkerData={hasWalkerData} />
      )}

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

      <div className="space-y-6 max-h-[720px] overflow-y-auto pr-1 -mr-1">
        {(['revealed', 'weak', 'hidden'] as TierKey[]).map((tier) => {
          const list = tiered[tier];
          if (list.length === 0) return null;
          const meta = TIER_META[tier];
          return (
            <section key={tier}>
              <header className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <div className="text-[11px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-forest-deep))]">
                  {meta.title}
                </div>
                <span className="text-[10px] text-[hsl(var(--ds-forest-deep))]/50 italic">
                  · {list.length}
                </span>
              </header>
              <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 mb-2">
                {meta.hint}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {list.map((m) => (
                  <PlantTile
                    key={m.plant.id}
                    match={m}
                    checked={observed.includes(m.plant.id)}
                    onToggle={() => onToggle(m.plant.id)}
                    tier={tier}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {tiered.revealed.length + tiered.weak.length + tiered.hidden.length === 0 && (
          <div className="text-center text-[11px] italic text-[hsl(var(--ds-forest-deep))]/60 py-6">
            Aucune plante ne correspond à cette recherche.
          </div>
        )}
      </div>
    </AnalyzeCard>
  );
};

const PlantTile: React.FC<{
  match: FloraMatch;
  checked: boolean;
  onToggle: () => void;
  tier: TierKey;
}> = ({ match, checked, onToggle, tier }) => {
  const { plant, observations, lastSeen, photos, confidence } = match;
  const photoUrl = photos[0];
  const dateStr = lastSeen ? new Date(lastSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : null;

  const highlight =
    tier === 'revealed'
      ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
      : tier === 'weak'
      ? 'border-amber-500/40'
      : 'border-[hsl(var(--ds-line))]';

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className={`relative group flex items-stretch gap-2 rounded-xl border overflow-hidden text-left transition-all ${
        checked
          ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))]/8 shadow-[inset_0_1px_6px_rgba(47,93,58,0.15)]'
          : `${highlight} bg-[hsl(var(--ds-cream))]/60 hover:border-[hsl(var(--ds-forest))]/50`
      }`}
    >
      {/* Media */}
      <div className="relative w-14 shrink-0 bg-[hsl(var(--ds-forest))]/5 flex items-center justify-center">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={plant.nom}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <FamilyIcon family={plant.famille} active={checked} size={36} />
        )}
        {tier === 'revealed' && (
          <span className="absolute top-0.5 left-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 text-white shadow">
            <Sparkles className="w-2.5 h-2.5" />
          </span>
        )}
        {tier === 'weak' && (
          <span className="absolute top-0.5 left-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white shadow">
            <HelpCircle className="w-2.5 h-2.5" />
          </span>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 py-1.5 pr-2">
        <div className="text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))] leading-tight truncate">
          {plant.nom}
        </div>
        {plant.latin && (
          <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 truncate">
            {plant.latin}
          </div>
        )}
        {observations > 0 && (
          <div className="mt-0.5 text-[10px] text-[hsl(var(--ds-forest))] font-medium truncate">
            Vu {observations}× {dateStr && `· ${dateStr}`}
          </div>
        )}
      </div>

      {/* Check indicator */}
      {checked && (
        <span className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--ds-forest))] text-white shadow">
          <Check className="w-3 h-3" />
        </span>
      )}
    </motion.button>
  );
};
