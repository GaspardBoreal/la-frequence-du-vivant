import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Leaf, Bug, Bird, Sprout, ArrowRight, CheckCheck } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertyObservation } from '@/hooks/propriete/usePropertyObservation';
import { OBSERVE_BLOCKS } from '@/components/propriete/observe/observeConfig';
import { ObservationCard } from '@/components/propriete/observe/ObservationCard';
import { SensorialBlock } from '@/components/propriete/observe/SensorialBlock';
import { StepHeader } from '@/components/propriete/observe/StepHeader';
import { Button } from '@/components/ui/button';

const KINGDOM_ICONS: Record<string, React.ReactNode> = {
  Plantae: <Sprout className="w-4 h-4" />,
  Animalia: <Bird className="w-4 h-4" />,
  Insecta: <Bug className="w-4 h-4" />,
  Fungi: <Leaf className="w-4 h-4" />,
};

export const TabObserve: React.FC<{ bio?: PropertyBiodiversity; proprieteId?: string }> = ({
  bio,
  proprieteId,
}) => {
  const kingdoms = Object.entries(bio?.kingdoms ?? {});
  const { state, saving, savedAt, toggleChoice, setSensorial, setNotes, markComplete } =
    usePropertyObservation(proprieteId);

  const totalAnswered = Object.values(state.answers).reduce(
    (n, arr) => n + (arr?.length ? 1 : 0),
    0
  );

  return (
    <div className="space-y-6">
      <StepHeader current={1} savedAt={savedAt} saving={saving} />

      {/* Grille des 8 cartes */}
      <div className="grid md:grid-cols-2 gap-5">
        {OBSERVE_BLOCKS.map((b, i) => (
          <ObservationCard
            key={b.id}
            block={b}
            selected={state.answers[b.id] ?? []}
            onToggle={(v) => toggleChoice(b.id, v)}
            index={i}
          />
        ))}
        <div className="md:col-span-2">
          <SensorialBlock values={state.sensorial} onChange={setSensorial} />
        </div>
      </div>

      {/* Notes libres */}
      <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6 shadow-[0_2px_20px_-10px_rgba(60,80,60,0.15)]">
        <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-[hsl(var(--ds-forest))]/80">
          Notes de terrain
        </div>
        <textarea
          rows={3}
          value={state.notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Impressions, hypothèses, points d'attention à discuter avec le client…"
          className="mt-2 w-full bg-transparent border-none outline-none resize-none text-sm text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest))]/40"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 md:p-6">
        <div className="text-sm text-[hsl(var(--ds-forest-deep))]">
          <span className="font-semibold">{totalAnswered}</span> / {OBSERVE_BLOCKS.length} blocs
          renseignés
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={markComplete}
            className="border-[hsl(var(--ds-forest))]/40 text-[hsl(var(--ds-forest-deep))] hover:bg-[hsl(var(--ds-forest))]/10"
          >
            <CheckCheck className="w-4 h-4 mr-2" /> Marquer l'étape comme terminée
          </Button>
          <Button className="bg-[hsl(var(--ds-forest))] hover:bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
            Étape suivante · J'analyse le sol <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Bloc de preuve — data biodiv existante */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-border/60 bg-card/50 p-5 md:p-6 space-y-4"
      >
        <header>
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-primary">
            <Eye className="w-3.5 h-3.5" /> Ce que la Fréquence du Vivant sait déjà
          </div>
          <h3 className="mt-1 text-lg font-semibold">Empreinte biodiversité mesurée ici</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Recensement basé sur les Marches du Vivant réalisées sur ce site.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Espèces observées" value={bio?.speciesTotal ?? 0} />
          <StatCard label="Marches réalisées" value={bio?.events.length ?? 0} />
          <StatCard label="Règnes présents" value={kingdoms.length} />
          <StatCard
            label="Dernière observation"
            value={(() => {
              const d = bio?.lastObservationDate ?? bio?.lastEventDate;
              return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
            })()}
            small
          />
        </div>

        {kingdoms.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">Répartition par règne</h4>
            <div className="flex flex-wrap gap-2">
              {kingdoms.map(([k, count]) => (
                <div
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs"
                >
                  {KINGDOM_ICONS[k] ?? <Leaf className="w-4 h-4" />}
                  <span className="font-medium">{k}</span>
                  <span className="text-muted-foreground">·</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(bio?.topSpecies?.length ?? 0) > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
              Espèces les plus présentes
            </h4>
            <ul className="grid md:grid-cols-2 gap-2">
              {bio!.topSpecies.map((sp) => (
                <li
                  key={sp.scientific}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card/70 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{sp.common ?? sp.scientific}</div>
                    <div className="truncate text-[11px] italic text-muted-foreground">
                      {sp.scientific}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">×{sp.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.section>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; small?: boolean }> = ({
  label,
  value,
  small,
}) => (
  <div className="rounded-xl border border-border/60 bg-card/60 p-3">
    <div className={small ? 'text-sm font-semibold' : 'text-2xl font-bold'}>{value}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
  </div>
);
