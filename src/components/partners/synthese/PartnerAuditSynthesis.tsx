import React from 'react';
import { ArrowRight, Brain, Handshake, Leaf, Sparkles, Target } from 'lucide-react';
import { useCountUp, useRevealOnScroll } from '@/hooks/useRevealOnScroll';
import { usePublicGlobalStats } from '@/hooks/usePublicGlobalStats';
import type { PartnerAudit, PartnerAuditKpi } from '@/lib/partnerAudits';

/* ------------------------------------------------------------------ */
/* Planche générique                                                    */
/* ------------------------------------------------------------------ */

const Planche: React.FC<{
  kicker?: string;
  title?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ kicker, title, children, className }) => {
  const { ref, shown } = useRevealOnScroll<HTMLElement>(0.15);
  return (
    <section
      ref={ref}
      className={`relative border-t border-border/40 px-6 py-20 transition-all duration-700 motion-reduce:transition-none ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
      } ${className ?? ''}`}
    >
      <div className="mx-auto w-full max-w-5xl">
        {kicker && (
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary/80">{kicker}</p>
        )}
        {title && (
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {title}
          </h2>
        )}
        <div className={kicker || title ? 'mt-8' : ''}>{children}</div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* 2. Le duel en chiffres                                              */
/* ------------------------------------------------------------------ */

const KpiRow: React.FC<{ kpi: PartnerAuditKpi; partnerName: string; index: number }> = ({
  kpi,
  partnerName,
  index,
}) => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>(0.4);
  const them = useCountUp(kpi.themPct, shown, 900 + index * 80);
  const us = useCountUp(kpi.usPct, shown, 900 + index * 80);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-foreground">{kpi.label}</span>
        {kpi.note && <span className="text-xs text-muted-foreground">{kpi.note}</span>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {[
          { name: partnerName, text: kpi.themText, pct: them, tone: 'bg-muted-foreground/50' },
          { name: 'La Fréquence du Vivant', text: kpi.usText, pct: us, tone: 'bg-primary' },
        ].map((side) => (
          <div key={side.name}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {side.name}
              </span>
              <span className="text-base font-semibold text-foreground">{side.text}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${side.tone}`}
                style={{ width: `${Math.max(2, side.pct)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* 4. La preuve terrain                                                */
/* ------------------------------------------------------------------ */

const PlatformStat: React.FC<{ label: string; value: number | undefined; delay: number }> = ({
  label,
  value,
  delay,
}) => {
  const { ref, shown } = useRevealOnScroll<HTMLDivElement>(0.5);
  const n = useCountUp(value ?? 0, shown && value !== undefined, 1200 + delay);
  if (value === undefined || value === null) return null;
  return (
    <div
      ref={ref}
      className="rounded-2xl border border-primary/25 bg-primary/5 p-5 text-center"
    >
      <div className="text-3xl font-semibold tabular-nums text-primary md:text-4xl">
        {Math.round(n).toLocaleString('fr-FR')}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Orchestrateur                                                       */
/* ------------------------------------------------------------------ */

export const PartnerAuditSynthesis: React.FC<{ audit: PartnerAudit }> = ({ audit }) => {
  const s = audit.synthesis;
  const { data: stats, isLoading } = usePublicGlobalStats();
  if (!s) return null;

  const platform = [
    { label: 'Marches organisées', value: stats?.marches_organisees },
    { label: 'Marcheurs', value: stats?.marcheurs },
    { label: 'Observations du vivant', value: stats?.observations_citoyennes },
    { label: 'Espèces tracées', value: stats?.especes_tracees },
    { label: 'Photos collectées', value: stats?.photos_collectees },
    { label: 'Territoires couverts', value: stats?.domaines },
  ];

  return (
    <div className="print:hidden">
      {/* 1 — Ouverture */}
      <section className="relative overflow-hidden px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_0%,hsl(var(--primary)/0.18),transparent_70%),radial-gradient(50%_50%_at_90%_20%,hsl(var(--primary)/0.10),transparent_70%)]"
        />
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <p className="text-[11px] uppercase tracking-[0.26em] text-primary/80">
            Lecture synthétique — 90 secondes
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-foreground md:text-6xl">
            La Fréquence du Vivant{' '}
            <span className="inline-block animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite] text-primary">
              ×
            </span>{' '}
            {audit.partnerName}
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-foreground/80 md:text-xl">
            {s.verdict}
          </p>
          <p className="mt-8 text-xs text-muted-foreground">{audit.dateLabel} · {audit.sources}</p>
        </div>
      </section>

      {/* 2 — Le duel en chiffres */}
      <Planche kicker="Le duel en chiffres" title="Deux visibilités exactement inverses">
        <div className="grid gap-4 md:grid-cols-2">
          {s.kpis.map((k, i) => (
            <KpiRow key={k.label} kpi={k} partnerName={audit.partnerName} index={i} />
          ))}
        </div>
      </Planche>

      {/* 3 — Complémentarité */}
      <Planche kicker="La complémentarité" title="Ce que chacun met sur la table">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Leaf className="h-4 w-4 text-muted-foreground" /> {audit.partnerName}
            </div>
            <ul className="space-y-3 text-sm text-foreground/80">
              {s.themBrings.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-6 shadow-lg shadow-primary/5">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              <Handshake className="h-4 w-4" /> La zone commune
            </div>
            <ul className="space-y-3 text-sm text-foreground/90">
              {s.shared.map((t) => (
                <li key={t} className="flex gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
            <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-primary" /> La Fréquence du Vivant
            </div>
            <ul className="space-y-3 text-sm text-foreground/80">
              {s.usBring.map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Planche>

      {/* 4 — Preuve terrain */}
      <Planche kicker="La preuve terrain" title="Ce que la plateforme produit, en direct">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {platform.map((p, i) => (
              <PlatformStat key={p.label} label={p.label} value={p.value} delay={i * 90} />
            ))}
          </div>
        )}
        <p className="mt-6 text-xs text-muted-foreground">
          Chiffres lus en temps réel dans la base de la plateforme — aucune valeur saisie à la main.
        </p>
      </Planche>

      {/* 5 — Levier GEO */}
      <Planche kicker="Le levier IA / GEO" title="Qui les modèles citeront-ils demain ?">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-y-10 -left-1/3 w-1/2 rotate-12 bg-gradient-to-r from-transparent via-primary/10 to-transparent motion-safe:animate-[slide-in-right_6s_ease-in-out_infinite]"
          />
          <div className="relative grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/40 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {audit.partnerName}
              </p>
              <p className="mt-2 text-sm text-foreground/85">{s.geo.themLine}</p>
            </div>
            <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-primary/90">
                La Fréquence du Vivant
              </p>
              <p className="mt-2 text-sm text-foreground/90">{s.geo.usLine}</p>
            </div>
          </div>
          <ul className="relative mt-6 space-y-3 text-sm text-foreground/80">
            {s.geo.points.map((p) => (
              <li key={p} className="flex gap-2">
                <Brain className="mt-0.5 h-4 w-4 shrink-0 text-primary/80" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Planche>

      {/* 6 — Leviers */}
      <Planche kicker="Les leviers" title="Trois mouvements, deux gagnants">
        <div className="grid gap-4 md:grid-cols-3">
          {s.levers.map((l, i) => (
            <div
              key={l.title}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 transition-all hover:-translate-y-1 hover:border-primary/50"
            >
              <span className="text-4xl font-light text-primary/25">0{i + 1}</span>
              <h3 className="mt-2 text-lg font-semibold text-foreground">{l.title}</h3>
              <div className="mt-4 space-y-3 text-sm">
                <p className="text-foreground/75">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    Pour {audit.partnerName}
                  </span>
                  {l.forThem}
                </p>
                <p className="text-foreground/75">
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-primary/80">
                    Pour nous
                  </span>
                  {l.forUs}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Planche>

      {/* 7 — Clôture */}
      <Planche className="border-b border-border/40">
        <div className="mx-auto max-w-3xl text-center">
          <Sparkles className="mx-auto h-6 w-6 text-primary" />
          <p className="mt-6 text-xl leading-relaxed text-foreground md:text-2xl">{s.closing}</p>
          <p className="mt-8 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {audit.dateLabel} — document de négociation, diffusion restreinte
          </p>
        </div>
      </Planche>
    </div>
  );
};

export default PartnerAuditSynthesis;
