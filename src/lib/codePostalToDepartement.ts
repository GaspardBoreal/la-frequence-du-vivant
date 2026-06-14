// Déduit le code département (INSEE) depuis un code postal français.
// Couvre métropole (incl. Corse 2A/2B) et DROM (97x).

import { FRENCH_DEPARTMENTS_WITH_CODES } from '@/utils/frenchAdministrativeCodes';

// Mapping INSEE des départements vers leur région (codes INSEE région).
const DEPT_TO_REGION: Record<string, string> = {
  // Auvergne-Rhône-Alpes (84)
  '01': '84', '03': '84', '07': '84', '15': '84', '26': '84', '38': '84', '42': '84', '43': '84', '63': '84', '69': '84', '73': '84', '74': '84',
  // Bourgogne-Franche-Comté (27)
  '21': '27', '25': '27', '39': '27', '58': '27', '70': '27', '71': '27', '89': '27', '90': '27',
  // Bretagne (53)
  '22': '53', '29': '53', '35': '53', '56': '53',
  // Centre-Val de Loire (24)
  '18': '24', '28': '24', '36': '24', '37': '24', '41': '24', '45': '24',
  // Corse (94)
  '2A': '94', '2B': '94',
  // Grand Est (44)
  '08': '44', '10': '44', '51': '44', '52': '44', '54': '44', '55': '44', '57': '44', '67': '44', '68': '44', '88': '44',
  // Hauts-de-France (32)
  '02': '32', '59': '32', '60': '32', '62': '32', '80': '32',
  // Île-de-France (11)
  '75': '11', '77': '11', '78': '11', '91': '11', '92': '11', '93': '11', '94': '11', '95': '11',
  // Normandie (28)
  '14': '28', '27': '28', '50': '28', '61': '28', '76': '28',
  // Nouvelle-Aquitaine (75)
  '16': '75', '17': '75', '19': '75', '23': '75', '24': '75', '33': '75', '40': '75', '47': '75', '64': '75', '79': '75', '86': '75', '87': '75',
  // Occitanie (76)
  '09': '76', '11': '76', '12': '76', '30': '76', '31': '76', '32': '76', '34': '76', '46': '76', '48': '76', '65': '76', '66': '76', '81': '76', '82': '76',
  // Pays de la Loire (52)
  '44': '52', '49': '52', '53': '52', '72': '52', '85': '52',
  // PACA (93)
  '04': '93', '05': '93', '06': '93', '13': '93', '83': '93', '84': '93',
  // DROM (régions = codes 01, 02, 03, 04, 06)
  '971': '01', '972': '02', '973': '03', '974': '04', '976': '06',
};

const DEPT_CODES = new Set(FRENCH_DEPARTMENTS_WITH_CODES.map((d) => d.code));

export function deptCodeFromCodePostal(cp?: string | null): string | undefined {
  if (!cp) return undefined;
  const clean = cp.replace(/\s/g, '');
  if (!/^\d{4,5}$/.test(clean)) return undefined;
  const padded = clean.padStart(5, '0');

  // DROM : 97x
  if (padded.startsWith('97')) {
    const code = padded.slice(0, 3);
    return DEPT_CODES.has(code) ? code : undefined;
  }
  // Corse : 20xxx → 2A (200-201) ou 2B (202-206)
  if (padded.startsWith('20')) {
    const n = parseInt(padded.slice(0, 3), 10);
    return n >= 202 ? '2B' : '2A';
  }
  const code = padded.slice(0, 2);
  return DEPT_CODES.has(code) ? code : undefined;
}

export function regionCodeFromDeptCode(deptCode?: string | null): string | undefined {
  if (!deptCode) return undefined;
  return DEPT_TO_REGION[deptCode];
}

export function regionCodeFromCodePostal(cp?: string | null): string | undefined {
  return regionCodeFromDeptCode(deptCodeFromCodePostal(cp));
}
