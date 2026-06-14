import React from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sparkles, Calendar, MapPin, Leaf, ImageOff } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { sanitizeHtml } from '@/utils/htmlSanitizer';

export interface PratiqueDetail {
  id: string;
  title: string;
  description: string | null;
  cover_urls: string[];
  total_medias: number;
  marche?: {
    id: string;
    title: string;
    date_marche: string | null;
    lieu: string | null;
  } | null;
}

interface Props {
  pratique: PratiqueDetail | null;
  onOpenChange: (open: boolean) => void;
}

const PratiqueRemarquableDialog: React.FC<Props> = ({ pratique, onOpenChange }) => {
  const open = !!pratique;
  const [heroIdx, setHeroIdx] = React.useState(0);
  const covers = pratique?.cover_urls ?? [];

  React.useEffect(() => {
    if (pratique) setHeroIdx(0);
  }, [pratique?.id]);

  const hero = covers[heroIdx] || covers[0] || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,56rem)] max-w-4xl max-h-[92vh] p-0 overflow-y-auto !flex flex-col gap-0 border-[hsl(var(--crm-border))] bg-gradient-to-br from-[hsl(var(--crm-surface))] via-[hsl(var(--crm-surface-2))] to-[hsl(var(--crm-accent))]/5">
        <AnimatePresence mode="wait">
          {pratique && (
            <motion.div
              key={pratique.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >


              {/* Hero */}
              <div className="relative h-[clamp(220px,34vh,320px)] shrink-0 bg-[hsl(var(--crm-surface-2))] overflow-hidden">
                {hero ? (
                  <img
                    src={hero}
                    alt={pratique.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 via-amber-500/10 to-primary/20 grid place-items-center">
                    <Leaf className="h-16 w-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Pratique remarquable
                </div>
                {pratique.total_medias > 1 && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs">
                    {heroIdx + 1} / {covers.length}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <DialogTitle className="text-2xl sm:text-3xl font-display font-semibold text-white leading-tight drop-shadow">
                    {pratique.title || 'Pratique remarquable'}
                  </DialogTitle>
                  {pratique.marche && (
                    <DialogDescription className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-white/80 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Leaf className="h-3.5 w-3.5" /> {pratique.marche.title}
                      </span>
                      {pratique.marche.date_marche && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(pratique.marche.date_marche), 'd MMMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {pratique.marche.lieu && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {pratique.marche.lieu}
                        </span>
                      )}
                    </DialogDescription>
                  )}
                </div>
              </div>

              {/* Carrousel vignettes */}
              {covers.length > 1 && (
                <div className="px-5 pt-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x">
                    {covers.map((url, i) => (
                      <button
                        key={url + i}
                        type="button"
                        onClick={() => setHeroIdx(i)}
                        className={`relative shrink-0 w-20 h-20 rounded-lg overflow-hidden snap-start border-2 transition-all ${
                          i === heroIdx
                            ? 'border-[hsl(var(--crm-accent))] ring-2 ring-[hsl(var(--crm-accent))]/30'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="p-5 pb-8 sm:p-6 sm:pb-10">
                {pratique.description ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-headings:text-[hsl(var(--crm-text))] prose-p:text-[hsl(var(--crm-text))]/85 prose-strong:text-[hsl(var(--crm-text))] prose-a:text-[hsl(var(--crm-accent))] prose-li:text-[hsl(var(--crm-text))]/85"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(pratique.description) }}
                  />
                ) : (
                  <p className="text-sm crm-muted italic flex items-center gap-2">
                    <ImageOff className="h-4 w-4" /> Aucune description renseignée.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PratiqueRemarquableDialog;
