import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Compass, ArrowRight } from 'lucide-react';
import type { CommunityFeedItem } from '@/hooks/useCommunityFeed';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  item: CommunityFeedItem;
  onSeen: (item: CommunityFeedItem) => void;
  onClick: (item: CommunityFeedItem) => void;
  index: number;
}

const CommunityDiscoveryCard: React.FC<Props> = ({ item, onSeen, onClick, index }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const seenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.intersectionRatio >= 0.5 && !seenTimerRef.current) {
          seenTimerRef.current = setTimeout(() => onSeen(item), 800);
        } else if (e.intersectionRatio < 0.5 && seenTimerRef.current) {
          clearTimeout(seenTimerRef.current);
          seenTimerRef.current = null;
        }
      });
    }, { threshold: [0, 0.5, 1] });
    obs.observe(el);
    return () => { obs.disconnect(); if (seenTimerRef.current) clearTimeout(seenTimerRef.current); };
  }, [item, onSeen]);

  const authorName = [item.author.prenom, item.author.nom].filter(Boolean).join(' ') || 'Un marcheur';
  const dateStr = item.marche.dateMarche
    ? format(new Date(item.marche.dateMarche), 'dd MMM', { locale: fr })
    : formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr });

  return (
    <motion.button
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      whileHover={{ y: -3 }}
      onClick={() => onClick(item)}
      className="group relative flex-shrink-0 w-[220px] h-[200px] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-900/90 to-teal-950/90 border border-emerald-500/30 text-left snap-start hover:shadow-xl hover:shadow-emerald-500/20 transition-all"
    >
      {item.preview && (
        <img
          src={item.preview}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/60 to-emerald-950/20" />

      <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/90 text-amber-950 text-[9px] font-bold uppercase tracking-wide">
        <Compass className="w-2.5 h-2.5" />
        À découvrir
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 space-y-1.5">
        <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
          {item.marche.title || 'Une marche'}
        </p>
        <p className="text-white/70 text-[10px] line-clamp-1">
          {authorName} · {dateStr}
        </p>
        <div className="flex items-center gap-1 text-amber-300 text-[10px] font-semibold pt-1">
          <MapPin className="w-3 h-3" />
          Rejoindre cette marche
          <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
};

export default CommunityDiscoveryCard;
