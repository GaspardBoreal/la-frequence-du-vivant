import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Merge, Trash2, AlertCircle, GitMerge, List, Map as MapIcon } from 'lucide-react';
import { useTaxonomyAliasesAdmin, normalizeAliasKey } from '@/hooks/useTaxonomyAliases';
import { toast } from 'sonner';
import { getGenus, isGenusOnly } from '@/utils/taxonomyMerge';
import DuplicatesMapView from '@/components/admin/taxonomy/DuplicatesMapView';

interface SpeciesRow {
  scientific_name: string | null;
  common_name: string | null;
  count: number;
  sources: Set<string>;
  kingdom: string | null;
}

export type KingdomFilter = 'all' | 'faune' | 'plants' | 'fungi' | 'others';

export const kingdomBucket = (k: string | null | undefined): KingdomFilter => {
  const v = (k || '').trim();
  if (v === 'Animalia') return 'faune';
  if (v === 'Plantae') return 'plants';
  if (v === 'Fungi') return 'fungi';
  return 'others';
};

const normalizeSearch = (s: string | null | undefined) =>
  (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();


const AdminTaxonomyCuration: React.FC = () => {
  const [eventId, setEventId] = useState<string | null>(null);
  const [marcheId, setMarcheId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [canonical, setCanonical] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [sortMode, setSortMode] = useState<'count' | 'genus'>('count');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>(() => {
    if (typeof window === 'undefined') return 'list';
    return new URLSearchParams(window.location.search).get('view') === 'map' ? 'map' : 'list';
  });

  React.useEffect(() => {
    const u = new URL(window.location.href);
    if (viewMode === 'map') u.searchParams.set('view', 'map');
    else u.searchParams.delete('view');
    window.history.replaceState({}, '', u.toString());
  }, [viewMode]);

  const { data: marches } = useQuery({
    queryKey: ['admin-marches-simple'],
    queryFn: async () => {
      const { data } = await supabase.from('marches').select('id, nom_marche').order('nom_marche');
      return ((data || []) as any[]).map(m => ({ id: m.id as string, name: m.nom_marche as string }));
    },
  });

  const { data: events } = useQuery({
    queryKey: ['admin-marche-events-simple'],
    queryFn: async () => {
      const { data } = await supabase
        .from('marche_events')
        .select('id, title, date_marche, exploration_id')
        .order('date_marche', { ascending: false });
      return ((data || []) as any[]).map(e => ({
        id: e.id as string,
        title: (e.title as string) || '(sans titre)',
        date: e.date_marche as string | null,
        explorationId: e.exploration_id as string | null,
      }));
    },
  });

  const selectedEvent = useMemo(
    () => events?.find(e => e.id === eventId) || null,
    [events, eventId]
  );

  const { data: eventMarcheIds } = useQuery({
    queryKey: ['event-marche-ids', selectedEvent?.explorationId],
    queryFn: async (): Promise<string[]> => {
      if (!selectedEvent?.explorationId) return [];
      const { data } = await supabase
        .from('exploration_marches')
        .select('marche_id')
        .eq('exploration_id', selectedEvent.explorationId);
      return ((data || []) as any[]).map(r => r.marche_id as string).filter(Boolean);
    },
    enabled: !!selectedEvent?.explorationId,
  });

  const marchesFiltered = useMemo(() => {
    if (!marches) return [];
    if (!eventId) return marches;
    const set = new Set(eventMarcheIds || []);
    return marches.filter(m => set.has(m.id));
  }, [marches, eventId, eventMarcheIds]);

  React.useEffect(() => {
    if (marcheId && eventId && eventMarcheIds && !eventMarcheIds.includes(marcheId)) {
      setMarcheId(null);
    }
  }, [eventId, eventMarcheIds, marcheId]);

  const { data: pool, isLoading: poolLoading } = useQuery({
    queryKey: ['taxonomy-curation-pool', marcheId || 'all', eventId || 'no-event', (eventMarcheIds || []).join(',')],
    queryFn: async (): Promise<SpeciesRow[]> => {
      let q = supabase
        .from('marcheur_observations')
        .select('species_scientific_name, taxon_common_name_fr, source, marche_id');
      if (marcheId) {
        q = q.eq('marche_id', marcheId);
      } else if (eventId && eventMarcheIds && eventMarcheIds.length > 0) {
        q = q.in('marche_id', eventMarcheIds);
      } else if (eventId && (!eventMarcheIds || eventMarcheIds.length === 0)) {
        return [];
      }
      const { data, error } = await q.limit(5000);
      if (error) throw error;
      const map = new Map<string, SpeciesRow>();
      (data || []).forEach((r: any) => {
        const key = normalizeAliasKey(r.species_scientific_name) || normalizeAliasKey(r.taxon_common_name_fr);
        if (!key) return;
        const existing = map.get(key);
        if (existing) {
          existing.count += 1;
          if (r.source) existing.sources.add(r.source);
        } else {
          map.set(key, {
            scientific_name: r.species_scientific_name,
            common_name: r.taxon_common_name_fr,
            count: 1,
            sources: new Set(r.source ? [r.source] : []),
          });
        }
      });
      return Array.from(map.values()).sort((a, b) => b.count - a.count);
    },
    enabled: !eventId || !!eventMarcheIds,
  });

  const { list: aliasList, upsert, remove } = useTaxonomyAliasesAdmin(marcheId);

  const suspects = useMemo(() => {
    if (!pool) return [] as { genus: string; rows: SpeciesRow[]; total: number }[];
    const byGenus = new Map<string, SpeciesRow[]>();
    pool.forEach(r => {
      const g = getGenus(r.scientific_name)?.toLowerCase();
      if (!g) return;
      const arr = byGenus.get(g) || [];
      arr.push(r);
      byGenus.set(g, arr);
    });
    const q = normalizeSearch(search);
    let groups = Array.from(byGenus.entries())
      .filter(([, rows]) => rows.length >= 2 && rows.some(r => isGenusOnly(r.scientific_name)))
      .map(([genus, rows]) => ({
        genus,
        rows,
        total: rows.reduce((s, r) => s + (r.count || 0), 0),
      }));
    if (q) {
      groups = groups.filter(g =>
        normalizeSearch(g.genus).includes(q) ||
        g.rows.some(r =>
          normalizeSearch(r.scientific_name).includes(q) ||
          normalizeSearch(r.common_name).includes(q)
        )
      );
    }
    groups.sort((a, b) =>
      sortMode === 'genus' ? a.genus.localeCompare(b.genus) : b.total - a.total
    );
    return groups;
  }, [pool, search, sortMode]);

  const toggle = (key: string) =>
    setSelected(s => (s.includes(key) ? s.filter(k => k !== key) : [...s, key]));

  const mergeScope = useMemo<
    | { kind: 'global'; label: string }
    | { kind: 'marche'; marcheId: string; label: string }
    | { kind: 'event'; marcheIds: string[]; label: string }
  >(() => {
    if (marcheId) {
      const name = marches?.find(m => m.id === marcheId)?.name || marcheId;
      return { kind: 'marche', marcheId, label: `Marche : ${name}` };
    }
    if (eventId && selectedEvent) {
      const ids = eventMarcheIds || [];
      return {
        kind: 'event',
        marcheIds: ids,
        label: `Événement : ${selectedEvent.title} (fan-out sur ${ids.length} marche${ids.length > 1 ? 's' : ''})`,
      };
    }
    return { kind: 'global', label: 'Global (toutes les marches)' };
  }, [marcheId, eventId, selectedEvent, eventMarcheIds, marches]);

  const doMerge = async () => {
    const target = canonical.trim();
    if (!target || selected.length === 0) {
      toast.error('Sélectionne au moins une source et saisis le nom canonique');
      return;
    }
    if (mergeScope.kind === 'event' && mergeScope.marcheIds.length === 0) {
      toast.error('Aucune marche liée à cet événement — impossible de fusionner');
      return;
    }
    setIsMerging(true);
    try {
      const sourcesToApply = selected.filter(
        s => normalizeAliasKey(s) !== normalizeAliasKey(target)
      );
      let upserts = 0;

      if (mergeScope.kind === 'event') {
        for (const mid of mergeScope.marcheIds) {
          for (const src of sourcesToApply) {
            const { error } = await (supabase as any).rpc('upsert_species_taxonomy_alias', {
              p_marche_id: mid,
              p_alias_key: normalizeAliasKey(src),
              p_canonical_scientific_name: target,
              p_canonical_common_name_fr: null,
              p_reason: 'manual_event_fanout',
              p_notes: `event:${eventId}`,
            });
            if (error) throw error;
            upserts++;
          }
        }
        toast.success(
          `${upserts} alias enregistré(s) sur ${mergeScope.marcheIds.length} marche(s) → « ${target} »`
        );
      } else {
        for (const src of sourcesToApply) {
          await upsert.mutateAsync({
            alias_key: src,
            canonical_scientific_name: target,
            reason: 'manual',
          });
          upserts++;
        }
        toast.success(`${upserts} alias enregistré(s) → « ${target} » (${mergeScope.label})`);
      }
      setSelected([]);
      setCanonical('');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/outils">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour Outils
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitMerge className="h-6 w-6" /> Curation taxonomique
          </h1>
        </div>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-3">
            Fusionne durablement des entrées d'espèces dupliquées (ex. « Lantana » et « Lantana camara »).
            Les fusions sont persistantes et s'appliquent automatiquement aux futures synchronisations iNaturalist / Pl@ntNet.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Événement</Label>
              <Select value={eventId || 'none'} onValueChange={v => setEventId(v === 'none' ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Tous les événements —</SelectItem>
                  {events?.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}{e.date ? ` — ${new Date(e.date).toLocaleDateString('fr-FR')}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Marche{eventId ? ' (limitée à cet événement)' : ''}</Label>
              <Select value={marcheId || 'global'} onValueChange={v => setMarcheId(v === 'global' ? null : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">— Toutes les marches —</SelectItem>
                  {marchesFiltered.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <Label>Trier les doublons par</Label>
              <Select value={sortMode} onValueChange={v => setSortMode(v as 'count' | 'genus')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="count">Nombre de doublons (défaut)</SelectItem>
                  <SelectItem value="genus">Genre (A→Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="search-species">Rechercher une espèce</Label>
              <Input
                id="search-species"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="nom scientifique ou vernaculaire…"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-muted-foreground">
              Portée de fusion : <span className="font-medium text-foreground">{mergeScope.label}</span>
            </div>
            <div className="inline-flex rounded-md border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition ${viewMode === 'list' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-3.5 w-3.5" /> Liste
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-xs rounded flex items-center gap-1.5 transition ${viewMode === 'map' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MapIcon className="h-3.5 w-3.5" /> Carte
              </button>
            </div>
          </div>
        </Card>

        {viewMode === 'map' && (
          <DuplicatesMapView
            marcheIds={
              marcheId
                ? [marcheId]
                : eventId
                ? eventMarcheIds || []
                : null
            }
            onRequestMerge={(canonicalName, sources) => {
              setCanonical(canonicalName);
              setSelected(sources);
              toast.info(`Fusion pré-remplie : ${sources.length} source(s) → « ${canonicalName} »`);
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }}
          />
        )}

        {viewMode === 'list' && suspects.length > 0 && (
          <Card className="p-4 border-amber-500/40">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h2 className="font-semibold">Doublons probables détectés ({suspects.length})</h2>
            </div>
            <div className="space-y-3">
              {suspects.map(s => (
                <div key={s.genus} className="border rounded p-3">
                  <div className="text-xs text-muted-foreground mb-2">Genre : <span className="italic">{s.genus}</span></div>
                  <div className="flex flex-wrap gap-2">
                    {s.rows.map(r => (
                      <label key={r.scientific_name || r.common_name || ''} className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer hover:bg-muted/40">
                        <input
                          type="checkbox"
                          checked={selected.includes(r.scientific_name || '')}
                          onChange={() => toggle(r.scientific_name || '')}
                        />
                        <span className={isGenusOnly(r.scientific_name) ? 'italic text-amber-600' : 'italic'}>
                          {r.scientific_name || r.common_name}
                        </span>
                        <Badge variant="secondary">{r.count}</Badge>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {viewMode === 'list' && (
        <Card className="p-4">
          {poolLoading && <p className="text-sm text-muted-foreground">Chargement…</p>}
          <div className="max-h-96 overflow-auto divide-y">
            {pool?.map(r => {
              const k = r.scientific_name || r.common_name || '';
              return (
                <label key={k} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/40 px-2">
                  <input
                    type="checkbox"
                    checked={selected.includes(k)}
                    onChange={() => toggle(k)}
                  />
                  <div className="flex-1">
                    <div className="italic">{r.scientific_name || <span className="text-muted-foreground">—</span>}</div>
                    {r.common_name && <div className="text-xs text-muted-foreground">{r.common_name}</div>}
                  </div>
                  <div className="flex gap-1">
                    {Array.from(r.sources).map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                  <Badge>{r.count}</Badge>
                </label>
              );
            })}
          </div>
        </Card>
        )}


        <Card className="p-4 border-primary/40">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Merge className="h-4 w-4" /> Fusionner</h2>
          <div className="space-y-3">
            <div className="text-xs px-2 py-1 rounded bg-muted/60 inline-block">
              Portée : <span className="font-medium">{mergeScope.label}</span>
            </div>
            <div>
              <Label>Sources sélectionnées ({selected.length})</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {selected.length === 0 && <span className="text-xs text-muted-foreground">Coche des espèces ci-dessus</span>}
                {selected.map(s => (
                  <Badge key={s} variant="secondary" className="italic">{s}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="canonical">Nom canonique cible (scientifique)</Label>
              <Input
                id="canonical"
                value={canonical}
                onChange={e => setCanonical(e.target.value)}
                placeholder="ex. Lantana camara"
              />
            </div>
            <Button
              onClick={doMerge}
              disabled={
                isMerging ||
                upsert.isPending ||
                selected.length === 0 ||
                !canonical.trim() ||
                (mergeScope.kind === 'event' && mergeScope.marcheIds.length === 0)
              }
            >
              <Merge className="h-4 w-4 mr-2" />
              Enregistrer la fusion
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="font-semibold mb-3">
            Alias enregistrés — {marcheId ? 'marche sélectionnée' : 'portée globale'} ({aliasList.data?.length || 0})
          </h2>
          {eventId && !marcheId && (
            <p className="text-xs text-muted-foreground mb-2">
              Sélectionne une marche pour voir les alias marche-scopés créés par le fan-out d'événement.
            </p>
          )}
          <div className="divide-y">
            {aliasList.data?.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2">
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="italic">{a.alias_key}</span>
                    <span className="mx-2 text-muted-foreground">→</span>
                    <span className="italic font-medium">{a.canonical_scientific_name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {a.reason} · {new Date(a.updated_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove.mutate(a.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {!aliasList.data?.length && (
              <p className="text-sm text-muted-foreground py-2">Aucun alias pour ce périmètre.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminTaxonomyCuration;
