import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Waves, Play, Pause } from 'lucide-react';
import type { PublicPaysageSample } from '@/hooks/usePublicEvent';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  paysages: PublicPaysageSample[];
  total: number;
}

const formatDur = (s: number | null) => {
  if (!s) return '';
  const m = Math.floor(s / 60), r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const PaysagesSonoresDialog: React.FC<Props> = ({ open, onOpenChange, paysages, total }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLAudioElement | null>>({});

  const toggle = (id: string) => {
    const el = refs.current[id];
    if (!el) return;
    if (playingId && playingId !== id) {
      const prev = refs.current[playingId];
      prev?.pause();
    }
    if (el.paused) {
      el.play().catch(() => {});
      setPlayingId(id);
    } else {
      el.pause();
      setPlayingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-background via-card to-emerald-500/5 border-primary/20">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-primary/10">
          <DialogTitle className="flex items-center gap-2 text-2xl font-display">
            <Waves className="h-6 w-6 text-emerald-500" />
            {total} paysage{total > 1 ? 's' : ''} sonore{total > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Captures audio enregistrées en marche. Casque ou enceintes recommandés.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 sm:p-6 space-y-3">
            {paysages.map((p) => {
              const author = [p.prenom, p.nom].filter(Boolean).join(' ');
              const initials = author.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase() || '·';
              const isPlaying = playingId === p.id;
              return (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-primary/10 bg-card/80 backdrop-blur-xl p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <Button
                      type="button"
                      onClick={() => toggle(p.id)}
                      size="icon"
                      className={`h-12 w-12 shrink-0 rounded-full ${isPlaying ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-primary hover:bg-primary/90'}`}
                      aria-label={isPlaying ? 'Pause' : 'Lire'}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground leading-tight">{p.titre}</h3>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                        {author && (
                          <>
                            <Avatar className="h-5 w-5">
                              {p.avatar_url && <AvatarImage src={p.avatar_url} alt={author} />}
                              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                            </Avatar>
                            <span>{author}</span>
                          </>
                        )}
                        {p.duree_secondes ? <span>· {formatDur(p.duree_secondes)}</span> : null}
                      </div>
                    </div>
                  </div>
                  {p.url && (
                    <audio
                      ref={(el) => { refs.current[p.id] = el; }}
                      src={p.url}
                      onEnded={() => setPlayingId(null)}
                      preload="none"
                      className="hidden"
                    />
                  )}
                  {/* Waveform faux */}
                  <div className="flex items-end gap-0.5 mt-3 h-6 px-1">
                    {Array.from({ length: 48 }).map((_, i) => (
                      <span
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-emerald-500/70 animate-pulse' : 'bg-primary/20'}`}
                        style={{
                          height: `${20 + Math.abs(Math.sin(i * 1.7)) * 70}%`,
                          animationDelay: isPlaying ? `${i * 40}ms` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PaysagesSonoresDialog;
