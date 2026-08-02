import React from 'react';
import {
  BookOpen,
  ChevronDown,
  Copy,
  Crosshair,
  Download,
  Leaf,
  Sparkles,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
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
  /** Nom de la propriété, pour l'en-tête des exports. */
  proprieteName?: string | null;
}

const fmtDate = (d: string | null | undefined) => {
  if (!d) return 'date inconnue';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? 'date inconnue' : format(dt, 'd MMM yyyy', { locale: fr });
};

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
}> = ({ entry, label, expanded, onToggle, onHover, onFocus }) => {
  const meta = TYPE_META[entry.type];
  return (
    <li
      onMouseEnter={() => onHover(entry.key)}
      onMouseLeave={() => onHover(null)}
      className="group border-b border-[hsl(var(--ds-line))]/60 last:border-0"
    >
      <div className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-[hsl(var(--ds-forest))]/6">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          <span
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]"
            style={{ boxShadow: entry.bio ? `0 0 0 1.5px ${meta.color}55` : undefined }}
          >
            {entry.photoUrl ? (
              <img
                src={entry.photoUrl}
                alt={label}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[13px] opacity-55">
                {meta.glyph}
              </span>
            )}
          </span>
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
          <span className="shrink-0 rounded-full bg-[hsl(var(--ds-forest))]/12 px-1.5 py-[1px] text-[9.5px] text-[hsl(var(--ds-forest-deep))]">
            {entry.observations.length}
          </span>
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
        <ul className="space-y-0.5 border-t border-dashed border-[hsl(var(--ds-line))]/70 bg-[hsl(var(--ds-cream))]/60 px-3 py-1.5">
          {entry.observations.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => onFocus(w)}
                className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-[10.5px] transition-colors hover:bg-[hsl(var(--ds-forest))]/10"
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <span className="shrink-0 opacity-75">{fmtDate(w.observationDate)}</span>
                <span className="min-w-0 flex-1 truncate opacity-60">
                  {w.observerName || (w.source === 'marcheur' ? 'Marcheur' : 'iNaturalist')}
                </span>
                <span className="shrink-0 text-[9px] uppercase tracking-wide opacity-45">
                  {w.source === 'marcheur' ? 'terrain' : 'iNat'}
                </span>
              </button>
            </li>
          ))}
        </ul>
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
  proprieteName,
}) => {
  const { entries, speciesCount, observationCount } = useVivantSpeciesRoster(
    waypoints,
    fieldPhotoFor,
  );
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const chips = React.useMemo(
    () => describeVivantFilters(filter, { scopeLabel, periodLabel, tagLabels }),
    [filter, scopeLabel, periodLabel, tagLabels],
  );

  const labelOf = React.useCallback(
    (e: VivantRosterEntry) => frenchName(e.scientificName, e.commonName),
    [frenchName],
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[11px] italic leading-relaxed opacity-65">
              Aucune observation ne passe ces filtres.
              <br />
              Le lieu n’est pas vide : c’est la fenêtre qui est étroite.
            </p>
            <button
              type="button"
              onClick={() => onFilterChange(resetVivantFilter())}
              className="mt-3 rounded-full border border-[hsl(var(--ds-forest))]/40 bg-[hsl(var(--ds-forest))]/10 px-3 py-1 text-[10px] transition-colors hover:bg-[hsl(var(--ds-forest))]/20"
            >
              Réinitialiser les filtres
            </button>
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
