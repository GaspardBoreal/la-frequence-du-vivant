import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, CornerDownLeft, Clock, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSitePages } from '@/hooks/useSitePages';
import { logSearch, getRecentSearches, pushRecentSearch } from '@/hooks/useGlobalSearch';
import {
  groupByUnivers, norm, resolveUnivers, searchPages,
  UNIVERS_META, UNIVERS_ORDER, type ScoredPage, type UniversKey,
} from '@/lib/search/siteSearch';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Surligne les termes trouvés, en ignorant les accents. */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const terms = norm(query).split(' ').filter(t => t.length >= 2);
  if (!terms.length) return <>{text}</>;
  const flat = norm(text);
  const marks = new Array(text.length).fill(false);
  // norm() peut décaler les index : on retombe sur une correspondance simple insensible aux accents.
  if (flat.length === text.length) {
    for (const t of terms) {
      let from = flat.indexOf(t);
      while (from !== -1) {
        for (let i = from; i < from + t.length; i++) marks[i] = true;
        from = flat.indexOf(t, from + t.length);
      }
    }
  }
  const out: React.ReactNode[] = [];
  let buffer = '';
  let current = marks[0] ?? false;
  const push = (i: number) => {
    if (!buffer) return;
    out.push(current
      ? <mark key={i} className="bg-transparent text-white font-semibold underline decoration-emerald-400/60 decoration-2 underline-offset-2">{buffer}</mark>
      : <span key={i}>{buffer}</span>);
    buffer = '';
  };
  for (let i = 0; i < text.length; i++) {
    if ((marks[i] ?? false) !== current) { push(i); current = marks[i] ?? false; }
    buffer += text[i];
  }
  push(text.length);
  return <>{out}</>;
};

export const SitePagesSearchOverlay: React.FC<Props> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<UniversKey | 'all'>('all');
  const [cursor, setCursor] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const { data, isLoading, error } = useSitePages();
  const pages = data?.pages ?? [];
  const rules = data?.rules ?? [];

  const results = useMemo(() => {
    const all = searchPages(pages, rules, query);
    return filter === 'all' ? all : all.filter(r => r.univers_resolved === filter);
  }, [pages, rules, query, filter]);

  const groups = useMemo(() => groupByUnivers(results), [results]);
  const flat = useMemo(() => groups.flatMap(g => g.items), [groups]);

  const counts = useMemo(() => {
    const c: Partial<Record<UniversKey, number>> = {};
    for (const r of searchPages(pages, rules, query)) {
      c[r.univers_resolved] = (c[r.univers_resolved] ?? 0) + 1;
    }
    return c;
  }, [pages, rules, query]);

  const portails = useMemo(() => {
    if (!pages.length) return [];
    const byUnivers = pages.map(p => ({ ...p, univers_resolved: resolveUnivers(p, rules), score: 0 })) as ScoredPage[];
    return UNIVERS_ORDER.map(u => ({
      univers: u,
      items: byUnivers
        .filter(p => p.univers_resolved === u)
        .sort((a, b) => Number(b.featured) - Number(a.featured) || b.priority - a.priority)
        .slice(0, 3),
    })).filter(g => g.items.length > 0);
  }, [pages, rules]);

  useEffect(() => {
    if (open) {
      setRecent(getRecentSearches());
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    setQuery('');
    setFilter('all');
    setCursor(0);
  }, [open]);

  useEffect(() => { setCursor(0); }, [query, filter]);

  const go = useCallback((page: ScoredPage) => {
    const q = query.trim();
    if (q.length >= 2) {
      pushRecentSearch(q);
      logSearch({ query: q, scope: 'global', resultsCount: flat.length, clickedKind: 'page', clickedId: page.id, route: page.path });
    }
    onClose();
    navigate(page.path);
  }, [query, flat.length, navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, Math.max(flat.length - 1, 0))); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
      else if (e.key === 'Enter' && flat[cursor]) { e.preventDefault(); go(flat[cursor]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, flat, cursor, go, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!open) return null;

  let index = -1;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="site-search"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[300]"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche dans le site"
      >
        <div className="absolute inset-0 bg-[#071713]/96 backdrop-blur-2xl" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(22)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-emerald-300/30"
              style={{ left: `${(i * 41) % 100}%`, top: `${(i * 29) % 100}%` }}
              animate={{ y: [0, -26, 0], opacity: [0.15, 0.6, 0.15] }}
              transition={{ duration: 5 + (i % 5), repeat: Infinity, delay: i * 0.17 }}
            />
          ))}
        </div>

        <motion.div
          initial={{ y: -16, opacity: 0, scale: 0.985 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-[max(env(safe-area-inset-top),1rem)]"
          onClick={e => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-emerald-300/70">
              Naviguer dans le site
            </span>
            <button
              onClick={onClose}
              aria-label="Fermer la recherche"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-emerald-100/80 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-400/10 to-lime-400/20 blur-xl" />
            <div className="relative flex items-center gap-3 rounded-2xl bg-[#0c2620]/85 px-4 py-4 shadow-[0_0_40px_-12px_rgba(45,212,168,0.45)] ring-1 ring-emerald-400/30 backdrop-blur-xl">
              <Search className="h-5 w-5 shrink-0 text-emerald-300" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Jardin, vignoble, marche, carte, entretien…"
                className="flex-1 bg-transparent text-lg font-light text-white outline-none placeholder:text-emerald-100/40"
                autoComplete="off"
                spellCheck={false}
              />
              {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" />}
            </div>
          </div>

          <div className="mt-3 -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
            <Chip active={filter === 'all'} onClick={() => setFilter('all')} label="Tous les univers" />
            {UNIVERS_ORDER.map(u => {
              const Icon = UNIVERS_META[u].icon;
              return (
                <Chip
                  key={u}
                  active={filter === u}
                  onClick={() => setFilter(filter === u ? 'all' : u)}
                  label={<span className="inline-flex items-center gap-1.5"><Icon className={cn('h-3.5 w-3.5', UNIVERS_META[u].accent)} />{UNIVERS_META[u].short}</span>}
                  count={counts[u]}
                />
              );
            })}

          </div>

          <div ref={listRef} className="mt-4 max-h-[62vh] overflow-y-auto pb-24 pr-1">
            {error && (
              <p className="py-10 text-center text-sm text-rose-200/80">
                La recherche est momentanément indisponible.
              </p>
            )}

            {!error && query.trim().length === 0 && (
              <div className="space-y-6 py-2">
                {recent.length > 0 && (
                  <div>
                    <Legend icon={Clock} label="Récent" />
                    <div className="flex flex-wrap gap-2">
                      {recent.map(r => (
                        <button
                          key={r}
                          onClick={() => setQuery(r)}
                          className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-emerald-100/80 ring-1 ring-white/10 transition hover:bg-emerald-500/20"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <Legend icon={Compass} label="Les cinq univers" />
                  <div className="space-y-3">
                    {portails.map(g => (
                      <div key={g.univers} className={cn('rounded-2xl bg-gradient-to-r to-transparent p-3 ring-1', UNIVERS_META[g.univers].glow, UNIVERS_META[g.univers].ring)}>
                        <p className={cn('mb-2 text-xs font-semibold uppercase tracking-widest', UNIVERS_META[g.univers].accent)}>
                          {UNIVERS_META[g.univers].emoji} {UNIVERS_META[g.univers].label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {g.items.map(p => (
                            <button
                              key={p.id}
                              onClick={() => go(p)}
                              className="rounded-full bg-white/5 px-3 py-1.5 text-left text-xs text-emerald-50/90 ring-1 ring-white/10 transition hover:bg-white/10"
                            >
                              {p.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!error && query.trim().length > 0 && flat.length === 0 && !isLoading && (
              <div className="py-12 text-center">
                <div className="mb-3 text-4xl">🌫️</div>
                <p className="text-sm text-emerald-100/60">
                  Aucune page pour <span className="text-emerald-200">« {query} »</span>
                </p>
                <p className="mt-1 text-xs text-emerald-100/30">Essayez un autre mot : jardin, vigne, marche, carte, sol…</p>
              </div>
            )}

            <div className="space-y-5">
              {groups.map(g => {
                const meta = UNIVERS_META[g.univers];
                return (
                  <div key={g.univers}>
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <span className="text-sm">{meta.emoji}</span>
                      <span className={cn('text-[0.7rem] font-semibold uppercase tracking-widest', meta.accent)}>{meta.label}</span>
                      <span className="text-[0.7rem] text-emerald-100/30">· {g.items.length}</span>
                    </div>
                    <div className="space-y-2">
                      {g.items.map(p => {
                        index += 1;
                        const active = index === cursor;
                        const myIndex = index;
                        return (
                          <motion.button
                            key={p.id}
                            data-active={active}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            onMouseEnter={() => setCursor(myIndex)}
                            onClick={() => go(p)}
                            className={cn(
                              'group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left ring-1 transition-all',
                              active
                                ? 'bg-white/[0.09] ring-emerald-400/40 shadow-[0_0_30px_-12px_rgba(45,212,168,0.5)]'
                                : 'bg-white/[0.03] ring-white/5 hover:bg-white/[0.07]',
                            )}
                          >
                            <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-base ring-1 ring-white/10')}>
                              {meta.emoji}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-emerald-50">
                                <Highlight text={p.title} query={query} />
                              </span>
                              {p.subtitle && (
                                <span className="block truncate text-xs italic text-emerald-100/50">
                                  <Highlight text={p.subtitle} query={query} />
                                </span>
                              )}
                              <span className="mt-0.5 block truncate text-[0.7rem] text-emerald-100/25">{p.path}</span>
                            </span>
                            {active && <CornerDownLeft className="mt-2 h-3.5 w-3.5 shrink-0 text-emerald-300/70" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-4 bottom-2 hidden justify-center gap-4 text-[0.65rem] text-emerald-100/30 md:flex">
            <span>↑ ↓ parcourir</span><span>⏎ ouvrir</span><span>Échap fermer</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
};

const Legend: React.FC<{ icon: React.ComponentType<any>; label: string }> = ({ icon: Icon, label }) => (
  <div className="mb-2 flex items-center gap-2 px-1">
    <Icon className="h-3.5 w-3.5 text-emerald-300/60" />
    <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-emerald-100/40">{label}</span>
  </div>
);

const Chip: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({ active, onClick, label, count }) => (
  <button
    onClick={onClick}
    className={cn(
      'shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition',
      active
        ? 'bg-emerald-400/20 text-emerald-50 ring-emerald-400/60'
        : 'bg-white/5 text-emerald-100/60 ring-white/10 hover:bg-white/10 hover:text-emerald-100',
    )}
  >
    {label}
    {count !== undefined && <span className="ml-1.5 text-emerald-100/40">{count}</span>}
  </button>
);

export default SitePagesSearchOverlay;
