import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SensorCardBody, { type SensorCardCapabilities } from '@/components/iot/SensorCardBody';
import type { IotMesure } from '@/hooks/iot/useIot';
import { HEALTH_COLOR, fmtHorodatage, sensorHealth } from '@/lib/iot/grandeurs';

interface Props {
  capteur: any | null;
  latest: IotMesure[];
  pings: string[];
  coverUrl?: string;
  capabilities: SensorCardCapabilities;
  onClose: () => void;
  onObservatory?: (c: any) => void;
  onAskAi?: (c: any) => void;
}

/** Fiche capteur en popup — feuille pleine largeur sur mobile, dialogue centré ensuite. */
export const SensorPeekDialog: React.FC<Props> = ({
  capteur, latest, pings, coverUrl, capabilities, onClose, onObservatory, onAskAi,
}) => {
  if (!capteur) return null;
  const health = sensorHealth(capteur);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto sm:max-w-md">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base">{capteur.nom}</DialogTitle>
          <DialogDescription className="text-[11px]">
            {capteur.serial_number} · {capteur.type?.modele ?? '—'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full px-2 py-0.5 text-white" style={{ background: HEALTH_COLOR[health.status] }}>
            {health.label}
          </span>
          <span className="text-muted-foreground">{fmtHorodatage(capteur.last_seen_at)}</span>
        </div>

        <SensorCardBody
          hideHeader
          capteur={capteur}
          latest={latest}
          pings={pings}
          coverUrl={coverUrl}
          capabilities={capabilities}
          onObservatory={onObservatory}
          onAskAi={onAskAi}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SensorPeekDialog;
