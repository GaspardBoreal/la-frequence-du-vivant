import React from 'react';
import {
  Wrench,
  HandHeart,
  Hammer,
  Handshake,
  HelpCircle,
  Landmark,
  Clock,
} from 'lucide-react';
import type { PartnerOffer } from '@/lib/partnerOffers';

const SectionTitle: React.FC<{
  icon: React.ReactNode;
  kicker: string;
  title: string;
  intro?: string;
}> = ({ icon, kicker, title, intro }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 text-primary">
      {icon}
      <span className="text-[11px] uppercase tracking-[0.2em]">{kicker}</span>
    </div>
    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
    {intro && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{intro}</p>}
  </div>
);

export const PartnerOfferContent: React.FC<{ offer: PartnerOffer }> = ({ offer }) => {
  return (
    <div className="space-y-16">
      {/* 1 — Lecture des marchés */}
      <section>
        <SectionTitle
          icon={<Landmark className="h-4 w-4" />}
          kicker="1 · Lecture des marchés"
          title="Vos dix marchés, et ce qui s'y branche"
          intro="Chaque ligne reprend un marché du tableau que vous nous avez transmis, et indique les blocs de notre technologie directement mobilisables."
        />
        <div className="space-y-4">
          {offer.markets.map((m) => (
            <article
              key={m.title}
              className="rounded-xl border border-border/60 bg-card/40 p-5"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
                  {m.period}
                </span>
                <h3 className="text-base font-semibold text-foreground">{m.title}</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{m.brief}</p>
              <dl className="mt-3 grid gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                <div>
                  <dt className="uppercase tracking-wider text-muted-foreground/70">Périmètre</dt>
                  <dd className="text-foreground/90">{m.scope}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted-foreground/70">
                    Donneur d'ordre
                  </dt>
                  <dd className="text-foreground/90">{m.client}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-wider text-muted-foreground/70">Livrables</dt>
                  <dd className="text-foreground/90">{m.deliverables}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.blocks.map((b) => (
                  <span
                    key={b}
                    className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] text-foreground/80"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 2 — Outils */}
      <section>
        <SectionTitle
          icon={<Wrench className="h-4 w-4" />}
          kicker="2 · Ce que nous faisons régulièrement"
          title="Outils"
          intro="Tout ce qui suit existe et tourne aujourd'hui en production. Rien n'est projeté."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {offer.tools.map((t) => (
            <article
              key={t.title}
              className="rounded-xl border border-border/60 bg-card/40 p-5"
            >
              <h3 className="text-base font-semibold text-foreground">{t.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.what}</p>
              <p className="mt-3 text-xs text-foreground/80">
                <span className="uppercase tracking-wider text-muted-foreground/70">
                  Marchés concernés ·{' '}
                </span>
                {t.useFor}
              </p>
              <p className="mt-1.5 text-xs italic text-muted-foreground">{t.proof}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3 — Services */}
      <section>
        <SectionTitle
          icon={<HandHeart className="h-4 w-4" />}
          kicker="2 · Ce que nous faisons régulièrement"
          title="Services"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {offer.services.map((s) => (
            <article
              key={s.title}
              className="rounded-xl border border-border/60 bg-card/40 p-5"
            >
              <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.detail}</p>
              <p className="mt-3 text-xs text-foreground/80">
                <span className="uppercase tracking-wider text-muted-foreground/70">
                  Marchés concernés ·{' '}
                </span>
                {s.useFor}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 4 — Développements */}
      <section>
        <SectionTitle
          icon={<Hammer className="h-4 w-4" />}
          kicker="3 · Développements complémentaires"
          title="Ce que nous pouvons réaliser en moins de trois mois"
          intro="Chaque chantier est déclenché par un marché réel de votre historique, et tient dans une fenêtre de développement inférieure à trois mois."
        />
        <div className="space-y-3">
          {offer.developments.map((d) => (
            <article
              key={d.title}
              className="rounded-xl border border-border/60 bg-card/40 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">{d.title}</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
                  <Clock className="h-3 w-3" /> {d.duration}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="uppercase tracking-wider text-muted-foreground/70">
                  Déclencheur ·{' '}
                </span>
                {d.trigger}
              </p>
              <p className="mt-1.5 text-sm text-foreground/90">{d.output}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 5 — Collaboration */}
      <section>
        <SectionTitle
          icon={<Handshake className="h-4 w-4" />}
          kicker="4 · Modes de collaboration"
          title="Deux positions, selon la taille du marché"
        />
        <div className="grid gap-4 md:grid-cols-2">
          {offer.collaboration.map((c) => (
            <article
              key={c.mode}
              className="rounded-xl border border-border/60 bg-card/40 p-5"
            >
              <h3 className="text-base font-semibold text-foreground">{c.mode}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>
              <p className="mt-3 text-xs text-foreground/85">
                <span className="uppercase tracking-wider text-muted-foreground/70">Rôles · </span>
                {c.roles}
              </p>
              <p className="mt-1.5 text-xs text-foreground/85">
                <span className="uppercase tracking-wider text-muted-foreground/70">
                  Données ·{' '}
                </span>
                {c.data}
              </p>
              <ul className="mt-3 space-y-1 text-xs text-foreground/85">
                {c.commitments.map((e) => (
                  <li key={e} className="flex gap-2">
                    <span className="text-primary">—</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* 6 — Questions */}
      <section>
        <SectionTitle
          icon={<HelpCircle className="h-4 w-4" />}
          kicker="5 · Avant de nous engager ensemble"
          title="Les questions que nous vous posons"
          intro="Nous préférons poser ces questions maintenant plutôt que de les découvrir en cours de marché."
        />
        <ol className="space-y-3">
          {offer.questions.map((q, i) => (
            <li
              key={q.question}
              className="rounded-xl border border-border/60 bg-card/40 p-5"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-sm font-semibold text-primary">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
                    {q.theme}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">{q.question}</p>
                  <p className="mt-1.5 text-xs italic text-muted-foreground">{q.why}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="rounded-xl border border-primary/25 bg-primary/5 p-5 text-sm text-foreground/90">
        {offer.closing}
      </p>
    </div>
  );
};

export default PartnerOfferContent;
