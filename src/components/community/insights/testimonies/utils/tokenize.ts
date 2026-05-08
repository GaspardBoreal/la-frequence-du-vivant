// French stop-words + tokenizer for the testimonies word cloud.
const STOP_WORDS = new Set([
  'le','la','les','un','une','des','de','du','d','l','et','ou','mais','donc','or','ni','car',
  'a','à','au','aux','en','dans','sur','sous','pour','par','avec','sans','vers','chez','contre','entre',
  'que','qui','quoi','dont','où','ce','cet','cette','ces','mon','ma','mes','ton','ta','tes','son','sa','ses','notre','nos','votre','vos','leur','leurs',
  'je','j','tu','il','elle','on','nous','vous','ils','elles','me','te','se','y',
  'est','suis','es','sommes','êtes','sont','être','était','étaient','soit','sera','seront','fut','été',
  'ai','as','avons','avez','ont','avoir','eu','avait','avaient','aura','auront',
  'fait','faire','fais','font','faisait','ferait',
  'plus','moins','très','trop','peu','aussi','encore','déjà','toujours','jamais','bien','mal','tout','tous','toute','toutes','même','autre','autres',
  'pas','ne','non','oui','si','alors','puis','quand','comment','pourquoi',
  'comme','quelque','quelques','chaque','tel','telle','telles','tels',
  'cela','ça','ceci','celui','celle','ceux','celles','là','ici',
  'mes','vos','leurs','aux','des','quelle','quel','vraiment','c','m','t','s','n','qu',
  'lui','elles','être','avoir','grand','petit','beaucoup',
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
    .replace(/[«»""''`]/g, ' ')
    .split(/[^a-zàâäéèêëîïôöùûüç-]+/i)
    .map((w) => w.trim())
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
    // also count repetitions for size weighting
    for (const w of tokenizeQuote(it.quote)) {
      const entry = map.get(w);
      if (entry) entry.count += 0; // keep distinct-doc count
    }
  }
  return Array.from(map.entries())
    .map(([word, v]) => ({ word, count: v.count, testimonyIds: Array.from(v.ids) }))
    .sort((a, b) => b.count - a.count);
}
