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
  word: string;
  count: number;
  testimonyIds: string[];
}

export function tokenizeQuote(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Apostrophes (toutes variantes) → espace pour casser les élisions (quelqu'un, parce qu', aujourd'hui...)
    .replace(/[''‛`´«»""„]/g, ' ')
    .split(/[^a-z-]+/i)
    .map((w) => w.trim().replace(/^-+|-+$/g, ''))
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

export function buildWordCloud(items: { id: string; quote: string }[]): WordEntry[] {
  const map = new Map<string, { count: number; ids: Set<string> }>();
  for (const it of items) {
    const seen = new Set<string>();
    for (const w of tokenizeQuote(it.quote)) {
      if (seen.has(w)) continue;
      seen.add(w);
      const entry = map.get(w) || { count: 0, ids: new Set<string>() };
      entry.count += 1;
      entry.ids.add(it.id);
      map.set(w, entry);
    }
  }
  return Array.from(map.entries())
    .map(([word, v]) => ({ word, count: v.count, testimonyIds: Array.from(v.ids) }))
    .sort((a, b) => b.count - a.count);
}
