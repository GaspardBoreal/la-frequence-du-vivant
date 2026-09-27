import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { METHODES_24 } from '@/content/frequenceJardin/methodes24';
import { FJ_SIGNUP_URL } from '@/content/frequenceJardin/pilier';
import { FjSourceLink } from './FjSourceLink';

const LIMITE = 600;
const goutte = METHODES_24.find((m) => m.id === 'goutte')!;
const byId = (id: string) => METHODES_24.find((m) => m.id === id)!;

const verdict = (s: number) =>
  s < 5
    ? 'Votre sol boit. L’eau d’arrosage entre là où vous la versez.'
    : s < 60
      ? 'Légèrement hydrophobe. Arrosez en deux passages et paillez.'
      : s < LIMITE
        ? 'Fortement hydrophobe. Votre sol repousse l’eau : matière organique et paillage d’abord.'
        : 'Très fortement hydrophobe. Un sol à lire de près dans Fréquence Jardin.';

const WEEKEND: { temps: string; ids: string[]; note?: string }[] = [
  { temps: 'Samedi matin', ids: ['cartes', 'boudin', 'bandelette-ph', 'nitrates', 'thermometre'] },
  { temps: 'Samedi après-midi', ids: ['percolation'] },
  { temps: 'Dimanche', ids: ['bioessai'], note: 'Lancer le bioessai haricot (résultat dans quatre semaines)' },
  { temps: 'Clôture', ids: ['lecture-ensemble'], note: 'La lecture d’ensemble dans l’application' },
];

const lancerFeuilles = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    const leaf = confetti.shapeFromPath({ path: 'M0 10 C 0 0 10 0 10 0 C 10 10 0 10 0 10 Z' });
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, shapes: [leaf], colors: ['#7fa87f', '#0d6b58', '#c9a44c'], scalar: 1.4 });
  } catch {
    /* décor facultatif */
  }
};

/** « Votre premier test prend deux minutes » : chronomètre de la goutte d’eau, échelle de Dekker. */
const PremierTest: React.FC = () => {
  const [etat, setEtat] = useState<'idle' | 'run' | 'done'>('idle');
  const [t, setT] = useState(0);
  const start = useRef(0);

  useEffect(() => {
    if (etat !== 'run') return;
    const id = window.setInterval(() => {
      const s = (performance.now() - start.current) / 1000;
      if (s >= LIMITE) {
        setT(LIMITE);
        setEtat('done');
      } else setT(s);
    }, 100);
    return () => window.clearInterval(id);
  }, [etat]);

  useEffect(() => {
    if (etat === 'done') lancerFeuilles();
  }, [etat]);

  const onMain = () => {
    if (etat === 'run') {
      setT((performance.now() - start.current) / 1000);
      setEtat('done');
    } else {
      start.current = performance.now();
      setT(0);
      setEtat('run');
    }
  };

  const mm = Math.floor(t / 60);
  const ss = (t % 60).toFixed(1).padStart(4, '0');

  return (
    <section id="premier-test" className="bg-[hsl(var(--ds-forest-deep))] py-16 text-[hsl(var(--ds-cream))] md:py-20">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="font-serif text-[26px] leading-tight md:text-[34px]">
          Votre premier test prend deux minutes. Faites-le maintenant.
        </h2>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            'Prenez une poignée de terre sèche de votre jardin.',
            'Posez une goutte d’eau dessus.',
            'Lancez le chrono, arrêtez-le quand la goutte a disparu.',
          ].map((txt, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-[hsl(var(--ds-cream))]/15 bg-[hsl(var(--ds-cream))]/[0.06] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--ds-gold))] font-serif text-[16px] text-[hsl(var(--ds-forest-deep))]">
                {i + 1}
              </span>
              <span className="text-[14px] leading-relaxed">{txt}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 text-center">
          <p className="font-serif text-[64px] leading-none tabular-nums md:text-[96px]" aria-live="off" role="timer">
            {mm > 0 ? `${mm}:${ss.padStart(4, '0')}` : `${ss} s`}
          </p>
          <button
            type="button"
            onClick={onMain}
            className="mt-6 min-h-[48px] rounded-full bg-[hsl(var(--ds-gold))] px-8 py-3 text-[16px] font-medium text-[hsl(var(--ds-forest-deep))] transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--ds-cream))]"
          >
            {etat === 'run' ? 'La goutte a disparu' : etat === 'done' ? 'Recommencer' : 'Lancer'}
          </button>

          <div aria-live="polite">
            {etat === 'done' && (
              <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[hsl(var(--ds-cream))]/20 bg-[hsl(var(--ds-cream))]/[0.07] p-6">
                <p className="font-serif text-[20px] leading-snug">{verdict(t)}</p>
                <p className="mt-3 text-[13px] text-[hsl(var(--ds-cream))]/75">
                  Lecture selon l’échelle de Dekker (WDPT) —{' '}
                  <FjSourceLink href={goutte.source.url} className="inline-flex items-center gap-1 text-[hsl(var(--ds-gold))] underline underline-offset-4">
                    {goutte.source.label}
                  </FjSourceLink>
                </p>
                <a
                  href={FJ_SIGNUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ds-cream))] px-6 py-3 text-[15px] font-medium text-[hsl(var(--ds-forest-deep))]"
                >
                  Enregistrer ce premier résultat et démarrer mon jardin <ArrowRight className="h-4 w-4" aria-hidden />
                  <span className="sr-only"> (nouvelle fenêtre)</span>
                </a>
              </div>
            )}
          </div>
        </div>

        <h3 className="mt-16 font-serif text-[22px] md:text-[26px]">Votre week-end diagnostic</h3>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {WEEKEND.map((w) => (
            <li key={w.temps} className="rounded-2xl border-t-2 border-[hsl(var(--ds-gold))] bg-[hsl(var(--ds-cream))]/[0.06] p-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--ds-gold))]">{w.temps}</p>
              {w.note ? (
                <p className="mt-2 text-[14px] leading-relaxed">
                  {w.note}
                  <span className="block text-[12px] text-[hsl(var(--ds-cream))]/65">{byId(w.ids[0]).duree}</span>
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {w.ids.map((id) => (
                    <li key={id} className="flex justify-between gap-2 text-[14px]">
                      <span>{byId(id).nom}</span>
                      <span className="shrink-0 text-[12px] text-[hsl(var(--ds-cream))]/65">{byId(id).duree}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-6 font-serif text-[18px] italic text-[hsl(var(--ds-gold))]">Un week-end pour savoir quoi planter, et où.</p>
      </div>
    </section>
  );
};

export default PremierTest;
