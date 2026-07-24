import React, { useState } from 'react';
import { Compass } from 'lucide-react';

const ENJEUX = [
  { id: 'biodiv', label: 'Restaurer la biodiversité', hint: 'Corridors, haies, mares' },
  { id: 'sol', label: 'Régénérer les sols', hint: 'Couverts, matière organique' },
  { id: 'eau', label: 'Gérer l\'eau', hint: 'Infiltration, rétention' },
  { id: 'paysage', label: 'Ouvrir le paysage', hint: 'Perspectives, points de vue' },
  { id: 'usage', label: 'Renouveler les usages', hint: 'Accueil, pédagogie, événements' },
  { id: 'productif', label: 'Rendre productif', hint: 'Verger, potager, forêt-jardin' },
];

const STORAGE_KEY = 'propriete-ds-identify';

export const TabIdentify: React.FC<{ proprieteId?: string }> = ({ proprieteId }) => {
  const key = `${STORAGE_KEY}:${proprieteId ?? 'default'}`;
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) ?? '[]');
    } catch {
      return [];
    }
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-primary">
          <Compass className="w-3.5 h-3.5" /> Étape 3 · J'identifie
        </div>
        <h2 className="text-xl font-semibold mt-1">Les enjeux vivants du lieu</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sélectionnez les priorités qui vous parlent. Elles alimentent la synthèse.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-3">
        {ENJEUX.map((e) => {
          const on = selected.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => toggle(e.id)}
              className={`text-left rounded-xl border p-4 transition-all ${
                on
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border/60 bg-card/40 hover:bg-card'
              }`}
            >
              <div className="text-sm font-semibold">{e.label}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{e.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
