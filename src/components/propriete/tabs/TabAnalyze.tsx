import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { PropertyBiodiversity } from '@/hooks/propriete/usePropertyBiodiversity';

export const TabAnalyze: React.FC<{ bio?: PropertyBiodiversity }> = ({ bio }) => {
  const total = Object.values(bio?.kingdoms ?? {}).reduce((a, b) => a + b, 0) || 1;
  const kingdoms = Object.entries(bio?.kingdoms ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
          <BarChart3 className="w-3.5 h-3.5" /> Étape 2 · J'analyse
        </div>
        <h2 className="text-xl font-semibold mt-1">Ce que les données révèlent</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Équilibre des règnes, tendances et signaux faibles.
        </p>
      </header>

      <div className="space-y-2">
        {kingdoms.map(([k, v]) => {
          const pct = Math.round((v / total) * 100);
          return (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">{k}</span>
                <span className="text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {kingdoms.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Aucune donnée à analyser pour l'instant. Organisez une Marche pour alimenter l'analyse.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">À venir :</strong> comparaison saisonnière, indice de
        Shannon local, corrélations météo & phénologie (en cours de développement).
      </div>
    </div>
  );
};
