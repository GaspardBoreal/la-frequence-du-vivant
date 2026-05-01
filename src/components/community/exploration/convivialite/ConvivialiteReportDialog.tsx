import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (raison: string) => void;
}

const ConvivialiteReportDialog: React.FC<Props> = ({ open, onOpenChange, onConfirm }) => {
  const [raison, setRaison] = useState('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler cette photo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Décrivez en quelques mots la raison de ce signalement. Un modérateur examinera la photo rapidement.
        </p>
        <Textarea
          value={raison}
          onChange={(e) => setRaison(e.target.value.slice(0, 200))}
          placeholder="Personne ne souhaite apparaître, contenu inapproprié, etc."
          rows={4}
        />
        <div className="text-[11px] text-muted-foreground text-right">{raison.length}/200</div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button
            onClick={() => { onConfirm(raison.trim()); setRaison(''); }}
            disabled={raison.trim().length < 3}
          >
            Envoyer le signalement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvivialiteReportDialog;
