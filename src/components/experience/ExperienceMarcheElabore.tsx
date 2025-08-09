import React from 'react';
import type { ExplorationMarche } from '@/hooks/useExplorations';

interface Props {
  marche: ExplorationMarche;
}

const ExperienceMarcheElabore: React.FC<Props> = ({ marche }) => {
  const m = marche.marche;
  return (
    <article className="rounded-xl border p-6">
      <header className="mb-4">
        <h2 className="text-xl font-semibold">{m?.nom_marche || m?.ville}</h2>
        {m?.date && <p className="text-sm text-foreground/60">{m.date}</p>}
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {m?.descriptif_court ? (
            <p className="text-foreground/80">{m.descriptif_court}</p>
          ) : (
            <p className="text-foreground/60">Volet poétique et data-visuel à venir…</p>
          )}
        </div>
        <div className="rounded-lg border p-4 bg-muted/30 text-sm text-foreground/70">
          Espace média (audio/visuel) — intégré selon les sources disponibles.
        </div>
      </div>
    </article>
  );
};

export default ExperienceMarcheElabore;
