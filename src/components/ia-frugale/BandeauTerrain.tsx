import { useEffect, useRef, useState } from 'react';
import m01 from '@/assets/marcheurs/Marcheurs_01.jpeg.asset.json';
import m04 from '@/assets/marcheurs/Marcheurs_04.jpeg.asset.json';
import m07 from '@/assets/marcheurs/Marcheurs_07.jpeg.asset.json';
import m10 from '@/assets/marcheurs/Marcheurs_10.jpeg.asset.json';
import m12 from '@/assets/marcheurs/Marcheurs_12.jpg.asset.json';
import patio from '@/assets/isegcom/Patio_vegetalise_01.jpeg.asset.json';
import mesure from '@/assets/isegcom/Mesure_Biodiv_01.jpeg.asset.json';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';

const nf = new Intl.NumberFormat('fr-FR');

const VIGNETTES = [
  { asset: m01, alt: 'Marcheurs en lisière de forêt', legende: 'Marche du Vivant — chaque sortie produit des photos géolocalisées.' },
  { asset: m04, alt: "Observation au pied d'un vieux chêne", legende: 'Une observation : une photo, une date, un point GPS.' },
  { asset: m12, alt: 'Marche en forêt sous la pluie', legende: 'Terrain réel, conditions réelles.' },
  { asset: mesure, alt: 'Mesure de biodiversité sur le terrain', legende: 'Mesure de biodiversité — la donnée avant le modèle.' },
  { asset: m07, alt: "Mains examinant le système racinaire d'une plante", legende: 'Fréquence Jardin — le sol observé de près.' },
  { asset: patio, alt: 'Patio végétalisé documenté', legende: 'Un jardin documenté photo après photo.' },
  { asset: m10, alt: 'Marcheurs observant un jardin partagé', legende: "Ce sont ces images que l'IA apprend à reconnaître." },
];

const useCompteur = (cible: number, actif: boolean) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!actif || cible <= 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setV(cible);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const duree = 1600;
    const tick = (now: number) => {
      const t = Math.min((now - t0) / duree, 1);
      setV(Math.floor((1 - Math.pow(1 - t, 4)) * cible));
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(cible);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cible, actif]);
  return v;
};

const Compteur = ({ valeur, label, actif }: { valeur?: number; label: string; actif: boolean }) => {
  const affiche = useCompteur(valeur ?? 0, actif);
  return (
    <div className="text-center sm:text-left">
      <p className="cc-mono cc-glow text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
        {valeur === undefined ? '—' : nf.format(affiche)}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
    </div>
  );
};

/**
 * Bandeau « La matière que l'on mesure » : mosaïque de photos réelles du projet
 * + compteurs alimentés par les chiffres publics (aucune valeur inventée).
 */
const BandeauTerrain = () => {
  const { data: stats } = usePublicGlobalStats();
  const ref = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setActif(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="cc-reveal mt-10" style={{ transitionDelay: '40ms' }}>
      <p className="cc-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--frugal-codecarbon))]">
        La matière que l'on mesure
      </p>

      {/* Mosaïque : défilement horizontal sur mobile, grille décalée sur grand écran */}
      <ul className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-7 md:gap-3 md:overflow-visible md:pb-0">
        {VIGNETTES.map((v, i) => (
          <li
            key={v.asset.url}
            className={`cc-vignette group relative w-40 shrink-0 snap-start overflow-hidden rounded-xl md:w-auto ${
              i % 2 === 1 ? 'md:translate-y-4' : ''
            } ${actif ? 'cc-vignette-on' : ''}`}
            style={{ transitionDelay: `${i * 70}ms` }}
          >
            <img
              src={v.asset.url}
              alt={v.alt}
              loading="lazy"
              className="h-32 w-full object-cover transition-all duration-700 md:h-36"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-[hsl(168_52%_8%/0.95)] to-transparent p-2 text-[10px] leading-snug text-foreground/90 transition-transform duration-500 group-hover:translate-y-0 group-focus-within:translate-y-0">
              {v.legende}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-col gap-5 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-3 gap-5 sm:gap-8">
          <Compteur valeur={stats?.photos_collectees} label="photos collectées" actif={actif} />
          <Compteur valeur={stats?.especes_tracees} label="espèces suivies" actif={actif} />
          <Compteur valeur={stats?.marches_organisees} label="marches organisées" actif={actif} />
        </div>
        <p className="max-w-xs text-sm font-light italic leading-relaxed text-foreground/75">
          Chaque chiffre de cette page porte sur ces images-là.
        </p>
      </div>
    </div>
  );
};

export default BandeauTerrain;
