import React from 'react';
import { ExternalLink, Pencil, Check, X, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';

interface Props {
  value: string | null;
  onSave: (v: string | null) => void;
  saving?: boolean;
}

const normalize = (raw: string) => {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
};

const urlSchema = z.string().trim().url('URL invalide').max(500);

export const WebsiteField: React.FC<Props> = ({ value, onSave, saving }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value ?? '');

  React.useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  const commit = () => {
    if (!draft.trim()) {
      onSave(null);
      setEditing(false);
      return;
    }
    const normalized = normalize(draft);
    const parsed = urlSchema.safeParse(normalized);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? 'URL invalide');
      return;
    }
    onSave(parsed.data);
    setEditing(false);
  };

  const host = React.useMemo(() => {
    if (!value) return null;
    try { return new URL(value).hostname.replace(/^www\./, ''); } catch { return value; }
  }, [value]);

  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-baseline py-2 border-b border-border/40 text-sm">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5" /> Site web
      </span>
      <div className="font-medium break-words">
        {editing ? (
          <div className="flex gap-1.5 items-center">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://exemple.com"
              className="h-8 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); commit(); }
                if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false); }
              }}
            />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={commit} disabled={saving}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => { setDraft(value ?? ''); setEditing(false); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : value ? (
          <div className="flex items-center gap-2 group">
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host ?? '')}&sz=32`}
              alt=""
              className="h-4 w-4 rounded-sm shrink-0"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1 truncate"
              title={value}
            >
              {host}
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setEditing(true)}
              aria-label="Éditer"
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
            <Pencil className="h-3 w-3" /> Ajouter une adresse
          </button>
        )}
      </div>
    </div>
  );
};
