import React from 'react';
import { Check, Loader2, Search, Tag, UserX, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAudienceTags, useNewsletterAudience, type AudienceRow } from '@/hooks/admin/useNewsletter';
import { UNIVERS_THEMES, UNIVERS_LIST, type NewsletterUnivers } from '@/lib/newsletter/blocks';

interface Props {
  univers: NewsletterUnivers;
  onUniversChange: (u: NewsletterUnivers) => void;
  mode: 'univers' | 'selection';
  onModeChange: (m: 'univers' | 'selection') => void;
  selected: string[];
  onSelectedChange: (ids: string[]) => void;
}

const UNIVERS_TAGS: Array<{ key: string; label: string }> = [
  { key: 'marches', label: 'Marches' },
  { key: 'jardin', label: 'Jardin' },
  { key: 'vignoble', label: 'Vignoble' },
];

/** Ciblage : univers calculé, étiquettes manuelles et sélection personne par personne. */
export const AudiencePicker: React.FC<Props> = ({
  univers,
  onUniversChange,
  mode,
  onModeChange,
  selected,
  onSelectedChange,
}) => {
  const { data: rows = [], isLoading } = useNewsletterAudience(mode === 'selection' ? 'tous' : univers);
  const { toggle } = useAudienceTags();
  const [q, setQ] = React.useState('');

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      [r.prenom, r.nom, r.email, r.ville].filter(Boolean).join(' ').toLowerCase().includes(needle),
    );
  }, [rows, q]);

  const joignables = rows.filter((r) => !r.unsubscribed);
  const desinscrits = rows.length - joignables.length;
  const destinataires =
    mode === 'selection' ? rows.filter((r) => selected.includes(r.profile_id) && !r.unsubscribed).length : joignables.length;

  const toggleOne = (id: string) =>
    onSelectedChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {UNIVERS_LIST.map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => onUniversChange(u)}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
            style={
              univers === u
                ? { background: UNIVERS_THEMES[u].accent, color: '#fff', borderColor: 'transparent' }
                : undefined
            }
          >
            {UNIVERS_THEMES[u].label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={mode === 'univers' ? 'default' : 'outline'}
          onClick={() => onModeChange('univers')}
        >
          <Users className="mr-1.5 h-4 w-4" /> Tout l'univers
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === 'selection' ? 'default' : 'outline'}
          onClick={() => onModeChange('selection')}
        >
          <Check className="mr-1.5 h-4 w-4" /> Sélection libre
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-3">
        <p className="text-sm">
          <span className="text-2xl font-semibold text-primary">{destinataires}</span>{' '}
          <span className="text-muted-foreground">
            destinataire{destinataires > 1 ? 's' : ''}
            {desinscrits > 0 ? `, dont ${desinscrits} désinscrit${desinscrits > 1 ? 's' : ''} exclu${desinscrits > 1 ? 's' : ''}` : ''}
          </span>
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un marcheur…" className="pl-9" />
      </div>

      {mode === 'selection' && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onSelectedChange(filtered.filter((r) => !r.unsubscribed).map((r) => r.profile_id))}
          >
            Tout cocher ({filtered.filter((r) => !r.unsubscribed).length})
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelectedChange([])}>
            Tout décocher
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-1">
          {filtered.map((r) => (
            <PersonRow
              key={r.profile_id}
              row={r}
              mode={mode}
              checked={selected.includes(r.profile_id)}
              onToggle={() => toggleOne(r.profile_id)}
              onTag={(u, active) => toggle.mutate({ profileId: r.profile_id, univers: u, active })}
            />
          ))}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucun marcheur pour ce filtre.</p>
          )}
        </div>
      )}
    </div>
  );
};

const PersonRow: React.FC<{
  row: AudienceRow;
  mode: 'univers' | 'selection';
  checked: boolean;
  onToggle: () => void;
  onTag: (univers: string, active: boolean) => void;
}> = ({ row, mode, checked, onToggle, onTag }) => (
  <div className="flex items-start gap-3 rounded-lg border bg-card p-2.5">
    {mode === 'selection' && (
      <Checkbox checked={checked} onCheckedChange={onToggle} disabled={row.unsubscribed} className="mt-1" />
    )}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="truncate text-sm font-medium">
          {[row.prenom, row.nom].filter(Boolean).join(' ') || row.email}
        </span>
        {row.unsubscribed && (
          <Badge variant="outline" className="gap-1 text-[10px] text-destructive">
            <UserX className="h-3 w-3" /> désinscrit
          </Badge>
        )}
      </div>
      <p className="truncate text-xs text-muted-foreground">
        {row.email}
        {row.ville ? ` · ${row.ville}` : ''}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {UNIVERS_TAGS.map((t) => {
          const active = row.univers?.includes(t.key);
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTag(t.key, !active)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                active ? 'border-transparent bg-primary/10 text-primary' : 'text-muted-foreground'
              }`}
              title={active ? 'Retirer cette étiquette' : 'Poser cette étiquette'}
            >
              <Tag className="h-2.5 w-2.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export default AudiencePicker;
