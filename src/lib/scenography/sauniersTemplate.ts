/**
 * Scenography template — LES SECRETS DE SAUNIERS
 * Coopérative des Sauniers de l'Île de Ré · Ars-en-Ré
 *
 * Récit en 6 temps :
 *   0. Le Seuil          — marée montante, titre, dateline
 *   1. L'Amont           — les 8 stations patrimoniales d'Ars-en-Ré
 *   2. Les 4 Éléments    — Sel / Eau / Argile / Vivant (la couche de preuve)
 *   3. La Parole         — témoignages sauniers (event_testimonies)
 *   4. Le Relevé         — espèces + photos réellement collectées
 *   5. La Coopérative    — signature client + appel
 *
 * Deux états automatiques :
 *   - AVANT la marche (0 espèce, 0 photo) → mode « promesse », poétique
 *   - APRÈS la marche (données présentes) → mode « restitution », chiffré
 *
 * Globals injectés par ScenographyRuntime :
 *   React, createElement, motion, AnimatePresence, useScroll, useTransform,
 *   useScrollProgress, useMousePos, lerp, clamp, hashColor, data
 *
 * Style createElement uniquement (pas de JSX) → parser TS, pas d'ambiguïté `<`.
 * Doit se terminer par : export default Scenography;
 */
export const SAUNIERS_ARS_EN_RE_TEMPLATE = String.raw`
// ---------------- utils ----------------
function usePrefersReducedMotion() {
  const { useState, useEffect } = React;
  const [r, setR] = useState(false);
  useEffect(function () {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = function () { setR(m.matches); };
    on();
    m.addEventListener ? m.addEventListener('change', on) : m.addListener(on);
    return function () { m.removeEventListener ? m.removeEventListener('change', on) : m.removeListener(on); };
  }, []);
  return r;
}

function frDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { return null; }
}

function Reveal(props) {
  const reduced = usePrefersReducedMotion();
  if (reduced || !motion) {
    return createElement('div', { className: props.className }, props.children);
  }
  return createElement(motion.div, {
    className: props.className,
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.7, delay: props.delay || 0, ease: [0.22, 1, 0.36, 1] },
  }, props.children);
}

// ---------------- contenu éditorial ----------------
const STATIONS = [
  { n: 1, lieu: "Le Port d'Ars-en-Ré", sous: "L'enrôlement", txt: "Sur les quais, chacun reçoit sa besace de transmission et prête le serment du saunier face aux bateaux traditionnels." },
  { n: 2, lieu: "L'ancienne gare", sous: "Le réseau de l'or blanc", txt: "Le sel voyageait par le tortillard. Le jeu de cordes révèle l'équilibre logistique fragile de l'île." },
  { n: 3, lieu: "L'église et son clocher", sous: "L'amer et les éléments", txt: "Le clocher noir et blanc sert d'amer aux marins. Boussole en main, on apprend à lire le vent — allié ou ennemi du saunier." },
  { n: 4, lieu: "L'ancien moulin à marée", sous: "La force de l'océan", txt: "Sur les traces du moulin disparu, le palais s'exerce : reconnaître les niveaux de salinité, comprendre le parcours de l'eau." },
  { n: 5, lieu: "L'ancienne raffinerie", sous: "Le défi de la pureté", txt: "Loupe de bois sur un cristal brut. Pourquoi un sel entièrement naturel a survécu à l'ère industrielle." },
  { n: 6, lieu: "La salorge", sous: "Le poids du savoir-faire", txt: "Face au hangar historique, on manipule une réplique du simoussi et l'on mesure la noblesse du geste." },
  { n: 7, lieu: "Les marais salants", sous: "Le fondement de l'écosystème", txt: "L'argile brute entre les doigts. Son imperméabilité est la fondation invisible de tout le système salicole." },
  { n: 8, lieu: "La coopérative", sous: "Le passage au collectif", txt: "La carte du périple se reconstitue. Une pincée de fleur de sel scelle le passage d'apprenti à ambassadeur." },
];

const ELEMENTS = [
  { cle: 'sel', titre: 'Le Sel', geste: 'Dégustation comparée, cristal à la loupe', donnee: 'Gradient de salinité relevé bassin par bassin', teinte: 'from-slate-100 to-white', encre: 'text-slate-900' },
  { cle: 'eau', titre: "L'Eau", geste: 'Lecture du circuit vasière → aires saunantes', donnee: 'Parcours de l\'eau cartographié, waypoints GPS', teinte: 'from-sky-100 to-teal-50', encre: 'text-teal-900' },
  { cle: 'argile', titre: "L'Argile", geste: 'Malaxage, test de plasticité', donnee: 'Prélèvements photographiés, situés, datés', teinte: 'from-amber-100 to-orange-50', encre: 'text-amber-900' },
  { cle: 'vivant', titre: 'Le Vivant', geste: 'Observation guidée des halophytes et de l\'avifaune', donnee: 'Observations géolocalisées versées à la science participative', teinte: 'from-emerald-100 to-lime-50', encre: 'text-emerald-900' },
];

const ATTENDUS = [
  'Salicorne', 'Obione', 'Soude maritime', 'Aster maritime', 'Statice',
  'Avocette élégante', 'Échasse blanche', 'Gravelot à collier interrompu', 'Tadorne de Belon', 'Aigrette garzette',
];

// ---------------- atomes ----------------
function Chiffre(props) {
  return createElement('div', { className: 'text-center' },
    createElement('div', { className: 'text-4xl sm:text-6xl font-light tabular-nums text-teal-900' }, props.valeur),
    createElement('div', { className: 'text-[10px] uppercase tracking-[0.28em] text-teal-700/70 mt-2' }, props.label),
  );
}

function Marée(props) {
  // Bandeau de marée : trois vagues SVG lentes, respectueuses de reduced-motion.
  const reduced = usePrefersReducedMotion();
  const vagues = [
    { d: 'M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,140 L0,140 Z', o: 0.18, dur: 26 },
    { d: 'M0,80 C300,30 600,120 900,70 C1140,30 1320,90 1440,70 L1440,140 L0,140 Z', o: 0.28, dur: 34 },
    { d: 'M0,100 C200,70 520,130 820,100 C1080,75 1280,120 1440,95 L1440,140 L0,140 Z', o: 0.45, dur: 44 },
  ];
  return createElement('div', { className: 'absolute inset-x-0 bottom-0 h-32 overflow-hidden pointer-events-none' },
    vagues.map(function (v, i) {
      const svg = createElement('svg', {
        key: 'v' + i, viewBox: '0 0 1440 140', preserveAspectRatio: 'none',
        className: 'absolute inset-0 w-[200%] h-full',
      }, createElement('path', { d: v.d, fill: 'currentColor', opacity: v.o }));
      if (reduced || !motion) return createElement('div', { key: 'w' + i, className: 'absolute inset-0 text-teal-700' }, svg);
      return createElement(motion.div, {
        key: 'w' + i,
        className: 'absolute inset-0 text-teal-700',
        animate: { x: ['0%', '-50%'] },
        transition: { duration: v.dur, repeat: Infinity, ease: 'linear' },
      }, svg);
    })
  );
}

// ---------------- actes ----------------
function ActeSeuil(props) {
  const ev = props.event || {};
  const d = frDate(ev.date);
  return createElement('section', { className: 'relative min-h-[92vh] flex items-center bg-gradient-to-b from-sky-50 via-white to-slate-50 overflow-hidden' },
    createElement('div', { className: 'relative z-10 max-w-5xl mx-auto px-6 py-24' },
      createElement(Reveal, { className: 'inline-block' },
        createElement('span', { className: 'inline-block px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-[11px] font-semibold uppercase tracking-[0.22em]' },
          'Ars-en-Ré · Île de Ré')
      ),
      createElement(Reveal, { className: 'mt-7', delay: 0.08 },
        createElement('h1', { className: 'font-display text-5xl sm:text-7xl lg:text-8xl font-light leading-[0.95] text-slate-900' },
          'Les Secrets', createElement('br'), 'de Sauniers')
      ),
      createElement(Reveal, { className: 'mt-8 max-w-2xl', delay: 0.16 },
        createElement('p', { className: 'text-lg sm:text-xl text-slate-600 leading-relaxed' },
          "Une Marche du Vivant conçue avec la Coopérative des Sauniers de l'Île de Ré. Trois heures pour apprendre à lire un marais : le patrimoine d'abord, les salines ensuite, et la parole de ceux qui les travaillent.")
      ),
      createElement(Reveal, { className: 'mt-10 flex flex-wrap gap-3 text-sm', delay: 0.24 },
        [
          d ? { k: 'date', v: d } : null,
          { k: 'duree', v: '1 h 15 en village · 1 h 45 en marais' },
          ev.lieu ? { k: 'lieu', v: ev.lieu } : { k: 'lieu', v: 'Départ : port d\'Ars-en-Ré' },
        ].filter(Boolean).map(function (it) {
          return createElement('span', {
            key: it.k,
            className: 'px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-slate-200 text-slate-700 font-medium shadow-sm',
          }, it.v);
        })
      ),
    ),
    createElement(Marée, null),
  );
}

function ActeAmont() {
  return createElement('section', { className: 'py-24 bg-white' },
    createElement('div', { className: 'max-w-5xl mx-auto px-6' },
      createElement(Reveal, { className: 'text-center max-w-2xl mx-auto' },
        createElement('div', { className: 'text-[11px] uppercase tracking-[0.3em] text-teal-700/70' }, 'Premier temps · 1 h 15'),
        createElement('h2', { className: 'font-display text-4xl sm:text-5xl font-light text-slate-900 mt-4' }, "L'Amont — huit stations dans le village"),
        createElement('p', { className: 'text-slate-600 mt-5 leading-relaxed' },
          "Aucun écran. Une besace de toile, une boussole, une loupe de bois, un peu d'argile. Le village d'Ars-en-Ré raconte le sel par ses bâtiments, ses disparus compris.")
      ),
      createElement('div', { className: 'mt-16 space-y-4' },
        STATIONS.map(function (s, i) {
          return createElement(Reveal, { key: s.n, delay: Math.min(i * 0.05, 0.3) },
            createElement('div', { className: 'group flex gap-5 sm:gap-8 p-5 sm:p-7 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-teal-300 transition-colors' },
              createElement('div', { className: 'shrink-0 w-11 h-11 rounded-xl bg-teal-900 text-white grid place-items-center font-light text-lg tabular-nums' }, s.n),
              createElement('div', { className: 'min-w-0' },
                createElement('h3', { className: 'font-display text-xl sm:text-2xl font-light text-slate-900' }, s.lieu),
                createElement('div', { className: 'text-[11px] uppercase tracking-[0.22em] text-teal-700 mt-1' }, s.sous),
                createElement('p', { className: 'text-sm sm:text-base text-slate-600 mt-3 leading-relaxed' }, s.txt),
              ),
            )
          );
        })
      ),
    )
  );
}

function ActeElements() {
  return createElement('section', { className: 'py-24 bg-slate-900 text-slate-100' },
    createElement('div', { className: 'max-w-5xl mx-auto px-6' },
      createElement(Reveal, { className: 'text-center max-w-2xl mx-auto' },
        createElement('div', { className: 'text-[11px] uppercase tracking-[0.3em] text-teal-300/70' }, 'Second temps · 1 h 45'),
        createElement('h2', { className: 'font-display text-4xl sm:text-5xl font-light mt-4' }, "L'Aval — les quatre éléments du saunier"),
        createElement('p', { className: 'text-slate-400 mt-5 leading-relaxed' },
          "Dans le marais, chaque geste sensible produit une donnée. Les marcheurs gardent l'argile et la loupe ; le guide et deux relais consignent. Low-tech pendant, données après.")
      ),
      createElement('div', { className: 'mt-16 grid sm:grid-cols-2 gap-5' },
        ELEMENTS.map(function (e, i) {
          return createElement(Reveal, { key: e.cle, delay: Math.min(i * 0.08, 0.32) },
            createElement('div', { className: 'h-full p-7 rounded-3xl bg-gradient-to-br ' + e.teinte },
              createElement('h3', { className: 'font-display text-3xl font-light ' + e.encre }, e.titre),
              createElement('div', { className: 'mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-500' }, 'Le geste'),
              createElement('p', { className: 'text-sm text-slate-700 mt-1.5' }, e.geste),
              createElement('div', { className: 'mt-5 text-[11px] uppercase tracking-[0.22em] text-slate-500' }, 'Ce que nous rapportons'),
              createElement('p', { className: 'text-sm font-medium ' + e.encre + ' mt-1.5' }, e.donnee),
            )
          );
        })
      ),
    )
  );
}

function ActeParole(props) {
  const temoignages = props.testimonies || [];
  return createElement('section', { className: 'py-24 bg-amber-50' },
    createElement('div', { className: 'max-w-4xl mx-auto px-6' },
      createElement(Reveal, { className: 'text-center' },
        createElement('div', { className: 'text-[11px] uppercase tracking-[0.3em] text-amber-700/80' }, 'Au centre du parcours'),
        createElement('h2', { className: 'font-display text-4xl sm:text-5xl font-light text-slate-900 mt-4' }, 'La parole du saunier'),
      ),
      temoignages.length === 0
        ? createElement(Reveal, { className: 'mt-12', delay: 0.1 },
            createElement('div', { className: 'p-8 sm:p-12 rounded-3xl bg-white border border-amber-200 text-center' },
              createElement('p', { className: 'font-display text-2xl sm:text-3xl font-light text-slate-800 leading-snug' },
                "« Le vent, je ne le mesure pas. Je le reconnais. »"),
              createElement('p', { className: 'text-sm text-slate-500 mt-6 leading-relaxed max-w-xl mx-auto' },
                "Un saunier de la coopérative tient une station du parcours — non en figurant, en témoin. Son geste est filmé, son savoir enregistré : la lecture du vent, la gestion des niveaux d'eau, ce qu'il voit changer depuis vingt ans. Les paroles recueillies s'inscriront ici."),
            )
          )
        : createElement('div', { className: 'mt-12 space-y-5' },
            temoignages.slice(0, 8).map(function (t, i) {
              return createElement(Reveal, { key: 't' + i, delay: Math.min(i * 0.06, 0.3) },
                createElement('figure', { className: 'p-7 rounded-3xl bg-white border border-amber-200' },
                  createElement('blockquote', { className: 'font-display text-xl sm:text-2xl font-light text-slate-800 leading-snug' }, '« ' + t.text + ' »'),
                  createElement('figcaption', { className: 'text-[11px] uppercase tracking-[0.22em] text-amber-700 mt-4' }, t.author || 'Un saunier'),
                )
              );
            })
          ),
    )
  );
}

function ActeReleve(props) {
  const especes = props.species || [];
  const photos = props.photos || [];
  const waypoints = props.waypoints || [];
  const obs = especes.reduce(function (a, s) { return a + (s.observations_count || 0); }, 0);
  const vide = especes.length === 0 && photos.length === 0;

  return createElement('section', { className: 'py-24 bg-gradient-to-b from-white to-teal-50/60' },
    createElement('div', { className: 'max-w-5xl mx-auto px-6' },
      createElement(Reveal, { className: 'text-center max-w-2xl mx-auto' },
        createElement('div', { className: 'text-[11px] uppercase tracking-[0.3em] text-teal-700/70' }, vide ? 'Après la marche' : 'Le relevé'),
        createElement('h2', { className: 'font-display text-4xl sm:text-5xl font-light text-slate-900 mt-4' },
          vide ? 'Ce que le marais nous dira' : 'Ce que le marais nous a dit'),
      ),

      vide
        ? createElement(Reveal, { className: 'mt-14', delay: 0.1 },
            createElement('div', { className: 'p-8 sm:p-12 rounded-3xl bg-white border border-teal-200' },
              createElement('p', { className: 'text-slate-600 leading-relaxed' },
                "Le marais salant est l'un des écosystèmes les plus lisibles de France : la flore y trace le gradient de salinité, l'avifaune y suit le calendrier des bassins. Chaque marche produit un relevé daté, situé, vérifiable — remis à la coopérative sous forme de bordereau du vivant."),
              createElement('div', { className: 'mt-8 text-[11px] uppercase tracking-[0.22em] text-teal-700/70' }, 'Cortège attendu'),
              createElement('div', { className: 'mt-4 flex flex-wrap gap-2' },
                ATTENDUS.map(function (n) {
                  return createElement('span', {
                    key: n,
                    className: 'px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-sm',
                  }, n);
                })
              ),
              createElement('p', { className: 'text-xs text-slate-400 mt-6' },
                "Liste indicative, non un résultat. Cette page se remplira des observations réellement collectées le jour de la marche."),
            )
          )
        : createElement(React.Fragment, null,
            createElement(Reveal, { className: 'mt-14', delay: 0.06 },
              createElement('div', { className: 'grid grid-cols-3 gap-4 p-7 rounded-3xl bg-white border border-teal-200' },
                createElement(Chiffre, { valeur: especes.length, label: 'Espèces' }),
                createElement(Chiffre, { valeur: obs, label: 'Observations' }),
                createElement(Chiffre, { valeur: waypoints.length || photos.length, label: waypoints.length ? 'Stations' : 'Photos' }),
              )
            ),
            createElement('div', { className: 'mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' },
              especes.slice(0, 24).map(function (sp, i) {
                return createElement(Reveal, { key: sp.scientific_name || i, delay: Math.min(i * 0.03, 0.3) },
                  createElement('div', { className: 'group rounded-2xl overflow-hidden bg-white border border-slate-200' },
                    createElement('div', { className: 'aspect-square bg-teal-50 overflow-hidden' },
                      sp.photo_url
                        ? createElement('img', {
                            src: sp.photo_url, alt: sp.common_name || sp.scientific_name, loading: 'lazy',
                            className: 'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
                          })
                        : createElement('div', { className: 'w-full h-full grid place-items-center text-teal-300 text-3xl font-light' }, '·')
                    ),
                    createElement('div', { className: 'p-3' },
                      createElement('div', { className: 'text-sm font-medium text-slate-900 leading-tight' }, sp.common_name || sp.scientific_name),
                      createElement('div', { className: 'text-[11px] italic text-slate-400 mt-0.5' }, sp.scientific_name),
                    ),
                  )
                );
              })
            ),
            photos.length > 0 && createElement('div', { className: 'mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3' },
              photos.slice(0, 8).map(function (p, i) {
                return createElement('div', { key: 'p' + i, className: 'aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100' },
                  createElement('img', {
                    src: p.thumbnail_url || p.url, alt: p.caption || 'Photographie de marche', loading: 'lazy',
                    className: 'w-full h-full object-cover',
                  })
                );
              })
            ),
          ),
    )
  );
}

function ActeCooperative(props) {
  const ev = props.event || {};
  return createElement('section', { className: 'py-24 bg-teal-900 text-teal-50' },
    createElement('div', { className: 'max-w-3xl mx-auto px-6 text-center' },
      createElement(Reveal, null,
        createElement('div', { className: 'text-[11px] uppercase tracking-[0.3em] text-teal-300/80' }, 'Le commanditaire'),
        createElement('h2', { className: 'font-display text-4xl sm:text-5xl font-light mt-4' }, "La Coopérative des Sauniers de l'Île de Ré"),
        createElement('p', { className: 'text-teal-100/80 mt-6 leading-relaxed' },
          "Une coopérative qui n'expose pas seulement un produit : elle expose un métier vivant, et elle mesure son marais. La marche inaugure un observatoire — mêmes stations, quatre saisons, courbes comparées."),
      ),
      createElement(Reveal, { className: 'mt-12 grid sm:grid-cols-3 gap-4 text-left', delay: 0.1 },
        [
          { t: 'La carte', d: 'Observations situées, station par station' },
          { t: "L'inventaire", d: 'Espèces du marais, noms français, photos' },
          { t: 'Le bordereau', d: 'PDF, Excel, GeoJSON au nom de la coopérative' },
        ].map(function (b) {
          return createElement('div', { key: b.t, className: 'p-5 rounded-2xl bg-teal-800/60 border border-teal-700' },
            createElement('div', { className: 'font-display text-xl font-light' }, b.t),
            createElement('p', { className: 'text-sm text-teal-100/70 mt-2 leading-relaxed' }, b.d),
          );
        })
      ),
      createElement(Reveal, { className: 'mt-14', delay: 0.18 },
        createElement('p', { className: 'text-[11px] uppercase tracking-[0.28em] text-teal-300/60' },
          'Une Marche du Vivant · ' + (ev.lieu || "Ars-en-Ré, Île de Ré")),
      ),
    )
  );
}

// ---------------- composition ----------------
function Scenography() {
  const ev = (data && data.event) || {};
  return createElement('div', { className: 'min-h-screen bg-white text-slate-800 antialiased selection:bg-teal-200' },
    createElement(ActeSeuil, { event: ev }),
    createElement(ActeAmont, null),
    createElement(ActeElements, null),
    createElement(ActeParole, { testimonies: data && data.testimonies }),
    createElement(ActeReleve, {
      species: data && data.species,
      photos: data && data.photos,
      waypoints: data && data.waypoints,
    }),
    createElement(ActeCooperative, { event: ev }),
  );
}

export default Scenography;
`;
