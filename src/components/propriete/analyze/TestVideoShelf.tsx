import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Clapperboard, ChevronDown, Play, Check } from 'lucide-react';
import { VideoLightbox, youtubeId, type LightboxVideo } from './VideoLightbox';

const LS_OPEN = (key: string) => `ds-video-shelf-open:${key}`;
const LS_SEEN = (key: string) => `ds-video-shelf-seen:${key}`;

export const TestVideoShelf: React.FC<{
  storageKey: string;
  videos: LightboxVideo[];
  /** Titre de l'appel, ex. "Voir le geste" */
  title?: string;
}> = ({ storageKey, videos, title = 'Voir le geste' }) => {
  const list = (videos ?? []).filter((v) => (v.url ?? '').trim().length > 0);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    try {
      const o = localStorage.getItem(LS_OPEN(storageKey));
      setOpen(o === null ? true : o === '1');
      setSeen(JSON.parse(localStorage.getItem(LS_SEEN(storageKey)) || '[]'));
    } catch {
      setOpen(true);
    }
  }, [storageKey]);

  const toggle = useCallback(
    (next: boolean) => {
      setOpen(next);
      try {
        localStorage.setItem(LS_OPEN(storageKey), next ? '1' : '0');
      } catch {
        /* noop */
      }
    },
    [storageKey]
  );

  const markSeen = useCallback(
    (url: string) => {
      setSeen((prev) => {
        if (prev.includes(url)) return prev;
        const next = [...prev, url];
        try {
          localStorage.setItem(LS_SEEN(storageKey), JSON.stringify(next));
        } catch {
          /* noop */
        }
        return next;
      });
    },
    [storageKey]
  );

  if (list.length === 0) return null;

  const anySeen = list.some((v) => seen.includes(v.url));

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => toggle(!open)}
          aria-expanded={open}
          className="group flex-1 flex items-center gap-2.5 rounded-xl border border-[hsl(var(--ds-gold))]/50 bg-[hsl(var(--ds-gold))]/[0.07] px-3 py-2 text-left transition hover:bg-[hsl(var(--ds-gold))]/[0.14]"
        >
          <span className="relative flex-shrink-0 w-7 h-7 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center">
            <Clapperboard className="w-3.5 h-3.5" />
            {!anySeen && (
              <span className="absolute inset-0 rounded-full ring-2 ring-[hsl(var(--ds-gold))]/60 motion-safe:animate-ping" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] font-semibold text-[hsl(var(--ds-forest-deep))] leading-tight">
              {anySeen ? `${title} — geste revu` : `${title} — ${list.length} regards de terrain`}
            </span>
            <span className="block text-[9.5px] font-bold tracking-[0.16em] uppercase text-[hsl(var(--ds-forest))]/60 mt-0.5">
              Optionnel · {list.length} vidéo{list.length > 1 ? 's' : ''}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 flex-shrink-0 text-[hsl(var(--ds-forest))]/70 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="shelf"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-2.5 grid gap-2 sm:grid-cols-3">
              {list.map((v, i) => {
                const id = v.youtubeId ?? youtubeId(v.url);
                const isSeen = seen.includes(v.url);
                return (
                  <motion.button
                    key={v.url}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    onClick={() => {
                      setActive(i);
                      markSeen(v.url);
                    }}
                    className="group relative overflow-hidden rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] text-left transition hover:border-[hsl(var(--ds-gold))]/60 hover:shadow-[0_6px_20px_-12px_rgba(60,80,60,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ds-gold))]"
                  >
                    <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[hsl(var(--ds-gold))]/70" />
                    <span className="block relative aspect-video overflow-hidden bg-[hsl(var(--ds-forest))]/10">
                      {id && (
                        <img
                          src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                          alt={`Miniature vidéo — ${v.label}`}
                          loading="lazy"
                          className="w-full h-full object-cover saturate-[0.55] transition duration-500 group-hover:saturate-100 group-hover:scale-[1.04]"
                        />
                      )}
                      <span className="absolute inset-0 bg-[hsl(var(--ds-forest-deep))]/25 transition group-hover:bg-[hsl(var(--ds-forest-deep))]/10" />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="relative w-9 h-9 rounded-full bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] flex items-center justify-center shadow-md ring-2 ring-[hsl(var(--ds-gold))]/50">
                          <Play className="w-3.5 h-3.5 translate-x-[1px]" />
                        </span>
                      </span>
                      <span className="absolute top-1.5 left-2 font-serif italic text-[hsl(var(--ds-cream))]/90 text-sm drop-shadow">
                        {i + 1}
                      </span>
                      {isSeen && (
                        <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-cream))]/90 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--ds-forest))]">
                          <Check className="w-2.5 h-2.5" /> vue
                        </span>
                      )}
                    </span>
                    <span className="block p-2.5">
                      <span className="block text-[9px] font-bold tracking-[0.18em] uppercase text-[hsl(var(--ds-forest))]/70 leading-tight">
                        {v.label}
                      </span>
                      {v.angle && (
                        <span className="block mt-1 text-[11px] italic text-[hsl(var(--ds-forest-deep))]/75 leading-snug">
                          {v.angle}
                        </span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => toggle(false)}
                className="text-[10.5px] font-semibold text-[hsl(var(--ds-forest-deep))]/55 hover:text-[hsl(var(--ds-forest-deep))] underline decoration-dotted underline-offset-2 transition"
              >
                Je connais déjà ce test — replier
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <VideoLightbox
        videos={list}
        activeIndex={active}
        onChangeIndex={(i) => {
          setActive(i);
          markSeen(list[i].url);
        }}
        onClose={() => setActive(null)}
      />
    </div>
  );
};
