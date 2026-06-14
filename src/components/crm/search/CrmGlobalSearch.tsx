import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, User, Target, Footprints, Search, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';

type ResultKind = 'company' | 'contact' | 'opportunity' | 'marche';

interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle?: string | null;
  route: string;
}

const KIND_META: Record<ResultKind, { label: string; Icon: React.ComponentType<any>; color: string }> = {
  company:     { label: 'Entreprises',   Icon: Building2,  color: 'text-sky-500' },
  contact:     { label: 'Contacts',      Icon: User,       color: 'text-violet-500' },
  opportunity: { label: 'Opportunités',  Icon: Target,     color: 'text-amber-500' },
  marche:      { label: 'Marches',       Icon: Footprints, color: 'text-emerald-500' },
};

function escapeIlike(s: string) {
  return s.replace(/[%,_]/g, ' ').trim();
}

async function runSearch(raw: string): Promise<SearchResult[]> {
  const q = escapeIlike(raw);
  if (q.length < 2) return [];
  const like = `%${q}%`;

  const [companiesRes, contactsRes, oppsRes, marchesRes] = await Promise.all([
    supabase
      .from('crm_companies')
      .select('id, denomination, nom_complet, siren, ville, code_postal')
      .or(`denomination.ilike.${like},nom_complet.ilike.${like},siren.ilike.${like},ville.ilike.${like}`)
      .limit(8),
    supabase
      .from('crm_contacts')
      .select('id, prenom, nom, email, entreprise, fonction, company_id')
      .or(`nom.ilike.${like},prenom.ilike.${like},email.ilike.${like},entreprise.ilike.${like}`)
      .limit(8),
    supabase
      .from('crm_opportunities')
      .select('id, entreprise, prenom, nom, format_souhaite, statut')
      .or(`entreprise.ilike.${like},nom.ilike.${like},prenom.ilike.${like},format_souhaite.ilike.${like}`)
      .limit(8),
    supabase
      .from('marche_events')
      .select('id, title, lieu, date_marche')
      .or(`title.ilike.${like},lieu.ilike.${like}`)
      .limit(8),
  ]);

  const out: SearchResult[] = [];

  (companiesRes.data ?? []).forEach((c: any) => {
    const title = c.denomination || c.nom_complet || c.siren || 'Entreprise';
    const locParts = [c.code_postal, c.ville].filter(Boolean).join(' ');
    out.push({
      kind: 'company',
      id: c.id,
      title,
      subtitle: [c.siren, locParts].filter(Boolean).join(' · ') || null,
      route: `/admin/crm/annuaire?company=${c.id}`,
    });
  });

  (contactsRes.data ?? []).forEach((c: any) => {
    const name = [c.prenom, c.nom].filter(Boolean).join(' ').trim() || c.email || 'Contact';
    const route = c.company_id
      ? `/admin/crm/annuaire?company=${c.company_id}&companyTab=dirigeants`
      : `/admin/crm/annuaire?tab=contacts&contact=${c.id}`;
    out.push({
      kind: 'contact',
      id: c.id,
      title: name,
      subtitle: [c.fonction, c.entreprise].filter(Boolean).join(' — ') || c.email || null,
      route,
    });
  });

  (oppsRes.data ?? []).forEach((o: any) => {
    const who = [o.prenom, o.nom].filter(Boolean).join(' ').trim();
    const title = o.entreprise || who || 'Opportunité';
    const sub = [who && o.entreprise ? who : null, o.format_souhaite, o.statut]
      .filter(Boolean)
      .join(' · ');
    out.push({
      kind: 'opportunity',
      id: o.id,
      title,
      subtitle: sub || null,
      route: `/admin/crm/pipeline?opportunity=${o.id}`,
    });
  });

  (marchesRes.data ?? []).forEach((m: any) => {
    const date = m.date_marche ? new Date(m.date_marche).toLocaleDateString('fr-FR') : null;
    out.push({
      kind: 'marche',
      id: m.id,
      title: m.title || 'Marche',
      subtitle: [m.lieu, date].filter(Boolean).join(' · ') || null,
      route: `/admin/crm/marches?marche=${m.id}`,
    });
  });

  return out;
}

interface Props {
  /** Controlled mode — when omitted, component owns its own open state and renders its own trigger. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Render the default trigger button (default: true). Pass false when using as controlled dialog only. */
  withTrigger?: boolean;
}

export const CrmGlobalSearch: React.FC<Props> = ({ open: controlledOpen, onOpenChange, withTrigger = true }) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    if (controlledOpen === undefined) setInternalOpen(v);
  };

  const [query, setQuery] = React.useState('');
  const debounced = useDebounce(query.trim(), 220);
  const navigate = useNavigate();

  // ⌘K / Ctrl+K
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['crm-global-search', debounced],
    queryFn: () => runSearch(debounced),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  });

  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const grouped = React.useMemo(() => {
    const g: Record<ResultKind, SearchResult[]> = { company: [], contact: [], opportunity: [], marche: [] };
    results.forEach(r => g[r.kind].push(r));
    return g;
  }, [results]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    setTimeout(() => navigate(r.route), 0);
  };

  return (
    <>
      {withTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 h-8 rounded-md crm-surface-elevated text-xs crm-muted w-[260px] hover:text-[hsl(var(--crm-text))] transition-colors"
          aria-label="Rechercher dans le CRM"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="truncate">Rechercher entreprise, contact, opportunité…</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--crm-bg))] border border-[hsl(var(--crm-border))]">⌘K</kbd>
        </button>
      )}

      {withTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-md crm-surface-elevated text-[hsl(var(--crm-text-muted))]"
          aria-label="Rechercher"
        >
          <Search className="h-4 w-4" />
        </button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput
          placeholder="Rechercher une entreprise, un contact, une opportunité, une marche…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {debounced.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères pour lancer la recherche.
            </div>
          )}
          {debounced.length >= 2 && isFetching && (
            <div className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Recherche…
            </div>
          )}
          {debounced.length >= 2 && !isFetching && results.length === 0 && (
            <CommandEmpty>Aucun résultat pour « {debounced} »</CommandEmpty>
          )}

          {(['company', 'contact', 'opportunity', 'marche'] as ResultKind[]).map((kind, idx) => {
            const items = grouped[kind];
            if (!items.length) return null;
            const meta = KIND_META[kind];
            const Icon = meta.Icon;
            return (
              <React.Fragment key={kind}>
                {idx > 0 && <CommandSeparator />}
                <CommandGroup heading={meta.label}>

                  {items.map(r => (
                    <CommandItem
                      key={`${r.kind}-${r.id}`}
                      value={`${r.kind}-${r.id}`}
                      onSelect={() => handleSelect(r)}
                      className="gap-3 cursor-pointer rounded-md transition-colors hover:bg-[hsl(var(--crm-surface-2))] data-[selected=true]:bg-[hsl(var(--crm-surface-2))] data-[selected=true]:text-[hsl(var(--crm-text))]"
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-medium text-[hsl(var(--crm-text))]">{r.title}</span>
                        {r.subtitle && (
                          <span className="truncate text-xs text-[hsl(var(--crm-text-muted))]/90">{r.subtitle}</span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </React.Fragment>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
};

export default CrmGlobalSearch;
