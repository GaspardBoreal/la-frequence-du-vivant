import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';
import RichMap from '@/components/maps/RichMap';
import { useAiCurationMedias, type AiCurationMedia } from '@/hooks/useAiCurationMedias';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Loader2, CheckCircle2, EyeOff, Sparkles, MapPin, MapPinOff, Search, X, Leaf, Bug, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props { eventId: string }

const STATUS_COLOR: Record<string, string> = {
  auto_validated: '#10b981',
  validated_by_human: '#059669',
  pending_curation: '#f59e0b',
  low_confidence: '#fb923c',
  unidentifiable: '#6b7280',
  pending: '#3b82f6',
  processing: '#3b82f6',
};

const STATUS_LABEL: Record<string, string> = {
  auto_validated: 'Auto-validée',
  validated_by_human: 'Validée humain',
  pending_curation: 'À curer',
  low_confidence: 'Faible confiance',
  unidentifiable: 'Non identifiable',
  pending: 'En attente',
  processing: 'En cours',
};

const ALL_STATUSES = Object.keys(STATUS_LABEL);

const KINGDOM_ICON: Record<string, any> = {
  plante: Leaf,
  animal: Bug,
  champignon: Sparkles,
};

function makeMarkerIcon(media: AiCurationMedia, selected: boolean, highlighted: boolean) {
  const color = STATUS_COLOR[media.ai_status] || '#999';
  const conf = media.topConfidence ?? 0;
  const r = 7 + Math.round(conf * 8); // 7→15
  const stroke = selected ? '#fff' : highlighted ? '#fde047' : 'rgba(0,0,0,0.55)';
  const sw = selected || highlighted ? 3 : 1.5;
  const pulse = media.ai_status === 'pending_curation';
  return L.divIcon({
    className: 'ai-photo-marker',
    iconSize: [r * 2 + 6, r * 2 + 6],
    iconAnchor: [r + 3, r + 3],
    html: `
      <div style="position:relative;width:${r * 2 + 6}px;height:${r * 2 + 6}px;">
        ${pulse ? `<div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:.35;animation:gps-pulse 1.8s ease-out infinite;"></div>` : ''}
        <svg width="${r * 2 + 6}" height="${r * 2 + 6}" viewBox="0 0 ${r * 2 + 6} ${r * 2 + 6}">
          <circle cx="${r + 3}" cy="${r + 3}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="${sw}"/>
        </svg>
      </div>`,
  });
}

interface Filters {
  statuses: Set<string>;
  kingdom: 'all' | 'plante' | 'animal' | 'champignon' | 'inconnu';
  marcheId: string | 'all';
  minConfidence: number;
  search: string;
  hideGps: 'all' | 'with' | 'without';
}

const DEFAULT_FILTERS: Filters = {
  statuses: new Set(['pending_curation', 'low_confidence', 'auto_validated', 'validated_by_human']),
  kingdom: 'all',
  marcheId: 'all',
  minConfidence: 0,
  search: '',
  hideGps: 'all',
};

export default function AiCurationMapView({ eventId }: Props) {
  const { data: medias = [], isLoading, refetch } = useAiCurationMedias(eventId);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [drawerMediaId, setDrawerMediaId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Marches de l'event (pour filtre + tracé)
  const { data: marches = [] } = useQuery({
    queryKey: ['event-marches-list', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('marches')
        .select('id, nom_marche, latitude, longitude')
        .in('id', Array.from(new Set(medias.map((m) => m.marche_id).filter(Boolean))) as string[]);
      return data || [];
    },
    enabled: medias.length > 0,
  });

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return medias.filter((m) => {
      if (!filters.statuses.has(m.ai_status)) return false;
      if (filters.kingdom !== 'all') {
        const k = m.ai_kingdom_hint || 'inconnu';
        if (filters.kingdom === 'inconnu' ? !!m.ai_kingdom_hint && KINGDOM_ICON[k] : k !== filters.kingdom) return false;
      }
      if (filters.marcheId !== 'all' && m.marche_id !== filters.marcheId) return false;
      if ((m.topConfidence ?? 0) * 100 < filters.minConfidence) return false;
      if (filters.hideGps === 'with' && (m.lat == null || m.lng == null)) return false;
      if (filters.hideGps === 'without' && (m.lat != null && m.lng != null)) return false;
      if (q && !(m.topName?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [medias, filters]);

  const withGps = filtered.filter((m) => m.lat != null && m.lng != null);
  const withoutGps = filtered.filter((m) => m.lat == null || m.lng == null);

  const bounds = useMemo(
    () => withGps.map((m) => [m.lat!, m.lng!] as [number, number]),
    [withGps],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    medias.forEach((m) => { c[m.ai_status] = (c[m.ai_status] || 0) + 1; });
    return c;
  }, [medias]);

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const selectAllVisible = () => setSelected(new Set(filtered.map((m) => m.id)));
  const clearSelection = () => setSelected(new Set());

  const runBatch = async (action: 'validate' | 'unidentifiable' | 'reprocess') => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const ids = Array.from(selected);
      if (action === 'reprocess') {
        const { error } = await supabase.functions.invoke('recognize-marcheur-photos', {
          body: { eventId, mediaIds: ids, forceReprocess: true },
        });
        if (error) throw error;
        toast.success(`Reconnaissance relancée sur ${ids.length} photo(s)`);
      } else {
        const { data, error } = await supabase.functions.invoke('curate-marcheur-photo', {
          body: { mediaIds: ids, action, useTopSuggestion: action === 'validate' },
        });
        if (error) throw error;
        const ok = (data as any)?.count ?? ids.length;
        toast.success(`${ok}/${ids.length} photo(s) traitée(s)`);
      }
      clearSelection();
      refetch();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const drawerMedia = filtered.find((m) => m.id === drawerMediaId)
    || medias.find((m) => m.id === drawerMediaId)
    || null;

  return (
    <Card className="p-0 overflow-hidden">
      {/* Toolbar filtres */}
      <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
        {/* Présets */}
        <div className="flex gap-1 flex-wrap">
          <PresetChip label="À curer" active={
            filters.statuses.size === 2 && filters.statuses.has('pending_curation') && filters.statuses.has('low_confidence')
          } onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(['pending_curation', 'low_confidence']) })} />
          <PresetChip label="Auto-validées" active={filters.statuses.size === 1 && filters.statuses.has('auto_validated')}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(['auto_validated']) })} />
          <PresetChip label="Sans GPS" active={filters.hideGps === 'without'}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(ALL_STATUSES), hideGps: 'without' })} />
          <PresetChip label="Tout" active={filters.statuses.size === ALL_STATUSES.length && filters.hideGps === 'all'}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(ALL_STATUSES) })} />
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        {/* Status chips */}
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => {
              setFilters((f) => {
                const n = new Set(f.statuses);
                n.has(s) ? n.delete(s) : n.add(s);
                return { ...f, statuses: n };
              });
            }} className={`px-2 py-1 rounded-full text-[11px] border transition ${
              filters.statuses.has(s) ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:border-foreground/30'
            }`}
              style={filters.statuses.has(s) ? { background: STATUS_COLOR[s] } : {}}
            >
              {STATUS_LABEL[s]} <span className="opacity-70">({counts[s] || 0})</span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={filters.kingdom} onValueChange={(v: any) => setFilters({ ...filters, kingdom: v })}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous règnes</SelectItem>
              <SelectItem value="plante">🌿 Flore</SelectItem>
              <SelectItem value="animal">🐾 Faune</SelectItem>
              <SelectItem value="champignon">🍄 Champi.</SelectItem>
              <SelectItem value="inconnu">❓ Inconnu</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.marcheId} onValueChange={(v) => setFilters({ ...filters, marcheId: v })}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes marches</SelectItem>
              {marches.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>{m.nom_marche}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Espèce…"
              className="h-8 text-xs pl-7 w-[140px]"
            />
          </div>
        </div>
      </div>

      {/* Slider confiance + GPS toggle */}
      <div className="border-b border-border px-3 py-2 flex items-center gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-[300px]">
          <span className="text-muted-foreground whitespace-nowrap">Confiance min</span>
          <Slider min={0} max={100} step={5} value={[filters.minConfidence]} onValueChange={(v) => setFilters({ ...filters, minConfidence: v[0] })} />
          <Badge variant="secondary" className="text-[10px]">{filters.minConfidence}%</Badge>
        </div>
        <div className="text-muted-foreground">
          {filtered.length} / {medias.length} affichées · {withGps.length} géolocalisée(s) · {withoutGps.length} sans GPS
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] h-[70vh] min-h-[500px]">
        {/* MAP */}
        <div className="relative bg-[#1a1a2e]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : withGps.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <MapPinOff className="h-10 w-10 opacity-40 mb-2" />
              <p className="text-sm">Aucune photo géolocalisée pour ces filtres</p>
            </div>
          ) : (
            <RichMap
              bounds={bounds}
              controls={{ zoom: true, style: true, geolocate: true }}
              height="100%"
            >
              {/* Marche centers */}
              {marches
                .filter((m: any) => m.latitude && m.longitude && (filters.marcheId === 'all' || filters.marcheId === m.id))
                .map((m: any) => (
                  <CircleMarker
                    key={`marche-${m.id}`}
                    center={[m.latitude, m.longitude]}
                    radius={5}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: '#fff', fillOpacity: 0.2 }}
                  >
                    <Popup>{m.nom_marche}</Popup>
                  </CircleMarker>
                ))}
              {/* Photo markers */}
              {withGps.map((m) => (
                <Marker
                  key={m.id}
                  position={[m.lat!, m.lng!]}
                  icon={makeMarkerIcon(m, selected.has(m.id), highlightedId === m.id)}
                  eventHandlers={{
                    click: () => setDrawerMediaId(m.id),
                    mouseover: () => setHighlightedId(m.id),
                    mouseout: () => setHighlightedId(null),
                  }}
                >
                  <Popup>
                    <PhotoPopup media={m} onOpen={() => setDrawerMediaId(m.id)} onSelect={() => toggleSelect(m.id)} selected={selected.has(m.id)} />
                  </Popup>
                </Marker>
              ))}
            </RichMap>
          )}
        </div>

        {/* LIST */}
        <div className="border-l border-border flex flex-col bg-card">
          {/* Selection bar */}
          <div className="border-b border-border p-2 flex items-center gap-2 text-xs">
            <Checkbox
              checked={selected.size > 0 && selected.size === filtered.length}
              onCheckedChange={(v) => v ? selectAllVisible() : clearSelection()}
            />
            <span className="text-muted-foreground">
              {selected.size > 0 ? `${selected.size} sélectionnée(s)` : `${filtered.length} photo(s)`}
            </span>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" className="h-6 ml-auto" onClick={clearSelection}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((m) => (
              <PhotoRow
                key={m.id}
                media={m}
                selected={selected.has(m.id)}
                highlighted={highlightedId === m.id}
                onSelect={() => toggleSelect(m.id)}
                onOpen={() => setDrawerMediaId(m.id)}
                onHover={(v) => setHighlightedId(v ? m.id : null)}
              />
            ))}
            {filtered.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune photo</p>
            )}
          </div>

          {/* Bottom action bar */}
          {selected.size > 0 && (
            <div className="border-t border-border p-2 space-y-1 bg-muted/30">
              <Button size="sm" className="w-full" disabled={busy} onClick={() => runBatch('validate')}>
                {busy ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1.5" />}
                Valider top-1 ({selected.size})
              </Button>
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => runBatch('unidentifiable')}>
                  <EyeOff className="h-3 w-3 mr-1" /> Non id.
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => runBatch('reprocess')}>
                  <Sparkles className="h-3 w-3 mr-1" /> Re-IA
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!drawerMediaId} onOpenChange={(o) => !o && setDrawerMediaId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Curation photo</SheetTitle>
          </SheetHeader>
          {drawerMedia && (
            <DetailContent media={drawerMedia} onDone={() => { refetch(); setDrawerMediaId(null); }} />
          )}
        </SheetContent>
      </Sheet>
    </Card>
  );
}

function PresetChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition ${
      active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-muted-foreground hover:text-foreground'
    }`}>{label}</button>
  );
}

function PhotoRow({ media, selected, highlighted, onSelect, onOpen, onHover }: {
  media: AiCurationMedia; selected: boolean; highlighted: boolean;
  onSelect: () => void; onOpen: () => void; onHover: (v: boolean) => void;
}) {
  const url = media.url_fichier || media.external_url || '';
  const color = STATUS_COLOR[media.ai_status];
  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={`flex gap-2 p-2 border-b border-border/50 cursor-pointer transition ${
        highlighted ? 'bg-accent/30' : selected ? 'bg-primary/5' : 'hover:bg-muted/40'
      }`}
    >
      <div className="flex items-start pt-1" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <Checkbox checked={selected} />
      </div>
      <button onClick={onOpen} className="flex gap-2 flex-1 min-w-0 text-left">
        <div className="relative flex-shrink-0">
          {url ? (
            <img src={url} alt="" className="w-16 h-16 object-cover rounded-md" loading="lazy" />
          ) : (
            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-card" style={{ background: color }} />
          {media.lat == null && (
            <span className="absolute bottom-0 right-0 bg-card/90 rounded-tl-md p-0.5">
              <MapPinOff className="h-2.5 w-2.5 text-muted-foreground" />
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium truncate">{media.topName || <span className="italic text-muted-foreground">Sans suggestion</span>}</div>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4" style={{ borderColor: color, color }}>
              {STATUS_LABEL[media.ai_status]}
            </Badge>
            {media.topConfidence != null && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                {(media.topConfidence * 100).toFixed(0)}%
              </Badge>
            )}
            {media.ai_kingdom_hint && (
              <span className="text-[10px] text-muted-foreground">{media.ai_kingdom_hint}</span>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

function PhotoPopup({ media, onOpen, onSelect, selected }: {
  media: AiCurationMedia; onOpen: () => void; onSelect: () => void; selected: boolean;
}) {
  const url = media.url_fichier || media.external_url || '';
  return (
    <div className="min-w-[200px]">
      {url && <img src={url} alt="" className="w-full h-32 object-cover rounded mb-2" />}
      <div className="text-xs font-semibold mb-1">{media.topName || 'Sans suggestion'}</div>
      <Badge variant="outline" className="text-[10px]" style={{ borderColor: STATUS_COLOR[media.ai_status], color: STATUS_COLOR[media.ai_status] }}>
        {STATUS_LABEL[media.ai_status]} · {media.topConfidence != null ? `${(media.topConfidence * 100).toFixed(0)}%` : '—'}
      </Badge>
      <div className="flex gap-1 mt-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={onOpen}>Ouvrir</Button>
        <Button size="sm" variant={selected ? 'default' : 'outline'} className="h-7 text-xs" onClick={onSelect}>
          {selected ? '✓' : '+'}
        </Button>
      </div>
    </div>
  );
}

function DetailContent({ media, onDone }: { media: AiCurationMedia; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const url = media.url_fichier || media.external_url || '';
  const act = async (action: string, sci?: string, fr?: string | null) => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('curate-marcheur-photo', {
        body: { mediaId: media.id, action, scientificName: sci, commonNameFr: fr },
      });
      if (error) throw error;
      toast.success(action === 'unidentifiable' ? 'Marquée non identifiable' : 'Espèce validée');
      onDone();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally { setBusy(false); }
  };

  const relancer = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('recognize-marcheur-photos', {
        body: { mediaId: media.id, forceReprocess: true },
      });
      if (error) throw error;
      toast.success('Reconnaissance relancée');
      onDone();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur');
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 mt-4">
      {url && <img src={url} alt="" className="w-full max-h-[40vh] object-contain rounded-lg bg-muted" />}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <Badge variant="outline" style={{ borderColor: STATUS_COLOR[media.ai_status], color: STATUS_COLOR[media.ai_status] }}>
          {STATUS_LABEL[media.ai_status]}
        </Badge>
        {media.ai_kingdom_hint && <Badge variant="secondary">{media.ai_kingdom_hint}</Badge>}
        {media.lat != null ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" /> {media.lat.toFixed(4)}, {media.lng?.toFixed(4)}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPinOff className="h-3 w-3" /> Sans GPS
          </span>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">Suggestions IA</h4>
        {media.suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune suggestion. Relancez la reconnaissance.</p>
        ) : (
          <div className="space-y-1.5">
            {media.suggestions.slice(0, 5).map((s) => (
              <button
                key={s.rank}
                onClick={() => act('validate', s.taxon_scientific_name, s.taxon_common_name_fr)}
                disabled={busy}
                className="w-full text-left rounded-md border border-border hover:border-primary hover:bg-primary/5 px-3 py-2 transition"
              >
                <div className="flex justify-between items-center gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.taxon_common_name_fr || s.taxon_scientific_name}</div>
                    {s.taxon_common_name_fr && (
                      <div className="text-xs text-muted-foreground italic truncate">{s.taxon_scientific_name}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{(s.confidence * 100).toFixed(0)}%</Badge>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{s.ai_provider}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={() => act('unidentifiable')} disabled={busy} className="flex-1">
          <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Non identifiable
        </Button>
        <Button variant="outline" size="sm" onClick={relancer} disabled={busy} className="flex-1">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Relancer IA
        </Button>
      </div>
    </div>
  );
}
