import React, { useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import {
  FAMILLES,
  METHODES_24,
  PALIERS,
  type Famille,
  type MethodeTerrain,
  type Palier,
} from '@/content/frequenceJardin/methodes24';
import { FjSourceLink } from './FjSourceLink';

type Lecture = 'complexite' | 'nourricier' | 'famille';

const LECTURES: { id: Lecture; label: string }[] = [
  { id: 'complexite', label: 'Du plus simple au plus long' },
  { id: 'nourricier', label: 'Pour un jardin nourricier' },
  { id: 'famille', label: 'Par question et par sens' },
];

const FAMILLE_ORDER: Famille[] = ['lieu', 'matiere', 'eau', 'racines', 'vivant', 'assiette', 'semis'];
const PALIER_ORDER: Palier[] = ['indispensable', 'tres-utile', 'complement'];

const PALIER_STYLE: Record<Palier, string> = {
  indispensable: 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]',
  'tres-utile': 'bg-[hsl(var(--ds-gold)/0.22)] text-[hsl(var(--ds-forest-deep))]',
  complement: 'bg-[hsl(var(--ds-earth)/0.14)] text-[hsl(var(--ds-forest-deep))]',
};

const spring = { type: 'spring' as const, stiffness: 260, damping: 30, mass: 0.9 };
const pad = (n: number) => String(n).padStart(2, '0');

const StatutBadge: React.FC<{ m: MethodeTerrain }> = ({ m }) =>
  m.statut === 'guide' ? (
    <span className="rounded-full bg-[hsl(var(--ds-verdict-non)/0.14)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--ds-verdict-non))]">
      Nouvelle — guide de terrain
    </span>
  ) : (
    <span className="rounded-full bg-[hsl(var(--ds-verdict-oui)/0.14)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--ds-verdict-oui))]">
      Dans l’application
    </span>
  );

const Carte: React.FC<{ m: MethodeTerrain; num: number; flipped: boolean; onFlip: () => void }> = ({
  m,
  num,
  flipped,
  onFlip,
}) => {
  const reduce = useReducedMotion();
  const fam = FAMILLES[m.famille];
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFlip();
    }
  };
  return (
    <motion.li
      layout={!reduce}
      layoutId={reduce ? undefined : m.id}
      transition={spring}
      className="list-none [perspective:1200px]"
    >
      <motion.div
        className="relative min-h-[212px] [transform-style:preserve-3d]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.55, ease: [0.19, 1, 0.22, 1] }}
      >
        {/* Recto */}
        <button
          type="button"
          onClick={onFlip}
          onKeyDown={onKey}
          aria-expanded={flipped}
          aria-label={`${m.nom} — voir le geste et la source`}
          tabIndex={flipped ? -1 : 0}
          className="absolute inset-0 flex flex-col rounded-2xl border border-[hsl(var(--ds-line))] bg-white/70 p-5 text-left transition hover:border-[hsl(var(--ds-forest-soft))] hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ds-forest))] [backface-visibility:hidden]"
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: fam.couleur }} aria-hidden />
            <span className="font-serif text-[22px] leading-none text-[hsl(var(--ds-forest))]">{pad(num)}</span>
          </div>
          <p className="mt-3 font-serif text-[19px] leading-snug text-[hsl(var(--ds-forest-deep))]">{m.nom}</p>
          <div className="mt-2">
            <StatutBadge m={m} />
          </div>
          <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-[13px] text-[hsl(var(--ds-ink-soft))]">
            <div>
              <dt className="sr-only">Durée</dt>
              <dd>⏱ {m.duree}</dd>
            </div>
            <div>
              <dt className="sr-only">Enjeu</dt>
              <dd>Enjeu : {m.enjeu}</dd>
            </div>
          </dl>
        </button>

        {/* Verso */}
        <div
          className="absolute inset-0 flex flex-col rounded-2xl border p-5 [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ borderColor: fam.couleur, background: 'hsl(var(--ds-cream))' }}
          aria-hidden={!flipped}
        >
          <p className="text-[14px] leading-relaxed text-[hsl(var(--ds-ink))]">{m.geste}</p>
          <p className="mt-3 text-[13px] text-[hsl(var(--ds-ink-soft))]">
            <span className="font-serif italic">{fam.question}</span> — <strong>{fam.sens}</strong>
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[13px]">
            <FjSourceLink href={m.source.url} tabIndex={flipped ? 0 : -1}>
              Source
            </FjSourceLink>
            <button
              type="button"
              onClick={onFlip}
              tabIndex={flipped ? 0 : -1}
              aria-expanded={flipped}
              className="inline-flex items-center gap-1 text-[hsl(var(--ds-ink-soft))] hover:text-[hsl(var(--ds-forest-deep))]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Retourner
            </button>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
};

const Grille: React.FC<{
  items: MethodeTerrain[];
  numOf: (m: MethodeTerrain) => number;
  flipped: Set<string>;
  toggle: (id: string) => void;
}> = ({ items, numOf, flipped, toggle }) => (
  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <AnimatePresence mode="popLayout" initial={false}>
      {items.map((m) => (
        <Carte key={m.id} m={m} num={numOf(m)} flipped={flipped.has(m.id)} onFlip={() => toggle(m.id)} />
      ))}
    </AnimatePresence>
  </ul>
);

const Fondu: React.FC<{ children: React.ReactNode; k: string }> = ({ children, k }) => (
  <motion.div key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
    {children}
  </motion.div>
);

/** Planche vivante des 24 méthodes : trois lectures, filtres, cartes retournables, sources. */
const PlancheMethodes: React.FC = () => {
  const [lecture, setLecture] = useState<Lecture>('complexite');
  const [familles, setFamilles] = useState<Set<Famille>>(new Set());
  const [nouvelles, setNouvelles] = useState(false);
  const [indisp, setIndisp] = useState(false);
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const toggle = (id: string) =>
    setFlipped((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleFam = (f: Famille) =>
    setFamilles((prev) => {
      const n = new Set(prev);
      n.has(f) ? n.delete(f) : n.add(f);
      return n;
    });

  const filtres = familles.size > 0 || nouvelles || indisp;
  const visibles = useMemo(
    () =>
      METHODES_24.filter(
        (m) =>
          (familles.size === 0 || familles.has(m.famille)) &&
          (!nouvelles || m.statut === 'guide') &&
          (!indisp || m.palier === 'indispensable'),
      ),
    [familles, nouvelles, indisp],
  );

  const numOf = (m: MethodeTerrain) => (lecture === 'nourricier' ? m.rangNourricier : m.ordreComplexite);
  const byComplexite = [...visibles].sort((a, b) => a.ordreComplexite - b.ordreComplexite);
  const byRang = [...visibles].sort((a, b) => a.rangNourricier - b.rangNourricier);

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition ${
      active
        ? 'border-[hsl(var(--ds-forest))] bg-[hsl(var(--ds-forest))] text-[hsl(var(--ds-cream))]'
        : 'border-[hsl(var(--ds-line))] bg-white/60 text-[hsl(var(--ds-ink))] hover:border-[hsl(var(--ds-forest-soft))]'
    }`;

  return (
    <div>
      {/* Sélecteur de lecture */}
      <div
        role="group"
        aria-label="Choisir une lecture"
        className="grid gap-1 rounded-2xl border border-[hsl(var(--ds-line))] bg-white/60 p-1 sm:inline-grid sm:grid-cols-3"
      >
        {LECTURES.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={lecture === l.id}
            onClick={() => setLecture(l.id)}
            className={`rounded-xl px-4 py-2.5 text-[14px] transition ${
              lecture === l.id
                ? 'bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]'
                : 'text-[hsl(var(--ds-ink))] hover:bg-[hsl(var(--ds-cream))]'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filtrer les méthodes">
        {FAMILLE_ORDER.map((f) => (
          <button key={f} type="button" aria-pressed={familles.has(f)} onClick={() => toggleFam(f)} className={chip(familles.has(f))}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: FAMILLES[f].couleur }} aria-hidden />
            {FAMILLES[f].question}
          </button>
        ))}
        <button type="button" aria-pressed={nouvelles} onClick={() => setNouvelles((v) => !v)} className={chip(nouvelles)}>
          Seulement les nouvelles
        </button>
        <button type="button" aria-pressed={indisp} onClick={() => setIndisp((v) => !v)} className={chip(indisp)}>
          Seulement les indispensables
        </button>
        {filtres && (
          <button
            type="button"
            onClick={() => {
              setFamilles(new Set());
              setNouvelles(false);
              setIndisp(false);
            }}
            className="rounded-full px-3 py-1.5 text-[13px] text-[hsl(var(--ds-forest))] underline underline-offset-4"
          >
            Tout afficher
          </button>
        )}
      </div>
      <p className="mt-3 text-[13px] text-[hsl(var(--ds-ink-soft))]" aria-live="polite">
        {visibles.length} méthode{visibles.length > 1 ? 's' : ''} affichée{visibles.length > 1 ? 's' : ''}. Touchez une
        carte pour la retourner.
      </p>

      <div className="mt-6">
        <LayoutGroup>
          {lecture === 'complexite' && <Grille items={byComplexite} numOf={numOf} flipped={flipped} toggle={toggle} />}

          {lecture === 'nourricier' &&
            PALIER_ORDER.map((p) => {
              const items = byRang.filter((m) => m.palier === p);
              if (!items.length) return null;
              return (
                <Fondu key={p} k={p}>
                  <div className={`mb-4 mt-8 rounded-xl px-4 py-2.5 text-[14px] font-medium first:mt-0 ${PALIER_STYLE[p]}`}>
                    {PALIERS[p].label} · {PALIERS[p].plage}
                  </div>
                  <Grille items={items} numOf={numOf} flipped={flipped} toggle={toggle} />
                </Fondu>
              );
            })}

          {lecture === 'famille' &&
            FAMILLE_ORDER.map((f) => {
              const items = byComplexite.filter((m) => m.famille === f);
              if (!items.length) return null;
              return (
                <Fondu key={f} k={f}>
                  <div className="mb-4 mt-8 border-l-4 pl-3" style={{ borderColor: FAMILLES[f].couleur }}>
                    <p className="font-serif text-[20px] italic text-[hsl(var(--ds-forest-deep))]">{FAMILLES[f].question}</p>
                    <p className="text-[13px] font-semibold text-[hsl(var(--ds-ink))]">{FAMILLES[f].sens}</p>
                  </div>
                  <Grille items={items} numOf={numOf} flipped={flipped} toggle={toggle} />
                </Fondu>
              );
            })}
        </LayoutGroup>
      </div>

      {/* Planche des sources */}
      <div className="mt-10">
        <button
          type="button"
          aria-expanded={sourcesOpen}
          aria-controls="planche-sources"
          onClick={() => setSourcesOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--ds-line))] bg-white/60 px-5 py-2.5 text-[14px] text-[hsl(var(--ds-forest-deep))] hover:border-[hsl(var(--ds-forest-soft))]"
        >
          {sourcesOpen ? 'Masquer les 24 sources' : 'Voir les 24 sources'}
          <ChevronDown className={`h-4 w-4 transition ${sourcesOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {sourcesOpen && (
          <div id="planche-sources" className="mt-5">
            <table className="hidden w-full border-collapse overflow-hidden rounded-2xl text-left text-[13px] md:table">
              <thead className="bg-[hsl(var(--ds-forest-deep))] text-[hsl(var(--ds-cream))]">
                <tr>
                  {['Méthode', 'Statut', 'Durée', 'Rang nourricier', 'Question — sens', 'Source'].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2.5 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...METHODES_24]
                  .sort((a, b) => a.ordreComplexite - b.ordreComplexite)
                  .map((m, i) => (
                    <tr key={m.id} className={i % 2 ? 'bg-white/70' : 'bg-[hsl(var(--ds-cream))]'}>
                      <th scope="row" className="px-3 py-2.5 font-medium text-[hsl(var(--ds-forest-deep))]">
                        {pad(m.ordreComplexite)} · {m.nom}
                      </th>
                      <td className="px-3 py-2.5">{m.statut === 'app' ? 'Application' : 'Guide de terrain'}</td>
                      <td className="px-3 py-2.5">{m.duree}</td>
                      <td className="px-3 py-2.5">{pad(m.rangNourricier)}</td>
                      <td className="px-3 py-2.5">
                        <span className="italic">{FAMILLES[m.famille].question}</span> — {FAMILLES[m.famille].sens}
                      </td>
                      <td className="px-3 py-2.5">
                        <FjSourceLink href={m.source.url}>{m.source.label}</FjSourceLink>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <ul className="space-y-3 md:hidden">
              {[...METHODES_24]
                .sort((a, b) => a.ordreComplexite - b.ordreComplexite)
                .map((m) => (
                  <li key={m.id} className="rounded-xl border border-[hsl(var(--ds-line))] bg-white/70 p-4 text-[13px]">
                    <p className="font-serif text-[16px] text-[hsl(var(--ds-forest-deep))]">
                      {pad(m.ordreComplexite)} · {m.nom}
                    </p>
                    <p className="mt-1 text-[hsl(var(--ds-ink-soft))]">
                      {m.statut === 'app' ? 'Application' : 'Guide de terrain'} · {m.duree} · rang nourricier{' '}
                      {pad(m.rangNourricier)}
                    </p>
                    <p className="mt-1">
                      <span className="italic">{FAMILLES[m.famille].question}</span> — {FAMILLES[m.famille].sens}
                    </p>
                    <p className="mt-2 break-words">
                      <FjSourceLink href={m.source.url}>{m.source.label}</FjSourceLink>
                    </p>
                  </li>
                ))}
            </ul>
            <p className="mt-3 text-[12px] text-[hsl(var(--ds-ink-soft))]">Durées indicatives, par point de prélèvement.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlancheMethodes;
