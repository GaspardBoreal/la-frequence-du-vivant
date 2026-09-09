import React from 'react';
import { Sparkles, Leaf, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ECO_FUNCTIONS } from '@/lib/ecologicalFunctions';
import { usePropertyBiodiversityKpis } from '@/hooks/propriete/usePropertyBiodiversityKpis';
import type { KingdomKey } from '@/lib/kingdomLabels';

interface Props {
  proprieteId: string;
  /** Ouvre la fenêtre de détail correspondante. */
  onOpen?: (key: 'vivant' | 'allies') => void;
}

const KINGDOMS: Array<{ key: KingdomKey; label: string; emoji: string; tint: string }> = [
  { key: 'plantae', label: 'Plantes', emoji: '🌿', tint: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { key: 'animalia', label: 'Animaux', emoji: '🦋', tint: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  { key: 'fungi', label: 'Champignons', emoji: '🍄', tint: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { key: 'others', label: 'Autres', emoji: '✳️', tint: 'bg-muted text-muted-foreground' },
];

const Shell: React.FC<{
  titre: string;
  icone: React.ReactNode;
  delay: number;
  onOpen?: () => void;
  children: React.ReactNode;
}> = ({ titre, icone, delay, onOpen, children }) => (
  <button
    type="button"
    onClick={onOpen}
    aria-haspopup="dialog"
    style={{ animationDelay: `${delay}ms` }}
    className={cn(
      'animate-fade-in w-full rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 p-5 text-left',
      'transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    )}
  >
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icone}
      </span>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {titre}
      </span>
    </div>
    {children}
    <span className="mt-3 block text-[11px] font-medium text-primary/80">Voir le détail →</span>
  </button>
);

/**
 * Deux indicateurs issus des marches rattachées au jardin : le vivant recensé
 * et les alliés du jardin. Aucun chiffre n'est affiché sans donnée réelle.
 */
const ProprieteBiodiversityCards: React.FC<Props> = ({ proprieteId, onOpen }) => {
  const bio = usePropertyBiodiversityKpis(proprieteId);

  if (bio.isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex h-36 items-center justify-center rounded-2xl border border-border/70 bg-muted/30 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Lecture du vivant…
          </div>
        ))}
      </div>
    );
  }

  if (bio.error) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        Indicateurs de biodiversité indisponibles : {bio.error.message}
      </div>
    );
  }

  if (!bio.hasEvents) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5">
        <p className="text-sm font-medium text-foreground">Aucune marche rattachée à ce jardin</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Les indicateurs de biodiversité se calculent à partir des événements de marche
          associés à la propriété. Rattachez un événement dans la section Événements.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Shell titre="Le vivant recensé" icone={<Leaf className="h-4 w-4" />} delay={0}>
        <p className="mt-3 text-4xl font-semibold leading-none tabular-nums text-foreground">
          {bio.totalSpecies}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          espèces distinctes observées lors de {bio.eventCount} marche{bio.eventCount > 1 ? 's' : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {KINGDOMS.filter((k) => bio.byKingdom[k.key] > 0).map((k) => (
            <span
              key={k.key}
              className={cn('rounded-full px-2.5 py-1 text-xs font-medium', k.tint)}
            >
              {k.emoji} {k.label} {bio.byKingdom[k.key]}
            </span>
          ))}
          {bio.totalSpecies === 0 && (
            <span className="text-xs italic text-muted-foreground/70">
              Collecte en attente sur cette marche
            </span>
          )}
        </div>
      </Shell>

      <Shell titre="Les alliés du jardin" icone={<Sparkles className="h-4 w-4" />} delay={80}>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl font-semibold leading-none tabular-nums text-foreground">
            {bio.alliesCount}
          </span>
          <span className="text-sm text-muted-foreground">
            sur {bio.totalSpecies} · {bio.alliesShare} %
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          espèces rendant un service écologique · indice de fertilité {bio.fertilityScore}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {bio.topFunctions.length > 0 ? (
            bio.topFunctions.map((f) => {
              const meta = ECO_FUNCTIONS.find((x) => x.value === f.value);
              return (
                <span
                  key={f.value}
                  className={cn(
                    'rounded-full bg-gradient-to-r px-2.5 py-1 text-xs font-medium text-foreground',
                    meta?.gradient,
                  )}
                >
                  {meta?.emoji} {meta?.shortLabel} {f.count}
                </span>
              );
            })
          ) : (
            <span className="text-xs italic text-muted-foreground/70">
              Aucune fonction écologique identifiée pour l’instant
            </span>
          )}
        </div>
        {bio.alliesCount > 0 && (
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground/80">
            Étiquettes : {bio.sources.curated} validée{bio.sources.curated > 1 ? 's' : ''} par un curateur ·{' '}
            {bio.sources.kb} issue{bio.sources.kb > 1 ? 's' : ''} de la base partagée ·{' '}
            {bio.sources.auto} reconnue{bio.sources.auto > 1 ? 's' : ''} automatiquement.
          </p>
        )}
      </Shell>
    </div>
  );
};

export default ProprieteBiodiversityCards;
