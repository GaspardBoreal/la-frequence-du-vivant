import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Moon } from 'lucide-react';
import { useCommunityFeed, type CommunityFeedItem } from '@/hooks/useCommunityFeed';
import { useFeedSeenTracker } from '@/hooks/useFeedSeenTracker';
import CommunityFeedCard from './CommunityFeedCard';
import CommunityDiscoveryCard from './CommunityDiscoveryCard';

interface Props {
  userId: string;
}

/** Retourne la route + params pour ouvrir l'onglet correct dans l'exploration */
function buildTarget(item: CommunityFeedItem): string | null {
  const eventId = item.marche.eventId;
  const explorationId = item.marche.explorationId;
  if (!eventId && !explorationId && !item.marche.publicSlug) return null;

  // Marche non inscrite → page publique
  if (!item.registered && item.marche.publicSlug) {
    return `/m/${item.marche.publicSlug}`;
  }

  const base = explorationId
    ? `/marches-du-vivant/mon-espace/exploration/${explorationId}`
    : eventId
      ? `/marches-du-vivant/mon-espace/exploration/event-${eventId}`
      : null;
  if (!base) return null;

  const params = new URLSearchParams();
  params.set('tab', 'marches');
  if (item.kind === 'photo') { params.set('sensory', 'voir'); }
  if (item.kind === 'son')   { params.set('sensory', 'ecouter'); }
  if (item.kind === 'texte') { params.set('sensory', 'ecrire'); }
  if (item.kind === 'espece') {
    params.set('tab', 'biodiversite');
    params.set('sub', 'taxons');
    if (item.extra?.scientificName) {
      params.set('focus', `species:${encodeURIComponent(item.extra.scientificName)}`);
    }
  }
  return `${base}?${params.toString()}`;
}

const CommunityFeedCarousel: React.FC<Props> = ({ userId }) => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const discoveryRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useCommunityFeed(userId);
  const { markSeen, markClicked } = useFeedSeenTracker(userId);

  const main = data?.main || [];
  const discovery = data?.discovery || [];
  const total = main.length + discovery.length;

  const scroll = (ref: React.RefObject<HTMLDivElement>, dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  };

  const handleClick = (item: CommunityFeedItem) => {
    markClicked(item);
    const target = buildTarget(item);
    if (target) navigate(target);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Nouveautés de la communauté…</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[200px] h-[280px] rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-border/40 bg-gradient-to-br from-indigo-950/40 to-slate-950/40 p-5 text-center"
      >
        <Moon className="w-6 h-6 text-indigo-300/70 mx-auto mb-2" />
        <p className="text-sm text-foreground font-medium">Tout est calme aujourd'hui</p>
        <p className="text-xs text-muted-foreground mt-1 italic">
          Vos marcheurs dorment. Revenez bientôt pour découvrir leurs traces.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {main.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
              </motion.div>
              <h3 className="text-sm font-semibold text-foreground">Depuis votre dernière visite</h3>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/15 px-2 py-0.5 rounded-full">
                {main.length}
              </span>
            </div>
            <div className="hidden sm:flex gap-1">
              <button
                onClick={() => scroll(scrollRef, 'left')}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Défiler à gauche"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => scroll(scrollRef, 'right')}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Défiler à droite"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
          >
            {main.map((item, i) => (
              <CommunityFeedCard
                key={item.id}
                item={item}
                index={i}
                onSeen={markSeen}
                onClick={handleClick}
              />
            ))}
          </div>
        </section>
      )}

      {discovery.length > 0 && (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Ailleurs dans la communauté</h3>
              <span className="text-[10px] text-muted-foreground">{discovery.length}</span>
            </div>
            <div className="hidden sm:flex gap-1">
              <button
                onClick={() => scroll(discoveryRef, 'left')}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Défiler à gauche"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => scroll(discoveryRef, 'right')}
                className="p-1 rounded-full hover:bg-muted transition-colors"
                aria-label="Défiler à droite"
              >
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground italic px-1">
            Ces marches se déroulent sans vous — rejoignez-les pour explorer plus loin.
          </p>
          <div
            ref={discoveryRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4"
          >
            {discovery.map((item, i) => (
              <CommunityDiscoveryCard
                key={item.id}
                item={item}
                index={i}
                onSeen={markSeen}
                onClick={handleClick}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default CommunityFeedCarousel;
