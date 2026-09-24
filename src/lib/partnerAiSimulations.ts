// Archivage des simulations IA partenaires : typage + fabriques d'export.
// Trois formats : Markdown calibré pour une autre IA, JSON brut, CSV à plat.

export interface PartnerAiPrecision {
  question: string;
  reponse: string;
}

export interface PartnerAiSimulation {
  id: string;
  created_at: string;
  source_page: string;
  partner_slug: string;
  nom: string | null;
  type_structure: string | null;
  territoire: string | null;
  productions: string | null;
  demarrage: string | null;
  projet: string | null;
  objectifs: string | null;
  livrables: string | null;
  difficulte: string | null;
  form_payload: Record<string, unknown>;
  dimensionnement: Record<string, unknown>;
  plan: Record<string, any> | null;
  precisions: PartnerAiPrecision[];
  iterations: number;
  ai_model: string | null;
  duration_ms: number | null;
  status: string;
  error_message: string | null;
  session_key: string | null;
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });

const val = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v));

/** Bloc Markdown d'une simulation, balisé pour être relu par une IA tierce. */
export function simulationToMarkdown(s: PartnerAiSimulation): string {
  const d = s.dimensionnement || {};
  const p = s.plan;
  const lignes: string[] = [];
  lignes.push(`<simulation id="${s.id}" date="${s.created_at}" page="${s.source_page}" statut="${s.status}">`);
  lignes.push('');
  lignes.push('<reponses_projet>');
  lignes.push(`- Structure : ${val(s.nom)}`);
  lignes.push(`- Type de structure : ${val(s.type_structure)}`);
  lignes.push(`- Territoire : ${val(s.territoire)}`);
  lignes.push(`- Productions dominantes : ${val(s.productions)}`);
  lignes.push(`- Démarrage souhaité : ${val(s.demarrage)}`);
  lignes.push(`- Nombre de sites : ${val((s.form_payload as any)?.sites)}`);
  lignes.push(`- Projet décrit : ${val(s.projet)}`);
  lignes.push(`- Objectifs cochés : ${val(s.objectifs)}`);
  lignes.push(`- Livrables cochés : ${val(s.livrables)}`);
  lignes.push(`- Principale difficulté : ${val(s.difficulte)}`);
  lignes.push('</reponses_projet>');
  lignes.push('');
  lignes.push('<dimensionnement_calcule>');
  lignes.push(`- Sites sentinelles : ${val(d.sentinelles)} ; sites réseau : ${val(d.reseau)}`);
  lignes.push(`- Jours d'accompagnement : ${val(d.jours)} ; formations : ${val(d.formations)} ; marches : ${val(d.marches)}`);
  lignes.push(`- Période : ${val(d.dateDebutLabel)} → ${val(d.dateFinLabel)}`);
  lignes.push('</dimensionnement_calcule>');
  lignes.push('');

  if (p) {
    lignes.push('<plan_genere>');
    lignes.push(`Synthèse : ${val(p.synthese)}`);
    if (p.compris) {
      lignes.push(`Reformulation : ${val(p.compris.reformulation)}`);
      (p.compris.hypotheses || []).forEach((h: any) => lignes.push(`Hypothèse (${h.champ}) : ${h.texte}`));
      (p.compris.ecartsDetectes || []).forEach((e: string) => lignes.push(`Écart détecté : ${e}`));
    }
    if (p.partiPris) lignes.push(`Parti pris — ${val(p.partiPris.titre)} : ${val(p.partiPris.texte)}`);
    (p.calendrier || []).forEach((t: any) => {
      lignes.push(`Trimestre ${t.periode} — ${t.titre}`);
      (t.actions || []).forEach((a: any) =>
        lignes.push(`  · ${a.action} [${a.fenetreBiologique}] sites: ${a.sites} / ${a.responsable}`),
      );
    });
    if (p.reponseDifficulte) {
      lignes.push(`Réponse à la difficulté « ${val(p.reponseDifficulte.difficulte)} » :`);
      (p.reponseDifficulte.ajustements || []).forEach((a: string) => lignes.push(`  · ${a}`));
    }
    if (p.gesteSignature) lignes.push(`Geste signature : ${p.gesteSignature.nom} — ${p.gesteSignature.quand} — ${p.gesteSignature.ou}`);
    (p.financements || []).forEach((f: any) => lignes.push(`Piste de financement : ${f.piste} (à vérifier)`));
    (p.questionsPourAffiner || []).forEach((q: string) => lignes.push(`Question posée pour affiner : ${q}`));
    lignes.push('</plan_genere>');
    lignes.push('');
  }

  lignes.push('<dialogue_affinement>');
  if (!s.precisions?.length) lignes.push('(aucune itération)');
  s.precisions?.forEach((pr, i) => {
    lignes.push(`Q${i + 1} : ${pr.question}`);
    lignes.push(`R${i + 1} : ${pr.reponse}`);
  });
  lignes.push('</dialogue_affinement>');
  lignes.push('');
  lignes.push('</simulation>');
  return lignes.join('\n');
}

const PREAMBULE = `# Simulations du plan d'action LFDV — export pour analyse

<contexte_lfdv>
La Fréquence du Vivant (LFDV) propose sur ses pages partenaires un simulateur : une structure
(chambre d'agriculture, coopérative, collectivité, exploitation, entreprise, particulier) décrit son
projet de biodiversité, puis une IA produit un plan d'action sur 12 mois. Chaque bloc ci-dessous
est une simulation complète : ce que la structure a répondu, le dimensionnement calculé, le plan
généré, et le fil des questions-réponses utilisé pour l'affiner.
</contexte_lfdv>

<votre_mission>
Analysez l'ensemble des simulations et dégagez : les types de structures et territoires les plus
représentés, les objectifs et difficultés récurrents, les besoins exprimés mais non couverts, les
signaux faibles, et les axes d'offre à prioriser. Citez les identifiants de simulation à l'appui.
</votre_mission>
`;

export function simulationsToMarkdown(rows: PartnerAiSimulation[]): string {
  return `${PREAMBULE}\n<simulations nombre="${rows.length}">\n\n${rows
    .map(simulationToMarkdown)
    .join('\n\n---\n\n')}\n\n</simulations>\n`;
}

export function simulationsToCsv(rows: PartnerAiSimulation[]): string {
  const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
  const head = [
    'id', 'date', 'page', 'structure', 'type', 'territoire', 'productions', 'demarrage', 'sites',
    'projet', 'objectifs', 'livrables', 'difficulte', 'sentinelles', 'reseau', 'jours',
    'iterations', 'questions_reponses', 'statut', 'modele',
  ];
  const body = rows.map((s) =>
    [
      s.id, s.created_at, s.source_page, s.nom, s.type_structure, s.territoire, s.productions,
      s.demarrage, (s.form_payload as any)?.sites, s.projet, s.objectifs, s.livrables, s.difficulte,
      (s.dimensionnement as any)?.sentinelles, (s.dimensionnement as any)?.reseau,
      (s.dimensionnement as any)?.jours, s.iterations,
      (s.precisions || []).map((p) => `Q: ${p.question} / R: ${p.reponse}`).join(' || '),
      s.status, s.ai_model,
    ].map(cell).join(','),
  );
  return [head.join(','), ...body].join('\n');
}

export function downloadFile(nom: string, contenu: string, mime: string) {
  const blob = new Blob([contenu], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  a.click();
  URL.revokeObjectURL(url);
}
