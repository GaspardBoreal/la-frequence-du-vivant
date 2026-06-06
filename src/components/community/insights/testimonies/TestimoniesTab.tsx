import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Sparkles, Cloud, Stars, MessageSquareQuote } from 'lucide-react';
import { useExplorationTestimonies } from '@/hooks/useEventTestimonies';
import QuoteWall from './modes/QuoteWall';
import ImmersiveCarousel from './modes/ImmersiveCarousel';
import WordCloud from './modes/WordCloud';
import Constellation from './modes/Constellation';

interface Props {
  explorationId?: string;
}

type Mode = 'wall' | 'carousel' | 'cloud' | 'constellation';

const MODES: { key: Mode; label: string; icon: typeof LayoutGrid }[] = [
  { key: 'wall', label: 'Mur de citations', icon: LayoutGrid },
  { key: 'carousel', label: 'Carrousel immersif', icon: Sparkles },
  { key: 'cloud', label: 'Nuage de mots', icon: Cloud },
  { key: 'constellation', label: 'Constellation', icon: Stars },
];

const TestimoniesTab: React.FC<Props> = ({ explorationId }) => {
  const [mode, setMode] = useState<Mode>('wall');
  const { data: items = [], isLoading } = useExplorationTestimonies(explorationId);
  const published = items.filter((t) => t.is_published);

  // Deep-link from global search : force "wall" mode so the targeted card is rendered.
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string };
      if (detail?.kind === 'testimony') setMode('wall');
    };
    window.addEventListener('lfdv:focus', handler as EventListener);
    return () => window.removeEventListener('lfdv:focus', handler as EventListener);
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-xs text-muted-foreground animate-pulse">
        Récolte des voix des marcheurs…
      </div>
    );
  }

  if (published.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
          <MessageSquareQuote className="w-7 h-7 text-emerald-500/70" />
        </div>
        <h3 className="text-foreground text-sm font-semibold mb-1">Aucun témoignage pour l'instant</h3>
        <p className="text-muted-foreground text-xs max-w-xs leading-relaxed">
          Les voix des marcheurs apparaîtront ici dès qu'elles auront été recueillies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-chat-section="temoignages" data-chat-mode={mode} data-chat-count={published.length}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {published.length} voix de marcheurs
        </span>
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {mode === 'wall' && <QuoteWall items={published} />}
        {mode === 'carousel' && <ImmersiveCarousel items={published} />}
        {mode === 'cloud' && <WordCloud items={published} />}
        {mode === 'constellation' && <Constellation items={published} />}
      </motion.div>
    </div>
  );
};

export default TestimoniesTab;
