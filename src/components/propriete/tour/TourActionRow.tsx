import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, Clock3, Eye, GripVertical, MoreHorizontal, Pencil, Sprout, ShieldCheck, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { GardenSchema } from './GardenSchema';
import { type TourAction, type TourVolet } from '@/hooks/propriete/useProprieteTours';
import { linkifyTourText } from './refs/linkifyTourText';
import { useTourRefIndex } from './refs/useTourRefIndex';
import type { TourRef } from './refs/types';
import TourActionEditorSheet from './TourActionEditorSheet';
import { cn } from '@/lib/utils';

const VOLET_ICON: Record<TourVolet, React.ReactNode> = {
  observer: <Eye className="h-3.5 w-3.5" />,
  biodiversite: <Sprout className="h-3.5 w-3.5" />,
  resilience: <ShieldCheck className="h-3.5 w-3.5" />,
};

const VOLET_LABEL: Record<TourVolet, string> = {
  observer: 'Observer',
  biodiversite: 'Biodiversité',
  resilience: 'Résilience',
};

interface Props {
  action: TourAction;
  readOnly?: boolean;
  onUpdate: (id: string, patch: Partial<TourAction>) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
}

export const TourActionRow: React.FC<Props> = ({ action, readOnly, onUpdate, onRemove }) => {
  const refIndex = useTourRefIndex();
  const explicitRefs = (action.refs ?? []) as TourRef[];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: action.id,
  });
  const [editing, setEditing] = React.useState(false);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative overflow-hidden rounded-lg border bg-card transition-shadow',
        action.retenue ? 'border-primary/45 shadow-sm' : 'border-border',
        isDragging && 'z-10 opacity-70 shadow-lg',
      )}
    >
      <div className="flex min-h-12 items-center gap-1 border-b border-border/70 px-2 py-1.5">
        {!readOnly && (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Réordonner l'action"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {VOLET_ICON[action.volet]}
          {VOLET_LABEL[action.volet]}
        </span>
        <span className="flex-1" />

        {!readOnly && (
          <button
            type="button"
            aria-pressed={!!action.retenue}
            aria-label={action.retenue ? 'Retirer du carnet de terrain' : 'Emporter dans le carnet de terrain'}
            title={action.retenue ? 'Retirée du carnet' : 'À emporter sur le terrain'}
            onClick={() => onUpdate(action.id, { retenue: !action.retenue })}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              action.retenue ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Star className={`h-5 w-5 ${action.retenue ? 'fill-current' : ''}`} />
          </button>
        )}
        {!readOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Actions sur cette fiche">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="min-h-11 gap-2" onSelect={() => setEditing(true)}>
                <Pencil className="h-4 w-4" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="min-h-11 gap-2 text-destructive focus:text-destructive" onSelect={() => onRemove(action.id)}>
                <Trash2 className="h-4 w-4" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="px-4 py-4">
        <h4 className={cn('text-base font-semibold leading-snug text-foreground', action.done && 'text-muted-foreground line-through')}>
          {linkifyTourText(action.titre, refIndex, explicitRefs)}
        </h4>
        {action.moment && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock3 className="h-3.5 w-3.5 text-primary" />
            {action.moment}
          </p>
        )}
        {action.detail && (
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {linkifyTourText(action.detail, refIndex, explicitRefs)}
          </p>
        )}
        <GardenSchema schemaKey={action.schema_key} className="mt-4 overflow-hidden rounded-lg border border-border/70 bg-muted/25 p-3 [&_svg]:mx-auto" />

        {action.done && !readOnly && (
          <label className="mt-4 flex min-h-11 flex-wrap items-center gap-2 rounded-md bg-muted/35 px-3 text-xs text-muted-foreground">
            Réalisée le
            <input
              type="date"
              value={action.done_at ? action.done_at.slice(0, 10) : ''}
              onChange={(event) => onUpdate(action.id, {
                done_at: event.target.value ? new Date(`${event.target.value}T12:00:00`).toISOString() : null,
              })}
              className="h-9 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        )}
      </div>

      <div className="flex min-h-12 items-center border-t border-border/70 bg-muted/20 px-3 py-1.5">
        <label className={cn('flex min-h-10 cursor-pointer items-center gap-2.5 rounded-md px-1 text-sm font-medium', readOnly && 'cursor-default')}>
          <Checkbox
            checked={action.done}
            disabled={readOnly}
            aria-label="Action réalisée"
            onCheckedChange={(value) => onUpdate(action.id, {
              done: !!value,
              done_at: value ? new Date().toISOString() : null,
            })}
          />
          <span className={action.done ? 'text-primary' : 'text-muted-foreground'}>
            {action.done ? <><Check className="mr-1 inline h-4 w-4" />Réalisée</> : 'À faire'}
          </span>
        </label>
        {action.retenue && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary">
            <Star className="h-3.5 w-3.5 fill-current" /> Carnet
          </span>
        )}
      </div>

      {!readOnly && (
        <TourActionEditorSheet action={action} open={editing} onOpenChange={setEditing} onSave={onUpdate} />
      )}
    </li>
  );
};

export default TourActionRow;
