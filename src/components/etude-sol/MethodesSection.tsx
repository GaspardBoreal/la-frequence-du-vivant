import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import {
  CATEGORY_MAP,
  METHOD_CATEGORIES,
  METHOD_GUARANTEES,
  PUBLIC_METHODS,
  type MethodCategoryId,
} from '@/content/etudeDeSolMethodes';

export const MethodesSection: React.FC = () => {
  const [filter, setFilter] = React.useState<MethodCategoryId | 'all'>('all');
  const methods = React.useMemo(
    () => (filter === 'all' ? PUBLIC_METHODS : PUBLIC_METHODS.filter((m) => m.category === filter)),
    [filter],
  );

  return (
    <section
      id="methodes"
      className="scroll-mt-16 border-t border-[hsl(var(--ds-forest))]/15 bg-[hsl(var(--ds-cream))] py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[hsl(var(--ds-forest))]/70">
          02 — Synthèse des méthodes
        </p>
        <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-[hsl(var(--ds-forest-deep))] sm:text-4xl">
          Douze gestes de terrain, un carnet
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
          Une bêche, un bocal, une bandelette, cinq minutes par point. Chaque geste produit un
          livrable lisible, géolocalisé et photographié.
        </p>

        {/* Filtres par catégorie */}
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
              filter === 'all'
                ? 'border-transparent bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]'
                : 'border-[hsl(var(--ds-forest))]/30 text-[hsl(var(--ds-forest-deep))]/75 hover:bg-[hsl(var(--ds-forest))]/10'
            }`}
          >
            Toutes ({PUBLIC_METHODS.length})
          </button>
          {METHOD_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              style={
                filter === c.id
                  ? { backgroundColor: `hsl(${c.accent})`, borderColor: 'transparent', color: 'hsl(var(--ds-cream))' }
                  : { borderColor: `hsl(${c.accent} / 0.45)`, color: `hsl(${c.accent})` }
              }
              className="rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition"
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Tableau (desktop) */}
        <div className="mt-8 hidden overflow-hidden rounded-3xl border border-[hsl(var(--ds-forest))]/18 bg-white/70 md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em]">Catégorie</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em]">Nom</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em]">Résumé simple</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.16em]">Livrable</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m, i) => {
                const cat = CATEGORY_MAP[m.category];
                return (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
                    className="border-t border-[hsl(var(--ds-forest))]/12 align-top transition hover:bg-[hsl(var(--ds-forest))]/[0.06]"
                  >
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
                        style={{ backgroundColor: `hsl(${cat.accent} / 0.14)`, color: `hsl(${cat.accent})` }}
                      >
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[14.5px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                      {m.name}
                      {m.optional && (
                        <span className="ml-2 rounded-full border border-[hsl(var(--ds-forest))]/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--ds-forest))]/80">
                          Optionnel
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[13.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
                      {m.summary}
                    </td>
                    <td className="px-5 py-4 text-[13.5px] font-medium text-[hsl(var(--ds-forest-deep))]/90">
                      {m.deliverable}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Cartes (mobile) */}
        <div className="mt-8 grid gap-3 md:hidden">
          {methods.map((m) => {
            const cat = CATEGORY_MAP[m.category];
            return (
              <article
                key={m.id}
                className="rounded-2xl border border-[hsl(var(--ds-forest))]/18 bg-white/70 p-4"
              >
                <span
                  className="inline-flex rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                  style={{ backgroundColor: `hsl(${cat.accent} / 0.14)`, color: `hsl(${cat.accent})` }}
                >
                  {cat.label}
                </span>
                <h3 className="mt-2 text-[15px] font-semibold text-[hsl(var(--ds-forest-deep))]">
                  {m.name}
                  {m.optional && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-[hsl(var(--ds-forest))]/70">
                      Optionnel
                    </span>
                  )}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/75">
                  {m.summary}
                </p>
                <p className="mt-2.5 border-t border-dashed border-[hsl(var(--ds-forest))]/20 pt-2 text-[13px] font-medium text-[hsl(var(--ds-forest-deep))]">
                  → {m.deliverable}
                </p>
              </article>
            );
          })}
        </div>

        {/* Garanties de qualité */}
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METHOD_GUARANTEES.map((g) => (
            <div
              key={g.title}
              className="rounded-2xl border border-[hsl(var(--ds-forest))]/18 bg-[hsl(var(--ds-forest))]/[0.06] p-5"
            >
              <ShieldCheck className="h-5 w-5 text-[hsl(var(--ds-forest))]" />
              <h3 className="mt-3 text-[14px] font-bold text-[hsl(var(--ds-forest-deep))]">{g.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[hsl(var(--ds-forest-deep))]/72">
                {g.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodesSection;
