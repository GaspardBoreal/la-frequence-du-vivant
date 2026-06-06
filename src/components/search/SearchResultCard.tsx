import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown, MapPin, Calendar, Sparkles, User, Leaf, BookOpen,
  MessageCircle, Tag, ArrowUpRight, PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchKind, SearchResult } from '@/hooks/useGlobalSearch';

const KIND_FALLBACK_ICON: Record<SearchKind, React.ComponentType<any>> = {
  species: Leaf,
  practice: Sparkles,
  text: BookOpen,
  testimony: MessageCircle,
  marcheur: User,
  event: MapPin,
};

const KIND_TINT: Record<SearchKind, string> = {
  species: 'from-emerald-500/30 to-teal-500/10 text-emerald-200',
  practice: 'from-amber-500/30 to-orange-500/10 text-amber-200',
  text: 'from-sky-500/30 to-indigo-500/10 text-sky-200',
  testimony: 'from-violet-500/30 to-fuchsia-500/10 text-violet-200',
  marcheur: 'from-rose-500/30 to-pink-500/10 text-rose-200',
  event: 'from-teal-500/30 to-cyan-500/10 text-teal-200',
};

/* ------------------------------- helpers ------------------------------- */

function formatRelative(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff < 0) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (diff === 0) return "aujourd'hui";
  if (diff === 1) return 'hier';
  if (diff < 7) return `il y a ${diff} j`;
  if (diff < 30) return `il y a ${Math.floor(diff / 7)} sem.`;
  if (diff < 365) return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  return d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

function Chip({ icon: Icon, children, tone = 'default' }: {
  icon: React.ComponentType<any>;
  children: React.ReactNode;
  tone?: 'default' | 'accent';
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] ring-1 backdrop-blur whitespace-nowrap',
      tone === 'accent'
        ? 'bg-emerald-400/15 ring-emerald-400/40 text-emerald-100'
        : 'bg-white/5 ring-white/10 text-emerald-100/70'
    )}>
      <Icon className="w-3 h-3 opacity-80" />
      {children}
    </span>
  );
}

/** Highlight all (case + accent-insensitive) occurrences of `q` in `text` */
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q || q.length < 2) return <>{text}</>;
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const nText = normalize(text);
  const nQ = normalize(q);
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = nText.indexOf(nQ, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={idx} className="bg-emerald-400/30 text-emerald-50 rounded px-0.5">
        {text.slice(idx, idx + nQ.length)}
      </mark>
    );
    i = idx + nQ.length;
  }
  return <>{parts}</>;
}

/* ------------------------------- card ------------------------------- */

interface Props {
  result: SearchResult;
  query: string;
  onOpen: (opts?: { marcheId?: string | null; explorationId?: string | null; eventId?: string | null }) => void;
}

export const SearchResultCard: React.FC<Props> = ({ result, query, onOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = (result.meta ?? {}) as any;
  const FallbackIcon = KIND_FALLBACK_ICON[result.kind];

  /* -------- thumbnail -------- */
  const thumbUrl: string | null =
    result.kind === 'species' ? meta.thumb_url ?? null :
    result.kind === 'event' ? meta.cover_image_url ?? null :
    result.kind === 'marcheur' ? meta.avatar_url ?? null :
    null;

  /* -------- chips line -------- */
  const chips: React.ReactNode[] = [];

  if (result.kind === 'species') {
    const first = (meta.recent_contexts ?? [])[0];
    if (first?.nom_marche || first?.ville) {
      chips.push(
        <Chip key="loc" icon={MapPin}>
          {first.nom_marche || first.ville}
        </Chip>
      );
    }
    const rel = formatRelative(meta.last_observation_date);
    if (rel) chips.push(<Chip key="date" icon={Calendar}>{rel}</Chip>);
    if ((meta.marches_count ?? 0) > 1) {
      chips.push(
        <Chip key="count" icon={Leaf} tone="accent">
          Vue {meta.occurrences}× · {meta.marches_count} marches
        </Chip>
      );
    } else if (first?.marcheur) {
      chips.push(<Chip key="who" icon={User}>{first.marcheur}</Chip>);
    }
  } else if (result.kind === 'text') {
    if (meta.nom_marche || meta.ville) {
      chips.push(<Chip key="loc" icon={MapPin}>{meta.nom_marche || meta.ville}</Chip>);
    }
    const rel = formatRelative(meta.date_marche);
    if (rel) chips.push(<Chip key="date" icon={Calendar}>{rel}</Chip>);
    if (meta.type_texte) chips.push(<Chip key="type" icon={PenLine}>{meta.type_texte}</Chip>);
  } else if (result.kind === 'testimony') {
    if (meta.marche_title || meta.lieu) {
      chips.push(<Chip key="loc" icon={MapPin}>{meta.marche_title || meta.lieu}</Chip>);
    }
    const rel = formatRelative(meta.date_marche);
    if (rel) chips.push(<Chip key="date" icon={Calendar}>{rel}</Chip>);
    if (meta.author_name) chips.push(<Chip key="who" icon={User}>{meta.author_name}</Chip>);
  } else if (result.kind === 'practice') {
    if (meta.exploration_name) {
      chips.push(<Chip key="loc" icon={MapPin}>{meta.exploration_name}</Chip>);
    }
    if (meta.category) chips.push(<Chip key="cat" icon={Tag}>{meta.category}</Chip>);
  } else if (result.kind === 'marcheur') {
    if (meta.ville) chips.push(<Chip key="loc" icon={MapPin}>{meta.ville}</Chip>);
    if (meta.role) chips.push(<Chip key="role" icon={Tag} tone="accent">{meta.role}</Chip>);
    if ((meta.marches_count ?? 0) > 0) {
      chips.push(<Chip key="m" icon={Leaf}>{meta.marches_count} marches</Chip>);
    }
  } else if (result.kind === 'event') {
    if (meta.lieu) chips.push(<Chip key="loc" icon={MapPin}>{meta.lieu}</Chip>);
    const rel = formatRelative(meta.date_marche);
    if (rel) chips.push(<Chip key="date" icon={Calendar}>{rel}</Chip>);
    if (meta.event_type) chips.push(<Chip key="type" icon={Tag}>{meta.event_type}</Chip>);
  }

  /* -------- title / subtitle -------- */
  const titleNode =
    result.kind === 'text' || result.kind === 'testimony'
      ? <Highlight text={result.title} q={query} />
      : result.title;

  const subtitleNode =
    result.kind === 'text' || result.kind === 'testimony'
      ? (meta.excerpt
          ? <em className="text-emerald-100/60">« <Highlight text={String(meta.excerpt)} q={query} /> »</em>
          : null)
      : result.subtitle;

  const hasExpand =
    (result.kind === 'species' && (meta.recent_contexts ?? []).length > 0) ||
    ((result.kind === 'text' || result.kind === 'testimony') && meta.excerpt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'rounded-xl bg-white/[0.03] ring-1 ring-white/5 transition-all',
        'hover:bg-white/[0.06] hover:ring-emerald-400/30 hover:shadow-[0_0_30px_-12px_rgba(45,212,168,0.4)]'
      )}
    >
      <div className="flex items-start gap-3 p-2.5">
        {/* thumb */}
        <div className={cn(
          'w-11 h-11 shrink-0 rounded-lg overflow-hidden ring-1 ring-white/10 bg-gradient-to-br flex items-center justify-center',
          KIND_TINT[result.kind]
        )}>
          {thumbUrl ? (
            <img src={thumbUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <FallbackIcon className="w-5 h-5" />
          )}
        </div>

        {/* body */}
        <button
          type="button"
          onClick={hasExpand ? () => setExpanded(e => !e) : () => onOpen()}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-1.5">
            <div className="text-sm text-emerald-50 font-medium truncate">{titleNode}</div>
            {hasExpand && (
              <ChevronDown className={cn(
                'w-3.5 h-3.5 text-emerald-300/60 transition-transform shrink-0',
                expanded && 'rotate-180'
              )} />
            )}
          </div>
          {subtitleNode && (
            <div className="text-xs text-emerald-100/50 truncate italic mt-0.5">
              {subtitleNode}
            </div>
          )}
          {chips.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">{chips}</div>
          )}
        </button>

        {/* CTA arrow (always visible, opens the fiche) */}
        <button
          onClick={() => onOpen()}
          aria-label="Ouvrir la fiche"
          className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-emerald-500/25 ring-1 ring-white/10 hover:ring-emerald-400/50 text-emerald-100/70 hover:text-emerald-50 transition"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* expanded panel */}
      <AnimatePresence initial={false}>
        {expanded && hasExpand && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/5">
              {result.kind === 'species' && (meta.recent_contexts ?? []).map((c: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpen({
                      marcheId: c.marche_id ?? null,
                      explorationId: c.exploration_id ?? null,
                      eventId: c.event_id ?? null,
                    });
                  }}
                  className="w-full flex items-center justify-between gap-2 text-xs px-2 py-2 rounded-lg bg-white/[0.03] hover:bg-emerald-500/15 ring-1 ring-white/5 hover:ring-emerald-400/40 text-left transition group/row"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-emerald-100/90 truncate">
                      {c.nom_marche || c.ville || '—'}
                    </div>
                    <div className="text-emerald-100/40 truncate">
                      {[formatRelative(c.date), c.marcheur, `${c.count} obs`, c.event_title].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300/50 group-hover/row:text-emerald-200 shrink-0" />
                </button>
              ))}

              {(result.kind === 'text' || result.kind === 'testimony') && meta.excerpt && (
                <p className="text-xs text-emerald-100/70 italic leading-relaxed">
                  « <Highlight text={String(meta.excerpt)} q={query} /> »
                </p>
              )}

              <button
                onClick={() => onOpen()}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 ring-1 ring-emerald-400/30 hover:ring-emerald-400/60 text-emerald-100 text-xs font-medium flex items-center justify-center gap-1.5 transition"
              >
                Ouvrir la fiche
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SearchResultCard;
