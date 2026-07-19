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
import { ArrowLeft, Merge, Trash2, AlertCircle, GitMerge } from 'lucide-react';
import { useTaxonomyAliasesAdmin, normalizeAliasKey } from '@/hooks/useTaxonomyAliases';
import { toast } from 'sonner';
import { getGenus, isGenusOnly } from '@/utils/taxonomyMerge';

interface SpeciesRow {
  scientific_name: string | null;
  common_name: string | null;
  count: number;
  sources: Set<string>;
}

const AdminTaxonomyCuration: React.FC = () => {
  const [eventId, setEventId] = useState<string | null>(null);
  const [marcheId, setMarcheId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [canonical, setCanonical] = useState<string>('');

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
    if (!pool) return [] as { genus: string; rows: SpeciesRow[] }[];
    const byGenus = new Map<string, SpeciesRow[]>();
    pool.forEach(r => {
      const g = getGenus(r.scientific_name)?.toLowerCase();
      if (!g) return;
      const arr = byGenus.get(g) || [];
      arr.push(r);
      byGenus.set(g, arr);
    });
    return Array.from(byGenus.entries())
      .filter(([, rows]) => rows.length >= 2 && rows.some(r => isGenusOnly(r.scientific_name)))
      .map(([genus, rows]) => ({ genus, rows }));
  }, [pool]);

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
    try {
      const sourcesToApply = selected.filter(
        s => normalizeAliasKey(s) !== normalizeAliasKey(target)
      );
      let upserts = 0;

      if (mergeScope.kind === 'event') {
        const { data: u } = await supabase.auth.getUser();
        for (const mid of mergeScope.marcheIds) {
          for (const src of sourcesToApply) {
            const { error } = await (supabase as any)
              .from('species_taxonomy_aliases')
              .upsert(
                {
                  marche_id: mid,
                  alias_key: normalizeAliasKey(src),
                  canonical_scientific_name: target,
                  canonical_common_name_fr: null,
                  reason: 'manual_event_fanout',
                  notes: `event:${eventId}`,
                  created_by: u.user?.id ?? null,
                },
                { onConflict: 'marche_id,alias_key' }
              );
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
          <div className="mt-3 text-xs text-muted-foreground">
            Portée de fusion : <span className="font-medium text-foreground">{mergeScope.label}</span>
          </div>
        </Card>

        {suspects.length > 0 && (
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

        <Card className="p-4">
          <h2 className="font-semibold mb-3">Espèces observées ({pool?.length || 0})</h2>
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
