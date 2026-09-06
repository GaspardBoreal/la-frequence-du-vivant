import React from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { closeTourRef } from './tourRefStore';
import { normRef, type TourRef } from './types';
import type { TourRefIndex } from './useTourRefIndex';

const RefObjetPanel: React.FC<{ refItem: TourRef; index: TourRefIndex }> = ({ refItem, index }) => {
  const objet =
    index.objets.find((o) => o.id === refItem.id) ||
    index.objets.find((o) => normRef(o.nom || '') === normRef(refItem.label));

  if (!objet) return <p className="text-sm text-muted-foreground">Ouvrage introuvable.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold">{objet.nom || objet.outil_key}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Type</div>
          <div className="font-semibold">{objet.outil_key}</div>
        </div>
        {objet.meta?.quantite != null && (
          <div className="rounded-lg border border-border bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Quantité</div>
            <div className="font-semibold">{objet.meta.quantite}</div>
          </div>
        )}
      </div>
      {objet.meta?.note && (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{objet.meta.note}</p>
      )}
      <Button
        variant="outline"
        className="min-h-[40px] w-full"
        onClick={() => {
          closeTourRef();
          window.dispatchEvent(new CustomEvent('propriete:goto-tab', { detail: 'identify' }));
        }}
      >
        Ouvrir la fiche complète
      </Button>
    </div>
  );
};

export default RefObjetPanel;
