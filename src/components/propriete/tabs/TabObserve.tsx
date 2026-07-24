import React from 'react';
import { Eye, Leaf, Bug, Bird, Sprout } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';

const KINGDOM_ICONS: Record<string, React.ReactNode> = {
  Plantae: <Sprout className="w-4 h-4" />,
  Animalia: <Bird className="w-4 h-4" />,
  Insecta: <Bug className="w-4 h-4" />,
  Fungi: <Leaf className="w-4 h-4" />,
};

export const TabObserve: React.FC<{ bio?: PropertyBiodiversity }> = ({ bio }) => {
  const kingdoms = Object.entries(bio?.kingdoms ?? {});
  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
          <Eye className="w-3.5 h-3.5" /> Étape 1 · J'observe
        </div>
        <h2 className="text-xl font-semibold mt-1">Ce que le lieu montre aujourd'hui</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recensement basé sur les Marches du Vivant réalisées ici.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Espèces observées" value={bio?.speciesTotal ?? 0} />
        <StatCard label="Marches réalisées" value={bio?.events.length ?? 0} />
        <StatCard label="Règnes présents" value={kingdoms.length} />
        <StatCard
          label="Dernière observation"
          value={bio?.lastEventDate ? new Date(bio.lastEventDate).toLocaleDateString('fr-FR') : '—'}
          small
        />
      </div>

      {kingdoms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2">Répartition par règne</h3>
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
          <h3 className="text-sm font-semibold mb-2">Espèces les plus présentes</h3>
          <ul className="grid md:grid-cols-2 gap-2">
            {bio!.topSpecies.map((sp) => (
              <li
                key={sp.scientific}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-card/50 px-3 py-2 text-sm"
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
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode; small?: boolean }> = ({
  label,
  value,
  small,
}) => (
  <div className="rounded-xl border border-border/60 bg-card/50 p-3">
    <div className={small ? 'text-sm font-semibold' : 'text-2xl font-bold'}>{value}</div>
    <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
  </div>
);
