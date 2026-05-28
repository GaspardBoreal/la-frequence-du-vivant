
## Objectif

Créer dans l'admin un module **Audit IA Frugale** conforme AFNOR SPEC 2314, capable de :
1. Gérer une bibliothèque versionnée de prompts d'audit
2. Lancer un audit via edge function + Lovable AI Gateway (Gemini 2.5 Pro)
3. Archiver chaque audit (prompt figé, auteur, date, rapport complet)
4. Publier chaque audit sur `/audit-frugal/:slug` avec dashboard synthétique + navigation par domaine
5. Exécuter immédiatement le 1er audit sur le cœur Marches du Vivant

---

## 1. Schéma BDD (migration unique)

**`audit_prompt_templates`** — bibliothèque versionnée
- `id`, `name`, `version` (int), `is_active` (bool), `referential` ('AFNOR_SPEC_2314'), `prompt_text` (text), `created_by`, `created_at`
- Contrainte unique `(name, version)`
- Seed : v1 du prompt AFNOR fourni par l'utilisateur

**`audit_runs`** — historique des audits
- `id`, `slug` (unique, généré), `template_id` (FK), `prompt_snapshot` (text figé), `scope_label`, `scope_context_json` (jsonb : périmètre soumis au LLM), `model_used`, `launched_by` (uuid → community_profiles), `launched_at`, `status` ('running'|'completed'|'failed'), `report_json` (jsonb structuré), `report_markdown` (text), `global_score` (int), `maturity_level`, `domain_scores` (jsonb), `error_message`, `is_public` (bool, défaut true)

**RLS / GRANT**
- `audit_prompt_templates` : lecture admins, écriture admins ; service_role full
- `audit_runs` : SELECT public si `is_public=true` (pour `/audit-frugal/:slug`), INSERT/UPDATE admins ; service_role full

---

## 2. Edge Function `run-frugal-audit`

- Auth : JWT admin (helper `validateAuth` existant)
- Input : `{ template_id, scope_label }`
- Étapes :
  1. Charge le template actif → snapshot du prompt
  2. Construit un **contexte projet compact** (≤ 30k tokens) :
     - Inventaire features Marches du Vivant (résumé arch : edge functions clés, hooks IA, tables principales, dépendances IA — extrait depuis `mem://index.md` + scan ciblé)
     - Liste des usages LLM (Lovable AI Gateway, modèles, edges concernées)
     - Stack infra (Supabase EU, Vercel, pas de modèle entraîné maison)
     - Politique données (RLS, snapshots iNat, déduplication, normalisation NFD)
  3. Crée un `audit_runs` status `running`
  4. Appelle `https://ai.gateway.lovable.dev/v1/chat/completions` avec **tool calling** pour forcer un JSON structuré : `{ global_score, domain_scores: {1..4}, maturity_level, strong_points[], improvements: { critical[], important[], desirable[], long_term[] }, env_indicators[], action_plan: { phase1[], phase2[], phase3[] }, afnor_references[] }`
  5. Modèle : `google/gemini-2.5-pro` (reasoning `medium`)
  6. Génère aussi un `report_markdown` lisible (second call rapide ou rendu côté front)
  7. Update `audit_runs` → `completed` + données
- Gestion 429/402 → message clair côté UI

---

## 3. Frontend Admin — `/admin/outils/audit-frugal`

Nouvelle entrée dans `AdminOutilsHub` (icône `Leaf`).

**Pages / composants :**
- `AdminAuditFrugalHub.tsx` — 3 onglets :
  - **Audits** : table (date, auteur, score, niveau, lien public, bouton "Revoir")
  - **Bibliothèque prompts** : liste des templates, bouton "Nouvelle version", éditeur (textarea + activation)
  - **Lancer un audit** : sélecteur template + label périmètre + bouton "Lancer" → loader + redirection vers le rapport
- `AdminAuditFrugalDetail.tsx` — vue détaillée (mêmes blocs que la page publique mais avec actions admin : toggle `is_public`, supprimer, dupliquer)

---

## 4. Page publique `/audit-frugal/:slug`

`PublicAuditFrugal.tsx` (hors layout admin, SEO complet).

**Layout :**
- Header : nom app auditée, date/heure, modèle LLM, lien template utilisé (snapshot)
- **Dashboard synthétique** (vue d'accueil) :
  - Score global /100 (gros chiffre + jauge circulaire)
  - Badge niveau maturité (🔴/🟠/🟡/🟢/🌿) avec couleur sémantique
  - 4 cartes domaines (score X/25 + mini-jauge + icône)
  - Bandeau "Points forts" (top 3) et "Critiques" (top 3)
- **Menu de navigation** (tabs ou sidebar) — un onglet par catégorie :
  1. Pertinence & Gouvernance
  2. Modèle & Algorithme
  3. Données
  4. Infrastructure & Ressources
  5. Indicateurs environnementaux
  6. Plan d'action
  7. Prompt utilisé (collapsible, texte intégral)
- Footer : référentiel AFNOR + avertissement

**Sécurité** : SELECT public via RLS sur `is_public=true`.

---

## 5. Exécution du 1er audit

Périmètre : **cœur Marches du Vivant** (hors Dordonia).

Contexte injecté au LLM (synthèse rédigée par le code de l'edge, pas par le LLM) :
- Stack : React/Vite/Supabase EU, Lovable AI Gateway (Gemini), pas d'entraînement maison
- Usages IA : classification éco-tags espèces (batch), chatbot screen-aware, French species names resolver, guide marche, quiz companion
- Données : snapshots iNat (déduplication NFD), `marcheur_observations`, RLS strict
- Frugalité existante : tool calling structuré, pas de streaming inutile, cache de résolution noms, déduplication, snapshot history avec guardrail régression 15%, hébergement EU

Lancement automatique post-déploiement → enregistrement dans `audit_runs` → ouverture URL publique du rapport.

---

## Détails techniques

```text
src/pages/AdminAuditFrugalHub.tsx
src/pages/AdminAuditFrugalDetail.tsx
src/pages/PublicAuditFrugal.tsx
src/components/admin/audit-frugal/AuditScoreDashboard.tsx
src/components/admin/audit-frugal/AuditDomainCard.tsx
src/components/admin/audit-frugal/AuditPromptEditor.tsx
src/components/admin/audit-frugal/AuditRunsTable.tsx
src/hooks/useAuditRuns.ts
src/hooks/useAuditPromptTemplates.ts
src/hooks/useLaunchAudit.ts
supabase/functions/run-frugal-audit/index.ts
supabase/migrations/<ts>_audit_frugal.sql
```

Routes ajoutées dans `App.tsx` :
- `/admin/outils/audit-frugal` (admin)
- `/admin/outils/audit-frugal/:id` (admin)
- `/audit-frugal/:slug` (public)

Tile ajoutée dans `AdminOutilsHub.tsx`.

---

## Hors scope

- Mesure réelle CO₂eq / CodeCarbon (l'audit reste qualitatif, mention dans avertissement)
- Audits comparatifs multi-versions (à itérer plus tard)
- Export PDF du rapport (peut être ajouté en v2)
