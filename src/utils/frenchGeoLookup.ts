// Référentiel géographique partagé : département / région (libellés officiels
// en majuscules, identiques à ceux utilisés dans les fiches marche).
import {
  FRENCH_DEPARTMENTS_WITH_CODES,
  FRENCH_REGIONS_WITH_CODES,
} from '@/utils/frenchAdministrativeCodes';
import {
  deptCodeFromCodePostal,
  regionCodeFromDeptCode,
} from '@/lib/codePostalToDepartement';

export const DEPARTEMENT_LABELS: string[] = FRENCH_DEPARTMENTS_WITH_CODES.map((d) => d.label);
export const REGION_LABELS: string[] = FRENCH_REGIONS_WITH_CODES.map((r) => r.label);

const deptCodeByLabel = new Map(FRENCH_DEPARTMENTS_WITH_CODES.map((d) => [d.label, d.code]));
const deptLabelByCode = new Map(FRENCH_DEPARTMENTS_WITH_CODES.map((d) => [d.code, d.label]));
const regionLabelByCode = new Map(FRENCH_REGIONS_WITH_CODES.map((r) => [r.code, r.label]));

/** Normalise un libellé libre (accents, tirets, casse) pour comparaison. */
export const normalizeGeoLabel = (v?: string | null): string =>
  (v ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase();

const deptByNorm = new Map(FRENCH_DEPARTMENTS_WITH_CODES.map((d) => [normalizeGeoLabel(d.label), d.label]));
const regionByNorm = new Map(FRENCH_REGIONS_WITH_CODES.map((r) => [normalizeGeoLabel(r.label), r.label]));

/** Ramene une saisie libre vers le libelle officiel du departement, si reconnu. */
export const canonicalDepartement = (v?: string | null): string | undefined =>
  deptByNorm.get(normalizeGeoLabel(v));

/** Ramene une saisie libre vers le libelle officiel de la region, si reconnue. */
export const canonicalRegion = (v?: string | null): string | undefined =>
  regionByNorm.get(normalizeGeoLabel(v));

/** Region officielle correspondant a un departement (libelle). */
export const regionLabelFromDepartement = (dept?: string | null): string | undefined => {
  const label = canonicalDepartement(dept);
  if (!label) return undefined;
  const code = deptCodeByLabel.get(label);
  const regionCode = regionCodeFromDeptCode(code);
  return regionCode ? regionLabelByCode.get(regionCode) : undefined;
};

/** Departements appartenant a une region (libelle). */
export const departementsForRegion = (region?: string | null): string[] => {
  const label = canonicalRegion(region);
  if (!label) return DEPARTEMENT_LABELS;
  return DEPARTEMENT_LABELS.filter((d) => regionLabelFromDepartement(d) === label);
};

/** Deduit departement + region depuis un code postal francais. */
export const geoFromCodePostal = (cp?: string | null): { departement?: string; region?: string } => {
  const code = deptCodeFromCodePostal(cp);
  if (!code) return {};
  const departement = deptLabelByCode.get(code);
  const regionCode = regionCodeFromDeptCode(code);
  return { departement, region: regionCode ? regionLabelByCode.get(regionCode) : undefined };
};
