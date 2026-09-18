import {
  CONFIG_OPTIONS,
  OPTION_BY_ID,
  PRICE_FLOOR,
  PRICE_MAX,
  TOTAL_WEIGHT,
} from '@/content/vdtp/configurateur';

/**
 * Règle de prix, affichée telle quelle aux partenaires :
 *   sélection vide      → 0 €
 *   sélection non vide  → 15 000 € + 35 000 € × (poids cochés / poids total)
 * Tout coché = exactement 50 000 €. Arrondi à la centaine d'euros.
 */
export function computePrice(selected: Iterable<string>): number {
  const ids = Array.from(new Set(Array.from(selected)));
  if (ids.length === 0) return 0;
  const weight = ids.reduce((sum, id) => sum + (OPTION_BY_ID.get(id)?.weight ?? 0), 0);
  const raw = PRICE_FLOOR + (PRICE_MAX - PRICE_FLOOR) * (weight / TOTAL_WEIGHT);
  return Math.round(raw / 100) * 100;
}

export function selectedWeight(selected: Iterable<string>): number {
  return Array.from(new Set(Array.from(selected))).reduce(
    (sum, id) => sum + (OPTION_BY_ID.get(id)?.weight ?? 0),
    0,
  );
}

/** Part de la valeur du catalogue retenue, de 0 à 1. */
export function coverage(selected: Iterable<string>): number {
  return TOTAL_WEIGHT === 0 ? 0 : selectedWeight(selected) / TOTAL_WEIGHT;
}

/** Deux tiers à la commande, un tiers conditionné à la réussite du projet. */
export function splitPayment(price: number) {
  const upfront = Math.round((price * (2 / 3)) / 100) * 100;
  return { upfront, conditional: price - upfront };
}

export function formatEuro(value: number): string {
  return `${value.toLocaleString('fr-FR')} €`;
}

const ORDER = CONFIG_OPTIONS.map((o) => o.id);

/** Encodage compact de la sélection pour l'URL : un caractère par option (1/0), en base 36. */
export function encodeSelection(selected: Iterable<string>): string {
  const set = new Set(Array.from(selected));
  const bits = ORDER.map((id) => (set.has(id) ? '1' : '0')).join('');
  // Découpe en paquets de 5 bits encodés en base 32 pour rester court et lisible.
  let out = '';
  for (let i = 0; i < bits.length; i += 5) {
    out += parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2).toString(32);
  }
  return out;
}

export function decodeSelection(code: string | null | undefined): string[] {
  if (!code) return [];
  let bits = '';
  for (const ch of code) {
    const v = parseInt(ch, 32);
    if (Number.isNaN(v)) return [];
    bits += v.toString(2).padStart(5, '0');
  }
  return ORDER.filter((_, i) => bits[i] === '1');
}
