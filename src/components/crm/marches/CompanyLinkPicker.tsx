import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLinkCompanyEvent, RELATION_TYPES } from '@/hooks/useCrmCompanyEvents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  eventId: string | null;
  open: boolean;
  onClose: () => void;
  excludeCompanyIds: string[];
}

export const CompanyLinkPicker: React.FC<Props> = ({ eventId, open, onClose, excludeCompanyIds }) => {
  const [q, setQ] = React.useState('');
  const [relationType, setRelationType] = React.useState('participant');
  const link = useLinkCompanyEvent();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['crm-companies-search-for-link', q],
    queryFn: async () => {
      let query = supabase
        .from('crm_companies')
        .select('id, nom_complet, denomination, lifecycle_stage, ville')
        .limit(30);
      if (q.trim()) {
        query = query.ilike('nom_complet', `%${q}%`);
      } else {
        query = query.order('updated_at', { ascending: false });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const filtered = companies.filter((c) => !excludeCompanyIds.includes(c.id));

  const handleLink = (companyId: string) => {
    if (!eventId) return;
    link.mutate(
      { company_id: companyId, event_id: eventId, relation_type: relationType },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))] max-w-lg p-0"
      >
        <div data-crm-shell>
          <DialogHeader className="p-5 border-b border-[hsl(var(--crm-border))]">
            <DialogTitle className="text-[hsl(var(--crm-text))]">Lier une entreprise</DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Rechercher une entreprise…"
                  className="pl-9 bg-[hsl(var(--crm-bg))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"
                  autoFocus
                />
              </div>
              <Select value={relationType} onValueChange={setRelationType}>
                <SelectTrigger className="w-[140px] bg-[hsl(var(--crm-bg))] border-[hsl(var(--crm-border))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_TYPES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-1 -mx-1 px-1">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin crm-muted" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-sm crm-muted">
                  {q ? 'Aucun résultat' : 'Aucune entreprise disponible'}
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleLink(c.id)}
                    disabled={link.isPending}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--crm-surface-2))] text-left transition-colors disabled:opacity-50"
                  >
                    <div className="h-8 w-8 rounded-md bg-[hsl(var(--crm-accent-soft))] flex items-center justify-center text-[10px] font-semibold text-[hsl(var(--crm-accent))] shrink-0">
                      {(c.denomination || c.nom_complet || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[hsl(var(--crm-text))] truncate">
                        {c.nom_complet}
                      </div>
                      <div className="text-xs crm-muted flex items-center gap-2">
                        <span className="uppercase">{c.lifecycle_stage}</span>
                        {c.ville && <span>· {c.ville}</span>}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 crm-muted" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
