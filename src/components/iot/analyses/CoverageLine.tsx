import React from 'react';
import type { SensorSpan } from '@/hooks/iot/useIotTelemetry';

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Période réellement lue pour une sonde — jamais la fenêtre théorique.
 * Une sonde installée hier ne peut pas prétendre parler de 7 jours.
 */
const CoverageLine: React.FC<{ span?: SensorSpan | null; windowDays: number }> = ({ span, windowDays }) => {
  if (!span) return null;
  if (span.count === 0) {
    return (
      <p className="mt-2 text-[10px] text-muted-foreground">
        Aucun relevé lu sur les {windowDays} derniers jours.
      </p>
    );
  }
  return (
    <p className="mt-2 text-[10px] text-muted-foreground">
      Lecture effective : {span.firstAt ? fmt(span.firstAt) : '—'} → {span.lastAt ? fmt(span.lastAt) : '—'} ·{' '}
      {span.count} relevé{span.count > 1 ? 's' : ''}
      {span.truncated ? ' · lecture plafonnée : les relevés les plus anciens ne sont pas pris en compte' : ''}
    </p>
  );
};

export default CoverageLine;
