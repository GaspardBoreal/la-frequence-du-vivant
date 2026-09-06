import React from 'react';
import { createPortal } from 'react-dom';
import { X, Quote } from 'lucide-react';
import type { EntretienPerson } from '@/content/entretiens';

interface Props {
  person: EntretienPerson;
  verbatims: string[];
  open: boolean;
  onClose: () => void;
}

/**
 * Portrait plein écran d'un intervenant : photo héros, identité, trois verbatims.
 * Animations en keyframes CSS (voir index.css), fermeture Échap / fond / croix.
 */
const EntretienPortraitOverlay: React.FC<Props> = ({ person, verbatims, open, onClose }) => {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Portrait de ${person.name}`}
      className="ep-overlay fixed inset-0 z-[4000] flex items-center justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-xl sm:p-8"
      onClick={onClose}
    >
      <div
        className="ep-card relative w-full max-w-4xl overflow-hidden rounded-3xl border border-primary/20 bg-card/95 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
        />

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer le portrait"
          className="absolute right-4 top-4 z-10 rounded-full border border-border/60 bg-background/70 p-2 text-muted-foreground transition hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,260px)_1fr] md:items-start">
          <div className="ep-hero mx-auto w-full max-w-[260px]">
            {person.portraitUrl ? (
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -m-3 rounded-[2rem] bg-gradient-to-br from-primary/40 via-primary/10 to-transparent blur-lg"
                />
                <img
                  src={person.portraitUrl}
                  alt={person.portraitAlt ?? person.name}
                  className="relative aspect-[4/5] w-full rounded-[1.75rem] object-cover shadow-xl ring-1 ring-primary/25"
                />
              </div>
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[1.75rem] bg-primary/10 text-4xl font-semibold text-primary">
                {person.name.charAt(0)}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="ep-line ep-d1 text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
              {person.name}
            </p>
            <p className="ep-line ep-d2 mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
              {person.role}
            </p>

            <ul className="mt-7 space-y-4">
              {verbatims.slice(0, 3).map((v, i) => (
                <li
                  key={v}
                  className={`ep-line ep-d${i + 3} relative rounded-2xl border-l-2 border-primary/60 bg-muted/40 py-4 pl-11 pr-5`}
                >
                  <Quote
                    aria-hidden
                    className="absolute left-4 top-4 h-4 w-4 text-primary/60"
                  />
                  <p className="text-[15px] italic leading-relaxed text-foreground/90">{v}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default EntretienPortraitOverlay;
