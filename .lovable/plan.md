## Objectif

Permettre d'attacher, visualiser, télécharger et supprimer des documents directement depuis la fiche d'une opportunité CRM (`admin/crm/pipeline`). Étape 2 (RAG par client) sera traitée séparément — la structure de données est préparée pour l'accueillir.

## Étape 1 — Documents sur les opportunités

### 1. Backend (migration Supabase)

**Nouvelle table `crm_opportunity_documents**`

- `opportunity_id` (FK → `crm_opportunities`, on delete cascade)
- `file_name`, `file_path` (storage), `file_size`, `mime_type`
- `label` (nom lisible optionnel), `uploaded_by`
- timestamps + trigger updated_at
- GRANT authenticated + service_role
- RLS : lecture/écriture pour utilisateurs authentifiés (le CRM admin l'est déjà)
- Champ `indexed_for_rag boolean default false` + `rag_indexed_at` (préparation Étape 2)

**Bucket Storage `crm-opportunity-docs**` (privé)

- Policies : authenticated peut read/insert/delete sur objets sous `{opportunity_id}/...`

### 2. Frontend

**Nouveau hook `useOpportunityDocuments(opportunityId)**`

- List, upload (avec progress), delete, getSignedUrl (visualisation en 1 clic)
- Invalidation React Query

**Nouveau composant `OpportunityDocumentsSection**`

- Zone drop / bouton "Ajouter un document"
- Liste des docs : icône selon mime, nom, taille, date, bouton œil (signed URL → ouvre onglet), bouton corbeille
- Multi-upload, progress inline

**Intégration dans la fiche opportunité**

- Détecter le composant actuel de fiche/édition (`OpportunityDialog` ou équivalent utilisé depuis `OpportunityCard.onEdit`) et y ajouter une section "Documents" sous les infos principales
- Ajouter aussi un petit indicateur (badge nombre de docs) sur `OpportunityCard`

### 3. Préparation Étape 2 (RAG)

- Colonnes `indexed_for_rag` / `rag_indexed_at` prêtes
- Aucune logique d'indexation pour l'instant (à traiter dans un plan dédié : edge function → embeddings → `crm_opportunity_document_chunks` + pgvector)

## Détails techniques

- Storage path : `{opportunity_id}/{uuid}-{filename}`
- Visualisation : `createSignedUrl(60s)` → `window.open`
- Types acceptés : PDF, DOCX, XLSX, images, TXT (pas de restriction stricte au départ)
- Limite de taille : 20 Mo par fichier
- Suppression : delete storage + delete row (atomique côté client, rollback si erreur DB)

## Question rapide avant implémentation

Les documents sont également visibles/téléchargeables par les autres membres CRM (tous les utilisateurs authentifiés admin)