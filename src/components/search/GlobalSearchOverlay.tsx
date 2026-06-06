import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, X, Leaf, Sparkles, BookOpen, MessageCircle, User, MapPin, Clock, TrendingUp,
} from 'lucide-react';
import { useGlobalSearch, logSearch, pushRecentSearch, getRecentSearches, type SearchKind, type SearchResult } from '@/hooks/useGlobalSearch';
import { SearchResultCard } from './SearchResultCard';
import { cn } from '@/lib/utils';

const KIND_META: Record<SearchKind, { label: string; icon: React.ComponentType<any>; color: string; chip: string }> = {
  species:   { label: 'Espèces',     icon: Leaf,          color: 'text-emerald-300', chip: '🌿' },
  practice:  { label: 'Pratiques',   icon: Sparkles,      color: 'text-amber-300',   chip: '✨' },
  text:      { label: 'Textes',      icon: BookOpen,      color: 'text-sky-300',     chip: '📖' },
  testimony: { label: 'Témoignages', icon: MessageCircle, color: 'text-violet-300',  chip: '💬' },
  marcheur:  { label: 'Marcheurs',   icon: User,          color: 'text-rose-300',    chip: '👤' },
  event:     { label: 'Marches',     icon: MapPin,        color: 'text-teal-300',    chip: '🚶' },
};

const KIND_ORDER: SearchKind[] = ['species', 'practice', 'text', 'testimony', 'marcheur', 'event'];

interface Props {
  open: boolean;
  onClose: () => void;
  eventId?: string | null;
  marcheId?: string | null;
  scope?: 'global' | 'event' | 'admin';
}

export const GlobalSearchOverlay: React.FC<Props> = ({ open, onClose, eventId, marcheId, scope = 'global' }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchKind | 'all'>('all');
  const [scopeChoice, setScopeChoice] = useState<'all' | 'event'>(eventId ? 'event' : 'all');
  const inputRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const loggedRef = useRef<string>('');

  const effectiveEventId = scopeChoice === 'event' ? eventId : null;
  const { data: results = [], isFetching } = useGlobalSearch(query, effectiveEventId);

  // Focus input + reset on open
  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setActiveFilter('all');
    }
  }, [open]);

  // Keyboard close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Log debounced search (when query stabilizes & has results, log once per query)
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2 || isFetching) return;
    const key = `${q}|${effectiveEventId ?? ''}`;
    if (loggedRef.current === key) return;
    loggedRef.current = key;
    const t = setTimeout(() => {
      pushRecentSearch(q);
      setRecent(getRecentSearches());
      logSearch({
        query: q,
        eventId: effectiveEventId,
        marcheId: marcheId ?? null,
        scope: scopeChoice === 'event' ? 'event' : scope,
        resultsCount: results.length,
      });
    }, 700);
    return () => clearTimeout(t);
  }, [query, isFetching, results.length, effectiveEventId, marcheId, scope, scopeChoice, open]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: results.length };
    for (const r of results) c[r.kind] = (c[r.kind] ?? 0) + 1;
    return c;
  }, [results]);

  const filtered = activeFilter === 'all' ? results : results.filter(r => r.kind === activeFilter);

  const grouped = useMemo(() => {
    const g: Partial<Record<SearchKind, SearchResult[]>> = {};
    for (const r of filtered) {
      g[r.kind] = g[r.kind] ?? [];
      g[r.kind]!.push(r);
    }
    return g;
  }, [filtered]);

  const handleResultClick = (r: SearchResult) => {
    logSearch({
      query: query.trim(),
      eventId: effectiveEventId,
      marcheId: marcheId ?? null,
      scope: scopeChoice === 'event' ? 'event' : scope,
      resultsCount: results.length,
      clickedKind: r.kind,
      clickedId: r.id,
    });
    onClose();
    if (r.route) navigate(r.route);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[200]"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#0a1f1a]/95 backdrop-blur-2xl" />

        {/* Decorative particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-emerald-400/40"
              style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.7, 0.2] }}
              transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ y: -20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-emerald-300/70 text-xs uppercase tracking-[0.2em] font-semibold">
              Rechercher
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur ring-1 ring-white/10 flex items-center justify-center text-emerald-100/80 transition"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-400/10 to-emerald-500/20 blur-xl" />
            <div className="relative flex items-center gap-3 px-4 py-4 rounded-2xl bg-[#0d2a23]/80 ring-1 ring-emerald-400/30 backdrop-blur-xl shadow-[0_0_40px_-12px_rgba(45,212,168,0.4)]">
              <Search className="w-5 h-5 text-emerald-300 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Espèce, pratique, marcheur, texte…"
                className="flex-1 bg-transparent outline-none text-white placeholder:text-emerald-100/40 text-lg font-light"
                autoComplete="off"
                spellCheck={false}
              />
              {isFetching && <div className="w-4 h-4 rounded-full border-2 border-emerald-300/30 border-t-emerald-300 animate-spin" />}
            </div>
          </div>

          {/* Scope toggle (only when on an event page) */}
          {eventId && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <button
                onClick={() => setScopeChoice('event')}
                className={cn(
                  'px-3 py-1.5 rounded-full ring-1 transition',
                  scopeChoice === 'event'
                    ? 'bg-emerald-500/20 ring-emerald-400/50 text-emerald-100'
                    : 'bg-white/5 ring-white/10 text-emerald-100/60 hover:text-emerald-100'
                )}
              >
                Cette marche
              </button>
              <button
                onClick={() => setScopeChoice('all')}
                className={cn(
                  'px-3 py-1.5 rounded-full ring-1 transition',
                  scopeChoice === 'all'
                    ? 'bg-emerald-500/20 ring-emerald-400/50 text-emerald-100'
                    : 'bg-white/5 ring-white/10 text-emerald-100/60 hover:text-emerald-100'
                )}
              >
                Toutes mes marches
              </button>
            </div>
          )}

          {/* Filters */}
          {query.trim().length >= 2 && results.length > 0 && (
            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              <FilterChip
                active={activeFilter === 'all'}
                onClick={() => setActiveFilter('all')}
                label="Tous"
                count={counts.all}
              />
              {KIND_ORDER.filter(k => counts[k]).map(k => (
                <FilterChip
                  key={k}
                  active={activeFilter === k}
                  onClick={() => setActiveFilter(k)}
                  label={`${KIND_META[k].chip} ${KIND_META[k].label}`}
                  count={counts[k]}
                />
              ))}
            </div>
          )}

          {/* Results */}
          <div className="mt-4 max-h-[65vh] overflow-y-auto pr-1 -mr-1 pb-24">
            {query.trim().length < 2 && (
              <EmptyState recent={recent} onPick={setQuery} />
            )}

            {query.trim().length >= 2 && !isFetching && results.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🌫️</div>
                <p className="text-emerald-100/60 text-sm">Aucun résultat pour <span className="text-emerald-200">« {query} »</span></p>
                <p className="text-emerald-100/30 text-xs mt-1">Essayez un autre mot ou vérifiez l'orthographe</p>
              </div>
            )}

            <div className="space-y-5">
              {(activeFilter === 'all' ? KIND_ORDER : [activeFilter as SearchKind]).map(k => {
                const list = grouped[k];
                if (!list || list.length === 0) return null;
                const Meta = KIND_META[k];
                return (
                  <div key={k}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Meta.icon className={cn('w-3.5 h-3.5', Meta.color)} />
                      <span className="text-[0.7rem] uppercase tracking-widest text-emerald-100/40 font-semibold">
                        {Meta.label}
                      </span>
                      <span className="text-[0.7rem] text-emerald-100/30">· {list.length}</span>
                    </div>
                    <div className="space-y-2">
                      {list.map((r, idx) => (
                        <SearchResultCard
                          key={`${r.kind}-${r.id}-${idx}`}
                          result={r}
                          query={query}
                          onOpen={() => handleResultClick(r)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const FilterChip: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={cn(
      'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ring-1 transition whitespace-nowrap',
      active
        ? 'bg-emerald-400/20 ring-emerald-400/60 text-emerald-50 shadow-[0_0_20px_-4px_rgba(45,212,168,0.5)]'
        : 'bg-white/5 ring-white/10 text-emerald-100/60 hover:text-emerald-100 hover:bg-white/10'
    )}
  >
    {label}
    {count !== undefined && <span className="ml-1.5 text-emerald-100/40">{count}</span>}
  </button>
);

const ResultRow: React.FC<{ result: SearchResult; onClick: () => void }> = ({ result, onClick }) => {
  const Meta = KIND_META[result.kind];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="group w-full text-left px-3 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] ring-1 ring-white/5 hover:ring-emerald-400/30 transition-all flex items-start gap-3 hover:shadow-[0_0_30px_-12px_rgba(45,212,168,0.4)]"
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-white/10 bg-gradient-to-br from-white/5 to-transparent',
        Meta.color
      )}>
        <Meta.icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-emerald-50 font-medium truncate">{result.title}</div>
        {result.subtitle && (
          <div className="text-xs text-emerald-100/50 truncate italic">{result.subtitle}</div>
        )}
        {result.context && (
          <div className="text-[0.7rem] text-emerald-100/30 truncate mt-0.5">{result.context}</div>
        )}
      </div>
    </motion.button>
  );
};

const EmptyState: React.FC<{ recent: string[]; onPick: (q: string) => void }> = ({ recent, onPick }) => {
  const suggestions = ['Ortie', 'Mésange', 'Pivert', 'Témoignage', 'Pratique'];
  return (
    <div className="space-y-6 py-4">
      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2 px-1">
            <Clock className="w-3.5 h-3.5 text-emerald-300/60" />
            <span className="text-[0.7rem] uppercase tracking-widest text-emerald-100/40 font-semibold">Récent</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map(q => (
              <button
                key={q}
                onClick={() => onPick(q)}
                className="px-3 py-1.5 rounded-full text-sm bg-white/5 ring-1 ring-white/10 text-emerald-100/80 hover:bg-emerald-500/20 hover:ring-emerald-400/50 transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-300/60" />
          <span className="text-[0.7rem] uppercase tracking-widest text-emerald-100/40 font-semibold">Suggestions</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map(q => (
            <button
              key={q}
              onClick={() => onPick(q)}
              className="px-3 py-1.5 rounded-full text-sm bg-white/5 ring-1 ring-white/10 text-emerald-100/60 hover:bg-emerald-500/20 hover:ring-emerald-400/50 transition"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <p className="text-center text-emerald-100/30 text-xs italic pt-4">
        Tapez au moins 2 lettres — la forêt vous écoute 🌿
      </p>
    </div>
  );
};
