import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExternalLink } from 'lucide-react';

export interface LightboxVideo {
  label: string;
  url: string;
  youtubeId?: string;
  angle?: string;
}

export const youtubeId = (url: string): string | null => {
  if (!url) return null;
  const m =
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/[?&]v=([\w-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/);
  return m ? m[1] : null;
};

export const VideoLightbox: React.FC<{
  videos: LightboxVideo[];
  activeIndex: number | null;
  onChangeIndex: (i: number) => void;
  onClose: () => void;
}> = ({ videos, activeIndex, onChangeIndex, onClose }) => {
  const open = activeIndex !== null;
  const active = open ? videos[activeIndex as number] : null;
  const id = active ? active.youtubeId ?? youtubeId(active.url) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl w-[calc(100vw-2rem)] border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-cream))] p-3 sm:p-4">
        {active && (
          <div className="space-y-3">
            <div>
              <div className="text-[9px] font-bold tracking-[0.22em] uppercase text-[hsl(var(--ds-gold))]">
                Voir le geste
              </div>
              <div className="font-serif italic text-lg text-[hsl(var(--ds-forest-deep))] leading-tight pr-8">
                {active.label}
              </div>
              {active.angle && (
                <div className="text-[11px] text-[hsl(var(--ds-forest-deep))]/70">{active.angle}</div>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-[hsl(var(--ds-gold))]/40 bg-black aspect-video">
              {id && (
                <iframe
                  key={id}
                  title={active.label}
                  src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {videos.map((v, i) => (
                  <button
                    key={v.url}
                    type="button"
                    onClick={() => onChangeIndex(i)}
                    aria-current={i === activeIndex}
                    className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold transition ${
                      i === activeIndex
                        ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
                        : 'border-[hsl(var(--ds-forest))]/35 bg-[hsl(var(--ds-forest))]/8 text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/15'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <a
                href={active.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/70 hover:text-[hsl(var(--ds-forest-deep))] transition"
              >
                <ExternalLink className="w-3 h-3" /> Ouvrir sur YouTube
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
