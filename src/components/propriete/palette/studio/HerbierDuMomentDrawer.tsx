import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import React from 'react';
import {
  BookOpen,
  Camera,
  ChevronDown,
  Copy,
  Crosshair,
  Download,
  Leaf,
  Maximize2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { PropertyWaypoint } from '@/hooks/propriete/usePropertySpeciesPool';
import { TYPE_META, type VivantFilterState } from './LivingLayer';
import { describeVivantFilters, resetVivantFilter, type VivantChip } from './vivantFilterChips';
import { useVivantSpeciesRoster, type VivantRosterEntry } from './useVivantSpeciesRoster';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Observations réellement affichées sur la carte (mêmes filtres). */
  waypoints: PropertyWaypoint[];
  filter: VivantFilterState;
  onFilterChange: (f: VivantFilterState) => void;
  frenchName: (scientific: string, fallback?: string | null) => string;
  fieldPhotoFor?: (w: PropertyWaypoint) => string[];
  scopeLabel?: string | null;
  periodLabel?: string | null;
  tagLabels?: Map<string, string>;
  /** Survol d'une espèce : la carte fait pulser ses pastilles. */
  onHoverSpecies: (key: string | null) => void;
  /** Clic sur une observation : recentrage + ouverture de sa fiche. */
  onFocusObservation: (w: PropertyWaypoint) => void;
  /** Clic sur une vignette : visionneuse limitée aux relevés photographiés de cette espèce. */
  onZoomObservation?: (w: PropertyWaypoint, observations: PropertyWaypoint[]) => void;
  /** Nom de la propriété, pour l'en-tête des exports. */
  proprieteName?: string | null;
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return 'date inconnue';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? 'date inconnue' : format(dt, 'd MMM yyyy', { locale: fr });
};

/** Recherche insensible à la casse et aux accents (même normalisation que le roster). */
const norm = (s: string | null | undefined) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

/** Sous-menus de l'herbier : la Flore d'abord, puis la Faune, puis le reste. */
type HerbierGroup = 'flore' | 'faune' | 'autres';

const GROUPS: { id: HerbierGroup; label: string; glyph: string; color: string }[] = [
  { id: 'flore', label: 'Flore', glyph: '🌿', color: '#5c8a3c' },
  { id: 'faune', label: 'Faune', glyph: '🦋', color: '#b06a2c' },
  { id: 'autres', label: 'Autres', glyph: '🍄', color: '#8a5a7a' },
];

/** Champignons et règnes indéterminés se rangent dans « Autres ». */
const groupOfType = (t: VivantRosterEntry['type']): HerbierGroup =>
  t === 'flore' ? 'flore' : t === 'faune' ? 'faune' : 'autres';

const chipTone: Record<VivantChip['tone'], string> = {
  scope: 'border-[hsl(var(--ds-forest))]/45 bg-[hsl(var(--ds-forest))]/12',
  period: 'border-[#c9a227]/50 bg-[#c9a227]/12',
  filter: 'border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]',
};

const SpeciesRow: React.FC<{
  entry: VivantRosterEntry;
  label: string;
  expanded: boolean;
  onToggle: () => void;
  onHover: (k: string | null) => void;
  onFocus: (w: PropertyWaypoint) => void;
  onZoom?: (w: PropertyWaypoint, observations: PropertyWaypoint[]) => void;
}> = ({ entry, label, expanded, onToggle, onHover, onFocus, onZoom }) => {
  const meta = TYPE_META[entry.type];
  const photographed = React.useMemo(() => entry.observations.filter((o) => !!o.photoUrl), [entry.observations]);
  const shot = photographed[0];
  const thumb = (
    <span
      className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]"
      style={{ boxShadow: entry.bio ? `0 0 0 1.5px ${meta.color}55` : undefined }}
    >
      {(shot?.photoUrl || entry.photoUrl) ? (
        <img src={shot?.photoUrl || entry.photoUrl || ''} alt={label} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[13px] opacity-55">
          {meta.glyph}
        </span>
      )}
    </span>
  );
  return (
    <li
      onMouseEnter={() => onHover(entry.key)}
      onMouseLeave={() => onHover(null)}
      className="group border-b border-[hsl(var(--ds-line))]/60 last:border-0"
    >
      <div className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[hsl(var(--ds-forest))]/6">
        {onZoom && shot ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={`Voir les ${photographed.length} photo${photographed.length > 1 ? 's' : ''} d’observation`}
            onClick={() => onZoom(shot, photographed)}
            className="h-9 w-9 shrink-0 cursor-zoom-in p-0 transition-transform hover:scale-105"
          >
            {thumb}
          </Button>
        ) : (
          thumb
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-[12px] font-medium text-[hsl(var(--ds-forest-deep))]">
                {label}
              </span>
              {entry.bio && (
                <Leaf className="h-3 w-3 shrink-0 text-[#7a9a3c]" aria-label="Bio-indicatrice" />
              )}
            </span>
            <span className="block truncate text-[10px] italic opacity-55">
              {entry.scientificName}
            </span>
          </span>
          <span className="shrink-0 text-[9.5px] opacity-65" title="Nombre d’observations">{entry.observations.length} obs.</span>
          {photographed.length > 0 && (
            <span className="flex shrink-0 items-center gap-0.5 text-[9.5px] text-[hsl(var(--ds-forest))]" title="Photos de ces observations">
              <Camera className="h-3 w-3" /> {photographed.length}
            </span>
          )}
          <ChevronDown
            className={`h-3 w-3 shrink-0 opacity-45 transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          type="button"
          title="Situer sur le plan"
          onClick={() => onFocus(entry.observations[0])}
          className="shrink-0 rounded-md p-1 text-[hsl(var(--ds-forest-deep))]/50 transition-colors hover:bg-[hsl(var(--ds-forest))]/12 hover:text-[hsl(var(--ds-forest-deep))]"
        >
          <Crosshair className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-dashed border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/60 px-3 py-2">
          <p className="mb-2 font-serif text-[12px] italic text-[hsl(var(--ds-forest-deep))]">Au fil des observations</p>
          <ul className="flex max-w-full gap-2 overflow-x-auto pb-2 [scrollbar-width:thin]" aria-label={`Observations de ${label}, de la plus récente à la plus ancienne`}>
            {entry.observations.map((w) => (
              <li key={w.id} className="w-[108px] shrink-0">
                {w.photoUrl && onZoom ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onZoom(w, photographed)}
                    title={`Voir la photo du ${fmtDate(w.observationDate)} en grand`}
                    className="group/shot relative h-[78px] w-full overflow-hidden rounded-md border border-[hsl(var(--ds-line))] p-0"
                  >
                    <img src={w.photoUrl} alt={`${label} · ${fmtDate(w.observationDate)}`} loading="lazy" className="h-full w-full object-cover transition-transform group-hover/shot:scale-105" />
                    <Maximize2 className="absolute bottom-1 right-1 h-4 w-4 rounded-sm bg-[hsl(var(--ds-cream))]/90 p-0.5" />
                  </Button>
                ) : (
                  <div className="flex h-[78px] items-center justify-center rounded-md border border-dashed border-[hsl(var(--ds-line))] text-[10px] italic opacity-60">Sans photo</div>
                )}
                <span className="mt-1 block text-[10px] font-medium">{fmtDate(w.observationDate)}</span>
                <span className="block truncate text-[9px] opacity-60" title={w.observerName || undefined}>
                  {w.source === 'marcheur' ? 'Terrain' : 'iNaturalist'}{w.observerName ? ` · ${w.observerName}` : ''}
                </span>
                <Button type="button" size="sm" variant="ghost" onClick={() => onFocus(w)} title="Situer cette observation sur le plan" className="mt-1 h-6 gap-1 px-0 text-[9px] text-[hsl(var(--ds-forest))]">
                  <Crosshair className="h-3 w-3" /> Situer
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

/**
 * « L'Herbier du moment » — miroir textuel exact de la carte.
 *
 * Il ne lit aucune donnée nouvelle : il met en mots l'ensemble d'observations
 * déjà filtré et affiché, pour que l'on sache d'un coup d'œil *quelles*
 * espèces composent les points visibles.
 */
export const HerbierDuMomentDrawer: React.FC<Props> = ({
  open,
  onClose,
  waypoints,
  filter,
  onFilterChange,
  frenchName,
  fieldPhotoFor,
  scopeLabel,
  periodLabel,
  tagLabels,
  onHoverSpecies,
  onFocusObservation,
  onZoomObservation,
  proprieteName,
}) => {
  const { entries: allEntries } = useVivantSpeciesRoster(
    waypoints,
    fieldPhotoFor,
  );
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [group, setGroup] = React.useState<HerbierGroup>('flore');
  const [query, setQuery] = React.useState('');

  // Anciens noms français (ex. « Argus brun ») : toujours trouvables par la recherche.
  const sciKey = React.useMemo(
    () => allEntries.map((e) => e.scientificName).sort(),
    [allEntries],
  );
  const { data: altNames } = useQuery({
    queryKey: ['species-alt-names-fr', sciKey],
    enabled: open && sciKey.length > 0,
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const m = new Map<string, string[]>();
      const { data } = await supabase
        .from('species_translations')
        .select('scientific_name, alternative_names_fr')
        .in('scientific_name', sciKey)
        .not('alternative_names_fr', 'is', null);
      (data || []).forEach((r: any) => m.set(r.scientific_name, r.alternative_names_fr || []));
      return m;
    },
  });

  const labelOf = React.useCallback(
    (e: VivantRosterEntry) => frenchName(e.scientificName, e.commonName),
    [frenchName],
  );

  // La recherche disparaît avec le tiroir : à la réouverture, l'herbier est complet.
  React.useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  /** Espèces dont le nom français ou le nom scientifique contient la recherche. */
  const searched = React.useMemo(() => {
    const q = norm(query);
    if (!q) return allEntries;
    return allEntries.filter(
      (e) =>
        norm(labelOf(e)).includes(q) ||
        norm(e.scientificName).includes(q) ||
        (altNames?.get(e.scientificName) || []).some((a) => norm(a).includes(q)),
    );
  }, [allEntries, query, labelOf, altNames]);

  /** Répartition Flore / Faune / Autres (champignons inclus dans « Autres »). */
  const byGroup = React.useMemo(() => {
    const m: Record<HerbierGroup, VivantRosterEntry[]> = { flore: [], faune: [], autres: [] };
    for (const e of searched) m[groupOfType(e.type)].push(e);
    return m;
  }, [searched]);

  const entries = byGroup[group];
  const speciesCount = entries.length;
  const observationCount = React.useMemo(
    () => entries.reduce((n, e) => n + e.observations.length, 0),
    [entries],
  );

  // Si le sous-menu par défaut est vide, on ouvre sur celui qui porte du vivant.
  React.useEffect(() => {
    if (!open) return;
    if (byGroup[group].length > 0) return;
    const fallback = GROUPS.find((g) => byGroup[g.id].length > 0);
    if (fallback) setGroup(fallback.id);
  }, [open, group, byGroup]);

  const chips = React.useMemo(
    () => describeVivantFilters(filter, { scopeLabel, periodLabel, tagLabels }),
    [filter, scopeLabel, periodLabel, tagLabels],
  );

  React.useEffect(() => {
    if (!open) onHoverSpecies(null);
  }, [open, onHoverSpecies]);

  const contextLine = chips.map((c) => c.label).join(' · ');

  const asMarkdown = () =>
    [
      `# Herbier du moment${proprieteName ? ` — ${proprieteName}` : ''}`,
      contextLine ? `_${contextLine}_` : '',
      `${observationCount} observation${observationCount > 1 ? 's' : ''} · ${speciesCount} espèce${speciesCount > 1 ? 's' : ''}`,
      '',
      '| Espèce | Nom scientifique | Obs. | Dernière | Bio-indicatrice |',
      '| --- | --- | --- | --- | --- |',
      ...entries.map(
        (e) =>
          `| ${labelOf(e)} | *${e.scientificName}* | ${e.observations.length} | ${fmtDate(e.lastSeen)} | ${e.bio ? 'oui' : '—'} |`,
      ),
    ]
      .filter(Boolean)
      .join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(asMarkdown());
      toast.success('Herbier copié', { description: `${speciesCount} espèces au presse-papier.` });
    } catch {
      toast.error('Copie impossible sur ce navigateur.');
    }
  };

  const exportCsv = () => {
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
    const rows = [
      ['nom_francais', 'nom_scientifique', 'type', 'observations', 'derniere_observation', 'bio_indicatrice', 'sources'],
      ...entries.map((e) => [
        labelOf(e),
        e.scientificName,
        TYPE_META[e.type].label,
        String(e.observations.length),
        e.lastSeen ?? '',
        e.bio ? 'oui' : 'non',
        Array.from(e.sources).join(' + '),
      ]),
    ];
    const csv = '\uFEFF' + rows.map((r) => r.map(esc).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `herbier-du-moment-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Herbier exporté en CSV');
  };

  const askAi = () => {
    const list = entries
      .map((e) => `- ${labelOf(e)} (${e.scientificName}) — ${e.observations.length} obs.`)
      .join('\n');
    const prefill = `Voici les espèces actuellement visibles sur mon plan${contextLine ? ` (${contextLine})` : ''} :\n${list}\n\nQue m'apprend cette liste sur l'état du lieu ?`;
    window.dispatchEvent(new CustomEvent('community-chat:open', { detail: { prefill } }));
  };

  if (!open) return null;

  return (
    <aside
      className="absolute right-4 top-[4.5rem] z-[740] flex max-h-[calc(100%-9rem)] w-[330px] flex-col overflow-hidden rounded-2xl border border-[hsl(var(--ds-line))] text-[hsl(var(--ds-forest-deep))] shadow-2xl backdrop-blur"
      style={{
        background:
          'linear-gradient(160deg, hsl(var(--ds-cream)) 0%, hsl(var(--ds-cream)) 62%, rgba(201,162,39,0.08) 100%)',
      }}
      aria-label="Herbier du moment"
    >
      {/* Bandeau papier-herbier */}
      <header className="relative shrink-0 border-b border-[hsl(var(--ds-line))] px-3 py-2.5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg,#7a9a3c,#c9a227,#8a5a7a)' }}
        />
        <div className="flex items-start gap-2">
          <BookOpen className="mt-[2px] h-4 w-4 shrink-0 opacity-70" />
          <div className="min-w-0 flex-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em]">
              L’herbier du moment
            </h3>
            <p className="text-[10px] opacity-60">
              {observationCount} observation{observationCount > 1 ? 's' : ''} · {speciesCount}{' '}
              espèce{speciesCount > 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’herbier"
            className="shrink-0 rounded-md p-1 opacity-55 transition-opacity hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                disabled={!c.next}
                onClick={() => c.next && onFilterChange(c.next)}
                title={c.next ? 'Retirer ce filtre' : undefined}
                className={`flex items-center gap-1 rounded-full border px-2 py-[1px] text-[9.5px] transition-colors ${chipTone[c.tone]} ${
                  c.next ? 'hover:border-[hsl(var(--ds-forest))]/60' : 'cursor-default opacity-80'
                }`}
              >
                {c.label}
                {c.next && <X className="h-2.5 w-2.5 opacity-60" />}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Recherche par nom d'espèce (contient, insensible aux accents) */}
      <div className="shrink-0 border-b border-[hsl(var(--ds-line))] px-2 py-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-45" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une espèce…"
            aria-label="Rechercher une espèce par son nom"
            className="w-full rounded-full border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 py-1 pl-7 pr-6 text-[11px] placeholder:italic placeholder:opacity-50 focus:border-[hsl(var(--ds-forest))]/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ds-forest))]/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Effacer la recherche"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 opacity-55 transition-opacity hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        {query.trim() && (
          <p className="mt-1 px-1 text-[9.5px] italic opacity-55">
            {searched.length === 0
              ? 'Aucune correspondance dans l’herbier.'
              : `${searched.length} espèce${searched.length > 1 ? 's' : ''} sur ${allEntries.length}`}
          </p>
        )}
      </div>

      {/* Sous-menus : Flore · Faune · Autres */}
      <nav
        role="tablist"
        aria-label="Règnes de l’herbier"
        className="flex shrink-0 gap-1 border-b border-[hsl(var(--ds-line))] px-2 py-1.5"
      >
        {GROUPS.map((g) => {
          const n = byGroup[g.id].length;
          const active = group === g.id;
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setGroup(g.id);
                setExpanded(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full border px-2 py-1 text-[10px] transition-all ${
                active
                  ? 'border-transparent text-[hsl(var(--ds-cream))]'
                  : 'border-[hsl(var(--ds-line))] hover:border-[hsl(var(--ds-forest))]/50'
              } ${n === 0 && !active ? 'opacity-45' : ''}`}
              style={active ? { background: g.color } : undefined}
            >
              <span aria-hidden>{g.glyph}</span>
              {g.label}
              <span
                className={`rounded-full px-1 text-[9px] ${
                  active ? 'bg-black/15' : 'bg-[hsl(var(--ds-forest))]/12'
                }`}
              >
                {n}
              </span>
            </button>
          );
        })}
      </nav>


      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[11px] italic leading-relaxed opacity-65">
              {query.trim() && searched.length === 0 ? (
                <>
                  Aucune espèce ne contient « {query.trim()} ».
                  <br />
                  Essayez un autre nom, français ou scientifique.
                </>
              ) : allEntries.length > 0 ? (
                <>
                  {query.trim()
                    ? 'Aucun résultat dans cet onglet.'
                    : `Rien dans « ${GROUPS.find((g) => g.id === group)?.label} » pour l’instant.`}
                  <br />
                  {query.trim()
                    ? 'L’espèce recherchée se range peut-être dans un autre.'
                    : 'Le vivant relevé ici se range dans un autre onglet.'}
                </>
              ) : (
                <>
                  Aucune observation ne passe ces filtres.
                  <br />
                  Le lieu n’est pas vide : c’est la fenêtre qui est étroite.
                </>
              )}
            </p>
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-3 rounded-full border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-forest))]/10 px-3 py-1 text-[10px] transition-colors hover:bg-[hsl(var(--ds-forest))]/20"
              >
                Effacer la recherche
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onFilterChange(resetVivantFilter())}
                className="mt-3 rounded-full border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-forest))]/10 px-3 py-1 text-[10px] transition-colors hover:bg-[hsl(var(--ds-forest))]/20"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <ul>
            {entries.map((e) => (
              <SpeciesRow
                key={e.key}
                entry={e}
                label={labelOf(e)}
                expanded={expanded === e.key}
                onToggle={() => setExpanded((k) => (k === e.key ? null : e.key))}
                onHover={onHoverSpecies}
                onFocus={onFocusObservation}
                onZoom={onZoomObservation}
              />
            ))}
          </ul>
        )}
      </div>

      <footer className="flex shrink-0 items-center gap-1 border-t border-[hsl(var(--ds-line))] px-2 py-1.5">
        <button
          type="button"
          onClick={copy}
          disabled={entries.length === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px] transition-colors hover:bg-[hsl(var(--ds-forest))]/12 disabled:opacity-40"
        >
          <Copy className="h-3 w-3" /> Copier
        </button>
        <button
          type="button"
          onClick={exportCsv}
          disabled={entries.length === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1 text-[10px] transition-colors hover:bg-[hsl(var(--ds-forest))]/12 disabled:opacity-40"
        >
          <Download className="h-3 w-3" /> CSV
        </button>
        <button
          type="button"
          onClick={askAi}
          disabled={entries.length === 0}
          className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[hsl(var(--ds-forest))] px-2 py-1 text-[10px] text-[hsl(var(--ds-cream))] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <Sparkles className="h-3 w-3" /> IA de Jardin
        </button>
      </footer>
    </aside>
  );
};

export default HerbierDuMomentDrawer;
