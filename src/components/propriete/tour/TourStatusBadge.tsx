import React from 'react';
import type { TourStatut } from '@/hooks/propriete/useProprieteTours';

const TONE: Record<TourStatut, string> = {
  recommande: 'bg-primary/12 text-primary border-primary/30',
  planifie: 'bg-accent text-accent-foreground border-border',
  en_cours: 'bg-primary/20 text-primary border-primary/40',
  fait: 'bg-primary text-primary-foreground border-transparent',
  non_retenu: 'bg-muted text-muted-foreground border-border',
};

const LABEL: Record<TourStatut, string> = {
  recommande: 'Recommandé',
  planifie: 'Planifié',
  en_cours: 'En cours',
  fait: 'Fait',
  non_retenu: 'Non retenu',
};

export const TourStatusBadge: React.FC<{ statut: TourStatut; className?: string }> = ({
  statut,
  className = '',
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${TONE[statut] ?? TONE.planifie} ${className}`}
  >
    {LABEL[statut] ?? statut}
  </span>
);

export default TourStatusBadge;
