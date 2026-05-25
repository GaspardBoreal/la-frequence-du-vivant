import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Plus, Minus } from 'lucide-react';

/** Local high-contrast zoom controls (overrides default for this admin context only) */
function CurationZoomControls() {
  const map = useMap();
  const btn = 'w-9 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg border border-emerald-400/60 transition active:scale-95';
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-1.5">
      <button onClick={() => map.zoomIn()} className={btn} aria-label="Zoomer"><Plus className="w-4 h-4" /></button>
      <button onClick={() => map.zoomOut()} className={btn} aria-label="Dézoomer"><Minus className="w-4 h-4" /></button>
    </div>
  );
}

/** Highly visible numbered emerald marker for marche centers */
function makeMarcheIcon(num: number, name: string) {
  return L.divIcon({
    className: 'curation-marche-marker',
    html: `<div style="
      display:flex;align-items:center;gap:6px;transform:translate(-50%,-50%);
    ">
      <div style="
        width:30px;height:30px;border-radius:50%;
        background:linear-gradient(135deg,#10b981,#059669);
        border:3px solid #fff;color:#fff;font-weight:800;font-size:13px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 10px rgba(0,0,0,.5),0 0 0 2px rgba(16,185,129,.4);
      ">${num}</div>
      <div style="
        background:rgba(5,46,22,.92);color:#fff;font-size:11px;font-weight:600;
        padding:3px 8px;border-radius:6px;border:1px solid rgba(16,185,129,.5);
        white-space:nowrap;max-width:160px;overflow:hidden;text-overflow:ellipsis;
      ">${name}</div>
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}
import { supabase } from '@/integrations/supabase/client';
import RichMap from '@/components/maps/RichMap';
import { useAiCurationMedias, type AiCurationMedia } from '@/hooks/useAiCurationMedias';
import { useCurationMediaContext, type CurationCandidate } from '@/hooks/useCurationMediaContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, CheckCircle2, EyeOff, Sparkles, MapPin, MapPinOff, Search, X, AlertTriangle, User as UserIcon, Image as ImageIcon, Footprints } from 'lucide-react';
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

function makeMarkerIcon(media: AiCurationMedia, selected: boolean, highlighted: boolean) {
  const color = STATUS_COLOR[media.ai_status] || '#999';
  const conf = media.topConfidence ?? 0;
  const r = 7 + Math.round(conf * 8);
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
  const [batchOpen, setBatchOpen] = useState(false);

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
  const marchesById = useMemo(() => Object.fromEntries(marches.map((m: any) => [m.id, m])), [marches]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return medias.filter((m) => {
      if (!filters.statuses.has(m.ai_status)) return false;
      if (filters.kingdom !== 'all') {
        const k = m.ai_kingdom_hint;
        const known = ['plante', 'animal', 'champignon'].includes(k || '');
        if (filters.kingdom === 'inconnu' ? known : k !== filters.kingdom) return false;
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
  const bounds = useMemo(() => withGps.map((m) => [m.lat!, m.lng!] as [number, number]), [withGps]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    medias.forEach((m) => { c[m.ai_status] = (c[m.ai_status] || 0) + 1; });
    return c;
  }, [medias]);

  const toggleSelect = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAllVisible = () => setSelected(new Set(filtered.map((m) => m.id)));
  const clearSelection = () => setSelected(new Set());

  const runBatchSimple = async (action: 'unidentifiable' | 'reprocess') => {
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
          body: { mediaIds: ids, action },
        });
        if (error) throw error;
        toast.success(`${(data as any)?.count ?? ids.length}/${ids.length} marquée(s) non id.`);
      }
      clearSelection();
      refetch();
    } catch (e: any) { toast.error(e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  const drawerMedia = filtered.find((m) => m.id === drawerMediaId) || medias.find((m) => m.id === drawerMediaId) || null;

  return (
    <Card className="p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border p-3 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          <PresetChip label="À curer" active={filters.statuses.size === 2 && filters.statuses.has('pending_curation') && filters.statuses.has('low_confidence')}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(['pending_curation', 'low_confidence']) })} />
          <PresetChip label="Auto-validées" active={filters.statuses.size === 1 && filters.statuses.has('auto_validated')}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(['auto_validated']) })} />
          <PresetChip label="Sans GPS" active={filters.hideGps === 'without'}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(ALL_STATUSES), hideGps: 'without' })} />
          <PresetChip label="Tout" active={filters.statuses.size === ALL_STATUSES.length && filters.hideGps === 'all'}
            onClick={() => setFilters({ ...DEFAULT_FILTERS, statuses: new Set(ALL_STATUSES) })} />
        </div>
        <div className="h-6 w-px bg-border mx-1" />
        <div className="flex gap-1 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button key={s} onClick={() => {
              setFilters((f) => { const n = new Set(f.statuses); n.has(s) ? n.delete(s) : n.add(s); return { ...f, statuses: n }; });
            }} className={`px-2 py-1 rounded-full text-[11px] border transition ${
              filters.statuses.has(s) ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:border-foreground/30'
            }`} style={filters.statuses.has(s) ? { background: STATUS_COLOR[s] } : {}}>
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
              {marches.map((m: any) => (<SelectItem key={m.id} value={m.id}>{m.nom_marche}</SelectItem>))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Espèce…" className="h-8 text-xs pl-7 w-[140px]" />
          </div>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] h-[70vh] min-h-[500px]">
        <div className="relative bg-[#1a1a2e]">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : withGps.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <MapPinOff className="h-10 w-10 opacity-40 mb-2" />
              <p className="text-sm">Aucune photo géolocalisée pour ces filtres</p>
            </div>
          ) : (
            <RichMap bounds={bounds} controls={{ zoom: false, style: true, geolocate: true }} height="100%">
              <CurationZoomControls />
              {marches.filter((m: any) => m.latitude && m.longitude && (filters.marcheId === 'all' || filters.marcheId === m.id))
                .map((m: any, idx: number) => (
                  <Marker key={`marche-${m.id}`} position={[m.latitude, m.longitude]}
                    icon={makeMarcheIcon(idx + 1, m.nom_marche)}>
                    <Popup>{m.nom_marche}</Popup>
                  </Marker>
                ))}
              {withGps.map((m) => (
                <Marker key={m.id} position={[m.lat!, m.lng!]}
                  icon={makeMarkerIcon(m, selected.has(m.id), highlightedId === m.id)}
                  eventHandlers={{
                    click: () => setDrawerMediaId(m.id),
                    mouseover: () => setHighlightedId(m.id),
                    mouseout: () => setHighlightedId(null),
                  }}>
                  <Popup>
                    <PhotoPopup media={m} marcheName={(marchesById[m.marche_id || ''] as any)?.nom_marche}
                      onOpen={() => setDrawerMediaId(m.id)} onSelect={() => toggleSelect(m.id)} selected={selected.has(m.id)} />
                  </Popup>
                </Marker>
              ))}
            </RichMap>
          )}
        </div>

        <div className="border-l border-border flex flex-col bg-card">
          <div className="border-b border-border p-2 flex items-center gap-2 text-xs">
            <Checkbox checked={selected.size > 0 && selected.size === filtered.length}
              onCheckedChange={(v) => v ? selectAllVisible() : clearSelection()} />
            <span className="text-muted-foreground">
              {selected.size > 0 ? `${selected.size} sélectionnée(s)` : `${filtered.length} photo(s)`}
            </span>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" className="h-6 ml-auto" onClick={clearSelection}><X className="h-3 w-3" /></Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map((m) => (
              <PhotoRow key={m.id} media={m} marcheName={(marchesById[m.marche_id || ''] as any)?.nom_marche}
                selected={selected.has(m.id)} highlighted={highlightedId === m.id}
                onSelect={() => toggleSelect(m.id)} onOpen={() => setDrawerMediaId(m.id)}
                onHover={(v) => setHighlightedId(v ? m.id : null)} />
            ))}
            {filtered.length === 0 && !isLoading && <p className="text-sm text-muted-foreground text-center py-8">Aucune photo</p>}
          </div>

          {selected.size > 0 && (
            <div className="border-t border-border p-2 space-y-1 bg-muted/30">
              <Button size="sm" className="w-full" disabled={busy} onClick={() => setBatchOpen(true)}>
                <CheckCircle2 className="h-3 w-3 mr-1.5" /> Valider top-1 ({selected.size})
              </Button>
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => runBatchSimple('unidentifiable')}>
                  <EyeOff className="h-3 w-3 mr-1" /> Non id.
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => runBatchSimple('reprocess')}>
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
          <SheetHeader><SheetTitle>Curation photo</SheetTitle></SheetHeader>
          {drawerMediaId && drawerMedia && (
            <DetailContent mediaId={drawerMediaId} fallback={drawerMedia}
              onDone={() => { refetch(); setDrawerMediaId(null); }} />
          )}
        </SheetContent>
      </Sheet>

      {/* Batch confirm dialog */}
      <BatchValidateDialog open={batchOpen} onOpenChange={setBatchOpen}
        mediaIds={Array.from(selected)} medias={medias} marches={marches}
        onDone={() => { refetch(); clearSelection(); setBatchOpen(false); }} />
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

function PhotoRow({ media, marcheName, selected, highlighted, onSelect, onOpen, onHover }: {
  media: AiCurationMedia; marcheName?: string; selected: boolean; highlighted: boolean;
  onSelect: () => void; onOpen: () => void; onHover: (v: boolean) => void;
}) {
  const url = media.url_fichier || media.external_url || '';
  const color = STATUS_COLOR[media.ai_status];
  return (
    <div onMouseEnter={() => onHover(true)} onMouseLeave={() => onHover(false)}
      className={`flex gap-2 p-2 border-b border-border/50 cursor-pointer transition ${
        highlighted ? 'bg-accent/30' : selected ? 'bg-primary/5' : 'hover:bg-muted/40'
      }`}>
      <div className="flex items-start pt-1" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
        <Checkbox checked={selected} />
      </div>
      <button onClick={onOpen} className="flex gap-2 flex-1 min-w-0 text-left">
        <div className="relative flex-shrink-0">
          {url ? <img src={url} alt="" className="w-16 h-16 object-cover rounded-md" loading="lazy" />
            : <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
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
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4" style={{ borderColor: color, color }}>{STATUS_LABEL[media.ai_status]}</Badge>
            {media.topConfidence != null && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{(media.topConfidence * 100).toFixed(0)}%</Badge>}
          </div>
          {marcheName && <div className="text-[10px] text-muted-foreground truncate mt-0.5 flex items-center gap-1"><Footprints className="h-2.5 w-2.5" />{marcheName}</div>}
        </div>
      </button>
    </div>
  );
}

function PhotoPopup({ media, marcheName, onOpen, onSelect, selected }: {
  media: AiCurationMedia; marcheName?: string; onOpen: () => void; onSelect: () => void; selected: boolean;
}) {
  const url = media.url_fichier || media.external_url || '';
  return (
    <div className="min-w-[200px]">
      {url && <img src={url} alt="" className="w-full h-32 object-cover rounded mb-2" />}
      <div className="text-xs font-semibold mb-1">{media.topName || 'Sans suggestion'}</div>
      <Badge variant="outline" className="text-[10px]" style={{ borderColor: STATUS_COLOR[media.ai_status], color: STATUS_COLOR[media.ai_status] }}>
        {STATUS_LABEL[media.ai_status]} · {media.topConfidence != null ? `${(media.topConfidence * 100).toFixed(0)}%` : '—'}
      </Badge>
      {marcheName && <div className="text-[10px] mt-1 flex items-center gap-1"><Footprints className="h-2.5 w-2.5" /> {marcheName}</div>}
      <div className="flex gap-1 mt-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={onOpen}>Ouvrir</Button>
        <Button size="sm" variant={selected ? 'default' : 'outline'} className="h-7 text-xs" onClick={onSelect}>{selected ? '✓' : '+'}</Button>
      </div>
    </div>
  );
}

function DetailContent({ mediaId, fallback, onDone }: { mediaId: string; fallback: AiCurationMedia; onDone: () => void }) {
  const { data: ctx, isLoading, refetch } = useCurationMediaContext(mediaId);
  const [busy, setBusy] = useState(false);
  const [marcheurUserId, setMarcheurUserId] = useState<string>('');

  useEffect(() => {
    if (ctx?.attributed?.user_id) setMarcheurUserId(ctx.attributed.user_id);
  }, [ctx?.attributed?.user_id]);

  const validate = async (sci: string, fr: string | null, kingdom?: string | null, conf?: number) => {
    if (!marcheurUserId) { toast.error('Sélectionne un marcheur avant de valider'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('curate-marcheur-photo', {
        body: { mediaId, action: 'validate', scientificName: sci, commonNameFr: fr,
          kingdom: kingdom || ctx?.media?.ai_kingdom_hint,
          aiConfidence: conf, marcheurUserId },
      });
      if (error) throw error;
      const w = (data as any)?.warnings;
      toast.success(w ? `Validée (avec ${w} warning)` : 'Identification validée');
      onDone();
    } catch (e: any) { toast.error(e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  const markUnid = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('curate-marcheur-photo', {
        body: { mediaId, action: 'unidentifiable' },
      });
      if (error) throw error;
      toast.success('Marquée non identifiable'); onDone();
    } catch (e: any) { toast.error(e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  const relancer = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke('recognize-marcheur-photos', {
        body: { mediaId, forceReprocess: true },
      });
      if (error) throw error;
      toast.success('Reconnaissance relancée'); refetch();
    } catch (e: any) { toast.error(e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  const url = ctx?.media?.url || fallback.url_fichier || fallback.external_url || '';
  const gps = ctx?.media?.gps;
  const marche = ctx?.marche;
  const candidates = ctx?.candidates ?? [];
  const top = ctx?.top_suggestion;
  const selectedCandidate = candidates.find((c: CurationCandidate) => c.user_id === marcheurUserId);

  return (
    <div className="space-y-4 mt-4">
      {url && <img src={url} alt="" className="w-full max-h-[35vh] object-contain rounded-lg bg-muted" />}

      {isLoading && <div className="flex items-center justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>}

      {/* 📍 MARCHE */}
      <section className="rounded-lg border border-border p-3 space-y-2">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <Footprints className="h-3.5 w-3.5" /> Marche
        </h4>
        {marche ? (
          <>
            <div className="text-sm font-medium">{marche.nom_marche}</div>
            {marche.date && <div className="text-[11px] text-muted-foreground">{new Date(marche.date).toLocaleDateString('fr-FR')}</div>}
            {gps?.lat != null && (
              <div className="h-40 rounded-md overflow-hidden border border-border">
                <RichMap center={[gps.lat, gps.lng!]} zoom={16} height="100%" controls={{ zoom: false, style: false }}>
                  <CircleMarker center={[marche.latitude, marche.longitude]} radius={6}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: '#fff', fillOpacity: 0.3 }}>
                    <Popup>{marche.nom_marche}</Popup>
                  </CircleMarker>
                  <CircleMarker center={[gps.lat, gps.lng!]} radius={8}
                    pathOptions={{ color: STATUS_COLOR[fallback.ai_status], weight: 2, fillColor: STATUS_COLOR[fallback.ai_status], fillOpacity: 0.7 }} />
                </RichMap>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px]">
              {marche.distance_m != null ? (
                marche.out_of_radius ? (
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <AlertTriangle className="h-3 w-3" /> Hors rayon : {Math.round(marche.distance_m)} m (rayon {marche.radius_m} m)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Dans le rayon ({Math.round(marche.distance_m)} m du centre)
                  </span>
                )
              ) : <span className="text-muted-foreground">Distance inconnue</span>}
            </div>
          </>
        ) : <p className="text-[11px] text-muted-foreground italic">Aucune marche associée</p>}
      </section>

      {/* 📌 GPS */}
      <section className="rounded-lg border border-border p-3 space-y-1.5">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <MapPin className="h-3.5 w-3.5" /> GPS exact
        </h4>
        {gps?.lat != null ? (
          <div className="text-[11px] space-y-0.5">
            <div className="font-mono">{gps.lat.toFixed(6)}, {gps.lng?.toFixed(6)}</div>
            {gps.altitude && Number(gps.altitude) > 0 && <div className="text-muted-foreground">Altitude : {Number(gps.altitude).toFixed(0)} m</div>}
            <div className="text-muted-foreground">Source : {gps.source === 'exif' ? 'EXIF appareil photo' : gps.source}</div>
          </div>
        ) : <p className="text-[11px] text-muted-foreground italic flex items-center gap-1"><MapPinOff className="h-3 w-3" /> Aucune coordonnée</p>}
      </section>

      {/* 👤 MARCHEUR */}
      <section className="rounded-lg border border-border p-3 space-y-2">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <UserIcon className="h-3.5 w-3.5" /> Marcheur attribué <span className="text-destructive">*</span>
        </h4>
        {candidates.length === 0 ? (
          <p className="text-[11px] text-orange-600 italic flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Aucun participant validé sur cet événement
          </p>
        ) : (
          <>
            <Select value={marcheurUserId} onValueChange={setMarcheurUserId}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choisir un marcheur participant…" /></SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.display_name || c.slug || c.user_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCandidate && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {selectedCandidate.avatar_url && <img src={selectedCandidate.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                Sera attribuée à <span className="font-medium text-foreground">{selectedCandidate.display_name}</span>
              </div>
            )}
            {!marcheurUserId && <p className="text-[10px] text-destructive">Sélection obligatoire avant validation</p>}
          </>
        )}
      </section>

      {/* ✨ SUGGESTIONS */}
      <section className="space-y-1.5">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wide">
          <Sparkles className="h-3.5 w-3.5" /> Suggestions IA
        </h4>
        <p className="text-[10px] text-muted-foreground italic">
          Cliquez sur une suggestion pour la valider, ou utilisez le bouton vert ci-dessous pour la top-1.
        </p>
        {fallback.suggestions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground italic">Aucune suggestion. Relancez la reconnaissance.</p>
        ) : (
          fallback.suggestions.slice(0, 5).map((s) => (
            <button key={s.rank} onClick={() => validate(s.taxon_scientific_name, s.taxon_common_name_fr, s.kingdom, s.confidence)}
              disabled={busy || !marcheurUserId}
              className="w-full text-left rounded-md border border-border hover:border-emerald-500 hover:bg-emerald-500/5 px-3 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed group">
              <div className="flex justify-between items-center gap-2">
                <div className="min-w-0 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{s.taxon_common_name_fr || s.taxon_scientific_name}</div>
                    {s.taxon_common_name_fr && <div className="text-xs text-muted-foreground italic truncate">{s.taxon_scientific_name}</div>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{(s.confidence * 100).toFixed(0)}%</Badge>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{s.ai_provider}</div>
                </div>
              </div>
            </button>
          ))
        )}
      </section>

      {/* 📊 IMPACT */}
      {top && marche && marcheurUserId && (
        <section className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1 text-[11px]">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 uppercase tracking-wide">
            📊 Aperçu impact
          </h4>
          <div className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>{ctx?.impact.species_already_in_marche
              ? <>Renforce <strong>{top.common_name_fr || top.scientific_name}</strong> sur <strong>{marche.nom_marche}</strong> ({ctx?.impact.current_obs_count_for_species} obs déjà)</>
              : <>Crée <strong>{top.common_name_fr || top.scientific_name}</strong> dans <strong>{marche.nom_marche}</strong> (nouvelle espèce)</>}</span>
          </div>
          <div className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>Attribuée à <strong>{selectedCandidate?.display_name}</strong></span>
          </div>
          <div className="flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-600 mt-0.5 flex-shrink-0" />
            <span>Source : <strong>Identification manuelle Marches Du Vivant</strong></span>
          </div>
        </section>
      )}

      {/* ✅ CTA PRINCIPAL */}
      {top && (
        <Button
          onClick={() => validate(top.scientific_name, top.common_name_fr, top.kingdom, top.confidence)}
          disabled={busy || !marcheurUserId}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          Valider l'identification top-1 ({top.common_name_fr || top.scientific_name})
        </Button>
      )}
      {!marcheurUserId && top && (
        <p className="text-[10px] text-destructive text-center -mt-2">Sélectionne d'abord un marcheur ci-dessus</p>
      )}

      <div className="flex gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={markUnid} disabled={busy} className="flex-1">
          <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Non identifiable
        </Button>
        <Button variant="outline" size="sm" onClick={relancer} disabled={busy} className="flex-1">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Relancer IA
        </Button>
      </div>
    </div>
  );
}

function BatchValidateDialog({ open, onOpenChange, mediaIds, medias, marches, onDone }: {
  open: boolean; onOpenChange: (v: boolean) => void; mediaIds: string[];
  medias: AiCurationMedia[]; marches: any[]; onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [perMarcheUser, setPerMarcheUser] = useState<Record<string, string>>({});

  // Participants par marche_event = même pool, on prend l'event_id du premier média
  const eventId = medias[0]?.metadata?.marche_event_id || null;

  const selectedMedias = medias.filter((m) => mediaIds.includes(m.id));
  const byMarche = useMemo(() => {
    const map: Record<string, AiCurationMedia[]> = {};
    selectedMedias.forEach((m) => { if (m.marche_id) (map[m.marche_id] ||= []).push(m); });
    return map;
  }, [selectedMedias]);

  // Charge la liste des participants validés une fois
  const { data: candidates = [] } = useQuery({
    queryKey: ['batch-candidates', selectedMedias[0]?.id],
    enabled: open && selectedMedias.length > 0,
    queryFn: async () => {
      const { data: ctx } = await supabase.rpc('get_curation_media_context', { p_media_id: selectedMedias[0].id });
      return (ctx as any)?.candidates || [];
    },
  });

  const allAssigned = Object.keys(byMarche).every((mid) => !!perMarcheUser[mid]);

  const submit = async () => {
    setBusy(true);
    let ok = 0, fail = 0, warn = 0;
    try {
      for (const mid of Object.keys(byMarche)) {
        const userIdAttr = perMarcheUser[mid];
        for (const m of byMarche[mid]) {
          const { data, error } = await supabase.functions.invoke('curate-marcheur-photo', {
            body: { mediaId: m.id, action: 'validate', useTopSuggestion: true, marcheurUserId: userIdAttr },
          });
          if (error) { fail++; continue; }
          const res = (data as any)?.results?.[0];
          if (res?.ok) { ok++; if (res.warning) warn++; } else fail++;
        }
      }
      toast.success(`${ok} validée(s)${warn ? `, ${warn} hors rayon` : ''}${fail ? `, ${fail} échec(s)` : ''}`);
      onDone();
    } catch (e: any) { toast.error(e?.message || 'Erreur'); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Valider en lot ({mediaIds.length} photo(s))</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Chaque photo sera validée avec sa suggestion IA top-1 et créera une observation
            <strong> source = Identification manuelle Marches Du Vivant</strong>.
            Choisis un marcheur à attribuer par marche.
          </p>
          {Object.entries(byMarche).map(([mid, list]) => {
            const marche = marches.find((m: any) => m.id === mid);
            return (
              <div key={mid} className="rounded-md border border-border p-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium flex items-center gap-1.5">
                    <Footprints className="h-3.5 w-3.5" /> {marche?.nom_marche || mid.slice(0, 8)}
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{list.length} photo(s)</Badge>
                </div>
                <Select value={perMarcheUser[mid] || ''} onValueChange={(v) => setPerMarcheUser((p) => ({ ...p, [mid]: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Choisir un marcheur…" /></SelectTrigger>
                  <SelectContent>
                    {candidates.map((c: CurationCandidate) => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.display_name || c.slug}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
          {Object.keys(byMarche).length === 0 && (
            <p className="text-xs text-orange-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Aucune des photos sélectionnées n'a de marche associée.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Annuler</Button>
          <Button onClick={submit} disabled={busy || !allAssigned || Object.keys(byMarche).length === 0}>
            {busy ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1.5" />}
            Valider {mediaIds.length} photo(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
