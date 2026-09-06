import React from 'react';
import { NotebookPen, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ProprieteTour, TourAction } from '@/hooks/propriete/useProprieteTours';
import { exportCarnetPdf, type CarnetOptions } from './CarnetTerrainPdf';
import CarnetSendDialog from './CarnetSendDialog';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tour: ProprieteTour;
  actions: TourAction[];
  proprieteId: string;
  proprieteNom: string;
  onEdited?: () => void;
}

export const CarnetTerrainDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  tour,
  actions,
  proprieteId,
  proprieteNom,
  onEdited,
}) => {
  const [options, setOptions] = React.useState<CarnetOptions>({
    format: 'A5',
    includeContexte: true,
    includeNotes: true,
  });
  const [busy, setBusy] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      await exportCarnetPdf({
        tour,
        actions,
        proprieteNom,
        options,
        pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      });
      onEdited?.();
      onOpenChange(false);
      toast.success('Carnet de terrain edité');
    } catch (e) {
      toast.error("Le carnet n'a pas pu être édité");
      console.error('[carnet-terrain]', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-primary" />
            Carnet de terrain
          </DialogTitle>
          <DialogDescription>
            {actions.length} action{actions.length > 1 ? 's' : ''} retenue{actions.length > 1 ? 's' : ''} · à imprimer,
            plier et annoter pendant le tour.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Format</Label>
            <div className="flex gap-2">
              {(['A5', 'A4'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={options.format === f}
                  onClick={() => setOptions((o) => ({ ...o, format: f }))}
                  className={`h-10 flex-1 rounded-md border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    options.format === f
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {f === 'A5' ? 'A5 · poche' : 'A4 · confort'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="carnet-contexte" className="text-sm font-normal">
              Rappeler « ce qui va bien » et « le potentiel »
            </Label>
            <Switch
              id="carnet-contexte"
              checked={options.includeContexte}
              onCheckedChange={(v) => setOptions((o) => ({ ...o, includeContexte: v }))}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="carnet-notes" className="text-sm font-normal">
              Lignes pour écrire au crayon
            </Label>
            <Switch
              id="carnet-notes"
              checked={options.includeNotes}
              onCheckedChange={(v) => setOptions((o) => ({ ...o, includeNotes: v }))}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => setSendOpen(true)}
            disabled={actions.length === 0}
            className="w-full sm:w-auto sm:mr-auto"
          >
            <Mail className="h-4 w-4 mr-1.5" />
            Envoyer par email
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" className="flex-1 sm:flex-none" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button className="flex-1 sm:flex-none" onClick={generate} disabled={busy || actions.length === 0}>
              {busy ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <NotebookPen className="h-4 w-4 mr-1.5" />}
              Éditer le PDF
            </Button>
          </div>
        </DialogFooter>

        <CarnetSendDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          tour={tour}
          actions={actions}
          proprieteId={proprieteId}
          proprieteNom={proprieteNom}
          options={options}
          onSent={() => {
            onEdited?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CarnetTerrainDialog;
