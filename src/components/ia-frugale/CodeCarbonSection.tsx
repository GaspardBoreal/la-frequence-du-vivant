import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Outil } from '@/content/iaFrugale/casUsage';
import { CONSTANTES_CODECARBON } from '@/content/iaFrugale/outilsMesure';
import SimulateurCard from './SimulateurCard';
import BandeauTerrain from './BandeauTerrain';
import VignetteCas from './VignetteCas';
import m04 from '@/assets/marcheurs/Marcheurs_04.jpeg.asset.json';
import m07 from '@/assets/marcheurs/Marcheurs_07.jpeg.asset.json';

const ILLUSTRATIONS: Record<string, { src: string; alt: string; legende: string }> = {
  mdv: {
    src: m04.url,
    alt: "Marcheurs observant le vivant au pied d'un vieux chêne",
    legende: 'Marches du Vivant — le calcul ci-dessus porte sur des photos comme celle-ci.',
  },
  jardin: {
    src: m07.url,
    alt: "Mains examinant le système racinaire d'une plante dans un jardin",
    legende: 'Fréquence Jardin — un jardin documenté, observation après observation.',
  },
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Section CodeCarbon — direction « Précision botanique (sombre) ».
 * Serre de nuit : fond forêt, verre dépoli, sérif + monospace, halo émeraude.
 * Le contenu et les calculs sont inchangés ; seule la mise en scène change.
 */
const CodeCarbonSection = ({ outil }: { outil: Outil }) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id={outil.cle}
      className={`cc-nuit scroll-mt-4 border-b border-border bg-background${visible ? ' cc-visible' : ''}`}
    >
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        {/* En-tête */}
        <header className="cc-reveal flex flex-col gap-6 border-b border-foreground/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <span className="inline-block rounded-full bg-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--frugal-codecarbon))]">
              {outil.nature}
            </span>
            <h2 className="cc-serif text-4xl leading-none text-foreground sm:text-6xl">
              {outil.nom}
            </h2>
          </div>
          <a
            href={outil.url}
            target="_blank"
            rel="noopener noreferrer"
            className="cc-mono group inline-flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
          >
            Ouvrir l'outil officiel
            <ExternalLink
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
        </header>

        {/* Cartes d'information en verre */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="cc-verre cc-reveal p-6 sm:p-8" style={{ transitionDelay: '90ms' }}>
            <h3 className="cc-mono text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--frugal-codecarbon))]">
              Ce qu'il mesure
            </h3>
            <p className="mt-4 text-sm font-light italic leading-relaxed text-foreground/85">
              {outil.quoi}
            </p>
            <div className="cc-mono mt-6 flex items-baseline gap-2 text-foreground" aria-hidden>
              <span className="text-2xl">kWh</span>
              <span className="text-sm text-foreground/40">×</span>
              <span className="text-2xl">gCO₂e</span>
            </div>
          </div>
          <div className="cc-verre cc-reveal p-6 sm:p-8" style={{ transitionDelay: '180ms' }}>
            <h3 className="cc-mono text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--frugal-codecarbon))]">
              Quand s'en servir
            </h3>
            <p className="mt-4 text-sm font-light leading-relaxed text-foreground/85">
              {outil.quand}
            </p>
            <div className="mt-6 flex gap-3" aria-hidden>
              <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--frugal-codecarbon))]" />
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--frugal-codecarbon)/0.4)]" />
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--frugal-codecarbon)/0.2)]" />
            </div>
          </div>
        </div>

        {/* Constantes officielles */}
        <div
          className="cc-reveal mt-8 rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.02] p-6"
          style={{ transitionDelay: '260ms' }}
        >
          <p className="cc-mono text-center text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {outil.constantesTitre}
          </p>
          <ul className="mt-5 flex flex-wrap items-stretch justify-center gap-x-8 gap-y-6">
            {CONSTANTES_CODECARBON.map((c, i) => (
              <li
                key={c.label}
                className={`max-w-[16rem] text-center ${
                  i > 0 ? 'sm:border-l sm:border-foreground/10 sm:pl-8' : ''
                }`}
              >
                <p className="cc-mono text-sm font-bold text-foreground">{c.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{c.valeur}</p>
                <a
                  href={c.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cc-mono mt-1.5 inline-block text-[10px] uppercase tracking-widest text-foreground/50 underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
                >
                  source
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Simulateurs */}
        <div className="mt-12 space-y-12">
          {outil.simulateurs.map((sim, i) => (
            <div key={sim.id} className="cc-reveal" style={{ transitionDelay: `${320 + i * 120}ms` }}>
              <SimulateurCard
                simulateur={sim}
                numero={i + 1}
                illustration={
                  ILLUSTRATIONS[sim.cas] ? <VignetteCas {...ILLUSTRATIONS[sim.cas]} /> : undefined
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CodeCarbonSection;
