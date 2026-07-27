import React, { useMemo, useState } from 'react';
import { Camera, Leaf, ZoomIn, Search, X, ArrowDownAZ, ArrowUpAZ, CalendarArrowDown, CalendarArrowUp, Tags } from 'lucide-react';
import type { GpsCandidate } from '@/components/propriete/gps/GpsControlConsole';
import {
  useMarcheurSpeciesTags,
  indexTagsBySpecies,
  getTagColor,
  normalizeTagKey,
  type MarcheurSpeciesTag,
} from '@/hooks/useMarcheurSpeciesTags';

interface Props {
  items: GpsCandidate[];
  selectedId: string | null;
  colorFor: (w: GpsCandidate) => string;
  displayNameFor: (w: { scientificName?: string | null; commonName?: string | null }) => string;
  onSelect: (w: GpsCandidate) => void;
  onZoomPhoto: (w: GpsCandidate) => void;
  rowRefs: React.MutableRefObject<Map<string, HTMLLIElement>>;
}

type SortKey = 'name' | 'date';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Surligne les occurrences de la recherche dans un libellé. */
const Highlight: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const i = norm(text).indexOf(norm(q));
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-[hsl(var(--ds-gold,45_60%_55%))]/35 text-inherit rounded-[2px] px-[1px]">
        {text.slice(i, i + q.length)}
      </mark>
      {text.slice(i + q.length)}
    </>
  );
};

/**
 * Bandeau latéral des observations (mode plein écran de la Carte des révélations).
 * Index vivant : recherche « nom contient », tri espèce/date réversible,
 * filtre « Mes tags », en-têtes de section flottants.
 */
export const RevealObservationList: React.FC<Props> = ({
  items,
  selectedId,
  colorFor,
  displayNameFor,
  onSelect,
  onZoomPhoto,
  rowRefs,
}) => {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [nameAsc, setNameAsc] = useState(true);
  const [dateDesc, setDateDesc] = useState(true);
  const [activeTagKeys, setActiveTagKeys] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);

  const scientificNames = useMemo(
    () => Array.from(new Set(items.map((w) => (w.scientificName || '').trim()).filter(Boolean))),
    [items],
  );
  const { data: tags } = useMarcheurSpeciesTags(scientificNames);
  const tagIndex = useMemo(() => indexTagsBySpecies(tags), [tags]);
  const tagsFor = (w: GpsCandidate): MarcheurSpeciesTag[] =>
    tagIndex.get(normalizeTagKey(w.scientificName || '')) || [];

  /** Libellés de tags présents sur les espèces visibles, avec comptage. */
  const tagFacets = useMemo(() => {
    const m = new Map<string, { label: string; color_hash: number; count: number }>();
    items.forEach((w) => {
      const seen = new Set<string>();
      tagsFor(w).forEach((t) => {
        const k = normalizeTagKey(t.label);
        if (seen.has(k)) return;
        seen.add(k);
        const ex = m.get(k);
        if (ex) ex.count++;
        else m.set(k, { label: t.label, color_hash: t.color_hash, count: 1 });
      });
    });
    return Array.from(m.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
  }, [items, tagIndex]);

  const displayed = useMemo(() => {
    const q = norm(query.trim());
    let list = items.filter((w) => {
      if (q) {
        const hay = norm(
          [displayNameFor(w), w.scientificName || '', (w as any).observerName || ''].join(' '),
        );
        if (!hay.includes(q)) return false;
      }
      if (activeTagKeys.length) {
        const keys = new Set(tagsFor(w).map((t) => normalizeTagKey(t.label)));
        if (!activeTagKeys.every((k) => keys.has(k))) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'name') {
        const c = displayNameFor(a).localeCompare(displayNameFor(b), 'fr', { sensitivity: 'base' });
        return nameAsc ? c : -c;
      }
      const da = a.observationDate ? new Date(a.observationDate).getTime() : NaN;
      const db = b.observationDate ? new Date(b.observationDate).getTime() : NaN;
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1; // sans date → toujours en fin de liste
      if (isNaN(db)) return -1;
      return dateDesc ? db - da : da - db;
    });
    return list;
  }, [items, query, activeTagKeys, sortKey, nameAsc, dateDesc, tagIndex, displayNameFor]);

  /** Clé de section flottante : initiale (tri espèce) ou mois/année (tri date). */
  const groupOf = (w: GpsCandidate): string => {
    if (sortKey === 'name') {
      const n = displayNameFor(w).trim();
      const c = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '').charAt(0).toUpperCase();
      return /[A-Z]/.test(c) ? c : '#';
    }
    if (!w.observationDate) return 'Sans date';
    const d = new Date(w.observationDate);
    if (isNaN(d.getTime())) return 'Sans date';
    return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  const pill = (active: boolean) =>
    `inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] px-2 py-1 rounded-full border transition ${
      active
        ? 'bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))] border-[hsl(var(--ds-forest))]'
        : 'bg-transparent text-[hsl(var(--ds-forest-deep))]/70 border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
    }`;

  let lastGroup: string | null = null;

  return (
    <aside className="hidden md:flex flex-col w-[300px] flex-shrink-0 border-r border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/60">
      {/* ── Barre d'outils ─────────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[hsl(var(--ds-line))] space-y-2 bg-[hsl(var(--ds-cream))]/80 backdrop-blur-sm">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--ds-forest-deep))]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Le nom contient…"
            aria-label="Rechercher une observation"
            className="w-full pl-8 pr-7 py-1.5 text-[12px] rounded-full bg-[hsl(var(--ds-cream))] border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] placeholder:text-[hsl(var(--ds-forest-deep))]/35 outline-none focus:border-[hsl(var(--ds-forest))]/60"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--ds-forest-deep))]/40 hover:text-[hsl(var(--ds-forest-deep))]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => (sortKey === 'name' ? setNameAsc((v) => !v) : setSortKey('name'))}
            className={pill(sortKey === 'name')}
            title="Trier par nom d'espèce"
          >
            {nameAsc ? <ArrowDownAZ className="w-3 h-3" /> : <ArrowUpAZ className="w-3 h-3" />}
            Espèce
          </button>
          <button
            type="button"
            onClick={() => (sortKey === 'date' ? setDateDesc((v) => !v) : setSortKey('date'))}
            className={pill(sortKey === 'date')}
            title="Trier par date d'observation"
          >
            {dateDesc ? <CalendarArrowDown className="w-3 h-3" /> : <CalendarArrowUp className="w-3 h-3" />}
            Date
          </button>
          {tagFacets.length > 0 && (
            <button
              type="button"
              onClick={() => setTagsOpen((v) => !v)}
              className={pill(tagsOpen || activeTagKeys.length > 0)}
              title="Filtrer par mes tags"
            >
              <Tags className="w-3 h-3" />
              Mes tags{activeTagKeys.length ? ` · ${activeTagKeys.length}` : ''}
            </button>
          )}
        </div>

        {tagsOpen && tagFacets.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tagFacets.map((f) => {
              const active = activeTagKeys.includes(f.key);
              const c = getTagColor(f.color_hash);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    setActiveTagKeys((prev) =>
                      prev.includes(f.key) ? prev.filter((k) => k !== f.key) : [...prev, f.key],
                    )
                  }
                  className="text-[10px] px-2 py-0.5 rounded-full border transition"
                  style={{
                    borderColor: c,
                    background: active ? c : 'transparent',
                    color: active ? 'hsl(var(--ds-cream))' : c,
                  }}
                >
                  {f.label} · {f.count}
                </button>
              );
            })}
            {activeTagKeys.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTagKeys([])}
                className="text-[10px] px-2 py-0.5 rounded-full border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))]/60 hover:text-[hsl(var(--ds-forest-deep))]"
              >
                Tout effacer
              </button>
            )}
          </div>
        )}

        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[hsl(var(--ds-forest-deep))]/55">
          Observations · {displayed.length}
          {displayed.length !== items.length && (
            <span className="normal-case tracking-normal font-medium"> / {items.length}</span>
          )}
        </div>
      </div>

      {/* ── Liste ──────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
          <Leaf className="w-7 h-7 text-[hsl(var(--ds-forest-deep))]/20" />
          <p className="text-[12px] text-[hsl(var(--ds-forest-deep))]/55">
            Aucune observation ne correspond à cette recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveTagKeys([]);
            }}
            className="text-[11px] underline text-[hsl(var(--ds-forest))]"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-[hsl(var(--ds-line))]/60">
          {displayed.map((w) => {
            const active = w.id === selectedId;
            const g = groupOf(w);
            const showGroup = g !== lastGroup;
            lastGroup = g;
            const wTags = tagsFor(w);
            return (
              <React.Fragment key={w.id}>
                {showGroup && (
                  <li className="sticky top-0 z-10 px-3 py-1 bg-[hsl(var(--ds-cream))]/95 backdrop-blur-sm border-y border-[hsl(var(--ds-line))]/60 text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ds-forest-deep))]/50">
                    {g}
                  </li>
                )}
                <li
                  ref={(el) => {
                    if (el) rowRefs.current.set(w.id, el);
                    else rowRefs.current.delete(w.id);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition ${
                    active
                      ? 'bg-[hsl(var(--ds-forest))]/10 ring-2 ring-inset ring-[hsl(var(--ds-gold,45_60%_55%))]'
                      : 'hover:bg-[hsl(var(--ds-forest))]/5'
                  }`}
                  onClick={() => onSelect(w)}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (w.photoUrl) onZoomPhoto(w);
                      else onSelect(w);
                    }}
                    aria-label={w.photoUrl ? 'Agrandir la photo' : 'Centrer sur la carte'}
                    className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))] group"
                  >
                    {w.photoUrl ? (
                      <>
                        <img src={w.photoUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </span>
                      </>
                    ) : (
                      <Leaf className="w-4 h-4 m-auto opacity-30" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: colorFor(w) }}
                        aria-hidden
                      />
                      <span className="text-[12px] font-medium text-[hsl(var(--ds-forest-deep))] truncate">
                        <Highlight text={displayNameFor(w)} query={query} />
                      </span>
                    </div>
                    <div className="text-[10px] italic text-[hsl(var(--ds-forest-deep))]/55 truncate">
                      {w.scientificName}
                    </div>
                    <div className="text-[10px] text-[hsl(var(--ds-forest-deep))]/45 flex items-center gap-1">
                      {w.source === 'marcheur' ? '📷' : '🌐'}
                      {w.observationDate && (
                        <>
                          <Camera className="w-2.5 h-2.5" />
                          {new Date(w.observationDate).toLocaleDateString('fr-FR')}
                        </>
                      )}
                    </div>
                    {wTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {wTags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="text-[9px] px-1.5 py-[1px] rounded-full border"
                            style={{ borderColor: getTagColor(t.color_hash), color: getTagColor(t.color_hash) }}
                          >
                            {t.label}
                          </span>
                        ))}
                        {wTags.length > 3 && (
                          <span className="text-[9px] text-[hsl(var(--ds-forest-deep))]/45">
                            +{wTags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default RevealObservationList;
