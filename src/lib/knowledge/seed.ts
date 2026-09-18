/**
 * Fiches de départ de la base de connaissance Fréquence Jardin.
 *
 * Rien n'est réécrit ni inventé ici : chaque fiche reprend, mot pour mot, un
 * savoir déjà publié dans le site (FAQ du pilier, guides, méthodes d'étude de
 * sol, table des plantes bio-indicatrices, fiches d'ouvrages, inspirations,
 * nuancier) et conserve sa source d'origine.
 */

import { FJ_FAQ } from '@/content/frequenceJardin/pilier';
import { FJ_GUIDES } from '@/content/frequenceJardin/guides';
import { FJ_PLANTS } from '@/content/frequenceJardin/plantes';
import { PUBLIC_METHODS, CATEGORY_MAP } from '@/content/etudeDeSolMethodes';
import { PLANT_INDICATORS } from '@/lib/plantIndicatorKb';
import { PALETTE_BLACKLIST, PALETTE_SOURCES } from '@/lib/plantPaletteKb';
import { OUVRAGE_RECO_KB, toolByKey } from '@/lib/ouvrageRecoKb';
import { INSPIRATIONS, TYPOLOGIE_LABEL } from '@/lib/inspirationsKb';
import { HARMONIES } from '@/lib/nuancierKb';

export type KbAudience = 'jardinier' | 'visiteur' | 'paysagiste' | 'support';

export interface KbSeedSource {
  name: string;
  url?: string;
}

export interface KbSeedArticle {
  stable_id: string;
  title: string;
  question_principale: string;
  short_answer: string;
  body_md: string;
  audiences: KbAudience[];
  topic: string;
  is_public: boolean;
  sources: KbSeedSource[];
}

const SITE = 'https://la-frequence-du-vivant.com';

const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

/* ── 1. Questions fréquentes du pilier ─────────────────────────── */
const faqArticles = (): KbSeedArticle[] =>
  FJ_FAQ.map((qa, i) => ({
    stable_id: `faq-pilier-${i + 1}`,
    title: qa.q,
    question_principale: qa.q,
    short_answer: qa.a,
    body_md: qa.a,
    audiences: ['visiteur', 'support'] as KbAudience[],
    topic: 'Le service',
    is_public: true,
    sources: [{ name: 'Page Fréquence Jardin', url: `${SITE}/frequence-jardin` }],
  }));

/* ── 2. Guides publics ─────────────────────────────────────────── */
const guideArticles = (): KbSeedArticle[] =>
  FJ_GUIDES.map((g) => ({
    stable_id: `guide-${g.slug}`,
    title: g.h1,
    question_principale: g.metaTitle,
    short_answer: g.answer,
    body_md: [g.intro, '', ...g.questions.map((q) => `**${q.q}**\n\n${q.a}`)].join('\n'),
    audiences: ['visiteur', 'jardinier', 'paysagiste'] as KbAudience[],
    topic: 'Méthode',
    is_public: true,
    sources: [{ name: g.metaTitle, url: `${SITE}/frequence-jardin/${g.slug}` }],
  }));

/* ── 3. Méthodes d'étude de sol ────────────────────────────────── */
const methodArticles = (): KbSeedArticle[] =>
  PUBLIC_METHODS.map((m) => ({
    stable_id: `methode-sol-${m.id}`,
    title: `${m.name} — méthode de terrain`,
    question_principale: `Comment réaliser le test « ${m.name} » ?`,
    short_answer: m.summary,
    body_md: [
      `**Le geste, pas à pas**`,
      list(m.steps),
      m.material ? `\n**Matériel** : ${m.material}` : '',
      m.results?.length ? `\n**Lectures possibles**\n${list(m.results)}` : '',
      m.benchmarks?.length ? `\n**Repères**\n${list(m.benchmarks)}` : '',
      `\n**Ce que cela produit** : ${m.deliverable}`,
      m.optional ? `\n_Méthode optionnelle._` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    audiences: ['jardinier', 'paysagiste'] as KbAudience[],
    topic: `Sol · ${CATEGORY_MAP[m.category]?.label ?? 'Méthode'}`,
    is_public: true,
    sources: [{ name: 'Étude de sol — méthodes publiques', url: `${SITE}/etude-de-sol` }],
  }));

/* ── 4. Plantes bio-indicatrices ───────────────────────────────── */
const axisWord = (v: number, low: string, high: string, mid: string) => {
  if (v <= -2) return `très ${low}`;
  if (v === -1) return low;
  if (v === 0) return mid;
  if (v === 1) return high;
  return `très ${high}`;
};

const plantArticles = (): KbSeedArticle[] => {
  const written = new Set(FJ_PLANTS.map((p) => p.kbId));

  const pages: KbSeedArticle[] = FJ_PLANTS.map((p) => ({
    stable_id: `plante-${p.kbId}`,
    title: p.h1,
    question_principale: p.metaTitle,
    short_answer: p.answer,
    body_md: [p.intro, '', '**Ce qu’il est raisonnable de faire ensuite**', list(p.suites), '', ...p.questions.map((q) => `**${q.q}**\n\n${q.a}`)].join('\n'),
    audiences: ['jardinier', 'visiteur'] as KbAudience[],
    topic: 'Flore spontanée',
    is_public: true,
    sources: [{ name: p.metaTitle, url: `${SITE}/frequence-jardin/${p.slug}` }],
  }));

  const brefs: KbSeedArticle[] = PLANT_INDICATORS.filter((p) => !written.has(p.id)).map((p) => {
    const nom = p.latin ? `${p.nom} (*${p.latin}*)` : p.nom;
    return {
      stable_id: `indicateur-${p.id}`,
      title: `${p.nom} : ce que cette plante dit du sol`,
      question_principale: `Que signifie la présence de ${p.nom.toLowerCase()} dans un jardin ?`,
      short_answer: `${nom} porte quatre indices de lecture du sol : eau ${p.eau >= 0 ? '+' : ''}${p.eau} (${axisWord(p.eau, 'sec', 'humide', 'indifférent')}), texture ${p.texture >= 0 ? '+' : ''}${p.texture} (${axisWord(p.texture, 'sableuse', 'argileuse', 'indifférente')}), nutrition ${p.nutri >= 0 ? '+' : ''}${p.nutri} (${axisWord(p.nutri, 'pauvre', 'riche', 'indifférente')}), pH ${p.ph >= 0 ? '+' : ''}${p.ph} (${axisWord(p.ph, 'acide', 'calcaire', 'neutre')}).`,
      body_md: `Une plante isolée ne prouve rien : c'est la convergence de plusieurs espèces sur une même zone qui fait un indice sérieux, et cet indice se confronte toujours aux tests de sol. Les indices vont de -3 à +3 ; 0 signifie que la plante est indifférente à ce facteur.`,
      audiences: ['jardinier', 'paysagiste'] as KbAudience[],
      topic: 'Flore spontanée',
      is_public: false,
      sources: [
        { name: 'Table des plantes bio-indicatrices', url: `${SITE}/frequence-jardin/tableau-plantes-bio-indicatrices` },
      ],
    };
  });

  return [...pages, ...brefs];
};

/* ── 5. Palette : espèces à écarter ────────────────────────────── */
const blacklistArticle = (): KbSeedArticle => ({
  stable_id: 'palette-especes-a-ecarter',
  title: 'Les espèces à écarter par principe',
  question_principale: 'Quelles plantes Fréquence Jardin ne recommande jamais ?',
  short_answer:
    "Huit espèces sont écartées quel que soit le lieu : invasives avérées en France métropolitaine ou impasses écologiques fréquentes en jardin.",
  body_md: list(PALETTE_BLACKLIST.map((b) => `**${b.fr}** (*${b.latin}*) — ${b.why}`)),
  audiences: ['jardinier', 'paysagiste', 'visiteur'],
  topic: 'Palette végétale',
  is_public: true,
  sources: PALETTE_SOURCES.map((s) => ({ name: s })),
});

/* ── 6. Fiches d'ouvrages ──────────────────────────────────────── */
const ouvrageArticles = (): KbSeedArticle[] =>
  Object.entries(OUVRAGE_RECO_KB).map(([key, reco]) => {
    const label = toolByKey(key)?.label ?? key;
    return {
      stable_id: `ouvrage-${key}`,
      title: `${label} : mise en œuvre et entretien`,
      question_principale: `Comment réaliser et entretenir un ouvrage de type « ${label} » ?`,
      short_answer: `${reco.miseEnOeuvre[0] ?? ''} Calendrier : ${reco.calendrier}`,
      body_md: [
        '**Mise en œuvre**',
        list(reco.miseEnOeuvre),
        `\n**Calendrier** : ${reco.calendrier}`,
        '\n**Entretien**',
        list([`Année 0 — ${reco.entretien.an0}`, `Année 1 — ${reco.entretien.an1}`, `Années suivantes — ${reco.entretien.an3}`]),
        reco.especes.length ? `\n**Végétaux associés**\n${list(reco.especes)}` : '',
        reco.vigilance.length ? `\n**Points de vigilance**\n${list(reco.vigilance)}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      audiences: ['paysagiste', 'jardinier'] as KbAudience[],
      topic: 'Ouvrages du jardin',
      is_public: false,
      sources: reco.sources.map((s) => ({ name: s })),
    };
  });

/* ── 7. Inspirations ───────────────────────────────────────────── */
const inspirationArticles = (): KbSeedArticle[] =>
  INSPIRATIONS.map((i) => ({
    stable_id: `inspiration-${i.key}`,
    title: i.titre,
    question_principale: `Quel exemple de réalisation en ${TYPOLOGIE_LABEL[i.typologie].toLowerCase()} ?`,
    short_answer: i.resume,
    body_md: [`**Lieu** : ${i.lieu}`, `**Ce que le sol raconte** : ${i.sol}`, `**Mots-clés** : ${i.motsCles.join(', ')}`].join('\n\n'),
    audiences: ['visiteur', 'paysagiste'] as KbAudience[],
    topic: 'Inspirations',
    is_public: false,
    sources: [{ name: `Fiche d'inspiration — ${i.lieu}` }],
  }));

/* ── 8. Nuancier et harmonies ──────────────────────────────────── */
const harmonieArticles = (): KbSeedArticle[] =>
  Object.values(HARMONIES)
    .filter((h) => h.key !== 'vide')
    .map((h) => ({
      stable_id: `harmonie-${h.key}`,
      title: h.label,
      question_principale: `Comment composer un ${h.label.toLowerCase()} ?`,
      short_answer: h.principe,
      body_md: h.conseil,
      audiences: ['jardinier', 'paysagiste'] as KbAudience[],
      topic: 'Couleur et composition',
      is_public: false,
      sources: [{ name: 'Nuancier Fréquence Jardin — atelier de composition' }],
    }));

/** L'ensemble des fiches de départ, dédupliquées par identifiant stable. */
export function buildSeedArticles(): KbSeedArticle[] {
  const all = [
    ...faqArticles(),
    ...guideArticles(),
    ...methodArticles(),
    ...plantArticles(),
    blacklistArticle(),
    ...ouvrageArticles(),
    ...inspirationArticles(),
    ...harmonieArticles(),
  ];
  const seen = new Set<string>();
  return all.filter((a) => (seen.has(a.stable_id) ? false : (seen.add(a.stable_id), true)));
}

/** Les questions que ces fiches couvrent, pour amorcer le registre. */
export function buildSeedQuestions(): Array<{ label: string; audience: KbAudience }> {
  return buildSeedArticles().map((a) => ({
    label: a.question_principale,
    audience: a.audiences[0] ?? 'jardinier',
  }));
}

export const AUDIENCE_LABEL: Record<KbAudience, string> = {
  jardinier: 'Jardinier inscrit',
  visiteur: 'Visiteur non inscrit',
  paysagiste: 'Paysagiste',
  support: 'Équipe support',
};

export const AUDIENCES: KbAudience[] = ['jardinier', 'visiteur', 'paysagiste', 'support'];
