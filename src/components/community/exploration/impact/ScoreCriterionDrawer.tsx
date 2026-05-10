import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { SentinelleBreakdown } from '@/lib/sentinelleIndex';
import { Leaf, AlertTriangle, Sparkles } from 'lucide-react';

export type CriterionKey = 'sensible' | 'voix' | 'pillars' | 'volume' | 'species' | 'pratiques';

export interface CriterionDetails {
  marcheurName?: string;
  /** Espèces curées comptées en "détections précieuses". */
  sensibleNames?: Array<{ name: string; cat: 'bio' | 'aux' | 'eee' }>;
  /** Espèces locales du marcheur sans curation (potentiel non valorisé). */
  uncuratedSpeciesNames?: string[];
  /** Nombre de contributions iNaturalist visibles dans l'onglet Contributions. */
  inatContributionsCount?: number;
  /** Espèces uniques issues des médias locaux (= breakdown.species.count). */
  localSpeciesCount?: number;
  /** Piliers manquants (depuis breakdown.pillars.missing). */
  pillarsMissing?: string[];
}

interface Meta {
  icon: string;
  title: string;
  color: string;
  formula: string;
  formulaSubtitle: string;
}

const META: Record<CriterionKey, Meta> = {
  sensible: {
    icon: '🌿',
    title: 'Détections précieuses',
    color: 'hsl(150 70% 55%)',
    formula: 'bio×1.5 + aux×1.0 + EEE×2.0',
    formulaSubtitle: 'plafonné à 15 pondérés, normalisé sur 35 pts',
  },
  voix: {
    icon: '🎙',
    title: 'Voix singulière',
    color: 'hsl(280 60% 65%)',
    formula: '(textes + sons + témoignage) × 2.5',
    formulaSubtitle: 'plafonné à 10 pondérés, normalisé sur 20 pts',
  },
  pillars: {
    icon: '🪶',
    title: 'Variété des gestes',
    color: 'hsl(170 60% 60%)',
    formula: '(piliers cochés / 5) × 15',
    formulaSubtitle: 'photo · son · texte · témoignage · espèce sensible',
  },
  volume: {
    icon: '📸',
    title: 'Volume',
    color: 'hsl(190 60% 60%)',
    formula: '√(contributions) / √64 × 10',
    formulaSubtitle: 'racine carrée pour valoriser le geste régulier sans saturer',
  },
  species: {
    icon: '🦋',
    title: 'Diversité d\'espèces',
    color: 'hsl(210 60% 65%)',
    formula: '(espèces / 20) × 10',
    formulaSubtitle: 'compte les espèces uniques issues des médias locaux',
  },
  pratiques: {
    icon: '🌾',
    title: 'Pratiques emblématiques',
    color: 'hsl(40 75% 60%)',
    formula: '(pratiques × 2) / 10 × 10',
    formulaSubtitle: 'curations « main » liées au marcheur — sature à 5 pratiques',
  },
};

/** Simple animated counter from 0 → value. */
const Counter: React.FC<{ value: number }> = ({ value }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{n}</>;
};

const Section: React.FC<{ title: string; children: React.ReactNode; tone?: 'default' | 'warning' | 'info' }> = ({ title, children, tone = 'default' }) => {
  const toneCls =
    tone === 'warning'
      ? 'bg-amber-500/8 border-amber-500/25'
      : tone === 'info'
      ? 'bg-emerald-500/8 border-emerald-500/20'
      : 'bg-muted/40 border-border/50';
  return (
    <div className={`rounded-lg border p-3 ${toneCls}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">{title}</div>
      <div className="text-[12px] text-foreground/90 space-y-1.5">{children}</div>
    </div>
  );
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  criterion: CriterionKey | null;
  breakdown: SentinelleBreakdown;
  details?: CriterionDetails;
}

const ScoreCriterionDrawer: React.FC<Props> = ({ open, onOpenChange, criterion, breakdown, details }) => {
  if (!criterion) return null;
  const meta = META[criterion];
  const row = breakdown[criterion];
  const value = row.value;
  const max = row.max;
  const pct = (value / max) * 100;

  // Build "ce qui est compté" by criterion
  let counted: React.ReactNode = null;
  let notCounted: React.ReactNode = null;
  let nextStep: React.ReactNode = null;

  if (criterion === 'sensible') {
    const list = details?.sensibleNames ?? [];
    counted = list.length === 0 ? (
      <p className="text-muted-foreground italic">Aucune espèce sensible reliée pour l'instant.</p>
    ) : (
      <ul className="space-y-1">
        {list.map((s) => (
          <li key={s.name} className="flex items-center justify-between gap-2">
            <span className="truncate">
              <Leaf className="inline w-3 h-3 mr-1 text-emerald-500" />
              {s.name}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.cat === 'bio' ? 'bio · +1.5' : s.cat === 'aux' ? 'aux · +1.0' : 'EEE · +2.0'}
            </span>
          </li>
        ))}
      </ul>
    );
    if ((details?.uncuratedSpeciesNames?.length ?? 0) > 0) {
      notCounted = (
        <>
          <p>
            <span className="font-semibold text-amber-500">{details!.uncuratedSpeciesNames!.length}</span> espèce(s) observée(s) ne sont pas (encore) classées par un curateur :
          </p>
          <p className="text-muted-foreground italic">{details!.uncuratedSpeciesNames!.slice(0, 6).join(' · ')}{details!.uncuratedSpeciesNames!.length > 6 ? '…' : ''}</p>
          <p className="text-[11px] text-muted-foreground">→ un Ambassadeur peut les relier à une catégorie pour valoriser ces détections.</p>
        </>
      );
    }
    nextStep = <p>+4 pts environ par bio-indicateur supplémentaire détecté.</p>;
  }

  if (criterion === 'voix') {
    const v = breakdown.voix;
    counted = (
      <ul className="space-y-1">
        <li>📝 {v.textes} texte{v.textes > 1 ? 's' : ''} éco-poétique{v.textes > 1 ? 's' : ''}</li>
        <li>🎧 {v.sons} son{v.sons > 1 ? 's' : ''}</li>
        <li>💬 {v.temoignage} témoignage</li>
      </ul>
    );
    nextStep = <p>+2.5 pts pondérés par contribution d'expression (texte, son ou témoignage).</p>;
  }

  if (criterion === 'pillars') {
    const missing = details?.pillarsMissing ?? breakdown.pillars.missing;
    counted = <p><span className="font-semibold">{breakdown.pillars.count}</span> pilier{breakdown.pillars.count > 1 ? 's' : ''} sur 5 cochés.</p>;
    if (missing.length > 0) {
      notCounted = (
        <>
          <p>Piliers manquants : <span className="text-amber-500 font-medium">{missing.join(' · ')}</span>.</p>
          <p className="text-[11px] text-muted-foreground">Chaque pilier supplémentaire = +3 pts.</p>
        </>
      );
    }
    nextStep = missing.length > 0 ? <p>+3 pts dès qu'un pilier manquant est coché.</p> : <p>Bravo, tous les piliers sont actifs.</p>;
  }

  if (criterion === 'volume') {
    counted = (
      <p>
        <span className="font-semibold">{breakdown.volume.raw}</span> contribution{breakdown.volume.raw > 1 ? 's' : ''} locale{breakdown.volume.raw > 1 ? 's' : ''} (photos · vidéos · sons · textes · témoignage de cet événement).
      </p>
    );
    const inat = details?.inatContributionsCount ?? 0;
    if (inat > 0) {
      notCounted = (
        <>
          <p>
            <AlertTriangle className="inline w-3.5 h-3.5 text-amber-500 mr-1" />
            <span className="font-semibold">{inat}</span> observation{inat > 1 ? 's' : ''} iNaturalist sont visibles dans l'onglet <em>Contributions</em> mais n'alimentent pas encore ce score.
          </p>
          <p className="text-[11px] text-muted-foreground">Une évolution est en cours pour les inclure dans la Fréquence.</p>
        </>
      );
    }
    nextStep = <p>Volume sature à 64 contributions (courbe en racine carrée pour récompenser la régularité).</p>;
  }

  if (criterion === 'species') {
    counted = <p><span className="font-semibold">{breakdown.species.count}</span> espèce{breakdown.species.count > 1 ? 's' : ''} unique{breakdown.species.count > 1 ? 's' : ''} issue{breakdown.species.count > 1 ? 's' : ''} des médias locaux.</p>;
    const inat = details?.inatContributionsCount ?? 0;
    const local = details?.localSpeciesCount ?? breakdown.species.count;
    if (inat > local) {
      const delta = inat - local;
      notCounted = (
        <>
          <p>
            <AlertTriangle className="inline w-3.5 h-3.5 text-amber-500 mr-1" />
            <span className="font-semibold">{delta}</span> espèce{delta > 1 ? 's' : ''} supplémentaire{delta > 1 ? 's' : ''} apparaissent dans l'onglet <em>Contributions</em> via iNaturalist mais ne sont pas comptées ici.
          </p>
          <p className="text-[11px] text-muted-foreground">Inclusion prévue dans une prochaine itération du calcul.</p>
        </>
      );
    }
    nextStep = <p>Sature à 20 espèces — chaque espèce supplémentaire vaut ~0.5 pt.</p>;
  }

  if (criterion === 'pratiques') {
    counted = breakdown.pratiques.count > 0 ? (
      <p><span className="font-semibold">{breakdown.pratiques.count}</span> pratique{breakdown.pratiques.count > 1 ? 's' : ''} emblématique{breakdown.pratiques.count > 1 ? 's' : ''} portée{breakdown.pratiques.count > 1 ? 's' : ''}.</p>
    ) : (
      <p className="text-muted-foreground italic">Aucune pratique emblématique reliée pour l'instant.</p>
    );
    if (breakdown.pratiques.count === 0) {
      notCounted = <p className="text-[11px] text-muted-foreground">Une curation « main » par un Ambassadeur ou Sentinelle peut relier une pratique au marcheur.</p>;
    }
    nextStep = <p>+2 pts par pratique reliée, sature à 5.</p>;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="flex items-center gap-3">
            <span className="text-3xl" style={{ filter: `drop-shadow(0 0 12px ${meta.color}80)` }}>{meta.icon}</span>
            <span>{meta.title}</span>
          </SheetTitle>
          {details?.marcheurName && (
            <p className="text-xs text-muted-foreground">Marcheur : {details.marcheurName}</p>
          )}
        </SheetHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={criterion}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Score animé */}
            <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border/60 p-4 text-center">
              <div className="text-4xl font-bold tabular-nums" style={{ color: meta.color }}>
                <Counter value={value} /><span className="text-lg text-muted-foreground"> / {max}</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden mt-3">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: meta.color, boxShadow: `0 0 12px ${meta.color}80` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            </div>

            <Section title="Comment on calcule">
              <p className="font-mono text-[11px]">{meta.formula}</p>
              <p className="text-[11px] text-muted-foreground">{meta.formulaSubtitle}</p>
            </Section>

            <Section title="Ce qui est compté" tone="info">{counted}</Section>

            {notCounted && (
              <Section title="Ce qui n'est pas (encore) compté" tone="warning">{notCounted}</Section>
            )}

            {nextStep && (
              <Section title="Prochain pas">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>{nextStep}</div>
                </div>
              </Section>
            )}
          </motion.div>
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  );
};

export default ScoreCriterionDrawer;
