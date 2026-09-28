import {
  CATALOG_2026_09_18,
  PRICE_FLOOR,
  PRICE_MAX,
  type VdtpCatalog,
} from '@/content/vdtp/configurateur-2026-09-18';

/**
 * Règle de prix, affichée telle quelle aux partenaires :
 *   sélection vide      → 0 €
 *   sélection non vide  → 15 000 € + 35 000 € × (poids cochés / poids total du 18.09.2026)
 * Catalogue du 18.09 tout coché = exactement 50 000 €. Les briques ajoutées depuis
 * s'ajoutent au-delà, sans modifier le prix d'une sélection existante.
 */
export function computePrice(
  selected: Iterable<string>,
  catalog: VdtpCatalog = CATALOG_2026_09_18,
): number {
  const ids = Array.from(new Set(Array.from(selected)));
  if (ids.length === 0) return 0;
  const weight = selectedWeight(ids, catalog);
  const raw = PRICE_FLOOR + (PRICE_MAX - PRICE_FLOOR) * (weight / catalog.refWeight);
  return Math.round(raw / 100) * 100;
}

export function maxPrice(catalog: VdtpCatalog = CATALOG_2026_09_18): number {
  return computePrice(catalog.options.map((o) => o.id), catalog);
}

export function selectedWeight(
  selected: Iterable<string>,
  catalog: VdtpCatalog = CATALOG_2026_09_18,
): number {
  return Array.from(new Set(Array.from(selected))).reduce(
    (sum, id) => sum + (catalog.byId.get(id)?.weight ?? 0),
    0,
  );
}

/** Part de la valeur du catalogue retenue, de 0 à 1. */
export function coverage(
  selected: Iterable<string>,
  catalog: VdtpCatalog = CATALOG_2026_09_18,
): number {
  return catalog.totalWeight === 0 ? 0 : selectedWeight(selected, catalog) / catalog.totalWeight;
}

/** Deux tiers à la commande, un tiers conditionné à la réussite du projet. */
export function splitPayment(price: number) {
  const upfront = Math.round((price * (2 / 3)) / 100) * 100;
  return { upfront, conditional: price - upfront };
}

export function formatEuro(value: number): string {
  return `${value.toLocaleString('fr-FR')} €`;
}

/** Encodage compact de la sélection pour l'URL : un bit par option, par paquets de 5 en base 32. */
export function encodeSelection(
  selected: Iterable<string>,
  catalog: VdtpCatalog = CATALOG_2026_09_18,
): string {
  const set = new Set(Array.from(selected));
  const bits = catalog.options.map((o) => (set.has(o.id) ? '1' : '0')).join('');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2).toString(32);
  }
  return out;
}

export function decodeSelection(
  code: string | null | undefined,
  catalog: VdtpCatalog = CATALOG_2026_09_18,
): string[] {
  if (!code) return [];
  let bits = '';
  for (const ch of code) {
    const v = parseInt(ch, 32);
    if (Number.isNaN(v)) return [];
    bits += v.toString(2).padStart(5, '0');
  }
  return catalog.options.filter((_, i) => bits[i] === '1').map((o) => o.id);
}
