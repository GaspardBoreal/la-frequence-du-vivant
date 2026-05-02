// Référentiel partagé pour la qualification socio-démographique des marcheurs.
// Reste cohérent avec les enums Postgres `profile_gender` et `profile_csp`
// et avec la fonction SQL `public.age_bracket(date)`.

export type ProfileGender = 'femme' | 'homme' | 'non_binaire' | 'prefere_ne_pas_dire';

export type ProfileCsp =
  | 'agriculteurs'
  | 'artisans_commercants'
  | 'cadres'
  | 'professions_intermediaires'
  | 'employes'
  | 'ouvriers'
  | 'retraites'
  | 'etudiants'
  | 'sans_activite'
  | 'prefere_ne_pas_dire';

export type AgeBracket = '0_14' | '15_29' | '30_44' | '45_59' | '60_74' | '75_plus' | 'inconnu';

export const GENDER_OPTIONS: { value: ProfileGender; label: string; emoji: string }[] = [
  { value: 'femme', label: 'Femme', emoji: '🌸' },
  { value: 'homme', label: 'Homme', emoji: '🌿' },
  { value: 'non_binaire', label: 'Non-binaire', emoji: '✨' },
  { value: 'prefere_ne_pas_dire', label: 'Préfère ne pas dire', emoji: '🌫️' },
];

export const CSP_OPTIONS: { value: ProfileCsp; label: string; short: string }[] = [
  { value: 'agriculteurs', label: 'Agriculteurs exploitants', short: 'Agriculteur·rice' },
  { value: 'artisans_commercants', label: 'Artisans, commerçants, chefs d\'entreprise', short: 'Artisan / Commerçant' },
  { value: 'cadres', label: 'Cadres et professions intellectuelles supérieures', short: 'Cadre' },
  { value: 'professions_intermediaires', label: 'Professions intermédiaires', short: 'Profession intermédiaire' },
  { value: 'employes', label: 'Employés', short: 'Employé·e' },
  { value: 'ouvriers', label: 'Ouvriers', short: 'Ouvrier·ère' },
  { value: 'retraites', label: 'Retraités', short: 'Retraité·e' },
  { value: 'etudiants', label: 'Élèves, étudiants', short: 'Étudiant·e' },
  { value: 'sans_activite', label: 'Autres personnes sans activité professionnelle', short: 'Sans activité' },
  { value: 'prefere_ne_pas_dire', label: 'Préfère ne pas dire', short: 'Non communiqué' },
];

export const AGE_BRACKETS: { value: AgeBracket; label: string; range: string }[] = [
  { value: '0_14', label: 'Enfants', range: '0 – 14 ans' },
  { value: '15_29', label: 'Jeunes', range: '15 – 29 ans' },
  { value: '30_44', label: 'Jeunes adultes', range: '30 – 44 ans' },
  { value: '45_59', label: 'Adultes', range: '45 – 59 ans' },
  { value: '60_74', label: 'Seniors', range: '60 – 74 ans' },
  { value: '75_plus', label: 'Personnes âgées', range: '75 ans ou plus' },
  { value: 'inconnu', label: 'Non renseigné', range: '—' },
];

export function computeAgeBracket(birth: string | null | undefined): AgeBracket {
  if (!birth) return 'inconnu';
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return 'inconnu';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  if (age < 15) return '0_14';
  if (age < 30) return '15_29';
  if (age < 45) return '30_44';
  if (age < 60) return '45_59';
  if (age < 75) return '60_74';
  return '75_plus';
}

export function genderLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return GENDER_OPTIONS.find(g => g.value === value)?.label ?? '—';
}

export function cspLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return CSP_OPTIONS.find(c => c.value === value)?.label ?? '—';
}

export function cspShortLabel(value: string | null | undefined): string {
  if (!value) return '—';
  return CSP_OPTIONS.find(c => c.value === value)?.short ?? '—';
}

export function ageBracketLabel(value: AgeBracket | string | null | undefined): string {
  if (!value) return 'Non renseigné';
  return AGE_BRACKETS.find(b => b.value === value)?.label ?? 'Non renseigné';
}

export function ageBracketRange(value: AgeBracket | string | null | undefined): string {
  if (!value) return '—';
  return AGE_BRACKETS.find(b => b.value === value)?.range ?? '—';
}
