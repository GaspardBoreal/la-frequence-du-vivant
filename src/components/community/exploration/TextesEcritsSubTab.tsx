import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  BookOpenText, MapPin, Copy, Check, X, Share2,
  ChevronLeft, ChevronRight, Quote, Feather, Users, Footprints,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface TextesEcritsSubTabProps {
  explorationId?: string;
  marcheEventId?: string;
  onNavigateToMarche?: (marcheId: string) => void;
}

interface TexteRow {
  id: string;
  user_id: string;
  marche_id: string | null;
  marche_event_id: string;
  type_texte: string;
  titre: string;
  contenu: string;
  is_public: boolean;
  ordre: number | null;
  created_at: string;
  author_prenom?: string;
  author_nom?: string;
  author_avatar?: string | null;
}

interface AuthorInfo {
  user_id: string;
  prenom: string;
  nom: string;
  avatar_url: string | null;
}

interface MarcheInfo {
  id: string;
  nom_marche: string | null;
  ville: string;
  ordre: number;
}

type ViewMode = 'mur' | 'marcheurs' | 'itineraire';

// Pastilles de couleur selon l'ordre du point de marche (gradient estuaire → source)
const POINT_COLORS = [
  'from-cyan-400/30 to-teal-500/20',
  'from-teal-400/30 to-emerald-500/20',
  'from-emerald-400/30 to-green-500/20',
  'from-amber-400/30 to-orange-500/20',
  'from-rose-400/30 to-pink-500/20',
  'from-violet-400/30 to-purple-500/20',
  'from-indigo-400/30 to-blue-500/20',
];

const getPointColor = (ordre: number) => POINT_COLORS[ordre % POINT_COLORS.length];

const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

// ============================================================
// MAIN COMPONENT
// ============================================================

const TextesEcritsSubTab: React.FC<TextesEcritsSubTabProps> = ({
  explorationId, marcheEventId, onNavigateToMarche,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('mur');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: textes = [], isLoading } = useQuery({
    queryKey: ['textes-ecrits', marcheEventId, explorationId],
    queryFn: async () => {
      if (marcheEventId) {
        const { data, error } = await supabase.rpc('get_event_public_textes', {
          p_event_id: marcheEventId,
        });
        if (error) throw error;
        return (data || []) as unknown as TexteRow[];
      }
      if (explorationId) {
        const { data, error } = await supabase.rpc('get_exploration_public_textes', {
          p_exploration_id: explorationId,
        });
        if (error) throw error;
        return (data || []) as unknown as TexteRow[];
      }
      return [];
    },
    enabled: !!(marcheEventId || explorationId),
  });

  const authorMap = useMemo(() => {
    const m = new Map<string, AuthorInfo>();
    textes.forEach(t => {
      if (!m.has(t.user_id)) {
        m.set(t.user_id, {
          user_id: t.user_id,
          prenom: t.author_prenom || '',
          nom: t.author_nom || '',
          avatar_url: t.author_avatar ?? null,
        });
      }
    });
    return m;
  }, [textes]);

  const marcheIds = useMemo(
    () => [...new Set(textes.filter(t => t.marche_id).map(t => t.marche_id!))],
    [textes]
  );

  const { data: marches = [] } = useQuery({
    queryKey: ['textes-marches', explorationId, marcheIds],
    queryFn: async () => {
      if (!explorationId || !marcheIds.length) return [];
      const { data: links } = await supabase
        .from('exploration_marches')
        .select('marche_id, ordre')
        .eq('exploration_id', explorationId)
        .in('marche_id', marcheIds);
      if (!links?.length) return [];
      const { data: marchesData } = await supabase
        .from('marches')
        .select('id, nom_marche, ville')
        .in('id', marcheIds);
      if (!marchesData) return [];
      const ordreMap: Record<string, number> = {};
      links.forEach(l => { ordreMap[l.marche_id] = l.ordre ?? 0; });
      return marchesData.map(m => ({
        id: m.id,
        nom_marche: m.nom_marche,
        ville: m.ville,
        ordre: ordreMap[m.id] ?? 0,
      })).sort((a, b) => a.ordre - b.ordre) as MarcheInfo[];
    },
    enabled: !!explorationId && marcheIds.length > 0,
  });

  const marcheMap = useMemo(() => {
    const m = new Map<string, MarcheInfo>();
    marches.forEach(mc => m.set(mc.id, mc));
    return m;
  }, [marches]);

  const types = useMemo(
    () => [...new Set(textes.map(t => t.type_texte))].sort(),
    [textes]
  );

  // Filtered & ordered list according to current view
  const orderedTextes = useMemo(() => {
    let list = [...textes];
    if (filterType) list = list.filter(t => t.type_texte === filterType);

    if (viewMode === 'itineraire') {
      list.sort((a, b) => {
        const oa = a.marche_id ? marcheMap.get(a.marche_id)?.ordre ?? 99 : 99;
        const ob = b.marche_id ? marcheMap.get(b.marche_id)?.ordre ?? 99 : 99;
        return oa - ob;
      });
    } else if (viewMode === 'marcheurs') {
      list.sort((a, b) => {
        const na = `${authorMap.get(a.user_id)?.prenom || ''}`.toLowerCase();
        const nb = `${authorMap.get(b.user_id)?.prenom || ''}`.toLowerCase();
        return na.localeCompare(nb);
      });
    }
    return list;
  }, [textes, filterType, viewMode, marcheMap, authorMap]);

  // Auto-open from URL
  useEffect(() => {
    const texteId = searchParams.get('texte');
    if (texteId && orderedTextes.length) {
      const idx = orderedTextes.findIndex(t => t.id === texteId);
      if (idx >= 0) setSelectedIdx(idx);
    }
  }, [searchParams, orderedTextes]);

  // Auto-open from global search (`lfdv:focus` event with kind=text)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { kind?: string; id?: string };
      if (detail?.kind !== 'text' || !detail.id) return;
      const idx = orderedTextes.findIndex(t => t.id === detail.id);
      if (idx >= 0) setSelectedIdx(idx);
    };
    window.addEventListener('lfdv:focus', handler as EventListener);
    return () => window.removeEventListener('lfdv:focus', handler as EventListener);
  }, [orderedTextes]);

  const handleOpen = (idx: number) => {
    setSelectedIdx(idx);
    const t = orderedTextes[idx];
    if (t) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('texte', t.id);
        return next;
      }, { replace: true });
    }
  };

  const handleClose = () => {
    setSelectedIdx(null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('texte');
      return next;
    }, { replace: true });
  };

  const handleNav = (delta: number) => {
    if (selectedIdx === null) return;
    const next = selectedIdx + delta;
    if (next >= 0 && next < orderedTextes.length) handleOpen(next);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!textes.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center px-6"
      >
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 blur-xl" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary/15 to-transparent border border-primary/20 flex items-center justify-center">
            <Feather className="w-9 h-9 text-primary/70" />
          </div>
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground mb-2">
          Le silence du papier
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
          Aucune voix n'a encore été confiée à cette page. Les textes des marcheurs apparaîtront ici, comme autant d'éclats poétiques recueillis sur le chemin.
        </p>
      </motion.div>
    );
  }

  const selected = selectedIdx !== null ? orderedTextes[selectedIdx] : null;

  return (
    <div className="space-y-5 pb-8">
      {/* HERO */}
      <EcritHero
        textCount={textes.length}
        authorCount={authorMap.size}
        pointCount={marcheMap.size}
        authors={[...authorMap.values()]}
      />

      {/* SEGMENTED TOGGLE */}
      <SegmentedToggle viewMode={viewMode} onChange={setViewMode} />

      {/* TYPE FILTERS */}
      {types.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <FilterPill
            label="Tous"
            active={filterType === null}
            onClick={() => setFilterType(null)}
            count={textes.length}
          />
          {types.map(t => (
            <FilterPill
              key={t}
              label={t}
              active={filterType === t}
              onClick={() => setFilterType(t)}
              count={textes.filter(x => x.type_texte === t).length}
            />
          ))}
        </div>
      )}

      {/* VIEWS */}
      <AnimatePresence mode="wait">
        {viewMode === 'mur' && (
          <motion.div
            key="mur"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <MurMasonry
              textes={orderedTextes}
              authorMap={authorMap}
              marcheMap={marcheMap}
              onSelect={handleOpen}
            />
          </motion.div>
        )}

        {viewMode === 'marcheurs' && (
          <motion.div
            key="marcheurs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <MarcheursVue
              textes={orderedTextes}
              authorMap={authorMap}
              marcheMap={marcheMap}
              onSelect={handleOpen}
            />
          </motion.div>
        )}

        {viewMode === 'itineraire' && (
          <motion.div
            key="itineraire"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ItineraireVue
              textes={orderedTextes}
              authorMap={authorMap}
              marcheMap={marcheMap}
              onSelect={handleOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMMERSIVE READER */}
      <LectureImmersive
        texte={selected}
        author={selected ? authorMap.get(selected.user_id) : undefined}
        marche={selected?.marche_id ? marcheMap.get(selected.marche_id) : undefined}
        currentIdx={selectedIdx ?? 0}
        total={orderedTextes.length}
        onClose={handleClose}
        onPrev={() => handleNav(-1)}
        onNext={() => handleNav(1)}
        onNavigateToMarche={onNavigateToMarche}
      />
    </div>
  );
};

// ============================================================
// HERO
// ============================================================

const EcritHero: React.FC<{
  textCount: number;
  authorCount: number;
  pointCount: number;
  authors: AuthorInfo[];
}> = ({ textCount, authorCount, pointCount, authors }) => (
  <motion.div
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-transparent p-5 sm:p-6"
  >
    {/* decorative quote */}
    <Quote className="absolute -top-2 -right-2 w-24 h-24 text-primary/5 rotate-12" strokeWidth={1} />

    <div className="relative">
      <div className="flex items-center gap-2 mb-2">
        <Feather className="w-4 h-4 text-primary" />
        <span className="text-[11px] uppercase tracking-[0.18em] text-primary/80 font-medium">
          Le cœur · écrits des marcheurs
        </span>
      </div>

      <p className="font-serif italic text-base sm:text-lg text-foreground/85 leading-snug mb-4 max-w-md">
        « Ce que les marcheurs ont confié au papier. »
      </p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <Stat value={authorCount} label={authorCount > 1 ? 'voix' : 'voix'} />
        <span className="text-border">·</span>
        <Stat value={textCount} label={textCount > 1 ? 'écrits' : 'écrit'} />
        <span className="text-border">·</span>
        <Stat value={pointCount} label={pointCount > 1 ? 'points de marche' : 'point'} />
      </div>

      {/* Avatars row */}
      {authors.length > 0 && (
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto scrollbar-none -mx-1 px-1">
          {authors.slice(0, 12).map(a => (
            <AuthorAvatar key={a.user_id} author={a} size="sm" />
          ))}
          {authors.length > 12 && (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[9px] text-muted-foreground font-medium shrink-0">
              +{authors.length - 12}
            </div>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex items-baseline gap-1.5">
    <span className="font-serif text-xl font-semibold text-foreground tabular-nums">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

// ============================================================
// SEGMENTED TOGGLE
// ============================================================

const SegmentedToggle: React.FC<{
  viewMode: ViewMode;
  onChange: (v: ViewMode) => void;
}> = ({ viewMode, onChange }) => {
  const options: { key: ViewMode; label: string; icon: React.ElementType }[] = [
    { key: 'mur', label: 'Mur', icon: BookOpenText },
    { key: 'marcheurs', label: 'Marcheurs', icon: Users },
    { key: 'itineraire', label: 'Itinéraire', icon: Footprints },
  ];

  return (
    <div className="relative grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-2xl border border-border/40">
      {options.map(opt => {
        const Icon = opt.icon;
        const active = viewMode === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="relative py-2 px-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {active && (
              <motion.div
                layoutId="seg-pill"
                className="absolute inset-0 bg-background shadow-sm rounded-xl border border-border/50"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon className={cn('w-3.5 h-3.5 relative z-10 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} />
            <span className={cn('relative z-10 transition-colors', active ? 'text-foreground' : 'text-muted-foreground')}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const FilterPill: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}> = ({ label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={cn(
      'shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-all border',
      active
        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
        : 'bg-background/60 text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground'
    )}
  >
    {label}
    <span className={cn('ml-1.5 text-[10px]', active ? 'opacity-70' : 'opacity-50')}>
      {count}
    </span>
  </button>
);

// ============================================================
// MUR MASONRY
// ============================================================

const MurMasonry: React.FC<{
  textes: TexteRow[];
  authorMap: Map<string, AuthorInfo>;
  marcheMap: Map<string, MarcheInfo>;
  onSelect: (idx: number) => void;
}> = ({ textes, authorMap, marcheMap, onSelect }) => (
  <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [column-fill:_balance]">
    {textes.map((t, idx) => (
      <CitationCard
        key={t.id}
        texte={t}
        author={authorMap.get(t.user_id)}
        marche={t.marche_id ? marcheMap.get(t.marche_id) : undefined}
        index={idx}
        onClick={() => onSelect(idx)}
      />
    ))}
  </div>
);

const CitationCard: React.FC<{
  texte: TexteRow;
  author?: AuthorInfo;
  marche?: MarcheInfo;
  index: number;
  onClick: () => void;
}> = ({ texte, author, marche, index, onClick }) => {
  const content = stripHtml(texte.contenu);
  const ordre = marche?.ordre ?? 0;
  const gradient = getPointColor(ordre);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.6) }}
      onClick={onClick}
      data-focus-id={`text:${texte.id}`}
      className={cn(
        'group relative w-full mb-3 break-inside-avoid text-left',
        'rounded-2xl overflow-hidden',
        'bg-card/80 backdrop-blur-sm border border-border/60',
        'hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5',
        'transition-all duration-300'
      )}
    >
      {/* Top gradient stripe (couleur du point) */}
      <div className={cn('h-1 bg-gradient-to-r', gradient)} />

      {/* Folded corner decoration */}
      <div className="absolute top-0 right-0 w-6 h-6 bg-gradient-to-bl from-background/40 to-transparent border-l border-b border-border/20" />

      <div className="p-4 sm:p-5">
        {/* Type badge */}
        <div className="flex items-center justify-between mb-2.5">
          <span className="px-2 py-0.5 rounded-full bg-primary/8 text-primary text-[10px] font-medium tracking-wide uppercase">
            {texte.type_texte}
          </span>
          <Quote className="w-3.5 h-3.5 text-primary/30 group-hover:text-primary/60 transition-colors" />
        </div>

        {/* Title */}
        <h4 className="font-serif text-base sm:text-lg font-semibold text-foreground leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {texte.titre}
        </h4>

        {/* Excerpt — italic serif */}
        <p className="font-serif italic text-sm text-foreground/70 leading-relaxed line-clamp-5">
          {content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
          <div className="flex items-center gap-2 min-w-0">
            <AuthorAvatar author={author} size="sm" />
            <span className="text-[11px] text-muted-foreground truncate">
              {author?.prenom} {author?.nom}
            </span>
          </div>
          {marche && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80 shrink-0 ml-2">
              <MapPin className="w-2.5 h-2.5" />
              <span className="max-w-[80px] truncate">{marche.nom_marche || marche.ville}</span>
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// ============================================================
// MARCHEURS VUE — Page d'auteur
// ============================================================

const MarcheursVue: React.FC<{
  textes: TexteRow[];
  authorMap: Map<string, AuthorInfo>;
  marcheMap: Map<string, MarcheInfo>;
  onSelect: (idx: number) => void;
}> = ({ textes, authorMap, marcheMap, onSelect }) => {
  const grouped = useMemo(() => {
    const m = new Map<string, { author?: AuthorInfo; items: { texte: TexteRow; idx: number }[] }>();
    textes.forEach((t, idx) => {
      const g = m.get(t.user_id) || { author: authorMap.get(t.user_id), items: [] };
      g.items.push({ texte: t, idx });
      m.set(t.user_id, g);
    });
    return [...m.values()];
  }, [textes, authorMap]);

  return (
    <div className="space-y-6">
      {grouped.map(({ author, items }) => (
        <motion.div
          key={author?.user_id || 'anon'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden"
        >
          {/* Author header */}
          <div className="relative p-5 sm:p-6 bg-gradient-to-br from-primary/8 to-transparent border-b border-border/40">
            <div className="flex items-center gap-3">
              <AuthorAvatar author={author} size="lg" />
              <div className="min-w-0">
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground leading-tight">
                  {author?.prenom} {author?.nom}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {items.length} écrit{items.length > 1 ? 's' : ''} confié{items.length > 1 ? 's' : ''} au papier
                </p>
              </div>
            </div>
          </div>

          {/* Texts list */}
          <div className="p-3 sm:p-4 space-y-2">
            {items.map(({ texte, idx }) => (
              <CompactTexteRow
                key={texte.id}
                texte={texte}
                marche={texte.marche_id ? marcheMap.get(texte.marche_id) : undefined}
                onClick={() => onSelect(idx)}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const CompactTexteRow: React.FC<{
  texte: TexteRow;
  marche?: MarcheInfo;
  onClick: () => void;
}> = ({ texte, marche, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3 sm:p-4 rounded-xl bg-background/60 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
  >
    <div className="flex items-start gap-3">
      <div className={cn(
        'shrink-0 w-1 self-stretch rounded-full bg-gradient-to-b',
        getPointColor(marche?.ordre ?? 0)
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px] uppercase tracking-wider text-primary/80 font-medium">
            {texte.type_texte}
          </span>
          {marche && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <MapPin className="w-2.5 h-2.5" />
              {marche.nom_marche || marche.ville}
            </span>
          )}
        </div>
        <h4 className="font-serif font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
          {texte.titre}
        </h4>
        <p className="font-serif italic text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {stripHtml(texte.contenu)}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
    </div>
  </button>
);

// ============================================================
// ITINÉRAIRE VUE — Timeline verticale par point de marche
// ============================================================

const ItineraireVue: React.FC<{
  textes: TexteRow[];
  authorMap: Map<string, AuthorInfo>;
  marcheMap: Map<string, MarcheInfo>;
  onSelect: (idx: number) => void;
}> = ({ textes, authorMap, marcheMap, onSelect }) => {
  const grouped = useMemo(() => {
    const m = new Map<string, { marche?: MarcheInfo; items: { texte: TexteRow; idx: number }[] }>();
    textes.forEach((t, idx) => {
      const key = t.marche_id || 'unknown';
      const g = m.get(key) || { marche: t.marche_id ? marcheMap.get(t.marche_id) : undefined, items: [] };
      g.items.push({ texte: t, idx });
      m.set(key, g);
    });
    return [...m.values()].sort((a, b) => (a.marche?.ordre ?? 99) - (b.marche?.ordre ?? 99));
  }, [textes, marcheMap]);

  return (
    <div className="relative pl-6 sm:pl-8">
      {/* Vertical dotted line */}
      <div className="absolute left-2 sm:left-3 top-2 bottom-2 w-px border-l-2 border-dotted border-primary/25" />

      <div className="space-y-7">
        {grouped.map(({ marche, items }, gIdx) => (
          <motion.div
            key={marche?.id || `g-${gIdx}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: gIdx * 0.05 }}
            className="relative"
          >
            {/* Dot on the line */}
            <div className={cn(
              'absolute -left-[26px] sm:-left-[30px] top-1 w-5 h-5 rounded-full border-2 border-background bg-gradient-to-br shadow-sm',
              getPointColor(marche?.ordre ?? 0)
            )}>
              <div className="absolute inset-1 rounded-full bg-primary/60" />
            </div>

            {/* Header */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-[0.15em] text-primary/70 font-medium mb-0.5">
                Étape {(marche?.ordre ?? 0) + 1}
              </div>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-foreground leading-tight">
                {marche?.nom_marche || marche?.ville || 'Point inconnu'}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {items.length} écrit{items.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Texts */}
            <div className="space-y-2">
              {items.map(({ texte, idx }) => {
                const author = authorMap.get(texte.user_id);
                return (
                  <button
                    key={texte.id}
                    onClick={() => onSelect(idx)}
                    className="w-full text-left p-3 rounded-xl bg-card/60 border border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] uppercase tracking-wider text-primary/80 font-medium">
                        {texte.type_texte}
                      </span>
                      <span className="text-border">·</span>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <AuthorAvatar author={author} size="xs" />
                        <span className="text-[10px] text-muted-foreground truncate">
                          {author?.prenom} {author?.nom}
                        </span>
                      </div>
                    </div>
                    <h4 className="font-serif font-semibold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                      {texte.titre}
                    </h4>
                    <p className="font-serif italic text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {stripHtml(texte.contenu)}
                    </p>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// LECTURE IMMERSIVE
// ============================================================

const LectureImmersive: React.FC<{
  texte: TexteRow | null;
  author?: AuthorInfo;
  marche?: MarcheInfo;
  currentIdx: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNavigateToMarche?: (marcheId: string) => void;
}> = ({ texte, author, marche, currentIdx, total, onClose, onPrev, onNext, onNavigateToMarche }) => {
  const [copied, setCopied] = useState(false);
  const open = !!texte;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll on text change
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setCopied(false);
  }, [texte?.id]);

  const handleShare = async () => {
    if (!texte) return;
    const url = `${window.location.origin}${window.location.pathname}?texte=${texte.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: texte.titre, text: stripHtml(texte.contenu).slice(0, 140), url });
        return;
      } catch {/* fallback */}
    }
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success('Lien copié');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDragEnd = (_e: any, info: PanInfo) => {
    if (info.offset.x < -80 && currentIdx < total - 1) onNext();
    else if (info.offset.x > 80 && currentIdx > 0) onPrev();
  };

  const content = texte ? stripHtml(texte.contenu) : '';
  const firstChar = content.charAt(0);
  const restContent = content.slice(1);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="bottom"
        className="h-[100dvh] sm:h-[95vh] sm:max-w-2xl sm:mx-auto sm:rounded-t-3xl p-0 border-t border-primary/20 bg-gradient-to-b from-background via-background to-primary/[0.02] overflow-hidden"
      >
        {texte && (
          <motion.div
            key={texte.id}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="h-full flex flex-col"
          >
            {/* Sticky Header */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-border/40 bg-background/80 backdrop-blur-md">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <AuthorAvatar author={author} size="sm" />
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-foreground truncate">
                    {author?.prenom} {author?.nom}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-primary/70">
                    {texte.type_texte}
                  </div>
                </div>
              </div>

              {total > 1 && (
                <div className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                  {currentIdx + 1} / {total}
                </div>
              )}

              <button
                onClick={onClose}
                className="shrink-0 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
              <article className="max-w-xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
                {/* Quote mark */}
                <Quote className="w-10 h-10 text-primary/15 mb-3" strokeWidth={1.5} />

                {/* Title */}
                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-foreground leading-tight mb-6 sm:mb-8">
                  {texte.titre}
                </h1>

                {/* Body with drop cap */}
                <div className="font-serif text-[17px] sm:text-lg leading-[1.85] text-foreground/90 whitespace-pre-line">
                  <span className="float-left font-serif text-6xl sm:text-7xl leading-[0.85] mr-2 mt-1 text-primary font-bold">
                    {firstChar}
                  </span>
                  {restContent}
                </div>

                {/* Decorative separator */}
                <div className="flex items-center justify-center gap-3 my-10">
                  <div className="h-px w-10 bg-border" />
                  <Feather className="w-3.5 h-3.5 text-primary/40" />
                  <div className="h-px w-10 bg-border" />
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                  {marche && (
                    <button
                      onClick={() => {
                        if (onNavigateToMarche && texte.marche_id) {
                          onClose();
                          onNavigateToMarche(texte.marche_id);
                        }
                      }}
                      disabled={!onNavigateToMarche}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/8 border border-primary/20',
                        onNavigateToMarche
                          ? 'text-primary hover:bg-primary/15 cursor-pointer'
                          : 'text-muted-foreground cursor-default'
                      )}
                    >
                      <MapPin className="w-3 h-3" />
                      {marche.nom_marche || marche.ville}
                    </button>
                  )}
                  <span className="text-muted-foreground/60">
                    {new Date(texte.created_at).toLocaleDateString('fr-FR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </div>
              </article>
            </div>

            {/* Footer Actions */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 sm:px-6 py-3 border-t border-border/40 bg-background/80 backdrop-blur-md">
              <button
                onClick={onPrev}
                disabled={currentIdx === 0}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Précédent</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                {copied ? 'Lien copié' : 'Partager'}
              </button>

              <button
                onClick={onNext}
                disabled={currentIdx >= total - 1}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <span className="hidden sm:inline">Suivant</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </SheetContent>
    </Sheet>
  );
};

// ============================================================
// AVATAR
// ============================================================

const AuthorAvatar: React.FC<{
  author?: AuthorInfo;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ author, size = 'md' }) => {
  const dim = {
    xs: 'w-5 h-5 text-[8px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-14 h-14 text-base',
  }[size];

  if (author?.avatar_url) {
    return (
      <img
        src={author.avatar_url}
        alt={`${author.prenom} ${author.nom}`}
        className={cn(dim, 'rounded-full object-cover ring-2 ring-background shrink-0')}
      />
    );
  }

  const initials = `${(author?.prenom || '?')[0]}${(author?.nom || '')[0] || ''}`.toUpperCase();
  return (
    <div className={cn(
      dim,
      'rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20',
      'flex items-center justify-center text-primary font-semibold ring-2 ring-background shrink-0'
    )}>
      {initials}
    </div>
  );
};

export default TextesEcritsSubTab;
