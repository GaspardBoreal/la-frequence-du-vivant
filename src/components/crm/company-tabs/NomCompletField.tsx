import React from 'react';
import { Pencil, Check, X, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Props {
  value: string | null;
  onSave: (v: string | null) => void;
  saving?: boolean;
}

export const NomCompletField: React.FC<Props> = ({ value, onSave, saving }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');

  React.useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim().slice(0, 255);
    onSave(trimmed ? trimmed : null);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value ?? '');
    setEditing(false);
  };

  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-baseline py-2 border-b border-border/40 text-sm">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5" /> Nom complet
      </span>
      <div className="font-medium break-words">
        {editing ? (
          <div className="flex gap-1.5 items-center">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nom commercial ou usuel"
              maxLength={255}
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { cancel(); }
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={commit} disabled={saving}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : value ? (
          <div className="flex items-center gap-2 group">
            <span className="truncate" title={value}>{value}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
              aria-label="Éditer le nom complet"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
          >
            <Pencil className="h-3 w-3" /> Ajouter un nom complet
          </button>
        )}
      </div>
    </div>
  );
};
