import { parseStrate, parseHeightM, parseEcoFunctions, type Strate } from '@/lib/plantSpread';
import type { ScenographeProposal } from '@/components/propriete/scenographe/scenographeStore';

const norm = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const findCol = (head: string[], ...keys: string[]) =>
  head.findIndex((h) => keys.some((k) => norm(h).includes(norm(k))));

/** « Thym serpolet (Thymus serpyllum) » → { fr, latin } */
function splitName(cell: string): { fr: string | null; latin: string | null } {
  const raw = (cell || '').replace(/\*/g, '').trim();
  if (!raw) return { fr: null, latin: null };
  const m = raw.match(/^(.*?)[\s]*[（(]\s*([A-Z][a-zà-ÿ-]+(?:\s+[a-zà-ÿ×-]+){1,2})\s*[)）]/);
  if (m) return { fr: m[1].trim() || null, latin: m[2].trim() };
  // Binôme latin nu
  if (/^[A-Z][a-z-]+\s+[a-z×-]+/.test(raw)) return { fr: null, latin: raw.split(/[,;·]/)[0].trim() };
  return { fr: raw, latin: null };
}

/**
 * Lit une matrice de tableau (issue du DOM du chat) et en extrait des
 * propositions d'espèces exploitables par le Scénographe. Tolérante : toute
 * colonne manquante retombe sur des valeurs prudentes.
 */
export function parseSpeciesTable(matrix: string[][]): ScenographeProposal[] {
  if (!matrix || matrix.length < 2) return [];
  const [head, ...body] = matrix;

  let nameCol = findCol(head, 'espece', 'espèce', 'scientifique', 'plante', 'nom', 'taxon');
  if (nameCol < 0) nameCol = 0;
  const strateCol = findCol(head, 'strate', 'port', 'type');
  const heightCol = findCol(head, 'hauteur', 'taille', 'envergure');
  const fnCol = findCol(head, 'fonction', 'role', 'rôle', 'usage', 'interet', 'intérêt', 'service');
  const noteCol = findCol(head, 'note', 'commentaire', 'remarque', 'justification', 'pourquoi');

  const out: ScenographeProposal[] = [];
  const seen = new Set<string>();

  for (const row of body) {
    const { fr, latin } = splitName(row[nameCol] || '');
    const scientificName = latin || fr;
    if (!scientificName) continue;
    const key = norm(scientificName);
    if (seen.has(key)) continue;
    seen.add(key);

    const strate: Strate = parseStrate(
      strateCol >= 0 ? row[strateCol] : `${row[nameCol] || ''} ${row[fnCol] || ''}`,
    );
    out.push({
      scientificName,
      commonNameFr: latin ? fr : null,
      strate,
      heightM: heightCol >= 0 ? parseHeightM(row[heightCol]) : null,
      functions: parseEcoFunctions(
        fnCol >= 0 ? row[fnCol] : null,
        noteCol >= 0 ? row[noteCol] : null,
      ),
      note: noteCol >= 0 ? row[noteCol] || null : null,
    });
  }
  return out;
}

/** Vrai si la matrice ressemble à une palette végétale (au moins 2 binômes). */
export function looksLikeSpeciesTable(matrix: string[][]): boolean {
  return parseSpeciesTable(matrix).filter((p) => /\s/.test(p.scientificName)).length >= 2;
}
