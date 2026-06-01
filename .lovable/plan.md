# Export PDF complet — Rapport d'Audit IA Frugale

## Objectif

Ajouter sur la vue publique (`/audit-frugal/:slug`) un bouton **« Imprimer le rapport complet »** qui génère un PDF multi-pages reprenant **l'intégralité** des données de `report_json` (pas seulement les tabs visibles), avec une mise en page éditoriale pro.

## Stack

- **@react-pdf/renderer** (déjà présent dans le projet — utilisé par `GuideDeMarchePdf.tsx`). Pas de nouvelle dépendance.
- Pagination native de React-PDF + composants `<Page wrap>` pour césure automatique.

## Contenu du PDF (ordre)

1. **Page de garde** — Logo/titre « Audit IA Frugale », `scope_label`, score global XXL, badge maturité, date, modèle, template+version, mention AFNOR SPEC 2314.
2. **Résumé exécutif** — `executive_summary` en pleine page.
3. **Scores par domaine** — 4 cartes (score/max + barre de progression SVG) + `domain_scores[].comment` si présent.
4. **Points forts** (tous, regroupés par domaine) — titre, justification, référence AFNOR.
5. **Améliorations** — 4 sections : Critiques 🔴, Importantes 🟠, Souhaitables 🟡, Long terme 🔵. Chaque entrée : problème, action recommandée, domaine, impact estimé, ref AFNOR.
6. **Indicateurs environnementaux** — table : nom, unité, priorité, mesuré oui/non.
7. **Plan d'action** — 3 phases (rapide / court / moyen terme) avec actions + ref AFNOR + impact.
8. **Annexe — Prompt utilisé** (snapshot figé), petite typo monospace, paginé proprement.
9. **Avertissement final** (texte du Card existant) + footer légal.

## Design éditorial

- Palette dérivée du thème emerald de l'app (cohérence avec `GuideDeMarchePdf`) : fond crème `#fefdfb`, primaire `#047857`, accent `#0d9488`, gris `#374151`/`#6b7280`.
- Typo Helvetica (built-in React-PDF — pas d'enregistrement de fonts custom).
- En-tête fixe : filet émeraude + « Audit IA Frugale » + scope_label tronqué.
- Pied de page fixe : « Les Marches du Vivant · AFNOR SPEC 2314 » à gauche, `Page X / Y` à droite (via render prop `pageNumber`/`totalPages`).
- Cartes : bordure 0.5pt gris clair, fond très pâle pour les blocs critiques (rouge), importants (orange), etc.
- Barres de progression : `<Svg>` rect background + rect fill émeraude.
- Badges AFNOR : petits chips arrondis fond gris pâle.
- Saut de page logique entre sections majeures via `break` sur le premier élément.

## Fichiers à créer / modifier

### Créer `src/components/admin/audit-frugal/AuditReportPdf.tsx`
- Export du composant `<AuditReportPdfDocument report scopeLabel launchedAt modelUsed templateName templateVersion promptSnapshot />`.
- Export `async function exportAuditReportPdf(run: AuditRunFull): Promise<void>` qui appelle `pdf(<…/>).toBlob()` et déclenche le téléchargement (nom : `audit-frugal-${slug}.pdf`).
- StyleSheet partagé inspiré de `GuideDeMarchePdf.tsx`.

### Modifier `src/pages/PublicAuditFrugal.tsx`
- Ajouter un bouton **« 📄 Imprimer le rapport complet »** dans une nouvelle barre d'actions sous le dashboard (visible publiquement, pas seulement admin), à côté d'un futur emplacement actions.
- État `isExporting` + spinner pendant génération.
- `onClick` → `exportAuditReportPdf(run)`, toast succès/erreur.

## Hors scope

- Pas de modif des tabs HTML actuelles.
- Pas de changement de schema / RPC.
- Pas d'historique multi-audits agrégé (l'export couvre **un** audit complet, qui est déjà l'« historique total » du run).
- Pas de logo bitmap (titre texte stylé pour éviter dépendance asset).
