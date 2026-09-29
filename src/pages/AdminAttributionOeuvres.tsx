import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Image as ImageIcon, Loader2, Music, Pause, Play, Search, UserRound, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type Kind = 'photo' | 'audio';
interface MediaItem {
  kind: Kind; id: string; marche_id: string | null; url: string | null; titre: string | null; nom_fichier: string | null;
  author_user_id: string | null; attributed_at: string | null; nom_marche: string | null; ville: string | null;
  marche_date: string | null; author_name: string | null; format_audio: string | null; taille_octets: number | null;
}
interface Candidate { user_id: string; name: string; avatar_url: string | null; marche_ids: string[] }

const rpc = supabase.rpc.bind(supabase) as unknown as (fn: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
const keyOf = (m: MediaItem) => `${m.kind}:${m.id}`;
const fmtTime = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–:––');
const audioBadge = (m: MediaItem) => {
  const f = (m.format_audio ?? '').split('/').pop()?.replace('x-', '').replace('mpeg', 'mp3').toUpperCase();
  const mo = m.taille_octets ? `${(m.taille_octets / 1e6).toFixed(m.taille_octets > 1e7 ? 0 : 1)} Mo` : '';
  return [f, mo].filter(Boolean).join(' · ');
};

export default function AdminAttributionOeuvres() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'todo' | 'done'>('todo');
  const [kindFilter, setKindFilter] = useState<'all' | Kind>('all');
  const [marcheFilter, setMarcheFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Lecteur audio unique pour toute la page
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<MediaItem | null>(null);
  const [isPaused, setIsPaused] = useState(true);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [time, setTime] = useState({ cur: 0, dur: NaN });

  useEffect(() => {
    const a = new Audio();
    a.preload = 'metadata';
    audioRef.current = a;
    const on = (ev: string, fn: () => void) => a.addEventListener(ev, fn);
    on('waiting', () => setLoadingAudio(true));
    on('playing', () => { setLoadingAudio(false); setIsPaused(false); });
    on('canplay', () => setLoadingAudio(false));
    on('pause', () => setIsPaused(true));
    on('ended', () => setIsPaused(true));
    on('timeupdate', () => setTime({ cur: a.currentTime, dur: a.duration }));
    on('loadedmetadata', () => setTime({ cur: a.currentTime, dur: a.duration }));
    on('error', () => { setLoadingAudio(false); setIsPaused(true); toast.error('Lecture impossible pour ce son'); });
    return () => { a.pause(); a.src = ''; };
  }, []);

  const playItem = (m: MediaItem) => {
    const a = audioRef.current; if (!a || !m.url) return;
    if (playing?.id === m.id) { a.paused ? a.play().catch(() => {}) : a.pause(); return; }
    a.pause(); a.src = m.url; setPlaying(m); setTime({ cur: 0, dur: NaN }); setLoadingAudio(true);
    a.play().catch(() => setLoadingAudio(false));
  };
  const closePlayer = () => { const a = audioRef.current; if (a) { a.pause(); a.removeAttribute('src'); a.load(); } setPlaying(null); };

  const media = useQuery({ queryKey: ['attribution-media'], refetchOnWindowFocus: false, queryFn: async () => {
    const { data, error } = await rpc('list_marche_media_for_attribution'); if (error) throw new Error(error.message); return (data ?? []) as MediaItem[];
  }});
  const candidates = useQuery({ queryKey: ['attribution-candidates'], queryFn: async () => {
    const { data, error } = await rpc('list_attribution_candidates'); if (error) throw new Error(error.message); return (data ?? []) as Candidate[];
  }});

  const all = media.data ?? [];
  const doneCount = all.filter((m) => m.author_user_id).length;
  const marches = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((m) => m.marche_id && map.set(m.marche_id, m.nom_marche || m.ville || 'Marche sans nom'));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [all]);

  const visible = all.filter((m) => (tab === 'todo' ? !m.author_user_id : !!m.author_user_id)
    && (kindFilter === 'all' || m.kind === kindFilter) && (marcheFilter === 'all' || m.marche_id === marcheFilter));
  const groups = useMemo(() => {
    const g = new Map<string, MediaItem[]>();
    visible.forEach((m) => { const k = m.marche_id ?? 'none'; g.set(k, [...(g.get(k) ?? []), m]); });
    return [...g.entries()];
  }, [visible]);

  const selectedItems = all.filter((m) => selected.has(keyOf(m)));
  const selectedMarches = new Set(selectedItems.map((m) => m.marche_id).filter(Boolean) as string[]);

  const toggle = (m: MediaItem) => setSelected((s) => { const n = new Set(s); n.has(keyOf(m)) ? n.delete(keyOf(m)) : n.add(keyOf(m)); return n; });
  const toggleGroup = (items: MediaItem[]) => setSelected((s) => {
    const n = new Set(s); const allIn = items.every((i) => n.has(keyOf(i)));
    items.forEach((i) => (allIn ? n.delete(keyOf(i)) : n.add(keyOf(i)))); return n;
  });

  const assign = async (userId: string | null, items = selectedItems) => {
    setSaving(true);
    try {
      for (const kind of ['photo', 'audio'] as Kind[]) {
        const ids = items.filter((i) => i.kind === kind).map((i) => i.id);
        if (!ids.length) continue;
        const { error } = await rpc('assign_marche_media_author', { _kind: kind, _ids: ids, _user_id: userId });
        if (error) throw new Error(error.message);
      }
      toast.success(userId ? `${items.length} œuvre(s) attribuée(s)` : 'Attribution annulée');
      setSelected(new Set()); setSheetOpen(false); setSearch('');
      qc.invalidateQueries({ queryKey: ['attribution-media'] });
      qc.invalidateQueries({ queryKey: ['data-asset-stats-v2'] });
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  };

  const cands = candidates.data ?? [];
  const q = search.trim().toLowerCase();
  const suggested = cands.filter((c) => /les marches du vivant|gaspard boreal|gaspard boréal/i.test(c.name) || c.marche_ids?.some((id) => selectedMarches.has(id)));
  const shown = q ? cands.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 40) : suggested;

  return (
    <div className="min-h-screen bg-background pb-44">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon"><Link to="/admin/note-donnees" aria-label="Retour à la note"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <h1 className="text-lg font-semibold">Attribuer les œuvres</h1>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span><strong>{all.length - doneCount}</strong> à attribuer</span>
            <span className="text-muted-foreground">{doneCount} / {all.length} faites</span>
          </div>
          <Progress value={all.length ? (doneCount / all.length) * 100 : 0} />
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {(['todo', 'done'] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setSelected(new Set()); }}
              className={`rounded-md py-2 text-sm font-medium ${tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
              {t === 'todo' ? 'À attribuer' : 'Déjà attribuées'}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {([['all', 'Tout'], ['photo', 'Photos'], ['audio', 'Sons']] as const).map(([k, l]) => (
            <Button key={k} size="sm" variant={kindFilter === k ? 'default' : 'outline'} onClick={() => setKindFilter(k)}>{l}</Button>
          ))}
          <select value={marcheFilter} onChange={(e) => setMarcheFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm">
            <option value="all">Toutes les marches</option>
            {marches.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
          </select>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6 max-w-5xl mx-auto">
        {media.isLoading && <p className="text-muted-foreground">Chargement…</p>}
        {media.error && (<div className="text-center py-8 space-y-2"><p className="text-destructive">Impossible de charger les œuvres : {(media.error as Error).message}</p><Button variant="outline" onClick={() => media.refetch()}>Réessayer</Button></div>)}
        {media.isSuccess && visible.length === 0 && (
          <p className="text-center text-muted-foreground py-12">{tab === 'todo' ? 'Toutes les œuvres ont un auteur.' : 'Aucune œuvre attribuée pour l’instant.'}</p>
        )}
        {groups.map(([gid, items]) => {
          const f = items[0];
          const allIn = items.every((i) => selected.has(keyOf(i)));
          return (
            <section key={gid} className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-medium truncate">{f.nom_marche || f.ville || 'Marche sans nom'}</h2>
                  <p className="text-xs text-muted-foreground">{f.marche_date ? new Date(f.marche_date).toLocaleDateString('fr-FR') : 'Date inconnue'} · {items.length} œuvre(s)</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => toggleGroup(items)}>{allIn ? 'Désélectionner' : 'Tout sélectionner'}</Button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {items.map((m) => {
                  const sel = selected.has(keyOf(m));
                  return (
                    <div key={keyOf(m)} className={`relative rounded-lg overflow-hidden border-2 ${sel ? 'border-primary' : 'border-transparent'}`}>
                      <button onClick={() => toggle(m)} className="block w-full aspect-square bg-muted text-left" aria-pressed={sel}>
                        {m.kind === 'photo' && m.url ? (
                          <img src={m.url} alt={m.titre ?? ''} loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex flex-col items-center justify-end gap-0.5 p-1 pb-2 text-center">
                            <span className="text-[10px] line-clamp-2">{m.titre || m.nom_fichier}</span>
                            <span className="text-[9px] text-muted-foreground">{audioBadge(m)}</span>
                          </div>
                        )}
                        {sel && <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                        <span className="absolute top-1 left-1 rounded bg-background/80 p-0.5">{m.kind === 'photo' ? <ImageIcon className="h-3 w-3" /> : <Music className="h-3 w-3" />}</span>
                      </button>
                      {m.kind === 'audio' && m.url && (() => {
                        const isCur = playing?.id === m.id;
                        return (
                          <button type="button" onClick={(e) => { e.stopPropagation(); playItem(m); }}
                            aria-label={isCur && !isPaused ? 'Pause' : 'Écouter'}
                            className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                            {isCur && loadingAudio ? <Loader2 className="h-5 w-5 animate-spin" /> : isCur && !isPaused ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                          </button>
                        );
                      })()}
                      {tab === 'done' && (
                        <div className="flex items-center justify-between gap-1 bg-muted px-1 py-0.5">
                          <span className="text-[10px] truncate">{m.author_name || 'Compte'}</span>
                          <button aria-label="Annuler l’attribution" onClick={() => assign(null, [m])}><Undo2 className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30">
        {playing && (
          <div className="border-t border-border bg-card px-3 py-2 flex items-center gap-3">
            <button onClick={() => playItem(playing)} aria-label={isPaused ? 'Écouter' : 'Pause'}
              className="h-9 w-9 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              {loadingAudio ? <Loader2 className="h-4 w-4 animate-spin" /> : isPaused ? <Play className="h-4 w-4 ml-0.5" /> : <Pause className="h-4 w-4" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 text-xs">
                <span className="truncate font-medium">{playing.titre || playing.nom_fichier}</span>
                <span className="tabular-nums text-muted-foreground shrink-0">{loadingAudio && !time.cur ? 'chargement…' : `${fmtTime(time.cur)} / ${fmtTime(time.dur)}`}</span>
              </div>
              <input type="range" min={0} max={Number.isFinite(time.dur) ? time.dur : 0} step={0.1} value={time.cur}
                onChange={(e) => { const a = audioRef.current; if (a) a.currentTime = Number(e.target.value); }}
                className="w-full accent-primary" aria-label="Avancement" />
              <p className="text-[10px] text-muted-foreground truncate">{playing.nom_marche || playing.ville} · {audioBadge(playing)}</p>
            </div>
            <button onClick={closePlayer} aria-label="Fermer le lecteur"><X className="h-4 w-4" /></button>
          </div>
        )}
        {selected.size > 0 && (
          <div className="border-t border-border bg-background p-3 flex items-center gap-2">
            <span className="text-sm flex-1">{selected.size} sélectionnée(s)</span>
            <Button variant="ghost" onClick={() => setSelected(new Set())}>Effacer</Button>
            <Button onClick={() => setSheetOpen(true)}><UserRound className="h-4 w-4 mr-1" />{tab === 'todo' ? 'Attribuer à…' : 'Réattribuer à…'}</Button>
          </div>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader><SheetTitle>Attribuer {selected.size} œuvre(s) à…</SheetTitle></SheetHeader>
          <div className="relative my-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Chercher un marcheur" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {!q && <p className="text-xs text-muted-foreground mb-2">Suggestions : marcheurs de ces marches, association, G. Boréal</p>}
          <div className="space-y-1">
            {shown.map((c) => (
              <button key={c.user_id} disabled={saving} onClick={() => assign(c.user_id)}
                className="w-full flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-muted text-left">
                {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : <span className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><UserRound className="h-4 w-4" /></span>}
                <span className="flex-1 font-medium">{c.name || 'Sans nom'}</span>
                {c.marche_ids?.some((id) => selectedMarches.has(id)) && <span className="text-xs text-primary">a marché ici</span>}
              </button>
            ))}
            {shown.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Aucun marcheur trouvé.</p>}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
