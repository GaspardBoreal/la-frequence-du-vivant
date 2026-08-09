import type { PartnerRoadmap, RoadmapPriority, RoadmapTask } from './types';

/** Clé stable d'un chantier (slug du titre), utilisée pour persister son état. */
export function taskKey(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const QUALITY_FRAME = `## Exigences non négociables

- **Direction artistique** : n'utiliser que les tokens sémantiques du design system (index.css + tailwind.config.ts). Jamais de couleur en dur (\`text-white\`, \`bg-black\`, \`bg-[#...]\`). Le rendu doit être impeccable en thème clair (Papier Crème) comme en thème sombre (Forêt Émeraude).
- **Sobriété informationnelle** : une idée par écran, pas de bandeau pédagogique dans les vues analytiques, hiérarchie typographique claire.
- **Wahouhh maîtrisé** : une intention visuelle forte et assumée (micro-animations Motion, transitions douces, états vivants), jamais d'esthétique générique (dégradés violets, Inter/Poppins par défaut).
- **Vocabulaire** : « Fréquences » et non « Points », « Observations » et non « Contributions ». Tout nom d'espèce passe par \`<SpeciesName />\` : nom vernaculaire français d'abord, puis (Nom scientifique) en italique.
- **Robustesse** : états de chargement (skeletons), état vide explicite, gestion et affichage des erreurs, aucune régression sur les URLs publiques existantes, RLS et GRANT complets sur toute nouvelle table.
- **Responsive** : mobile-first, testé en 375 px et en desktop large.`;

/** Construit le brief Lovable prêt à coller pour un chantier de la feuille de route. */
export function buildLovablePrompt(
  roadmap: PartnerRoadmap,
  priority: RoadmapPriority,
  task: RoadmapTask,
): string {
  const theme = roadmap.themes.find((t) => t.id === task.themeId);
  const verbatim = task.themeId
    ? roadmap.verbatims.find((v) => v.themeId === task.themeId)
    : undefined;

  const lines: string[] = [];

  lines.push(`# ${task.title}`);
  lines.push('');
  lines.push(
    `Chantier issu de la feuille de route **${roadmap.partnerName}** (${roadmap.interviewLabel}), priorité **${priority.code} — ${priority.title}** (${priority.window}, charge estimée ${task.effortDays} j).`,
  );
  lines.push('');

  lines.push('## Contexte');
  lines.push(roadmap.context.trim());
  if (theme) {
    lines.push('');
    lines.push(`**Sujet rattaché — ${theme.label} (${theme.family})** : ${theme.summary}`);
  }
  if (verbatim) {
    lines.push('');
    lines.push(`> « ${verbatim.quote} »`);
    lines.push(`> — ${verbatim.speaker}, ${verbatim.at}`);
  }
  lines.push('');
  lines.push(`**Pourquoi ce rang de priorité** : ${priority.rationale}`);
  lines.push('');

  lines.push('## Objectif');
  lines.push(task.detail.trim());
  lines.push('');

  lines.push('## Livrable attendu');
  lines.push(task.output.trim());
  lines.push('');

  lines.push(QUALITY_FRAME);
  lines.push('');

  lines.push('## Critères d\'acceptation');
  lines.push(`- Le livrable « ${task.output.trim()} » est visible et utilisable dans l'application.`);
  lines.push('- Aucune erreur console, aucun avertissement React nouveau.');
  lines.push('- Les états chargement / vide / erreur sont tous traités.');
  lines.push('- Le rendu est vérifié en thème clair et en thème sombre, sur mobile et desktop.');
  lines.push("- Aucune URL publique existante n'est cassée.");
  lines.push('');
  lines.push(
    'Si un point du cahier des charges est ambigu, pose-moi la question avant de coder plutôt que de deviner.',
  );

  return lines.join('\n');
}

export default buildLovablePrompt;
