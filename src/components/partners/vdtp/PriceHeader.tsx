import React from 'react';
import { motion } from 'framer-motion';
import { PRESTATION } from '@/content/vdtp/configurateur';
import { coverage, formatEuro, splitPayment } from '@/lib/vdtp/pricing';

interface Props {
  price: number;
  selected: string[];
  totalOptions: number;
}

const PriceHeader: React.FC<Props> = ({ price, selected, totalOptions }) => {
  const cov = coverage(selected);
  const { upfront, conditional } = splitPayment(price);

  return (
    <div className="rounded-3xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] p-5 shadow-sm sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--ds-ink-soft))]">
        Valorisation du socle repris
      </p>

      <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
        <motion.span
          key={price}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-serif text-5xl leading-none text-[hsl(var(--ds-forest-deep))] sm:text-6xl"
        >
          {formatEuro(price)}
        </motion.span>
        <span className="pb-1 text-sm text-[hsl(var(--ds-ink-soft))]">
          {selected.length} / {totalOptions} briques retenues
        </span>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--ds-forest))]/10">
        <motion.div
          className="h-full rounded-full bg-[hsl(var(--ds-forest))]"
          animate={{ width: `${Math.round(cov * 100)}%` }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        />
      </div>
      <p className="mt-2 text-xs text-[hsl(var(--ds-ink-soft))]">
        {Math.round(cov * 100)} % de la valeur du catalogue · règle affichée :{' '}
        <span className="font-medium text-[hsl(var(--ds-forest-deep))]">
          15 000 € + 35 000 € × part retenue
        </span>{' '}
        (0 € si rien n'est retenu)
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ds-ink-soft))]">
            À la commande (2/3)
          </p>
          <p className="mt-1 text-lg font-semibold text-[hsl(var(--ds-forest-deep))]">
            {formatEuro(upfront)}
          </p>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-3">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ds-ink-soft))]">
            Si le projet réussit (1/3)
          </p>
          <p className="mt-1 text-lg font-semibold text-[hsl(var(--ds-forest-deep))]">
            {formatEuro(conditional)}
          </p>
        </div>
        <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] bg-transparent p-3">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ds-ink-soft))]">
            Prestation, à part
          </p>
          <p className="mt-1 text-lg font-semibold text-[hsl(var(--ds-forest-deep))]">
            {PRESTATION.days} j · {formatEuro(PRESTATION.amount)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceHeader;
