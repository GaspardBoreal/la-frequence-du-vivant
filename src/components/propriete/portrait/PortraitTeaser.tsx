import React from 'react';
import { Images, ChevronRight } from 'lucide-react';
import { usePropertyGallery } from '@/hooks/propriete/usePropertyGallery';

interface Props {
  proprieteId?: string;
  onOpen: () => void;
}

/**
 * Bandeau discret placé en tête de « J'observe » — invite à composer / consulter
 * le portrait photographique du site.
 */
export const PortraitTeaser: React.FC<Props> = ({ proprieteId, onOpen }) => {
  const { data: photos = [] } = usePropertyGallery(proprieteId);
  const previews = photos.slice(0, 4);

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-4 rounded-xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/20 dark:to-transparent px-4 py-3 hover:from-amber-100/80 dark:hover:from-amber-950/40 transition text-left group"
    >
      <div className="flex -space-x-3">
        {previews.length > 0 ? (
          previews.map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt=""
              className="w-11 h-11 rounded-full object-cover ring-2 ring-background shadow"
            />
          ))
        ) : (
          <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center ring-2 ring-background">
            <Images className="w-5 h-5 text-amber-700 dark:text-amber-300" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold uppercase tracking-[0.15em] text-amber-800 dark:text-amber-300">
          Portrait du site
        </div>
        <div className="text-sm text-foreground/80 truncate">
          {photos.length > 0
            ? `${photos.length} ${photos.length > 1 ? 'photographies choisies' : 'photographie choisie'} pour raconter votre site`
            : 'Composez le portrait photographique de votre site avant le diagnostic'}
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-amber-700 dark:text-amber-300 group-hover:translate-x-0.5 transition" />
    </button>
  );
};
