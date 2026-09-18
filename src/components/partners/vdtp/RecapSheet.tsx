import React from 'react';
import { Printer, Link2, Check } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { CONFIG_GRIDS, OPTION_BY_ID, PRESTATION } from '@/content/vdtp/configurateur';
import { formatEuro, splitPayment } from '@/lib/vdtp/pricing';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: string[];
  price: number;
  onCopyLink: () => void;
  copied: boolean;
}

const RecapSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  selected,
  price,
  onCopyLink,
  copied,
}) => {
  const set = new Set(selected);
  const { upfront, conditional } = splitPayment(price);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88dvh] overflow-y-auto rounded-t-3xl border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] pb-[max(1rem,env(safe-area-inset-bottom))]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-serif text-2xl text-[hsl(var(--ds-forest-deep))]">
            Récapitulatif de la sélection
          </SheetTitle>
          <SheetDescription className="text-[hsl(var(--ds-ink-soft))]">
            Jardin nourricier · Ver de Terre Production × bziiit · PiloTerra
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-4">
            <p className="font-serif text-3xl text-[hsl(var(--ds-forest-deep))]">
              {formatEuro(price)}
            </p>
            <p className="mt-1 text-sm text-[hsl(var(--ds-ink-soft))]">
              dont {formatEuro(upfront)} à la commande et {formatEuro(conditional)} dus seulement
              si le projet réussit. Prestation de développement en sus : {PRESTATION.days} j ·{' '}
              {formatEuro(PRESTATION.amount)}.
            </p>
          </div>

          {CONFIG_GRIDS.map((grid) => {
            const rows = grid.optionIds.filter((id) => set.has(id));
            if (rows.length === 0) return null;
            return (
              <div key={grid.id}>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[hsl(var(--ds-ink-soft))]">
                  {grid.number} · {grid.label}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {rows.map((id) => {
                    const o = OPTION_BY_ID.get(id)!;
                    return (
                      <li
                        key={id}
                        className="flex items-start gap-2 text-sm text-[hsl(var(--ds-forest-deep))]"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--ds-forest))]" />
                        <span>{o.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {selected.length === 0 && (
            <p className="text-sm text-[hsl(var(--ds-ink-soft))]">
              Aucune brique retenue pour le moment : le montant reste à 0 €.
            </p>
          )}

          <div className="rounded-2xl border border-dashed border-[hsl(var(--ds-line))] p-4 text-sm text-[hsl(var(--ds-ink-soft))]">
            Les briques non retenues restent la propriété de bziiit et continuent d'être exploitées
            sur les verticales B2B (paysagistes, comités d'entreprise & PME, collectivités,
            distribution jardin), sans concurrencer l'offre B2C de VDTP.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.print()} className="flex-1 min-w-[160px]">
              <Printer className="mr-1.5 h-4 w-4" /> Imprimer / PDF
            </Button>
            <Button variant="outline" onClick={onCopyLink} className="flex-1 min-w-[160px]">
              <Link2 className="mr-1.5 h-4 w-4" /> {copied ? 'Lien copié' : 'Copier le lien'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RecapSheet;
