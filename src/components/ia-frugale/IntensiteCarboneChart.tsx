import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PAYS } from '@/content/iaFrugale/outilsMesure';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const fmt = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });

/**
 * Barres horizontales des intensités carbone par pays (données CodeCarbon 2023).
 * Aucune valeur n'est recopiée : tout vient de PAYS.
 */
const IntensiteCarboneChart: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [actif, setActif] = useState<string | null>(null);

  const { lignes, max, monde, ratio, plusPropre, plusCharge } = useMemo(() => {
    const tries = [...PAYS].sort((a, b) => a.ci - b.ci);
    const pays = tries.filter((p) => p.code !== 'WLD');
    const mondial = tries.find((p) => p.code === 'WLD') ?? null;
    const maxi = Math.max(...tries.map((p) => p.ci));
    const bas = pays[0];
    const haut = pays[pays.length - 1];
    return {
      lignes: pays,
      max: maxi,
      monde: mondial,
      ratio: bas && haut ? haut.ci / bas.ci : 1,
      plusPropre: bas,
      plusCharge: haut,
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const paysActif = lignes.find((p) => p.code === actif);
  const mondePct = monde ? (monde.ci / max) * 100 : null;

  return (
    <div ref={ref} className="mt-6">
      <div className="relative rounded-2xl border border-border bg-card p-4 sm:p-6">
        {/* Repère moyenne mondiale */}
        {mondePct !== null && monde && (
          <div
            className="pointer-events-none absolute inset-y-4 hidden sm:block"
            style={{ left: `calc(${mondePct}% * 0.62 + 38%)` }}
            aria-hidden
          >
            <div className="h-full border-l border-dashed border-foreground/35" />
          </div>
        )}

        <ul className="relative space-y-3">
          {lignes.map((p, i) => {
            const pct = (p.ci / max) * 100;
            const t = Math.round(((p.ci - lignes[0].ci) / (max - lignes[0].ci || 1)) * 100);
            const est = actif === p.code;
            return (
              <li
                key={p.code}
                className="group grid grid-cols-[8.5rem_1fr] items-center gap-3 sm:grid-cols-[10rem_1fr]"
                onMouseEnter={() => setActif(p.code)}
                onMouseLeave={() => setActif((c) => (c === p.code ? null : c))}
                onClick={() => setActif((c) => (c === p.code ? null : p.code))}
              >
                <span className="truncate text-sm font-medium text-foreground">{p.nom}</span>
                <div className="flex items-center gap-2">
                  <div className="h-6 flex-1 overflow-hidden rounded-full bg-muted sm:h-7">
                    <div
                      className="h-full rounded-full transition-[width,opacity] ease-out"
                      style={{
                        width: visible ? `${pct}%` : '0%',
                        transitionDuration: '900ms',
                        transitionDelay: `${i * 90}ms`,
                        opacity: est ? 1 : 0.88,
                        background: `linear-gradient(90deg, color-mix(in oklab, hsl(var(--primary)) ${100 - t}%, hsl(var(--destructive))) 0%, color-mix(in oklab, hsl(var(--primary)) ${Math.max(0, 100 - t - 18)}%, hsl(var(--destructive))) 100%)`,
                      }}
                    />
                  </div>
                  <span className="w-[5.5rem] shrink-0 text-right font-mono text-sm tabular-nums text-foreground">
                    {fmt(p.ci)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
          <span>gCO2eq / kWh</span>
          {monde && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0 w-5 border-t border-dashed border-foreground/50" />
              moyenne mondiale {fmt(monde.ci)}
            </span>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {paysActif && monde ? (
          <>
            <span className="font-medium text-foreground">{paysActif.nom}</span> :{' '}
            {fmt(paysActif.ci)} gCO2eq/kWh, soit{' '}
            {paysActif.ci >= monde.ci
              ? `${fmt(paysActif.ci / monde.ci)} fois la moyenne mondiale`
              : `${fmt(monde.ci / paysActif.ci)} fois moins que la moyenne mondiale`}
            .
          </>
        ) : (
          plusPropre &&
          plusCharge && (
            <>
              Un même calcul émet{' '}
              <span className="font-medium text-foreground">{fmt(ratio)} fois plus</span> en{' '}
              {plusCharge.nom} qu'en {plusPropre.nom}.
            </>
          )
        )}
      </p>
    </div>
  );
};

export default IntensiteCarboneChart;
