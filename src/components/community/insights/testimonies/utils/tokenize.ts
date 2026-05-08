// French stop-words + tokenizer for the testimonies word cloud.
// Stop-list is stored in NFD-normalized form (no accents) since we normalize before lookup.
const STOP_WORDS = new Set([
  // Articles, prépositions, conjonctions
  'le','la','les','un','une','des','de','du','d','l','et','ou','mais','donc','or','ni','car',
  'a','à','au','aux','en','dans','sur','sous','pour','par','avec','sans','vers','chez','contre','entre',
  'que','qui','quoi','dont','ou','où','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','nos','votre','vos','leur','leurs',
  'je','j','tu','il','elle','on','nous','vous','ils','elles','me','te','se','y',
  // Auxiliaires être / avoir / faire (toutes formes courantes, sans accents)
  'est','suis','es','sommes','etes','sont','etre','etait','etaient','soit','sera','seront','fut','ete',
  'ai','as','avons','avez','ont','avoir','eu','avait','avaient','aura','auront',
  'fait','faits','faite','faites','faire','fais','font','faisait','ferait','feront',
  // Verbes très fréquents non porteurs de sens dans un témoignage
  'prend','prends','prendre','prenait','prennent','pris','prise',
  'passe','passes','passent','passer','passait','passe',
  'va','vais','vas','vont','allait','allais','aller','allons','allez',
  'dit','dis','dire','disait','disent','disais',
  'voir','vois','voit','voyait','voyons','vu','vue','vues','vus',
  'savoir','sait','savait','savent','sais','su',
  'peut','peuvent','pouvoir','pouvait','pouvais','pourra','pourrait','pu',
  'veut','veulent','vouloir','voulait','voulais','voudrait','voulu',
  'mettre','met','mets','mettent','mettait','mis',
  'donne','donnes','donner','donnent','donnait','donne',
  'trouve','trouves','trouver','trouvent','trouvait',
  'arrive','arrives','arriver','arrivent','arrivait',
  'rend','rendre','rendent','rendait',
  'reste','restes','rester','restent','restait',
  // Locutions / élisions tronquées
  'parce','quelqu','aujourdhui','jusqu','lorsqu','puisqu','presqu','quoiqu','quelqu',
  // Adverbes & marqueurs peu signifiants
  'plus','moins','tres','trop','peu','aussi','encore','deja','toujours','jamais','bien','mal',
  'tout','tous','toute','toutes','meme','autre','autres',
  'pas','ne','non','oui','si','alors','puis','quand','comment','pourquoi','enfin','donc','assez','parfois','souvent','juste',
  'comme','quelque','quelques','chaque','tel','telle','telles','tels',
  'cela','ca','ceci','celui','celle','ceux','celles','la','ici',
  'quelle','quel','vraiment','c','m','t','s','n','qu',
  'lui','grand','grande','petit','petite','beaucoup',
  // Mots peu porteurs de sens dans un témoignage oral
  'truc','trucs','chose','choses','fois','vrai','vraie','vrais','vraies',
  'super','genre','etc','cetait','cest','hyper',
  // Abréviations / restes d'élisions
  'aujourd','hui','jusque',
]);

export interface WordEntry {
  word: string; // forme d'affichage (avec accents)
  key: string;  // forme normalisée (sans accents) pour matching
  count: number;
  testimonyIds: string[];
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Tokenise un texte en préservant la forme accentuée d'origine.
 * Retourne des paires { display, key } où key est normalisé (sans accents).
 */
export function tokenizeQuote(text: string): { display: string; key: string }[] {
  // On casse les apostrophes (toutes variantes) pour gérer les élisions.
  const cleaned = text.replace(/[''‛`´«»""„]/g, ' ');
  // Split sur tout ce qui n'est pas lettre (Unicode) ou tiret.
  const raw = cleaned.split(/[^\p{L}-]+/u);
  const out: { display: string; key: string }[] = [];
  for (const w of raw) {
    const display = w.trim().replace(/^-+|-+$/g, '').toLowerCase();
    if (!display) continue;
    const key = normalize(display);
    if (key.length < 4 || STOP_WORDS.has(key)) continue;
    out.push({ display, key });
  }
  return out;
}

export function buildWordCloud(items: { id: string; quote: string }[]): WordEntry[] {
  const map = new Map<
    string,
    { count: number; ids: Set<string>; forms: Map<string, number> }
  >();
  for (const it of items) {
    const seen = new Set<string>();
    for (const { display, key } of tokenizeQuote(it.quote)) {
      if (seen.has(key)) continue;
      seen.add(key);
      const entry =
        map.get(key) || { count: 0, ids: new Set<string>(), forms: new Map<string, number>() };
      entry.count += 1;
      entry.ids.add(it.id);
      entry.forms.set(display, (entry.forms.get(display) || 0) + 1);
      map.set(key, entry);
    }
  }
  return Array.from(map.entries())
    .map(([key, v]) => {
      // forme d'affichage la plus fréquente (préserve les accents)
      const word = Array.from(v.forms.entries()).sort((a, b) => b[1] - a[1])[0][0];
      return { word, key, count: v.count, testimonyIds: Array.from(v.ids) };
    })
    .sort((a, b) => b.count - a.count);
}
