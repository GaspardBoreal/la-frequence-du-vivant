import React from 'react';
import type { ExplorationMarche } from '@/hooks/useExplorations';

interface Props {
  marche: ExplorationMarche;
}

const ExperienceMarcheSimple: React.FC<Props> = ({ marche }) => {
  const m = marche.marche;
  return (
    <article className="rounded-xl border p-6">
      <header className="flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">{m?.nom_marche || m?.ville}</h2>
        {m?.date && <span className="text-sm text-foreground/60">{m.date}</span>}
      </header>
      {m?.descriptif_court && (
        <p className="mt-3 text-foreground/80">{m.descriptif_court}</p>
      )}
      {(m?.latitude && m?.longitude) && (
        <p className="mt-3 text-xs text-foreground/60">Coordonnées: {m.latitude}, {m.longitude}</p>
      )}
    </article>
  );
};

export default ExperienceMarcheSimple;
