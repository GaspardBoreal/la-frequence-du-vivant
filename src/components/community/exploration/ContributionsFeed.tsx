import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, FileText, Video, Clock } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import SortToggle from '@/components/community/contributions/SortToggle';
import { useExplorationContributions, ContributionEntry } from '@/hooks/useExplorationContributions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ContributionsFeedProps {
  explorationId?: string;
  maxItems?: number;
}

const typeConfig: Record<ContributionEntry['type'], { icon: React.ElementType; color: string; label: string }> = {
  photo: { icon: Camera, color: 'text-emerald-500', label: 'Photo' },
  video: { icon: Video, color: 'text-blue-500', label: 'Vidéo' },
  audio: { icon: Mic, color: 'text-violet-500', label: 'Son' },
  texte: { icon: FileText, color: 'text-amber-500', label: 'Texte' },
};

const ContributionsFeed: React.FC<ContributionsFeedProps> = ({ explorationId, maxItems = 20 }) => {
  const { data: contributions, isLoading } = useExplorationContributions(explorationId);
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');

  const sorted = useMemo(() => {
    if (!contributions) return [];
    const items = [...contributions];
    items.sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === 'desc' ? diff : -diff;
    });
    return items.slice(0, maxItems);
  }, [contributions, sort, maxItems]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-36 h-4 rounded" />
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border animate-pulse">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
            <Skeleton className="w-10 h-10 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!sorted.length) return null;

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold text-foreground">Contributions récentes</span>
          <span className="text-[10px]">({sorted.length})</span>
        </div>
        <SortToggle sort={sort} onToggle={() => setSort(s => s === 'desc' ? 'asc' : 'desc')} />
      </div>

      {/* Feed */}
      <div className="space-y-1.5">
        {sorted.map((c, i) => {
          const config = typeConfig[c.type];
          const Icon = config.icon;
          const initials = `${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase();
          const dateStr = format(new Date(c.createdAt), 'dd MMM · HH:mm', { locale: fr });

          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-card border border-border/60 hover:border-emerald-500/20 transition-colors"
            >
              {/* Avatar */}
              <Avatar className="w-8 h-8 flex-shrink-0">
                {c.avatarUrl && <AvatarImage src={c.avatarUrl} alt={c.prenom} />}
                <AvatarFallback className="text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {c.prenom} {c.nom?.[0]}.
                  </span>
                  <Icon className={`w-3 h-3 flex-shrink-0 ${config.color}`} />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground truncate">
                    {c.titre || config.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">·</span>
                  <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">{dateStr}</span>
                </div>
              </div>

              {/* Thumbnail for photos */}
              {c.type === 'photo' && c.url && (
                <img
                  src={c.url}
                  alt={c.titre || 'Photo'}
                  className="w-10 h-10 rounded-lg object-cover ring-1 ring-border/50 flex-shrink-0"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}

              {/* Icon for non-photo types */}
              {(c.type === 'audio' || c.type === 'texte' || c.type === 'video') && (
                <div className={`w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ContributionsFeed;
