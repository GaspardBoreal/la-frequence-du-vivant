import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ear,
  Play,
  Pause,
  MapPin,
  Sparkles,
  MessageCircle,
  Share2,
  Maximize2,
  Minimize2,
  ListMusic,
  Search,
  Quote,
  Music,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useExplorationAudioPlaylist, type AudioTrackEnhanced } from '@/hooks/useExplorationAudioPlaylist';
import { chatPageContext, useChatTabSnapshot } from '@/hooks/useChatPageContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  explorationId: string;
  isCurator: boolean;
}

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

const formatDurationLong = (s: number) => {
  if (!s) return '0 min';
  const total = Math.round(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return `${h} h ${m.toString().padStart(2, '0')}`;
  return `${m} min`;
};

// Palette d'ambiance par type littéraire
const literaryColors: Record<string, { bg: string; ring: string; label: string }> = {
  poeme: { bg: 'bg-purple-500/10', ring: 'ring-purple-500/30', label: 'Poème' },
  recit: { bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', label: 'Récit' },
  temoignage: { bg: 'bg-sky-500/10', ring: 'ring-sky-500/30', label: 'Témoignage' },
  chant: { bg: 'bg-rose-500/10', ring: 'ring-rose-500/30', label: 'Chant' },
  ambiance: { bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30', label: 'Ambiance' },
  default: { bg: 'bg-muted/40', ring: 'ring-border', label: 'Audio' },
};

const colorFor = (track: AudioTrackEnhanced) => {
  const key = (track.literary_type || track.type_audio || '').toLowerCase();
  const found = Object.keys(literaryColors).find((k) => key.includes(k));
  return literaryColors[found || 'default'];
};

// Mini equalizer animé
const Equalizer: React.FC<{ playing: boolean; bars?: number }> = ({ playing, bars = 24 }) => (
  <div className="flex items-end gap-[2px] h-6">
    {Array.from({ length: bars }).map((_, i) => (
      <motion.span
        key={i}
        className="w-[2px] rounded-full bg-primary/70"
        animate={{ height: playing ? [4, 14 + (i % 5) * 2, 6, 18, 8] : 4 }}
        transition={{
          duration: 0.9 + (i % 4) * 0.15,
          repeat: playing ? Infinity : 0,
          ease: 'easeInOut',
        }}
        style={{ height: 4 }}
      />
    ))}
  </div>
);

// Marker leaflet (note de musique)
const noteIcon = L.divIcon({
  className: '',
  html: `<div style="
    background:hsl(var(--primary));
    color:hsl(var(--primary-foreground));
    width:30px;height:30px;border-radius:9999px;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 4px 10px hsl(var(--primary)/0.4);
    font-size:14px;font-weight:600;
    border:2px solid hsl(var(--background));
  ">♪</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const OreilleCuration: React.FC<Props> = ({ explorationId, isCurator }) => {
  const mapKey = useId();
  const { audioPlaylist, totalDuration, totalMarches, isLoading } =
    useExplorationAudioPlaylist(explorationId);
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [marcheFilter, setMarcheFilter] = useState<number | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string | 'all'>('all');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [continuous, setContinuous] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filtres
  const filtered = useMemo(() => {
    return audioPlaylist.filter((t) => {
      if (marcheFilter !== 'all' && t.marcheIndex !== marcheFilter) return false;
      const tkey = (t.literary_type || t.type_audio || '').toLowerCase();
      if (typeFilter !== 'all' && !tkey.includes(typeFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${t.title} ${t.description || ''} ${t.marcheName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [audioPlaylist, marcheFilter, typeFilter, search]);

  // Marches uniques
  const marcheOptions = useMemo(() => {
    const map = new Map<number, string>();
    audioPlaylist.forEach((t) => map.set(t.marcheIndex, t.marcheName));
    return Array.from(map.entries()).map(([idx, name]) => ({ idx, name }));
  }, [audioPlaylist]);

  // Types uniques
  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    audioPlaylist.forEach((t) => {
      const k = (t.literary_type || t.type_audio || '').toLowerCase();
      Object.keys(literaryColors)
        .filter((c) => c !== 'default')
        .forEach((c) => k.includes(c) && set.add(c));
    });
    return Array.from(set);
  }, [audioPlaylist]);

  // Marqueurs carte (1 par marche avec audio)
  const mapPoints = useMemo(() => {
    const byMarche = new Map<number, AudioTrackEnhanced[]>();
    audioPlaylist.forEach((t) => {
      if (t.marcheLat && t.marcheLng) {
        const arr = byMarche.get(t.marcheIndex) || [];
        arr.push(t);
        byMarche.set(t.marcheIndex, arr);
      }
    });
    return Array.from(byMarche.entries()).map(([idx, tracks]) => ({
      idx,
      lat: tracks[0].marcheLat as number,
      lng: tracks[0].marcheLng as number,
      name: tracks[0].marcheName,
      count: tracks.length,
    }));
  }, [audioPlaylist]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (mapPoints.length === 0) return [45.0, 0.5];
    const lat = mapPoints.reduce((s, p) => s + p.lat, 0) / mapPoints.length;
    const lng = mapPoints.reduce((s, p) => s + p.lng, 0) / mapPoints.length;
    return [lat, lng];
  }, [mapPoints]);

  // Suggestions IA d'écoute (sélection statique pondérée)
  const suggestions = useMemo(() => {
    if (audioPlaylist.length === 0) return [];
    const buckets: { label: string; track: AudioTrackEnhanced }[] = [];
    const long = [...audioPlaylist].sort((a, b) => (b.duration || 0) - (a.duration || 0))[0];
    const short = [...audioPlaylist].sort((a, b) => (a.duration || 0) - (b.duration || 0))[0];
    const withTrans = audioPlaylist.find((t) => t.transcription_text && t.transcription_text.length > 40);
    if (long) buckets.push({ label: '🌊 Le plus immersif', track: long });
    if (withTrans) buckets.push({ label: '🪶 Le plus poétique', track: withTrans });
    if (short && short.id !== long?.id) buckets.push({ label: '⚡ Saisissant', track: short });
    return buckets.slice(0, 3);
  }, [audioPlaylist]);

  // Play / Pause
  const playTrack = (track: AudioTrackEnhanced) => {
    if (!audioRef.current) return;
    if (currentId === track.id) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      return;
    }
    setCurrentId(track.id);
    audioRef.current.src = track.url;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));

    // Update IA focus
    chatPageContext.setPageState({
      filters: { audioFocusId: track.id, audioFocusTitre: track.title, audioFocusMarche: track.marcheName },
    });
  };

  const onEnded = () => {
    setIsPlaying(false);
    if (continuous) {
      const idx = filtered.findIndex((t) => t.id === currentId);
      const next = filtered[idx + 1];
      if (next) {
        setTimeout(() => playTrack(next), 600);
      }
    }
  };

  // Deep link ?audio=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const aid = params.get('audio');
    if (aid && audioPlaylist.length > 0) {
      const t = audioPlaylist.find((x) => x.id === aid);
      if (t) setTimeout(() => playTrack(t), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPlaylist.length]);

  // Snapshot IA
  useChatTabSnapshot(
    'apprendre.oreille.audios',
    filtered.map((t) => ({
      id: t.id,
      titre: t.title,
      description: t.description,
      marche: t.marcheName,
      duree: t.duration,
      type: t.literary_type || t.type_audio,
      transcription_extrait: t.transcription_text?.slice(0, 240),
    })),
  );

  const sharedAudio = (track: AudioTrackEnhanced) => {
    const url = `${window.location.origin}${window.location.pathname}?audio=${track.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Lien copié', description: track.title });
  };

  const askAI = (track: AudioTrackEnhanced) => {
    chatPageContext.setPageState({
      filters: {
        audioFocusId: track.id,
        audioFocusTitre: track.title,
        audioFocusMarche: track.marcheName,
        chatPrompt: `Parle-moi de l'audio « ${track.title} » capté lors de ${track.marcheName}.`,
      },
    });
    toast({ title: 'Contexte envoyé à l\'IA', description: 'Ouvre le chat pour dialoguer sur ce son.' });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Chargement des sons…
      </div>
    );
  }

  if (audioPlaylist.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
        <Ear className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-semibold">Paysage sonore vide</p>
        <p className="text-xs text-muted-foreground mt-1">
          Aucun audio capté pour le moment sur cette exploration.
        </p>
      </div>
    );
  }

  const current = filtered.find((t) => t.id === currentId) || audioPlaylist.find((t) => t.id === currentId);

  return (
    <div className="space-y-4" data-chat-section="apprendre.oreille">
      <audio ref={audioRef} onEnded={onEnded} preload="metadata" />

      {/* Header synthétique */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Ear className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Paysage sonore</h3>
              <p className="text-xs text-muted-foreground">
                {audioPlaylist.length} enregistrement{audioPlaylist.length > 1 ? 's' : ''} ·{' '}
                {totalMarches} marche{totalMarches > 1 ? 's' : ''} · {formatDurationLong(totalDuration)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Equalizer playing={isPlaying} />
            <button
              onClick={() => {
                setContinuous((v) => !v);
                if (!continuous && filtered[0]) playTrack(filtered[0]);
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 ${
                continuous
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <ListMusic className="h-3.5 w-3.5" />
              {continuous ? 'Lecture continue' : 'Tout écouter'}
            </button>
            <button
              onClick={() => setImmersive(true)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted flex items-center gap-1.5"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Immersion
            </button>
          </div>
        </div>
      </div>

      {/* Cartographie sonore */}
      {mapPoints.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            Cartographie sonore
          </div>
          <div className="h-48 w-full">
            <MapContainer
              key={mapKey}
              center={mapCenter}
              zoom={10}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              {mapPoints.map((p) => (
                <Marker
                  key={p.idx}
                  position={[p.lat, p.lng]}
                  icon={noteIcon}
                  eventHandlers={{ click: () => setMarcheFilter(p.idx) }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold">{p.name}</div>
                      <div>{p.count} audio{p.count > 1 ? 's' : ''}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un titre, une description…"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={marcheFilter}
          onChange={(e) => setMarcheFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="text-xs rounded-full border border-border bg-card px-3 py-1.5"
        >
          <option value="all">Toutes les marches</option>
          {marcheOptions.map((m) => (
            <option key={m.idx} value={m.idx}>
              {m.name}
            </option>
          ))}
        </select>
        {typeOptions.length > 0 && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-full border border-border bg-card px-3 py-1.5"
          >
            <option value="all">Tous les types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {literaryColors[t]?.label || t}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-6">
            Aucun audio ne correspond à vos filtres.
          </div>
        ) : (
          filtered.map((track) => {
            const c = colorFor(track);
            const playing = currentId === track.id && isPlaying;
            return (
              <motion.div
                key={track.id}
                layout
                className={`rounded-xl border ring-1 p-3 transition ${c.bg} ${c.ring} ${
                  currentId === track.id ? 'border-primary/60' : 'border-border'
                }`}
                data-chat-audio-id={track.id}
                data-chat-audio-titre={track.title}
                data-chat-audio-marche={track.marcheName}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => playTrack(track)}
                    className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition"
                    aria-label={playing ? 'Pause' : 'Lecture'}
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold line-clamp-1">{track.title}</h4>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-background/70 rounded-full px-1.5 py-0.5">
                        {c.label}
                      </span>
                    </div>
                    {track.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {track.description}
                      </p>
                    )}
                    {track.transcription_text && (
                      <div className="mt-1.5 flex items-start gap-1.5 text-[11px] italic text-foreground/70">
                        <Quote className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary/70" />
                        <span className="line-clamp-2">
                          {track.transcription_text.slice(0, 160)}
                          {track.transcription_text.length > 160 ? '…' : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <button
                        onClick={() => setMarcheFilter(track.marcheIndex)}
                        className="text-[11px] flex items-center gap-1 text-primary hover:underline"
                      >
                        <MapPin className="h-3 w-3" />
                        {track.marcheName}
                      </button>
                      <span className="text-[11px] text-muted-foreground">
                        {formatTime(track.duration || 0)}
                      </span>
                      <button
                        onClick={() => askAI(track)}
                        className="text-[11px] flex items-center gap-1 text-muted-foreground hover:text-primary"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Discuter avec l'IA
                      </button>
                      <button
                        onClick={() => sharedAudio(track)}
                        className="text-[11px] flex items-center gap-1 text-muted-foreground hover:text-primary"
                      >
                        <Share2 className="h-3 w-3" />
                        Partager
                      </button>
                    </div>
                    {playing && (
                      <div className="mt-2">
                        <Equalizer playing bars={40} />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Mode immersion */}
      <AnimatePresence>
        {immersive && current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-gradient-to-br from-background via-primary/10 to-background backdrop-blur-md flex flex-col items-center justify-center p-6"
          >
            <button
              onClick={() => setImmersive(false)}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted"
              aria-label="Fermer"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <Music className="h-10 w-10 text-primary/70 mb-4" />
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2">
              {current.marcheName}
            </div>
            <h2 className="text-2xl sm:text-4xl font-semibold text-center max-w-2xl">
              {current.title}
            </h2>
            {current.description && (
              <p className="mt-3 text-sm text-muted-foreground text-center max-w-xl line-clamp-3">
                {current.description}
              </p>
            )}
            <div className="mt-8">
              <Equalizer playing={isPlaying} bars={64} />
            </div>
            <button
              onClick={() => playTrack(current)}
              className="mt-8 h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl hover:scale-105 transition"
            >
              {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="h-7 w-7 ml-1" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {isCurator && (
        <p className="text-[11px] text-muted-foreground text-center">
          Astuce curateur·rice : la sélection des audios mis en avant et leur ordre se gèrent depuis la marche.
        </p>
      )}
    </div>
  );
};

export default OreilleCuration;
