/**
 * Inventaire déclaratif des points d'entrée applicatifs qui touchent au
 * registre de sol (`propriete_soil_diagnostics`).
 *
 * Cet inventaire est la référence du « Coffre-fort du registre » : toute
 * nouvelle vue qui lit ou écrit le registre doit y être déclarée.
 */

export type SoilWriteRegime =
  | 'read_only'        // lecture seule, aucune écriture possible
  | 'guarded_write'    // écriture complète via la RPC protégée (J'analyse)
  | 'surgical_write'   // écriture limitée aux coordonnées (déplacement)
  | 'unprotected';     // écriture directe non déclarée → à corriger

export interface SoilWritePath {
  id: string;
  screen: string;
  file: string;
  regime: SoilWriteRegime;
  detail: string;
}

export const SOIL_WRITE_PATHS: SoilWritePath[] = [
  {
    id: 'tab-analyze',
    screen: "J'analyse — saisie du registre",
    file: 'src/components/propriete/analyze/TabAnalyze.tsx',
    regime: 'guarded_write',
    detail:
      "Seul écran de saisie. Passe par usePropertySoil (readOnly=false) puis la fonction serveur upsert_propriete_soil, contrôlée par le garde-fou anti-effacement.",
  },
  {
    id: 'use-property-soil-readonly',
    screen: "J'identifie · La synthèse · Contextes IA",
    file: 'src/hooks/propriete/usePropertySoil.ts',
    regime: 'read_only',
    detail:
      "Hook monté en lecture seule hors J'analyse : la fonction d'enregistrement est neutralisée côté client, aucune requête d'écriture n'est émise.",
  },
  {
    id: 'palette-map-move',
    screen: 'La palette — carte des zones',
    file: 'src/hooks/propriete/useSoilSamples.ts',
    regime: 'surgical_write',
    detail:
      'Déplacement d\'un prélèvement. Bascule sur move_propriete_soil_sample : seules la latitude et la longitude du point visé sont modifiées.',
  },
  {
    id: 'atelier-move',
    screen: 'Atelier — registre des ouvrages',
    file: 'src/components/propriete/atelier/ObjectInspector.tsx',
    regime: 'surgical_write',
    detail:
      'Même déplacement chirurgical de prélèvement, via le hook partagé useSoilSamples.',
  },
  {
    id: 'scenographe-move',
    screen: 'Scénographe — studio palette',
    file: 'src/components/propriete/scenographe/PaletteStudio.tsx',
    regime: 'surgical_write',
    detail:
      'Repositionnement des prélèvements depuis la vue scénario, via le hook partagé useSoilSamples.',
  },
  {
    id: 'chantier',
    screen: 'Le chantier — avant / après',
    file: 'src/components/propriete/chantier/ChantierOverlay.tsx',
    regime: 'read_only',
    detail:
      'Lit les prélèvements pour rattacher un ouvrage à une carotte de sol. Aucune écriture dans le registre.',
  },
  {
    id: 'soil-history',
    screen: 'Journal des versions du registre',
    file: 'src/components/propriete/analyze/SoilHistoryPanel.tsx',
    regime: 'guarded_write',
    detail:
      "Restauration explicite d'une version archivée. Écriture volontaire et déclarée, autorisée à écraser après confirmation de l'utilisateur.",
  },
  {
    id: 'mcp-edge',
    screen: 'Serveur MCP (accès machine)',
    file: 'supabase/functions/mcp/index.ts',
    regime: 'read_only',
    detail:
      'Expose le registre en lecture pour les agents. Aucun outil d\'écriture n\'est déclaré côté serveur.',
  },
];

export const REGIME_LABEL: Record<SoilWriteRegime, string> = {
  read_only: 'Lecture seule',
  guarded_write: 'Écriture protégée',
  surgical_write: 'Écriture chirurgicale',
  unprotected: 'Non protégé',
};
