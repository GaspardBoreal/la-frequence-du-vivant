import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Leaf, Bug, Bird, Sprout } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';

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

export const BiodiversityEvidenceBlock: React.FC<{ bio?: PropertyBiodiversity }> = ({ bio }) => {
  const kingdoms = Object.entries(bio?.kingdoms ?? {});

  return (
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
  );
};
