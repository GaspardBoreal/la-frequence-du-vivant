# Analyse du bug et correctif robuste

## Diagnostic

La carte espèce « Clematis » liste 3 occurrences (Bordeaux, Déviat C 865, Déviat C 362). Quand on clique sur **DEVIAT C 865**, on atterrit sur **BORDEAUX / Patio végétalisé ISEG → onglet Synthèse**. C'est faux.

Cause racine (vérifiée dans `search_global` et `ExplorationMarcheurPage`) :

1. Côté SQL, la `route` du résultat espèce est calculée **une seule fois**, à partir de `last_marche_id` (la marche la plus récente, ici Bordeaux). L'exploration cible dans l'URL est donc toujours celle de Bordeaux, quelle que soit l'occurrence cliquée.
2. Côté front, on réécrit bien `marcheId=DEVIAT` dans l'URL, mais on garde **la même exploration** dans le chemin. La page exploration de Bordeaux ne contient pas la marche DEVIAT dans `explorationMarches`, donc `findIndex(...) = -1` → on reste sur l'étape par défaut (Bordeaux) et sur l'onglet par défaut (Synthèse).
3. Les sous-occurrences ne portent aujourd'hui que `marche_id` ; elles ignorent que chaque marche peut appartenir à une **exploration différente** et qu'elle a un **event_id** précis.

Conséquence : confusion entre « espèce dans une exploration » et « espèce dans un événement ». L'utilisateur attend une fiche espèce ouverte dans **l'événement** de la marche cliquée.

## Correctif proposé

### 1. SQL — Enrichir `recent_contexts` avec l'exploration et l'event de la marche

Dans `search_global`, pour chaque ligne de `recent_contexts`, ajouter :

- `exploration_id` (via `exploration_marches`)
- `exploration_slug` (optionnel pour le routing public)
- `event_id` (via `marche_events` : l'événement actif/le plus récent pour cette marche)
- `event_title`, `event_date`

Ainsi chaque occurrence devient routable de manière autonome, sans dépendre du `last_marche_id` global de l'espèce.

### 2. Front — Construire la route par occurrence, pas réécrire celle de l'espèce

Dans `GlobalSearchOverlay.handleResultClick` :

- Si l'utilisateur clique une **sous-occurrence**, ignorer `r.route` et reconstruire :  
  `/marches-du-vivant/mon-espace/exploration/{ctx.exploration_id}?focus=species:{scientific_name}&tab=biodiversite&sub=taxons&marcheId={ctx.marche_id}&eventId={ctx.event_id}&t={nonce}`
- Si l'utilisateur clique la **carte espèce** (en-tête), garder le comportement actuel (route globale).

### 3. Front — `useFocusFromUrl` : lire aussi `eventId`

Ajouter `eventId?: string | null` au `FocusDescriptor` et l'inclure dans la liste des params consommés.

### 4. Front — `ExplorationMarcheurPage` : appliquer l'event + onglet sensoriel correct

- Si `focus.eventId` est présent, forcer le step correspondant (déjà fait via `marcheId`) **et** s'assurer que `marcheEvent` ciblé = celui-là (sécurité si plusieurs events partagent une même marche).
- Pour `focus.kind === 'species'`, basculer automatiquement sur l'onglet sensoriel `voir` + sous-onglet `taxons` plutôt que rester sur « Synthèse ».
- Garantir que l'effet de focus se rejoue quand `explorationMarches` se charge après le mount (dépendance déjà ok, mais ajouter un guard sur `focus.eventId`).

### 5. UX — Lisibilité de la sous-occurrence

- Afficher en chip dans la ligne de sous-occurrence : la **date** + le **type d'événement** lorsque dispo, pour que l'utilisateur sache qu'il va atterrir sur l'événement et non sur l'exploration.

## Détail technique

Fichiers touchés :

```
supabase/migrations/<new>.sql              # RPC search_global v3 — contexts enrichis
src/hooks/useFocusFromUrl.ts               # +eventId
src/components/search/GlobalSearchOverlay.tsx
                                           # route reconstruite par occurrence
src/components/search/SearchResultCard.tsx # passe ctx complet (exploration_id,event_id)
src/components/community/ExplorationMarcheurPage.tsx
                                           # consomme focus.eventId, force tab biodiversite/sub=taxons
```

Signature `onOpen` étendue :
```ts
onOpen(opts?: {
  marcheId?: string | null;
  explorationId?: string | null;
  eventId?: string | null;
})
```

## Résultat attendu

- Clic sur **DEVIAT C 865** → ouvre l'exploration *contenant* DEVIAT, sur l'événement DEVIAT/Jardin Monde, onglet Biodiversité → Taxons, avec la fiche **Clématite** ouverte en halo.
- Clic sur **Bordeaux** → ouvre l'événement Bordeaux, même fiche espèce.
- Clic sur la carte espèce (en-tête) → comportement global inchangé.
- Plus aucune navigation « morte » ou détournée vers la mauvaise marche.
