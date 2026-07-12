/**
 * Helpers pour extraire les champs de la fiche gogocarto Sol Vivant
 * stockée dans `carte_sol_vivant_points.raw` (JSONB).
 */

const IMG_BASE = 'https://cartesolvivant.gogocarto.fr/uploads/gogocarto/images/';

export interface SvCategoryFull {
  id?: number | string;
  name: string;
  description?: string | null;
}

export interface SvContact {
  personName?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export interface SvFarmField {
  key: string;
  label: string;
  value: string;
}

/** Libellés FR des champs agro (whitelist ordonnée). */
const FARM_LABELS: Array<[string, string]> = [
  ['description_ferme', 'Description'],
  ['annee_installation', "Année d'installation"],
  ['nombre_annees_sol_vivant', 'Années en Sol Vivant'],
  ['proportion_surface_sol_vivant', 'Surface en Sol Vivant'],
  ['sau', 'SAU (ha)'],
  ['SAU', 'SAU (ha)'],
  ['profondeur_sol', 'Profondeur de sol'],
  ['taux_argile', "Taux d'argile"],
  ['taux_limon', 'Taux de limon'],
  ['taux_sable', 'Taux de sable'],
  ['taux_mo', 'Taux de matière organique'],
  ['taux_MO', 'Taux de matière organique'],
  ['ph', 'pH'],
  ['types_cultures', 'Types de cultures'],
  ['types_elevages', "Types d'élevages"],
  ['couverts_vegetaux', 'Couverts végétaux'],
  ['mulch', 'Mulch'],
  ['type_mulchs', 'Type de mulchs'],
  ['types_engrais', "Types d'engrais"],
  ['engrais', 'Engrais'],
  ['agroforesterie', 'Agroforesterie'],
  ['preparations', 'Préparations'],
  ['experimentations', 'Expérimentations'],
  ['historique_sol', 'Historique du sol'],
  ['problematiques', 'Problématiques'],
  ['commercialisation', 'Commercialisation'],
  ['label_commercialisation', 'Labellisation'],
  ['batiment', 'Bâtiments'],
  ['materiel', 'Matériel'],
  ['surface_serre', 'Surface sous serre'],
  ['description_organisation', "Description de l'organisation"],
  ['diplome', 'Diplôme'],
];

function toStr(v: any): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.filter(Boolean).join(', ') || null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}

export function getSvContact(raw: any): SvContact {
  if (!raw) return {};
  return {
    personName: toStr(raw.nom_prenom) ?? undefined,
    phone: toStr(raw.telephone) ?? undefined,
    email: toStr(raw.email) ?? undefined,
    website: toStr(raw.site_web ?? raw.website) ?? undefined,
  };
}

export function getSvCategories(raw: any): SvCategoryFull[] {
  if (!raw) return [];
  if (Array.isArray(raw.categoriesFull) && raw.categoriesFull.length > 0) {
    return raw.categoriesFull
      .map((c: any) => ({ id: c?.id, name: String(c?.name ?? '').trim(), description: c?.description ?? null }))
      .filter((c: SvCategoryFull) => c.name);
  }
  if (Array.isArray(raw.categories)) {
    return raw.categories
      .map((n: any) => ({ name: String(n ?? '').trim() }))
      .filter((c: SvCategoryFull) => c.name);
  }
  return [];
}

export function getSvImages(raw: any): string[] {
  if (!raw) return [];
  const list: string[] = [];
  if (Array.isArray(raw.images)) {
    for (const img of raw.images) {
      if (typeof img === 'string' && img.trim()) {
        list.push(img.startsWith('http') ? img : IMG_BASE + img);
      }
    }
  }
  if (Array.isArray(raw.files)) {
    for (const f of raw.files) {
      if (typeof f === 'string' && /\.(jpe?g|png|webp|gif)$/i.test(f)) {
        list.push(f.startsWith('http') ? f : IMG_BASE + f);
      }
    }
  }
  return list;
}

export function getSvFarmFields(raw: any): SvFarmField[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: SvFarmField[] = [];
  for (const [key, label] of FARM_LABELS) {
    if (seen.has(label)) continue;
    const v = toStr(raw[key]);
    if (v) {
      out.push({ key, label, value: v });
      seen.add(label);
    }
  }
  return out;
}

export function getSvPropositions(raw: any): string[] {
  if (!raw) return [];
  const v = raw.checkbox_proposition;
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v).split(',').map((s) => s.trim()).filter(Boolean);
}

/** Slug façon gogocarto pour reconstruire l'URL de la fiche originale. */
function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getSvExternalUrl(raw: any, name: string, lat: number, lng: number): string | null {
  if (!raw) return null;
  const slug = slugify(name || '');
  const extId = raw.id != null ? String(raw.id) : '';
  if (!slug || !extId) return `https://cartesolvivant.gogocarto.fr/map#/@${lat},${lng},14z`;
  return `https://cartesolvivant.gogocarto.fr/map#/fiche/${slug}/${extId}/@${lat},${lng},14z`;
}
