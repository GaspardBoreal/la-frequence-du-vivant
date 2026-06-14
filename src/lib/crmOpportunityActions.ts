import { FileText, ClipboardList, MessageSquareDashed, PackageCheck, type LucideIcon } from 'lucide-react';

export type OpportunityActionCode =
  | 'plaquette_envoyee'
  | 'fiche_preparation_marche'
  | 'point_avancement'
  | 'pack_vivant_complet';

export interface OpportunityActionDef {
  code: OpportunityActionCode;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** HSL triplet (no hsl() wrapper) — used inline for backgrounds/rings/text */
  hue: string;
}

export const OPPORTUNITY_ACTIONS: OpportunityActionDef[] = [
  {
    code: 'plaquette_envoyee',
    label: 'Plaquette envoyée',
    shortLabel: 'Plaquette',
    description: 'Documentation commerciale transmise au prospect',
    icon: FileText,
    hue: '210 90% 56%', // bleu
  },
  {
    code: 'fiche_preparation_marche',
    label: 'Fiche préparation Marche',
    shortLabel: 'Fiche prépa',
    description: 'Fiche de préparation de la marche partagée',
    icon: ClipboardList,
    hue: '38 92% 50%', // ambre
  },
  {
    code: 'point_avancement',
    label: 'Point d’avancement',
    shortLabel: 'Point d’avancement',
    description: 'Rendez-vous d’avancement effectué',
    icon: MessageSquareDashed,
    hue: '262 83% 62%', // violet
  },
  {
    code: 'pack_vivant_complet',
    label: 'Pack du vivant complet',
    shortLabel: 'Pack vivant',
    description: 'Pack du vivant complet livré au client',
    icon: PackageCheck,
    hue: '160 70% 42%', // émeraude
  },
];

export const ACTIONS_BY_CODE: Record<OpportunityActionCode, OpportunityActionDef> =
  OPPORTUNITY_ACTIONS.reduce((acc, a) => {
    acc[a.code] = a;
    return acc;
  }, {} as Record<OpportunityActionCode, OpportunityActionDef>);

export const ALL_ACTION_CODES = OPPORTUNITY_ACTIONS.map(a => a.code);

export function isValidActionCode(code: string): code is OpportunityActionCode {
  return code in ACTIONS_BY_CODE;
}
