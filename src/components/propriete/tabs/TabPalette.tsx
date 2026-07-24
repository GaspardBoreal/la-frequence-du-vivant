import React from 'react';
import { Palette } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';

export const TabPalette: React.FC<{ bio?: PropertyBiodiversity }> = ({ bio }) => {
  const plantes = (bio?.topSpecies ?? []).filter(
    (s) => (s.kingdom ?? '').toLowerCase() === 'plantae',
  );

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
          <Palette className="w-3.5 h-3.5" /> Étape 5 · Palette végétale
        </div>
        <h2 className="text-xl font-semibold mt-1">Le vocabulaire végétal du lieu</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Espèces déjà présentes, base pour vos futures plantations cohérentes.
        </p>
      </header>

      {plantes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground text-center">
          Aucune plante recensée pour l'instant. Une Marche du Vivant sur le lieu constituera la
          première palette végétale.
        </div>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {plantes.map((sp) => (
            <li
              key={sp.scientific}
              className="rounded-lg border border-border/60 bg-gradient-to-br from-emerald-50/40 to-amber-50/30 dark:from-emerald-900/10 dark:to-amber-900/10 p-3"
            >
              <div className="text-sm font-medium truncate">{sp.common ?? sp.scientific}</div>
              <div className="text-[11px] italic text-muted-foreground truncate">
                {sp.scientific}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">×{sp.count}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Bibliothèque étendue à venir :</strong> 150 espèces
        recommandées (climat, sol, usages) — en cours de développement.
      </div>
    </div>
  );
};
