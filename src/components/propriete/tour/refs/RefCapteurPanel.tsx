import React from 'react';
import { Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { closeTourRef } from './tourRefStore';
import { normRef, type TourRef } from './types';
import type { TourRefIndex } from './useTourRefIndex';

const ETAT_LABEL: Record<string, string> = {
  service: 'En service',
  maintenance: 'En maintenance',
  retire: 'Retirée du terrain',
};

const RefCapteurPanel: React.FC<{ refItem: TourRef; index: TourRefIndex }> = ({ refItem, index }) => {
  const capteur =
    index.capteurs.find((c) => c.id === refItem.id) ||
    index.capteurs.find((c) => normRef(c.nom) === normRef(refItem.label));

  if (!capteur) return <p className="text-sm text-muted-foreground">Sonde introuvable.</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Radio className="h-4 w-4 text-primary" />
        <span className="text-base font-semibold">{capteur.nom}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">État</div>
          <div className="font-semibold">{ETAT_LABEL[capteur.etat || 'service'] ?? 'En service'}</div>
        </div>
        <div className="rounded-lg border border-border bg-muted/40 p-2.5">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Dernier signe</div>
          <div className="font-semibold">
            {capteur.last_seen_at
              ? new Date(capteur.last_seen_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
              : '—'}
          </div>
        </div>
        {capteur.battery_pct != null && (
          <div className="rounded-lg border border-border bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Batterie</div>
            <div className="font-semibold">{Math.round(capteur.battery_pct)} %</div>
          </div>
        )}
        {capteur.emplacement && (
          <div className="rounded-lg border border-border bg-muted/40 p-2.5">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Emplacement</div>
            <div className="font-semibold">{capteur.emplacement}</div>
          </div>
        )}
      </div>
      <Button
        variant="outline"
        className="min-h-[40px] w-full"
        onClick={() => {
          closeTourRef();
          window.dispatchEvent(new CustomEvent('propriete:goto-tab', { detail: 'capteurs' }));
        }}
      >
        Ouvrir la fiche complète
      </Button>
    </div>
  );
};

export default RefCapteurPanel;
