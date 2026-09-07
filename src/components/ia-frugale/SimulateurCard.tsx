import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, RotateCcw, Sparkles } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Simulateur, Valeurs } from '@/content/iaFrugale/casUsage';
import { CAS_LABEL } from '@/content/iaFrugale/casUsage';
import FormuleBloc from './FormuleBloc';
import SourceNote from './SourceNote';
import AncrageInaturalist from './AncrageInaturalist';

interface Props {
  simulateur: Simulateur;
  /** Pastille ronde numérotée (serre de nuit CodeCarbon). */
  numero?: number;
  /** Cartouche visuelle optionnelle affichée à côté des résultats. */
  illustration?: ReactNode;
}

const valeursParDefaut = (sim: Simulateur): Valeurs =>
  Object.fromEntries(sim.controles.map((c) => [c.cle, c.defaut]));

const formatCurseur = (valeur: number, pas: number) =>
  pas < 1
    ? valeur.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    : valeur.toLocaleString('fr-FR');

export const SimulateurCard = ({ simulateur, numero, illustration }: Props) => {
  const [valeurs, setValeurs] = useState<Valeurs>(() => valeursParDefaut(simulateur));
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  const resultats = useMemo(() => simulateur.calcul(valeurs), [simulateur, valeurs]);
  const principaux = resultats.filter((r) => r.principal);
  const secondaires = resultats.filter((r) => !r.principal);

  return (
    <article
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      style={{ ['--accent-outil' as string]: `var(--frugal-${simulateur.outil})` }}
    >
      <div className="h-1 w-full bg-[hsl(var(--accent-outil))]" aria-hidden />

      <header className="space-y-3 border-b border-border p-5 sm:p-6">
        <div className="flex items-center gap-3">
          {numero !== undefined && (
            <span
              className="cc-serif flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent-outil))] text-lg text-primary-foreground"
              aria-hidden
            >
              {numero}
            </span>
          )}
          <span className="inline-flex items-center rounded-full border border-[hsl(var(--accent-outil)/0.4)] bg-[hsl(var(--accent-outil)/0.08)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[hsl(var(--accent-outil))]">
            {CAS_LABEL[simulateur.cas]}
          </span>
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {simulateur.titre}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{simulateur.accroche}</p>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Curseurs */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              À vous de régler
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              onClick={() => setValeurs(valeursParDefaut(simulateur))}
            >
              <RotateCcw className="h-3 w-3" aria-hidden />
              Réinitialiser
            </Button>
          </div>

          {simulateur.controles.map((c) =>
            c.type === 'slider' ? (
              <div key={c.cle} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <label
                    htmlFor={`${simulateur.id}-${c.cle}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {c.label}
                    {c.hypothese && (
                      <span className="ml-1.5 align-middle text-[10px] uppercase tracking-wider text-muted-foreground">
                        hypothèse
                      </span>
                    )}
                  </label>
                  <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs tabular-nums text-foreground">
                    {formatCurseur(Number(valeurs[c.cle]), c.pas)}
                    {c.unite ? ` ${c.unite}` : ''}
                  </span>
                </div>
                <Slider
                  id={`${simulateur.id}-${c.cle}`}
                  value={[Number(valeurs[c.cle])]}
                  min={c.min}
                  max={c.max}
                  step={c.pas}
                  onValueChange={([v]) => setValeurs((p) => ({ ...p, [c.cle]: v }))}
                  aria-label={c.label}
                />
                {c.aide && <p className="text-xs leading-relaxed text-muted-foreground">{c.aide}</p>}
              </div>
            ) : (
              <div key={c.cle} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{c.label}</label>
                <Select
                  value={String(valeurs[c.cle])}
                  onValueChange={(v) => setValeurs((p) => ({ ...p, [c.cle]: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    {c.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {c.aide && <p className="text-xs leading-relaxed text-muted-foreground">{c.aide}</p>}
              </div>
            )
          )}
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Ce que dit le calcul
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {principaux.map((r) => (
              <div
                key={r.label}
                data-cc="principal"
                className="rounded-xl border border-[hsl(var(--accent-outil)/0.35)] bg-[hsl(var(--accent-outil)/0.07)] p-4"
              >
                <p className="text-xs leading-snug text-muted-foreground">{r.label}</p>
                <p className="cc-chiffre mt-1 font-mono text-2xl font-semibold tabular-nums text-[hsl(var(--accent-outil))]">
                  {r.valeur}
                  {r.unite && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">{r.unite}</span>
                  )}
                </p>
                {r.aide && <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{r.aide}</p>}
              </div>
            ))}
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border">
            {secondaires.map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-4 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{r.label}</p>
                  {r.aide && (
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{r.aide}</p>
                  )}
                </div>
                <p className="shrink-0 font-mono text-sm tabular-nums text-foreground">
                  {r.valeur}
                  {r.unite && <span className="ml-1 text-xs text-muted-foreground">{r.unite}</span>}
                </p>
              </li>
            ))}
          </ul>

          {illustration}
        </div>
      </div>

      {simulateur.ancrage === 'inaturalist' && (
        <AncrageInaturalist valeurs={valeurs} setValeurs={setValeurs} />
      )}

      {/* Détails de méthode */}
      <Collapsible open={detailsOuverts} onOpenChange={setDetailsOuverts}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 border-t border-border px-5 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50 sm:px-6"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--accent-outil))]" aria-hidden />
              Comment ce résultat est calculé
            </span>
            <ChevronDown
              className={cn('h-4 w-4 shrink-0 transition-transform', detailsOuverts && 'rotate-180')}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-5 border-t border-border bg-muted/20 p-5 sm:p-6">
            <FormuleBloc lignes={simulateur.formule} />

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Pourquoi c'est rigoureux
              </p>
              <ul className="space-y-2">
                {simulateur.rigueur.map((r) => (
                  <li key={r} className="flex gap-2 text-sm leading-relaxed text-foreground/85">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--accent-outil))]" aria-hidden />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Ce qui est une hypothèse, pas une mesure
              </p>
              <ul className="space-y-2">
                {simulateur.hypotheses.map((h) => (
                  <li key={h} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" aria-hidden />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <SourceNote sources={simulateur.sources} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
};

export default SimulateurCard;
