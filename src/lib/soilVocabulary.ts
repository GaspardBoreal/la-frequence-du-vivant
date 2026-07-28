import type { SoilLite } from '@/lib/plantIndicatorKb';

/**
 * Vocabulaires de texture rencontrés dans l'application :
 *  - par prélèvement (Étape 2)       : sable | limon | argile
 *  - champ global hérité             : sableux | limoneux | argileux
 *  - vocabulaire interne concordance : sable_limon | limon_moyen | limon_argile
 */
export function normalizeTexture(raw?: string | null): SoilLite['texture'] {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (!v) return null;
  if (v === 'sable_limon' || v === 'limon_moyen' || v === 'limon_argile') return v;
  if (v.startsWith('sabl')) return 'sable_limon';
  if (v.startsWith('argil')) return 'limon_argile';
  if (v.startsWith('limon')) return 'limon_moyen';
  return null;
}

export function normalizeStructure(raw?: string | null): SoilLite['structure'] {
  if (!raw) return null;
  const v = String(raw).trim().toLowerCase();
  if (v.startsWith('compact')) return 'compacte';
  if (v.startsWith('grumel')) return 'grumeleuse';
  if (v.startsWith('particul')) return 'particulaire';
  return null;
}
