import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Leaf } from 'lucide-react';
import type { PublicPratiqueSample } from '@/hooks/usePublicEvent';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pratiques: PublicPratiqueSample[];
  total: number;
}

const PratiquesEmblematiquesDialog: React.FC<Props> = ({ open, onOpenChange, pratiques, total }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-gradient-to-br from-background via-card to-primary/5 border-primary/20">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-primary/10">
          <DialogTitle className="flex items-center gap-2 text-2xl font-display">
            <Sparkles className="h-6 w-6 text-amber-500" />
            {total} pratique{total > 1 ? 's' : ''} emblématique{total > 1 ? 's' : ''}
          </DialogTitle>
          <DialogDescription>
            Gestes, savoirs et engagements partagés par les marcheurs de cette exploration.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="p-4 sm:p-6 grid gap-4">
            {pratiques.map((p) => {
              const author = [p.prenom, p.nom].filter(Boolean).join(' ');
              const initials = author.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
              return (
                <article
                  key={p.id}
                  className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-card/80 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col sm:flex-row gap-0">
                    {p.photo_url ? (
                      <div className="sm:w-44 aspect-[4/3] sm:aspect-auto overflow-hidden bg-muted shrink-0">
                        <img
                          src={p.photo_url}
                          alt={p.titre ?? ''}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="sm:w-44 aspect-[4/3] sm:aspect-auto shrink-0 bg-gradient-to-br from-emerald-500/15 via-amber-500/10 to-primary/15 grid place-items-center">
                        <Leaf className="h-10 w-10 text-primary/40" />
                      </div>
                    )}
                    <div className="flex-1 p-4 sm:p-5 min-w-0">
                      {p.category && (
                        <span className="inline-block text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1.5">
                          {p.category}
                        </span>
                      )}
                      <h3 className="text-lg font-display font-semibold text-foreground leading-tight mb-2">
                        {p.titre || 'Pratique emblématique'}
                      </h3>
                      {p.description && (
                        <p
                          className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-3"
                          dangerouslySetInnerHTML={{ __html: p.description }}
                        />
                      )}
                      {author && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <Avatar className="h-7 w-7">
                            {p.avatar_url && <AvatarImage src={p.avatar_url} alt={author} />}
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">Partagé par <span className="text-foreground font-medium">{author}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PratiquesEmblematiquesDialog;
