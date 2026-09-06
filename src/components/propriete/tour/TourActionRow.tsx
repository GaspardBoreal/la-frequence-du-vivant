import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2, Check, X, Eye, Sprout, ShieldCheck, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GardenSchema, SCHEMA_KEYS, SCHEMA_LABELS, type SchemaKey } from './GardenSchema';
import { TOUR_VOLETS, type TourAction, type TourVolet } from '@/hooks/propriete/useProprieteTours';
import { linkifyTourText } from './refs/linkifyTourText';
import { useTourRefIndex } from './refs/useTourRefIndex';
import type { TourRef } from './refs/types';

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
  const [draft, setDraft] = React.useState({
    titre: action.titre,
    detail: action.detail ?? '',
    volet: action.volet,
    moment: action.moment ?? '',
    schema_key: action.schema_key ?? '',
    difficulte: action.difficulte,
  });

  React.useEffect(() => {
    setDraft({
      titre: action.titre,
      detail: action.detail ?? '',
      volet: action.volet,
      moment: action.moment ?? '',
      schema_key: action.schema_key ?? '',
      difficulte: action.difficulte,
    });
  }, [action]);

  const save = async () => {
    await onUpdate(action.id, {
      titre: draft.titre.trim() || action.titre,
      detail: draft.detail.trim() || null,
      volet: draft.volet,
      moment: draft.moment.trim() || null,
      schema_key: draft.schema_key || null,
      difficulte: draft.difficulte,
    });
    setEditing(false);
  };

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-lg border border-border bg-card p-3 ${isDragging ? 'opacity-70 shadow-lg' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        {!readOnly && (
          <button
            type="button"
            className="mt-1 cursor-grab text-muted-foreground hover:text-foreground touch-none"
            aria-label="Réordonner l'action"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <Checkbox
          checked={action.done}
          disabled={readOnly}
          aria-label="Action réalisée"
          className="mt-1"
          onCheckedChange={(v) =>
            onUpdate(action.id, { done: !!v, done_at: v ? new Date().toISOString() : null })
          }
        />

        {!readOnly && (
          <button
            type="button"
            aria-pressed={!!action.retenue}
            aria-label={action.retenue ? 'Retirer du carnet de terrain' : 'Emporter dans le carnet de terrain'}
            title={action.retenue ? 'Retirée du carnet' : 'À emporter sur le terrain'}
            onClick={() => onUpdate(action.id, { retenue: !action.retenue })}
            className={`-mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              action.retenue ? 'text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground'
            }`}
          >
            <Star className={`h-4 w-4 ${action.retenue ? 'fill-current' : ''}`} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={draft.titre}
                onChange={(e) => setDraft((d) => ({ ...d, titre: e.target.value }))}
                placeholder="Titre de l'action"
              />
              <Textarea
                value={draft.detail}
                onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))}
                placeholder="Comment faire, et pourquoi"
                rows={3}
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <Select
                  value={draft.volet}
                  onValueChange={(v) => setDraft((d) => ({ ...d, volet: v as TourVolet }))}
                >
                  <SelectTrigger><SelectValue placeholder="Intention" /></SelectTrigger>
                  <SelectContent className="bg-popover z-[100]">
                    {TOUR_VOLETS.map((v) => (
                      <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={draft.moment}
                  onChange={(e) => setDraft((d) => ({ ...d, moment: e.target.value }))}
                  placeholder="Moment (ex. matin frais)"
                />
                <Select
                  value={draft.schema_key || 'none'}
                  onValueChange={(v) => setDraft((d) => ({ ...d, schema_key: v === 'none' ? '' : v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Schéma" /></SelectTrigger>
                  <SelectContent className="bg-popover z-[100]">
                    <SelectItem value="none">Aucun schéma</SelectItem>
                    {SCHEMA_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{SCHEMA_LABELS[k as SchemaKey]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}><Check className="h-3.5 w-3.5 mr-1" />Enregistrer</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  <X className="h-3.5 w-3.5 mr-1" />Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-sm font-medium ${action.done ? 'line-through text-muted-foreground' : ''}`}>
                  {linkifyTourText(action.titre, refIndex, explicitRefs)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {VOLET_ICON[action.volet]}
                  {VOLET_LABEL[action.volet]}
                </span>
                {action.moment && (
                  <span className="text-[10px] text-muted-foreground">· {action.moment}</span>
                )}
              </div>
              {action.detail && (
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{linkifyTourText(action.detail, refIndex, explicitRefs)}</p>
              )}
              <GardenSchema schemaKey={action.schema_key} className="mt-2" />
              {action.done && !readOnly && (
                <label className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  Fait le
                  <input
                    type="date"
                    value={action.done_at ? action.done_at.slice(0, 10) : ''}
                    onChange={(e) =>
                      onUpdate(action.id, {
                        done_at: e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null,
                      })
                    }
                    className="h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
              )}
            </>
          )}
        </div>

        {!readOnly && !editing && (
          <div className="flex shrink-0 gap-1">
            <Button size="icon" variant="ghost" aria-label="Modifier" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Supprimer" onClick={() => onRemove(action.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </li>
  );
};

export default TourActionRow;
