import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Handshake, ExternalLink } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}

const SolVivantOptInDialog: React.FC<Props> = ({ open, onOpenChange, onConfirm }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Handshake className="h-6 w-6 text-primary" />
        </div>
        <DialogTitle className="text-center">Afficher les partenaires Sol Vivant ?</DialogTitle>
        <DialogDescription className="text-center pt-2">
          <a href="https://cartesolvivant.gogocarto.fr" target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1 text-primary hover:underline">
            Carte Sol Vivant <ExternalLink className="h-3 w-3" />
          </a>
          {' '}recense plus de 900 acteurs français du Maraîchage Sol Vivant (MSV) : maraîchers,
          éleveurs, arboriculteurs, jardiniers pédagogiques, terrains disponibles…
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-lg bg-muted/40 p-4 text-sm space-y-2">
        <p><strong>En activant cette option</strong>, vous verrez leurs points superposés à nos marches — un moyen de tisser des liens entre praticiens du sol vivant et communautés de marcheurs.</p>
        <p className="text-muted-foreground">Les données sont issues d'une synchronisation quotidienne de leur API publique (licence ODbL).</p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Plus tard</Button>
        <Button onClick={() => { onConfirm(); onOpenChange(false); }}>Activer le calque</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default SolVivantOptInDialog;
