/**
 * Réparation des tableaux markdown produits par le modèle.
 *
 * Le rendu du chat s'appuie sur remark-gfm : un tableau n'est reconnu que s'il
 * possède une ligne d'en-tête, une ligne de séparation (`| --- |`) et une ligne
 * par enregistrement. Quand le modèle oublie la séparation ou écrit tout le
 * tableau sur une seule ligne, GFM abandonne et l'utilisateur voit couler des
 * `|` dans un paragraphe. Ce module remet le markdown d'aplomb AVANT le rendu,
 * sans jamais toucher au reste du contenu.
 */

/** Découpe une ligne `| a | b |` en cellules propres. */
const splitRow = (line: string): string[] => {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  return s.split('|').map((c) => c.trim());
};

const isPipeLine = (line: string) => (line.match(/\|/g) ?? []).length >= 2;

const isSeparatorLine = (line: string) =>
  /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

const buildRow = (cells: string[], width: number) => {
  const out = cells.slice(0, width);
  while (out.length < width) out.push('—');
  return `| ${out.map((c) => c || '—').join(' | ')} |`;
};

const separatorRow = (width: number) => `| ${Array.from({ length: width }, () => '---').join(' | ')} |`;

/** En-têtes attendus par le prompt « Synthèse à exporter » — sert d'indice fort. */
const KNOWN_HEADERS = [
  'espèce',
  'nom scientifique',
  'strate',
  'hauteur',
  'exposition',
  'fonctions écologiques',
  'justification',
  'nom',
  'type',
  'surface',
  'intention',
  'observations',
  'source',
];

const headerScore = (cells: string[]) =>
  cells.reduce((s, c) => (KNOWN_HEADERS.includes(c.toLowerCase()) ? s + 1 : s), 0) / (cells.length || 1);

/**
 * Devine la largeur d'un tableau écrit sur une seule ligne : on teste chaque
 * découpage entier possible et on retient celui dont l'en-tête ressemble le
 * plus à un en-tête (libellés courts, connus, sans ponctuation de phrase).
 */
const guessWidth = (cells: string[]): number | null => {
  let best: { k: number; score: number } | null = null;
  for (let k = 2; k <= Math.min(12, cells.length); k++) {
    if (cells.length % k !== 0) continue;
    const head = cells.slice(0, k);
    const shortness = head.every((c) => c.length > 0 && c.length <= 32) ? 1 : 0;
    const noSentence = head.every((c) => !/[.:;]/.test(c)) ? 0.5 : 0;
    const score = headerScore(head) * 3 + shortness + noSentence + k * 0.01;
    if (!best || score > best.score) best = { k, score };
  }
  return best && best.score >= 1 ? best.k : null;
};

/** Un tableau sur une seule ligne (≥ 2 enregistrements potentiels). */
const repairSingleLineTable = (line: string): string[] | null => {
  const cells = splitRow(line).filter((c) => c.length > 0 && !/^:?-{2,}:?$/.test(c));
  if (cells.length < 6) return null;
  const width = guessWidth(cells);
  if (!width || cells.length / width < 2) return null;
  const rows: string[] = [buildRow(cells.slice(0, width), width), separatorRow(width)];
  for (let i = width; i < cells.length; i += width) {
    rows.push(buildRow(cells.slice(i, i + width), width));
  }
  return rows;
};

/**
 * Normalise le markdown d'une réponse assistant : les tableaux GFM valides sont
 * renvoyés tels quels, les tableaux dégradés sont reconstruits.
 *
 * @param content markdown brut (éventuellement en cours de streaming)
 * @param streaming vrai tant que la réponse n'est pas terminée : la dernière
 *   ligne, potentiellement incomplète, est alors laissée intacte.
 */
export function repairChatMarkdown(content: string, streaming = false): string {
  if (!content || !content.includes('|')) return content;

  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!isPipeLine(line) || isSeparatorLine(line)) {
      out.push(line);
      i++;
      continue;
    }

    // Bloc de lignes contiguës contenant des pipes.
    const block: string[] = [];
    while (i < lines.length && isPipeLine(lines[i])) {
      block.push(lines[i]);
      i++;
    }
    const lastOfContent = i >= lines.length;

    if (block.length >= 2 && isSeparatorLine(block[1])) {
      // Tableau déjà valide : on n'y touche pas.
      out.push(...block);
      continue;
    }

    if (block.length === 1) {
      if (streaming && lastOfContent) {
        // Ligne en cours d'écriture : on attend la suite.
        out.push(block[0]);
        continue;
      }
      const repaired = repairSingleLineTable(block[0]);
      out.push(...(repaired ?? block));
      continue;
    }

    // Plusieurs lignes, séparation manquante : on l'insère.
    const width = splitRow(block[0]).length;
    const rows = [buildRow(splitRow(block[0]), width), separatorRow(width)];
    for (let r = 1; r < block.length; r++) {
      if (isSeparatorLine(block[r])) continue;
      const cells = splitRow(block[r]);
      if (streaming && lastOfContent && r === block.length - 1 && cells.length < width) {
        continue; // dernière ligne encore en cours de streaming
      }
      rows.push(buildRow(cells, width));
    }
    out.push(...rows);
  }

  return out.join('\n');
}

export default repairChatMarkdown;
