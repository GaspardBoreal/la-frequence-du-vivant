import React from 'react';
import { CONFIG_GRIDS, OPTION_BY_ID, PRESTATION } from '@/content/vdtp/configurateur';
import { formatEuro, splitPayment } from '@/lib/vdtp/pricing';

interface Props {
  selected: string[];
  price: number;
}

/** Mise en page A4, visible uniquement à l'impression. */
const ConfigPrintLayout: React.FC<Props> = ({ selected, price }) => {
  const set = new Set(selected);
  const { upfront, conditional } = splitPayment(price);

  return (
    <div className="hidden print:block print:text-black">
      <h1 className="text-2xl font-bold">
        Jardin nourricier — périmètre retenu et valorisation du socle
      </h1>
      <p className="mt-1 text-sm">
        Ver de Terre Production × bziiit · PiloTerra — document de travail, sélection du{' '}
        {new Date().toLocaleDateString('fr-FR')}
      </p>

      <p className="mt-4 text-xl font-bold">{formatEuro(price)}</p>
      <p className="text-sm">
        {formatEuro(upfront)} à la commande · {formatEuro(conditional)} dus uniquement si le projet
        réussit. Prestation de développement en sus : {PRESTATION.days} jours ·{' '}
        {formatEuro(PRESTATION.amount)}.
      </p>
      <p className="mt-1 text-xs">
        Règle de calcul : 0 € si aucune brique n'est retenue ; sinon 15 000 € + 35 000 € × (poids
        des briques retenues / poids total du catalogue). Toutes les briques retenues = 50 000 €.
      </p>

      {CONFIG_GRIDS.map((grid) => {
        const rows = grid.optionIds.filter((id) => set.has(id));
        if (rows.length === 0) return null;
        return (
          <div key={grid.id} className="mt-4 break-inside-avoid">
            <h2 className="text-sm font-bold uppercase tracking-wide">
              {grid.number} · {grid.label}
            </h2>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {rows.map((id) => {
                const o = OPTION_BY_ID.get(id)!;
                return (
                  <li key={id}>
                    <span className="font-semibold">{o.label}</span> — {o.gain}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <p className="mt-6 text-xs">
        Les briques non retenues restent la propriété de bziiit, exploitées sur les verticales B2B
        nommées au contrat de licence, sans concurrencer l'offre B2C de Ver de Terre Production.
      </p>
    </div>
  );
};

export default ConfigPrintLayout;
