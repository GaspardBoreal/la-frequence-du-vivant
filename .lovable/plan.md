## Objectif

Rendre les documents visibles et accessibles directement depuis la vignette d'une opportunité dans le Kanban `admin/crm/pipeline`, sans avoir à ouvrir la fiche.

## Ce qu'on ajoute

### 1. Badge « Documents » sur `OpportunityCard`

Sur chaque vignette, si l'opportunité a ≥ 1 document :
- Une petite pastille discrète (icône `FileText` + compteur, ex. `📄 2`) intégrée dans la ligne des jalons/infos, cohérente avec le style existant (Badge shadcn, taille `xs`).
- Clic sur la pastille (stopPropagation pour ne pas déclencher l'édition) → ouvre un **popover** compact ancré à la pastille.

### 2. Popover « Documents » depuis la vignette

Contenu du popover :
- En-tête : « Documents (N) »
- Liste condensée (max 5 visibles, scroll au-delà) — pour chaque doc :
  - icône mime (PDF/image/xlsx/…) 
  - nom tronqué + taille
  - bouton œil → ouvre le doc via signed URL (`openDocument`)
  - bouton télécharger → même signed URL avec attribut `download`
- Footer : lien « Gérer les documents » qui ouvre la fiche opportunité (déclenche `onEdit`) — permet upload/suppression comme aujourd'hui.

Pas d'ajout/suppression depuis la vignette (reste dans la fiche, plus sûr) — la vignette est un accès *lecture rapide*.

### 3. Données

Deux options, on choisit l'option **A** (perf) :

**A. Compter/lister via une seule requête agrégée sur le Kanban** — nouveau hook `useOpportunitiesDocumentsIndex()` qui fait un `select('opportunity_id, id, file_name, file_path, file_size, mime_type, created_at').in('opportunity_id', ids)` une seule fois pour toutes les opportunités visibles, puis expose une map `{ [opportunityId]: OpportunityDocument[] }`. Utilisé par `OpportunityCard` pour connaître le count et alimenter le popover sans N requêtes.

Réutilisation de `openDocument` (signed URL) via un petit helper partagé extrait de `useOpportunityDocuments` (`getSignedUrl(path)`).

### 4. Design

- Pastille : `Badge variant="secondary"` compact avec icône `FileText` + chiffre, hover subtil (couleur primary), placée dans la rangée « Additional Info » à droite du budget, ou juste sous les jalons pour rester visible.
- Popover : `w-80`, padding compact, séparateurs légers, cohérent avec le thème (Papier Crème / Forêt Émeraude).
- Icônes mime réutilisées de `OpportunityDocumentsSection` (extraction dans un util partagé `crmDocIcon.ts`).

## Fichiers touchés

- `src/hooks/useOpportunitiesDocumentsIndex.ts` (nouveau) — requête agrégée + map par opportunité.
- `src/hooks/useOpportunityDocuments.ts` — expose un helper `getSignedUrl` réutilisable (petit refactor, comportement inchangé).
- `src/lib/crmDocIcon.ts` (nouveau) — `iconFor(mime, name)` + `formatSize` partagés.
- `src/components/crm/opportunities/OpportunityDocumentsSection.tsx` — utilise le util partagé (dédup).
- `src/components/crm/opportunities/OpportunityDocsPopover.tsx` (nouveau) — pastille + popover décrits ci-dessus.
- `src/components/crm/OpportunityCard.tsx` — intègre `<OpportunityDocsPopover opportunityId={...} onOpenFull={() => onEdit?.(opportunity)} />`.
- Composant parent du Kanban (là où sont mappées les cartes) — appel unique de `useOpportunitiesDocumentsIndex(allIds)` et passage via un contexte léger ou prop `docsMap` à la carte pour éviter N requêtes. (Sinon fallback : chaque carte fetch, acceptable si volumes < 100.)

## Étape 2 (RAG) — inchangée

Aucun impact ; les colonnes `indexed_for_rag` / `rag_indexed_at` restent prêtes.
