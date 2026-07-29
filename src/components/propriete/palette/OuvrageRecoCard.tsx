import React from 'react';
import {
  Hammer,
  CalendarDays,
  Sprout,
  Gauge,
  AlertTriangle,
  BookOpen,
  Pencil,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import type { PaysageTool } from '@/lib/paysageTools';
import type { OuvrageReco } from '@/lib/ouvrageRecoKb';
import type { OuvrageRecoResolved } from '@/hooks/propriete/useOuvrageRecoKb';
import { fmtEuro } from './studio/geoMetrics';

interface Props {
  tool: PaysageTool;
  reco: OuvrageRecoResolved;
  /** métré de l'ouvrage, pour chiffrer coûts et rétention */
  measure: number;
  /** note de chantier propre à cet ouvrage (locale à la propriété) */
  note: string;
  /** emplacement de rattachement, pour croiser avec la palette retenue */
  zoneNom?: string | null;
  /** espèces déjà retenues dans la palette de cet emplacement */
  zoneSelected?: string[];
  onNoteChange?: (v: string) => void;
  canEditKb?: boolean;
  onSaveKb?: (reco: OuvrageReco) => Promise<void>;
  onResetKb?: () => Promise<void>;
  readOnly?: boolean;
}

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}> = ({ icon, title, accent, children }) => (
  <section className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-3 text-[hsl(var(--ds-forest-deep))]">
    <p
      className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{ color: accent }}
    >
      {icon}
      {title}
    </p>
    {children}
  </section>
);


const textarea =
  'w-full rounded-md border border-[hsl(var(--ds-line))] bg-white/70 px-2 py-1.5 text-[11px] leading-relaxed text-[hsl(var(--ds-forest-deep))] outline-none focus:border-[hsl(var(--ds-forest))]/50';


const toLines = (a: string[]) => a.join('\n');
const fromLines = (v: string) =>
  v
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * Fiche de recommandation d'un type d'ouvrage : mise en œuvre & calendrier,
 * entretien An 0 / 1 / 3, espèces & compagnonnage, coûts / eau / biodiversité.
 * Socle expert livré, surchargeable par un administrateur.
 */
export const OuvrageRecoCard: React.FC<Props> = ({
  tool,
  reco,
  measure,
  note,
  zoneNom,
  zoneSelected,
  onNoteChange,
  canEditKb,
  onSaveKb,
  onResetKb,
  readOnly,
}) => {
  const accent = tool.color;
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [draft, setDraft] = React.useState<OuvrageReco>(() => ({
    miseEnOeuvre: reco.miseEnOeuvre,
    calendrier: reco.calendrier,
    entretien: reco.entretien,
    especes: reco.especes,
    vigilance: reco.vigilance,
    sources: reco.sources,
  }));
  const [localNote, setLocalNote] = React.useState(note);

  React.useEffect(() => setLocalNote(note), [note]);

  const openEditor = () => {
    setDraft({
      miseEnOeuvre: reco.miseEnOeuvre,
      calendrier: reco.calendrier,
      entretien: reco.entretien,
      especes: reco.especes,
      vigilance: reco.vigilance,
      sources: reco.sources,
    });
    setEditing(true);
  };

  const impact = tool.impact ?? {};
  const chiffres: Array<{ label: string; value: string; hint?: string }> = [];
  if (impact.coutConventionnel != null)
    chiffres.push({
      label: 'Conventionnel',
      value: fmtEuro(impact.coutConventionnel * measure),
      hint: `${fmtEuro(impact.coutConventionnel)} / ${tool.unit === 'm2' ? 'm²' : tool.unit === 'ml' ? 'ml' : 'u'}`,
    });
  if (impact.coutSolVivant != null)
    chiffres.push({
      label: 'Sol vivant',
      value: fmtEuro(impact.coutSolVivant * measure),
      hint: `${fmtEuro(impact.coutSolVivant)} / ${tool.unit === 'm2' ? 'm²' : tool.unit === 'ml' ? 'ml' : 'u'}`,
    });
  if (impact.retentionLpU != null)
    chiffres.push({
      label: 'Rétention',
      value: `${Math.round(impact.retentionLpU * measure).toLocaleString('fr-FR')} L`,
      hint: `${impact.retentionLpU} L / unité`,
    });
  if (impact.entretienSolVivant != null)
    chiffres.push({
      label: 'Entretien / an',
      value: fmtEuro(impact.entretienSolVivant * measure),
      hint: 'conduite sol vivant',
    });

  const services = [
    impact.desimpermeabilise && 'Désimperméabilisation',
    impact.nourricier && 'Surface nourricière',
    impact.couverture && 'Couverture permanente du sol',
  ].filter(Boolean) as string[];

  if (editing) {
    return (
      <div className="space-y-2.5 rounded-xl border border-dashed border-[hsl(var(--ds-forest))]/40 bg-white/60 p-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[hsl(var(--ds-forest))]">
          Enrichir la fiche « {tool.label} » — base commune à tous les sites
        </p>
        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
            Mise en œuvre (une étape par ligne)
          </span>
          <textarea
            className={`${textarea} min-h-[90px]`}
            value={toLines(draft.miseEnOeuvre)}
            onChange={(e) => setDraft({ ...draft, miseEnOeuvre: fromLines(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
            Calendrier
          </span>
          <textarea
            className={`${textarea} min-h-[44px]`}
            value={draft.calendrier}
            onChange={(e) => setDraft({ ...draft, calendrier: e.target.value })}
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-3">
          {(['an0', 'an1', 'an3'] as const).map((k) => (
            <label key={k} className="block">
              <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
                Entretien {k === 'an0' ? 'An 0' : k === 'an1' ? 'An 1' : 'An 3'}
              </span>
              <textarea
                className={`${textarea} min-h-[64px]`}
                value={draft.entretien[k]}
                onChange={(e) =>
                  setDraft({ ...draft, entretien: { ...draft.entretien, [k]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
            Espèces & compagnonnage (une ligne par entrée)
          </span>
          <textarea
            className={`${textarea} min-h-[70px]`}
            value={toLines(draft.especes)}
            onChange={(e) => setDraft({ ...draft, especes: fromLines(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
            Points de vigilance
          </span>
          <textarea
            className={`${textarea} min-h-[60px]`}
            value={toLines(draft.vigilance)}
            onChange={(e) => setDraft({ ...draft, vigilance: fromLines(e.target.value) })}
          />
        </label>
        <label className="block">
          <span className="mb-0.5 block text-[10px] uppercase tracking-wider opacity-55">
            Sources
          </span>
          <textarea
            className={`${textarea} min-h-[46px]`}
            value={toLines(draft.sources)}
            onChange={(e) => setDraft({ ...draft, sources: fromLines(e.target.value) })}
          />
        </label>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSaveKb?.(draft);
                setEditing(false);
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ds-forest))] px-3 py-1 text-[10px] font-semibold text-[hsl(var(--ds-cream))] disabled:opacity-50"
          >
            <Check className="h-3 w-3" /> Enregistrer la fiche
          </button>
          {reco.enriched && (
            <button
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await onResetKb?.();
                  setEditing(false);
                } finally {
                  setSaving(false);
                }
              }}
              className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1 text-[10px]"
            >
              <RotateCcw className="h-3 w-3" /> Revenir au socle
            </button>
          )}
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-3 py-1 text-[10px]"
          >
            <X className="h-3 w-3" /> Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em]"
          style={{ backgroundColor: `${accent}1f`, color: accent }}
        >
          {reco.enriched ? 'Fiche enrichie' : reco.specific ? 'Socle expert' : 'Repères de famille'}
        </span>
        {reco.updatedAt && (
          <span className="text-[10px] opacity-50">
            mise à jour le {new Date(reco.updatedAt).toLocaleDateString('fr-FR')}
          </span>
        )}
        {canEditKb && (
          <button
            onClick={openEditor}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-[hsl(var(--ds-line))] px-2.5 py-1 text-[10px] hover:border-[hsl(var(--ds-forest))]/60"
          >
            <Pencil className="h-3 w-3" /> Enrichir
          </button>
        )}
      </div>

      <div className="grid gap-2.5 lg:grid-cols-2">
        <Section icon={<Hammer className="h-3 w-3" />} title="Mise en œuvre" accent={accent}>
          <ol className="space-y-1.5">
            {reco.miseEnOeuvre.map((s, i) => (
              <li key={i} className="flex gap-2 text-[11.5px] leading-relaxed">
                <span
                  className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: `${accent}22`, color: accent }}
                >
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2.5 flex items-start gap-1.5 border-t border-[hsl(var(--ds-line))]/70 pt-2 text-[11px] italic leading-relaxed opacity-80">
            <CalendarDays className="mt-[2px] h-3 w-3 shrink-0" style={{ color: accent }} />
            {reco.calendrier}
          </p>
        </Section>

        <Section
          icon={<Gauge className="h-3 w-3" />}
          title="Entretien · An 0 / 1 / 3"
          accent={accent}
        >
          <div className="relative space-y-2.5 pl-4">
            <span
              aria-hidden
              className="absolute left-[5px] top-1 bottom-1 w-px"
              style={{ backgroundColor: `${accent}44` }}
            />
            {(
              [
                ['An 0', reco.entretien.an0],
                ['An 1', reco.entretien.an1],
                ['An 3', reco.entretien.an3],
              ] as const
            ).map(([label, txt]) => (
              <div key={label} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-4 top-1 h-[9px] w-[9px] rounded-full ring-2 ring-[hsl(var(--ds-cream))]"
                  style={{ backgroundColor: accent }}
                />
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: accent }}
                >
                  {label}
                </p>
                <p className="text-[11.5px] leading-relaxed">{txt}</p>
              </div>
            ))}
          </div>
        </Section>

        {reco.especes.length > 0 && (
          <Section
            icon={<Sprout className="h-3 w-3" />}
            title="Espèces & compagnonnage"
            accent={accent}
          >
            <ul className="space-y-1">
              {reco.especes.map((s, i) => (
                <li key={i} className="text-[11.5px] leading-relaxed">
                  <span className="mr-1.5 opacity-40">·</span>
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section
          icon={<Gauge className="h-3 w-3" />}
          title="Coûts, eau & biodiversité"
          accent={accent}
        >
          {chiffres.length > 0 ? (
            <div className="grid grid-cols-2 gap-1.5">
              {chiffres.map((c) => (
                <div
                  key={c.label}
                  className="rounded-lg border border-[hsl(var(--ds-line))] bg-white/60 px-2 py-1.5"
                >
                  <p className="text-[9.5px] uppercase tracking-wider opacity-55">{c.label}</p>
                  <p className="font-serif text-[15px] leading-tight" style={{ color: accent }}>
                    {c.value}
                  </p>
                  {c.hint && <p className="text-[9.5px] opacity-45">{c.hint}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] italic opacity-60">
              Pas de chiffrage type pour cet ouvrage : à estimer au cas par cas.
            </p>
          )}
          {services.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {services.map((s) => (
                <span
                  key={s}
                  className="rounded-full border px-2 py-0.5 text-[9.5px]"
                  style={{ borderColor: `${accent}55`, color: accent }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </Section>
      </div>

      {reco.vigilance.length > 0 && (
        <div className="rounded-xl border border-[#d9a441]/50 bg-[#fdf6e6]/70 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a5a1c]">
            <AlertTriangle className="h-3 w-3" /> Points de vigilance
          </p>
          <ul className="space-y-1">
            {reco.vigilance.map((v, i) => (
              <li key={i} className="text-[11.5px] leading-relaxed text-[#5f4514]">
                <span className="mr-1.5 opacity-50">·</span>
                {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-2.5 lg:grid-cols-2">
        <label className="block rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-3">
          <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
            <Pencil className="h-3 w-3" /> Note de chantier — propre à cet ouvrage
          </span>
          <textarea
            className={`${textarea} min-h-[54px] resize-y`}
            disabled={readOnly}
            value={localNote}
            onChange={(e) => setLocalNote(e.target.value)}
            onBlur={() => localNote !== note && onNoteChange?.(localNote)}
            placeholder="Ce qui est particulier ici : accès, contrainte, décision prise avec le client…"
          />
        </label>

        {reco.sources.length > 0 && (
          <div className="rounded-xl border border-[hsl(var(--ds-line))] bg-[hsl(var(--ds-cream))]/70 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
              <BookOpen className="h-3 w-3" /> Sources
            </p>
            <ul className="space-y-0.5">
              {reco.sources.map((s) => (
                <li key={s} className="text-[10.5px] leading-relaxed opacity-70">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default OuvrageRecoCard;
