import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Loader2, Search, Calendar, MapPin, Leaf, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TopSpecies {
  scientific_name: string;
  common_name_fr: string | null;
  observation_count: number;
  last_observation_date: string | null;
  last_photo_url: string | null;
  last_lieu: string | null;
  last_marche_id: string | null;
  last_marcheur_name: string | null;
  iconic_taxon: string | null;
  kingdom: string | null;
}

interface MarcheForSpecies {
  marche_id: string;
  marche_title: string;
  marche_date: string | null;
  marche_lieu: string | null;
  observation_count: number;
  last_photo_url: string | null;
}

export const TopEspecesTab: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [debounced, setDebounced] = React.useState('');
  const [openSpecies, setOpenSpecies] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: top = [], isLoading } = useQuery({
    queryKey: ['crm-top-species', 25],
    queryFn: async (): Promise<TopSpecies[]> => {
      const { data, error } = await supabase.rpc('get_top_species_observed', { p_limit: 25 });
      if (error) throw error;
      return (data || []) as TopSpecies[];
    },
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['crm-species-search', debounced],
    queryFn: async (): Promise<TopSpecies[]> => {
      if (!debounced || debounced.length < 2) return [];
      const { data, error } = await supabase.rpc('get_top_species_observed', { p_limit: 500 });
      if (error) throw error;
      const s = debounced.toLowerCase();
      return ((data || []) as TopSpecies[]).filter(
        (sp) =>
          sp.scientific_name?.toLowerCase().includes(s) ||
          sp.common_name_fr?.toLowerCase().includes(s)
      );
    },
    enabled: !!debounced && debounced.length >= 2,
  });

  const display = debounced && debounced.length >= 2 ? searchResults : top;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 crm-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une espèce (nom latin ou français)…"
            className="pl-9 bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]"
          />
        </div>
        <span className="text-xs crm-muted ml-auto">
          {debounced ? `${display.length} résultat(s)` : `Top ${display.length} espèces observées`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin crm-muted" /></div>
      ) : display.length === 0 ? (
        <div className="text-center py-16 crm-muted text-sm">
          <Leaf className="h-8 w-8 mx-auto mb-2 opacity-40" />
          {debounced ? `Aucune espèce trouvée pour « ${debounced} »` : 'Aucune observation disponible'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {display.map((sp, idx) => (
            <article
              key={sp.scientific_name}
              className="rounded-xl crm-surface overflow-hidden border border-[hsl(var(--crm-border))] hover:border-[hsl(var(--crm-accent))]/50 transition-all"
            >
              <div className="aspect-square bg-[hsl(var(--crm-surface-2))] overflow-hidden relative">
                {sp.last_photo_url ? (
                  <img src={sp.last_photo_url} alt={sp.scientific_name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Leaf className="h-10 w-10 crm-muted opacity-40" /></div>
                )}
                {!debounced && idx < 25 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] bg-[hsl(var(--crm-accent))] text-white font-semibold">
                    #{idx + 1}
                  </span>
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] bg-black/60 text-white">
                  {sp.observation_count} obs.
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div>
                  <h3 className="font-semibold text-sm text-[hsl(var(--crm-text))] line-clamp-1">
                    {sp.common_name_fr || sp.scientific_name}
                  </h3>
                  {sp.common_name_fr && (
                    <p className="text-xs crm-muted italic line-clamp-1">{sp.scientific_name}</p>
                  )}
                </div>
                <div className="space-y-1 text-[11px] crm-muted">
                  {sp.last_observation_date && (
                    <div className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(sp.last_observation_date), 'd MMM yyyy', { locale: fr })}</div>
                  )}
                  {sp.last_lieu && <div className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{sp.last_lieu}</div>}
                  {sp.last_marcheur_name && <div className="inline-flex items-center gap-1"><User className="h-3 w-3" />{sp.last_marcheur_name}</div>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-xs"
                  onClick={() => setOpenSpecies(sp.scientific_name)}
                >
                  Voir toutes les marches
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <SpeciesMarchesDialog
        scientificName={openSpecies}
        onClose={() => setOpenSpecies(null)}
      />
    </div>
  );
};

const SpeciesMarchesDialog: React.FC<{ scientificName: string | null; onClose: () => void }> = ({ scientificName, onClose }) => {
  const { data = [], isLoading } = useQuery({
    queryKey: ['crm-marches-for-species', scientificName],
    queryFn: async (): Promise<MarcheForSpecies[]> => {
      if (!scientificName) return [];
      const { data, error } = await supabase.rpc('get_marches_for_species', { p_query: scientificName });
      if (error) throw error;
      return (data || []) as MarcheForSpecies[];
    },
    enabled: !!scientificName,
  });

  return (
    <Dialog open={!!scientificName} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-[hsl(var(--crm-surface))] border-[hsl(var(--crm-border))] text-[hsl(var(--crm-text))]">
        <DialogHeader>
          <DialogTitle className="italic">{scientificName}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm crm-muted py-4 text-center">Aucune marche associée.</p>
        ) : (
          <ul className="space-y-2">
            {data.map((m) => (
              <li key={m.marche_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--crm-surface-2))]">
                {m.last_photo_url && <img src={m.last_photo_url} alt="" className="w-12 h-12 rounded object-cover" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{m.marche_title}</div>
                  <div className="text-xs crm-muted flex items-center gap-2 flex-wrap">
                    {m.marche_date && <span>{format(new Date(m.marche_date), 'd MMM yyyy', { locale: fr })}</span>}
                    {m.marche_lieu && <span>· {m.marche_lieu}</span>}
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-[hsl(var(--crm-surface-2))]">{m.observation_count} obs.</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TopEspecesTab;
