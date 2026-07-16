import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Music, PenLine, Sparkles, MapPin, Play, ArrowUpRight } from 'lucide-react';
import type { CommunityFeedItem } from '@/hooks/useCommunityFeed';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  item: CommunityFeedItem;
  onSeen: (item: CommunityFeedItem) => void;
  onClick: (item: CommunityFeedItem) => void;
  index: number;
}

const KIND_META: Record<CommunityFeedItem['kind'], { label: string; icon: React.ElementType; accent: string }> = {
  photo:  { label: 'Photo',  icon: Camera,   accent: 'from-sky-500/80 to-cyan-500/80' },
  son:    { label: 'Son',    icon: Music,    accent: 'from-violet-500/80 to-fuchsia-500/80' },
  texte:  { label: 'Texte',  icon: PenLine,  accent: 'from-amber-500/80 to-orange-500/80' },
  espece: { label: 'Espèce', icon: Sparkles, accent: 'from-emerald-500/80 to-teal-500/80' },
};

const CommunityFeedCard: React.FC<Props> = ({ item, onSeen, onClick, index }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const seenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.intersectionRatio >= 0.5) {
          if (!seenTimerRef.current) {
            seenTimerRef.current = setTimeout(() => onSeen(item), 800);
          }
        } else if (seenTimerRef.current) {
          clearTimeout(seenTimerRef.current);
          seenTimerRef.current = null;
        }
      });
    }, { threshold: [0, 0.5, 1] });
    obs.observe(el);
    return () => {
      obs.disconnect();
      if (seenTimerRef.current) clearTimeout(seenTimerRef.current);
    };
  }, [item, onSeen]);

  const authorName = [item.author.prenom, item.author.nom].filter(Boolean).join(' ') || 'Un marcheur';
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr });

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
      whileHover={{ y: -3 }}
      onClick={() => onClick(item)}
      className="group relative flex-shrink-0 w-[200px] h-[280px] rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all snap-start text-left"
    >
      {/* Visual */}
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.accent} opacity-40`} />
      {item.preview && (
        <img
          src={item.preview}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      {!item.preview && item.kind === 'son' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="w-12 h-12 text-white/80" fill="currentColor" />
        </div>
      )}
      {!item.preview && item.kind === 'texte' && (
        <div className="absolute inset-0 p-4 flex items-center">
          <p className="text-white/90 text-xs italic leading-relaxed line-clamp-6">
            « {item.extra?.extrait || item.title || 'Un nouveau texte à découvrir'} »
          </p>
        </div>
      )}

      {/* Overlay dégradé */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

      {/* Type badge */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
        <Icon className="w-3 h-3 text-white" />
        <span className="text-[10px] font-semibold text-white uppercase tracking-wide">{meta.label}</span>
      </div>

      {/* Nouveauté halo */}
      {index === 0 && (
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-2xl ring-2 ring-amber-300/60 pointer-events-none"
        />
      )}

      {/* Bas de carte */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1.5">
        {item.title && (
          <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
            {item.title}
          </p>
        )}
        {item.kind === 'espece' && item.extra?.scientificName && (
          <p className="text-white/70 text-[10px] italic line-clamp-1">
            {item.extra.scientificName}
          </p>
        )}
        <div className="flex items-center gap-1.5 pt-1">
          {item.author.avatarUrl ? (
            <img src={item.author.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-[8px] text-white font-bold">
              {authorName[0]}
            </div>
          )}
          <span className="text-white/85 text-[10px] font-medium truncate">{authorName}</span>
        </div>
        {item.marche.title && (
          <p className="text-white/60 text-[9px] flex items-center gap-1 line-clamp-1">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            <span className="truncate">{item.marche.title}</span>
          </p>
        )}
        <p className="text-white/50 text-[9px]">{timeAgo}</p>
      </div>

      <ArrowUpRight className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
};

export default CommunityFeedCard;
