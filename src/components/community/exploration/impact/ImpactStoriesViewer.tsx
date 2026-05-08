import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Share2, Lock, Sparkles, MapPin, Leaf, Bird, Flower2, TreePine, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EmpreinteVivante from './EmpreinteVivante';
import HowItWorksBanner from './HowItWorksBanner';
import ScoreBreakdown from './ScoreBreakdown';
import type { MarcheurWithStats } from '@/hooks/useExplorationParticipants';
import type { SensibleBuckets } from '@/lib/speciesClassification';
import type { BadgesResult } from '@/hooks/useMarcheurBadges';
import type { SentinelleBreakdown, SentinelleNextTip } from '@/lib/sentinelleIndex';
import { useFrenchSpeciesNamesAuto } from '@/hooks/useFrenchSpeciesNamesAuto';

const STORY_DURATION = 6000; // ms

export interface ImpactStoriesViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marcheur: MarcheurWithStats;
  sensible: SensibleBuckets;
  badgesResult: BadgesResult;
  pioneerCount: number;
  taxonomicFamilies: { label: string; count: number; icon: React.ElementType; color: string }[];
  sentinelleScore: number;
  sentinelleLabel: string;
  sentinelleBreakdown: SentinelleBreakdown;
  sentinelleNextTip: SentinelleNextTip;
  hasTemoignage: boolean;
}

const STORY_KEYS = ['empreinte', 'sentinelle', 'familles', 'detections', 'badges', 'palier'] as const;

const ImpactStoriesViewer: React.FC<ImpactStoriesViewerProps> = ({
  open, onOpenChange, marcheur, sensible, badgesResult,
  pioneerCount, taxonomicFamilies, sentinelleScore, sentinelleLabel,
  sentinelleBreakdown, sentinelleNextTip, hasTemoignage,
}) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Reset on open
  useEffect(() => { if (open) { setIndex(0); setProgress(0); } }, [open]);

  // Autoplay timer
  useEffect(() => {
    if (!open || paused) return;
    const tick = 50;
    const id = setInterval(() => {
      setProgress(p => {
        const next = p + (tick / STORY_DURATION) * 100;
        if (next >= 100) {
          if (index < STORY_KEYS.length - 1) {
            setIndex(i => i + 1);
            return 0;
          }
          return 100;
        }
        return next;
      });
    }, tick);
    return () => clearInterval(id);
  }, [open, paused, index]);

  // Reset progress when story changes
  useEffect(() => { setProgress(0); }, [index]);

  const next = useCallback(() => {
    if (index < STORY_KEYS.length - 1) { setIndex(i => i + 1); setProgress(0); }
  }, [index]);
  const prev = useCallback(() => {
    if (index > 0) { setIndex(i => i - 1); setProgress(0); } else { setProgress(0); }
  }, [index]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, next, prev, onOpenChange]);

  const currentKey = STORY_KEYS[index];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 border-0 bg-transparent shadow-none max-w-none w-screen h-[100dvh] sm:w-[420px] sm:h-[740px] sm:rounded-3xl overflow-hidden"
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerLeave={() => setPaused(false)}
      >
        {/* Background : deep emerald gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-900" />
        <div className="absolute inset-0 opacity-30" style={{
          background: 'radial-gradient(circle at 30% 20%, hsl(150 60% 30% / 0.5), transparent 60%), radial-gradient(circle at 80% 80%, hsl(180 60% 30% / 0.4), transparent 60%)',
        }} />

        {/* Top bar : progress + close */}
        <div className="relative z-20 px-3 pt-3">
          <div className="flex gap-1">
            {STORY_KEYS.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white"
                  style={{
                    width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
                    transition: i === index ? 'none' : 'width 200ms',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                   style={{ background: marcheur.couleur }}>
                {marcheur.prenom[0]}{marcheur.nom[0]}
              </div>
              <div className="text-xs text-white/90 font-medium">
                {marcheur.prenom} <span className="text-white/50">· empreinte vivante</span>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tap zones */}
        <button
          className="absolute left-0 top-16 bottom-16 w-1/3 z-10"
          onClick={(e) => { e.stopPropagation(); prev(); }}
          aria-label="Précédent"
        />
        <button
          className="absolute right-0 top-16 bottom-16 w-1/3 z-10"
          onClick={(e) => { e.stopPropagation(); next(); }}
          aria-label="Suivant"
        />

        {/* Story content */}
        <div className="relative z-[5] flex-1 flex items-center justify-center px-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {currentKey === 'empreinte' && (
                <StoryEmpreinte marcheur={marcheur} sensible={sensible} hasTemoignage={hasTemoignage} />
              )}
              {currentKey === 'sentinelle' && (
                <StorySentinelle
                  score={sentinelleScore}
                  label={sentinelleLabel}
                  breakdown={sentinelleBreakdown}
                  nextTip={sentinelleNextTip}
                />
              )}
              {currentKey === 'familles' && (
                <StoryFamilles marcheur={marcheur} taxonomicFamilies={taxonomicFamilies} />
              )}
              {currentKey === 'detections' && (
                <StoryDetections sensible={sensible} />
              )}
              {currentKey === 'badges' && (
                <StoryBadges badges={badgesResult.badges} unlockedCount={badgesResult.unlockedCount} />
              )}
              {currentKey === 'palier' && (
                <StoryPalier nextBadge={badgesResult.nextBadge} marcheur={marcheur} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop arrows */}
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white z-20"
          aria-label="Précédent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 items-center justify-center text-white z-20"
          aria-label="Suivant"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
};

// ─── Stories ─────────────────────────────────────────────────────────────────

const StoryEmpreinte: React.FC<{ marcheur: MarcheurWithStats; sensible: SensibleBuckets; hasTemoignage: boolean }> = ({ marcheur, sensible, hasTemoignage }) => (
  <div className="flex flex-col items-center text-center text-white">
    <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Votre Empreinte</div>
    <h2 className="text-xl font-light mb-6">La trace que vous laissez<br/><span className="font-semibold text-emerald-200">dans le vivant</span></h2>
    <EmpreinteVivante
      photos={marcheur.stats.photos}
      audios={marcheur.stats.sons}
      textes={marcheur.stats.textes}
      temoignages={hasTemoignage ? 1 : 0}
      bioCount={sensible.bioIndicateurs.length}
      auxCount={sensible.auxiliaires.length}
      eeeCount={sensible.eee.length}
      size={260}
    />
    <p className="text-xs text-white/60 italic mt-6 max-w-[260px]">
      Aucune autre empreinte n'a la même forme que la vôtre.
    </p>
  </div>
);

const StorySentinelle: React.FC<{
  score: number;
  label: string;
  breakdown: SentinelleBreakdown;
  nextTip: SentinelleNextTip;
}> = ({ score, label, breakdown, nextTip }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="flex flex-col items-center text-center text-white max-h-[calc(100dvh-120px)] sm:max-h-[620px] overflow-y-auto py-2 gap-3">
      <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80">Indice de Sentinelle</div>
      <h2 className="text-base font-light">{label}</h2>

      <div className="relative" style={{ width: 150, height: 150 }}>
        <svg width={150} height={150} className="-rotate-90">
          <circle cx={75} cy={75} r={radius} fill="none" stroke="hsl(0 0% 100% / 0.1)" strokeWidth={6} />
          <motion.circle
            cx={75} cy={75} r={radius} fill="none"
            stroke="hsl(150 70% 55%)" strokeWidth={6} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (circumference * score) / 100 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{ filter: 'drop-shadow(0 0 10px hsl(150 70% 55%))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="text-4xl font-bold text-white leading-none">{score}</motion.div>
          <div className="text-[10px] text-white/60 mt-0.5">/ 100</div>
        </div>
      </div>

      <ScoreBreakdown breakdown={breakdown} total={score} />

      {nextTip.gain > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="w-full max-w-[320px] bg-emerald-500/10 border border-emerald-300/30 rounded-lg px-3 py-2 text-left"
        >
          <div className="text-[10px] uppercase tracking-wider text-emerald-300/90 mb-0.5">Prochain pas</div>
          <div className="text-xs text-white/90 font-medium">{nextTip.text}</div>
        </motion.div>
      )}

      <HowItWorksBanner />
    </div>
  );
};

const StoryFamilles: React.FC<{
  marcheur: MarcheurWithStats;
  taxonomicFamilies: { label: string; count: number; icon: React.ElementType; color: string }[];
}> = ({ marcheur, taxonomicFamilies }) => {
  const speciesNames = useMemo(() => marcheur.speciesObserved.map(s => s.scientificName).slice(0, 3), [marcheur.speciesObserved]);
  const speciesInputs = useMemo(() => speciesNames.map(scientificName => ({ scientificName })), [speciesNames]);
  const { data: frNamesMap } = useFrenchSpeciesNamesAuto(speciesInputs);

  return (
    <div className="flex flex-col items-center text-center text-white">
      <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Familles du Vivant</div>
      <h2 className="text-2xl font-light mb-1">
        <span className="font-bold text-emerald-200">{taxonomicFamilies.length}</span> famille{taxonomicFamilies.length > 1 ? 's' : ''}
      </h2>
      <p className="text-xs text-white/60 mb-8">rencontrée{taxonomicFamilies.length > 1 ? 's' : ''} sur le terrain</p>

      <div className="space-y-2 w-full max-w-[280px] mb-8">
        {taxonomicFamilies.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.12 }}
            className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
          >
            <div className="flex items-center gap-2.5">
              <f.icon className={`w-4 h-4 ${f.color}`} />
              <span className="text-sm font-medium">{f.label}</span>
            </div>
            <span className="text-lg font-bold tabular-nums">{f.count}</span>
          </motion.div>
        ))}
      </div>

      {speciesNames.length > 0 && (
        <div className="w-full max-w-[280px]">
          <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2">Vos espèces phares</div>
          <div className="space-y-1">
            {speciesNames.map((sn, i) => (
              <motion.div
                key={sn}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-xs text-white/80"
              >
                {frNamesMap?.get(sn)?.commonNameFr || sn}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StoryDetections: React.FC<{ sensible: SensibleBuckets }> = ({ sensible }) => {
  const items = [
    { count: sensible.bioIndicateurs.length, label: 'bio-indicateur', poetic: 'Vous lisez la santé du milieu', color: 'emerald', dot: 'hsl(150 70% 55%)' },
    { count: sensible.auxiliaires.length,    label: 'auxiliaire',     poetic: 'Vous reconnaissez les alliés',  color: 'amber',   dot: 'hsl(45 92% 55%)' },
    { count: sensible.eee.length,            label: 'EEE signalée',   poetic: 'Vous protégez l\'écosystème',   color: 'rose',    dot: 'hsl(0 80% 60%)', alert: true },
  ];

  const totalSensible = sensible.bioIndicateurs.length + sensible.auxiliaires.length + sensible.eee.length;

  return (
    <div className="flex flex-col items-center text-center text-white">
      <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Détections Précieuses</div>
      <h2 className="text-xl font-light mb-1">Vos espèces sensibles</h2>
      <p className="text-xs text-white/50 mb-6">Elles révèlent l'état réel du vivant</p>

      {totalSensible === 0 && (
        <div className="text-sm text-white/60 italic mt-4 max-w-[260px]">
          Aucune espèce sensible détectée pour l'instant. Apprenez à reconnaître les bio-indicateurs pour devenir Sentinelle.
        </div>
      )}

      <div className="space-y-3 w-full max-w-[300px]">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.15 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-left"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: it.dot, boxShadow: `0 0 12px ${it.dot}` }}
                animate={it.alert ? { opacity: [1, 0.3, 1] } : { scale: [1, 1.15, 1] }}
                transition={{ duration: it.alert ? 0.9 : 2.4, repeat: Infinity }}
              />
              <div className="flex-1">
                <div className="text-2xl font-bold tabular-nums">
                  {it.count} <span className="text-xs font-normal text-white/60">{it.label}{it.count > 1 ? 's' : ''}</span>
                </div>
                <div className="text-[11px] text-white/60 italic mt-0.5">{it.poetic}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StoryBadges: React.FC<{ badges: BadgesResult['badges']; unlockedCount: number }> = ({ badges, unlockedCount }) => (
  <div className="flex flex-col items-center text-center text-white">
    <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Vos Badges</div>
    <h2 className="text-xl font-light mb-1">
      <span className="font-bold text-emerald-200">{unlockedCount}</span> sur {badges.length} débloqué{unlockedCount > 1 ? 's' : ''}
    </h2>
    <p className="text-xs text-white/50 mb-6">Collection rare du Marcheur</p>

    <div className="grid grid-cols-3 gap-3 w-full max-w-[320px] max-h-[400px] overflow-y-auto pr-1">
      {badges.map((b, i) => (
        <motion.div
          key={b.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 * i, type: 'spring', stiffness: 200 }}
          className={`flex flex-col items-center p-2.5 rounded-xl border ${
            b.unlocked
              ? 'bg-white/10 border-white/20 backdrop-blur-sm'
              : 'bg-white/[0.02] border-white/5 opacity-50'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1.5 ${
            b.unlocked ? 'bg-white/10' : 'bg-white/[0.03]'
          }`}>
            {b.unlocked
              ? <b.icon className={`w-5 h-5 ${b.color}`} />
              : <Lock className="w-3.5 h-3.5 text-white/30" />
            }
          </div>
          <div className="text-[10px] font-semibold leading-tight">{b.label}</div>
          {!b.unlocked && b.progress > 0 && (
            <div className="w-full h-0.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-400/70" style={{ width: `${b.progress * 100}%` }} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  </div>
);

const StoryPalier: React.FC<{ nextBadge: BadgesResult['nextBadge']; marcheur: MarcheurWithStats }> = ({ nextBadge, marcheur }) => {
  const handleShare = async () => {
    const text = `Mon empreinte du vivant — ${marcheur.prenom} 🌿\nLa Fréquence du Vivant`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Mon empreinte', text, url: window.location.href }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(text + '\n' + window.location.href); } catch {}
    }
  };

  return (
    <div className="flex flex-col items-center text-center text-white">
      <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2">Votre Prochain Palier</div>
      {nextBadge ? (
        <>
          <h2 className="text-xl font-light mb-6">Bientôt débloqué</h2>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative w-32 h-32 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-6 backdrop-blur-sm"
          >
            <nextBadge.icon className={`w-14 h-14 ${nextBadge.color} opacity-80`} />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
              {Math.round(nextBadge.progress * 100)}%
            </div>
          </motion.div>
          <div className="text-base font-semibold mb-1">{nextBadge.label}</div>
          <p className="text-xs text-white/70 max-w-[260px] mb-2">{nextBadge.description}</p>
          {nextBadge.hint && (
            <div className="text-xs text-emerald-300 font-medium mt-1">→ {nextBadge.hint}</div>
          )}
        </>
      ) : (
        <>
          <Sparkles className="w-12 h-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-light mb-2">Tous les badges débloqués</h2>
          <p className="text-sm text-white/70 max-w-[280px]">Vous incarnez la Sentinelle accomplie. Continuez à inspirer la communauté.</p>
        </>
      )}

      <Button
        onClick={handleShare}
        variant="secondary"
        className="mt-8 bg-white text-emerald-950 hover:bg-white/90 rounded-full px-6"
      >
        <Share2 className="w-4 h-4 mr-2" /> Partager mon empreinte
      </Button>
    </div>
  );
};

export default ImpactStoriesViewer;
