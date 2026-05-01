import React, { useState } from 'react';
import { Pin, PinOff, Loader2 } from 'lucide-react';
import {
  useUpsertCuration,
  useDeleteCuration,
  type ExplorationCuration,
  type CurationSense,
  type CurationEntityType,
} from '@/hooks/useExplorationCurations';

interface Props {
  explorationId: string;
  sense: CurationSense;
  entityType: CurationEntityType;
  entityId: string;
  existing?: ExplorationCuration;
  category?: string | null;
  size?: 'sm' | 'md';
}

/** Small inline button to pin/unpin an item. Visible only when curator. */
const PinToggle: React.FC<Props> = ({
  explorationId,
  sense,
  entityType,
  entityId,
  existing,
  category,
  size = 'sm',
}) => {
  const upsert = useUpsertCuration();
  const del = useDeleteCuration();
  const [busy, setBusy] = useState(false);

  const isPinned = !!existing;
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setBusy(true);
    try {
      if (isPinned && existing) {
        await del.mutateAsync({ id: existing.id, exploration_id: explorationId });
      } else {
        await upsert.mutateAsync({
          exploration_id: explorationId,
          sense,
          entity_type: entityType,
          entity_id: entityId,
          category: category ?? null,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={busy}
      title={isPinned ? 'Retirer de la sélection' : 'Épingler à la sélection'}
      className={`${dim} rounded-full flex items-center justify-center transition shrink-0 ${
        isPinned
          ? 'bg-amber-500 text-white hover:bg-amber-600'
          : 'bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-amber-500 hover:border-amber-500'
      } ${busy ? 'opacity-60 cursor-wait' : ''}`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isPinned ? (
        <Pin className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Pin className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

export default PinToggle;
