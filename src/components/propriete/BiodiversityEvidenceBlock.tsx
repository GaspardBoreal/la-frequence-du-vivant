import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Leaf, Bug, Bird, Sprout, ChevronDown } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';
import { usePropertySpeciesPool } from '@/hooks/propriete/usePropertySpeciesPool';
import SpeciesExplorer from '@/components/biodiversity/SpeciesExplorer';

const KINGDOM_ICONS: Record<string, React.ReactNode> = {
  Plantae: <Sprout className="w-4 h-4" />,
  Animalia: <Bird className="w-4 h-4" />,
  Insecta: <Bug className="w-4 h-4" />,
  Fungi: <Leaf className="w-4 h-4" />,
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

interface Props {
  bio?: PropertyBiodiversity;
  proprieteId?: string;
  proprieteNom?: string;
  /** Ouvre déplié par défaut si true (défaut : replié) */
  defaultOpen?: boolean;
}

export const BiodiversityEvidenceBlock: React.FC<Props> = ({
  bio,
  proprieteId,
  proprieteNom,
  defaultOpen = false,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);
  const kingdoms = Object.entries(bio?.kingdoms ?? {});
  const eventCount = bio?.events.length ?? 0;

  // Le pool n'est chargé qu'à l'ouverture — évite le fan-out RPC inutile.
  const { species, isLoading, latestExplorationId } = usePropertySpeciesPool(
    open ? proprieteId : undefined,
  );

  const lastObsLabel = (() => {
    const d = bio?.lastObservationDate ?? bio?.lastEventDate;
    return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  })();

  const filtersLabel = proprieteNom
    ? `${proprieteNom} · ${eventCount} marche${eventCount > 1 ? 's' : ''}`
    : `${eventCount} marche${eventCount > 1 ? 's' : ''}`;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl border border-border/60 bg-card/50 p-5 md:p-6 space-y-4"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.3em] uppercase text-primary">
            <Eye className="w-3.5 h-3.5" /> Ce que la Fréquence du Vivant sait déjà
          </div>
          <h3 className="mt-1 text-lg font-semibold">Empreinte biodiversité mesurée ici</h3>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-xs font-medium hover:bg-background transition-colors shrink-0"
          aria-expanded={open}
        >
          {open ? 'Replier' : 'Voir les détails'}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Espèces observées" value={bio?.speciesTotal ?? 0} />
        <StatCard label="Marches réalisées" value={eventCount} />
        <StatCard label="Règnes présents" value={kingdoms.length} />
        <StatCard label="Dernière observation" value={lastObsLabel} small />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="details"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-5">
              {kingdoms.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    Répartition par règne
                  </h4>
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

              <div>
                <h4 className="text-xs font-semibold mb-3 text-muted-foreground">
                  Taxons observés · fusion de toutes les marches liées
                </h4>
                {isLoading && species.length === 0 ? (
                  <div className="text-xs italic text-muted-foreground py-8 text-center">
                    Chargement des espèces…
                  </div>
                ) : species.length === 0 ? (
                  <div className="text-xs italic text-muted-foreground py-8 text-center">
                    Aucune espèce collectée pour le moment.
                  </div>
                ) : (
                  <SpeciesExplorer
                    species={species}
                    explorationId={latestExplorationId}
                    compact
                    className="!p-0"
                  />
                )}
                {filtersLabel && (
                  <div className="mt-2 text-[10px] text-muted-foreground text-right italic">
                    {filtersLabel}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
