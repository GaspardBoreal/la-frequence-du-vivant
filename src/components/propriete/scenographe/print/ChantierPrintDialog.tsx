import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Printer, Images, Sprout, Map as MapIcon } from 'lucide-react';
import type { ChantierPrintOptions } from './ChantierPrintLayout';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: ChantierPrintOptions) => void;
  inPlaceCount: number;
  photoCount: number;
  plantCount: number;
}

const Toggle: React.FC<{
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}> = ({ icon, label, hint, checked, disabled, onChange }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition disabled:opacity-40 ${
      checked
        ? 'border-[#c8a24a]/70 bg-[#c8a24a]/12'
        : 'border-[hsl(var(--ds-line))] bg-transparent hover:bg-[hsl(var(--ds-forest-deep))]/5'
    }`}
  >
    <span className="mt-[2px] text-[hsl(var(--ds-gold))]">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-[12.5px] font-semibold">{label}</span>
      <span className="block text-[11px] opacity-65">{hint}</span>
    </span>
    <span
      aria-hidden
      className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${
        checked ? 'border-[#c8a24a] bg-[#c8a24a]' : 'border-current opacity-40'
      }`}
    />
  </button>
);

/** Réglages du « Dossier de chantier » avant l'ouverture de l'aperçu papier. */
export const ChantierPrintDialog: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  inPlaceCount,
  photoCount,
  plantCount,
}) => {
  const [year, setYear] = React.useState(3);
  const [withInPlace, setWithInPlace] = React.useState(true);
  const [withPhotos, setWithPhotos] = React.useState(true);
  const [withNeighbours, setWithNeighbours] = React.useState(true);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="z-[4200] max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-[22px] italic">Dossier de chantier</DialogTitle>
          <DialogDescription>
            Un cahier A4 à poser sur la table d'un paysagiste : plan coté, liste de plantation à
            chiffrer, espèces en place, apports retenus et photos d'avant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5">
          <div className="rounded-xl border border-[hsl(var(--ds-line))] px-3 py-2.5">
            <p className="mb-2 text-[11px] uppercase tracking-[0.16em] opacity-60">
              Horizon du plan
            </p>
            <div className="flex gap-1.5">
              {[0, 3, 10].map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition ${
                    year === y
                      ? 'border-[#c8a24a] bg-[#c8a24a]/15 text-[hsl(var(--ds-gold))]'
                      : 'border-[hsl(var(--ds-line))] opacity-70 hover:opacity-100'
                  }`}
                >
                  An {y}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] opacity-60">
              Taille des houppiers dessinés sur le plan ({plantCount} sujet
              {plantCount > 1 ? 's' : ''} posé{plantCount > 1 ? 's' : ''}).
            </p>
          </div>

          <Toggle
            icon={<Sprout className="h-4 w-4" />}
            label="Les espèces en place"
            hint={`${inPlaceCount} espèce${inPlaceCount > 1 ? 's' : ''} déjà présente${inPlaceCount > 1 ? 's' : ''} dans le périmètre retenu`}
            checked={withInPlace}
            disabled={inPlaceCount === 0}
            onChange={setWithInPlace}
          />
          <Toggle
            icon={<Images className="h-4 w-4" />}
            label="Les photos avant aménagement"
            hint={
              photoCount > 0
                ? `${photoCount} photographie${photoCount > 1 ? 's' : ''} du carnet de l'ouvrage`
                : 'Aucune photo au carnet de cet ouvrage'
            }
            checked={withPhotos}
            disabled={photoCount === 0}
            onChange={setWithPhotos}
          />
          <Toggle
            icon={<MapIcon className="h-4 w-4" />}
            label="Les ouvrages voisins"
            hint="Tracés en pointillé pour situer le chantier"
            checked={withNeighbours}
            onChange={setWithNeighbours}
          />
        </div>

        <button
          type="button"
          onClick={() =>
            onConfirm({
              year,
              withInPlace: withInPlace && inPlaceCount > 0,
              withPhotos: withPhotos && photoCount > 0,
              withNeighbours,
            })
          }
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-[hsl(var(--ds-forest-deep))] px-4 py-2.5 text-[13px] font-semibold text-[#f0e3c2] transition hover:opacity-90"
        >
          <Printer className="h-4 w-4" />
          Préparer le dossier
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ChantierPrintDialog;
